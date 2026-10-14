/* eslint-disable @typescript-eslint/no-require-imports -- The test harness uses CommonJS to transpile TypeScript without a separate build. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { create, act } = require("react-test-renderer");
global.IS_REACT_ACT_ENVIRONMENT = true;
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(
    this,
    request.startsWith("@/")
      ? path.join(__dirname, "../src", request.slice(2))
      : request,
    ...args,
  );
};
for (const extension of [".ts", ".tsx"]) {
  require.extensions[extension] = (module, filename) =>
    module._compile(
      ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      }).outputText,
      filename,
    );
}

const client = {
  id: "new-client",
  companyName: "New Company",
  email: "owner@example.com",
  status: "Active",
};
const {
  clientOptions,
  projectBelongsToClient,
  INTERNAL_CLIENT,
} = require("../src/lib/clientProjects.ts");
assert.ok(clientOptions([client]).some((c) => c.id === "new-client"));
assert.ok(clientOptions([client]).some((c) => c.id === INTERNAL_CLIENT));
assert.equal(clientOptions([{ ...client, status: "Archived" }]).length, 1);
assert.equal(
  projectBelongsToClient(
    { clientId: client.id, clientName: "Old name" },
    { ...client, companyName: "Renamed Company" },
  ),
  true,
);
assert.equal(
  projectBelongsToClient(
    { clientId: "another-client", clientName: client.companyName },
    client,
  ),
  false,
  "ID association must not fall back to duplicate names",
);
assert.equal(
  projectBelongsToClient({ clientName: " new company " }, client),
  true,
  "legacy name links remain compatible",
);
let created, navigated;
function mock(filename, exports) {
  const resolved = require.resolve(filename);
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports,
  };
}
mock("../src/context/ClientContext.tsx", {
  useClients: () => ({ clients: [client], isLoaded: true }),
});
mock("../src/context/ProjectContext.tsx", {
  useProjects: () => ({
    createProject: (input) => {
      created = input;
      return { ...input, id: "new-build" };
    },
  }),
});
mock("next/navigation", {
  useRouter: () => ({
    push: (url) => {
      navigated = url;
    },
  }),
});
mock("next/link", {
  __esModule: true,
  default: (props) => React.createElement("a", props, props.children),
});
global.window = { scrollTo() {} };
const Form =
  require("../src/components/projects/CreateProjectForm.tsx").default;
(async () => {
  let renderer;
  await act(async () => {
    renderer = create(React.createElement(Form));
  });
  await act(async () =>
    renderer.root
      .findByProps({ id: "clientName" })
      .props.onChange({ target: { value: client.id } }),
  );
  assert.equal(
    renderer.root.findByProps({ id: "clientEmail" }).props.value,
    client.email,
  );
  for (const [name, value] of [
    ["name", "Linked build"],
    ["description", "A project for the new saved client"],
    ["budget", "1000"],
  ])
    await act(async () =>
      renderer.root
        .findByProps({ name })
        .props.onChange({ target: { name, value } }),
    );
  await act(async () =>
    renderer.root
      .findByProps({ id: "build-template" })
      .props.onChange({ target: { value: "website" } }),
  );
  await act(async () =>
    renderer.root.findByType("form").props.onSubmit({ preventDefault() {} }),
  );
  assert.equal(created.templateId, "website");
  assert.equal(created.clientId, client.id);
  assert.equal(created.clientName, client.companyName);
  assert.equal(created.clientEmail, client.email);
  assert.equal(navigated, "/projects/new-build");
  await act(async () => renderer.unmount());
  await act(async () => {
    renderer = create(
      React.createElement(Form, { initialClientName: client.companyName }),
    );
  });
  assert.equal(
    renderer.root.findByProps({ id: "clientName" }).props.value,
    client.id,
    "client-page project link prefills the saved client",
  );
  await act(async () => renderer.unmount());
  console.log(
    "Passed: saved client selection, email autofill, linked project creation, client preselection, rename-safe and legacy links.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
