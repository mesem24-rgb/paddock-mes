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
const browserRecords = new Map([
  ["paddock-projects", JSON.stringify([{ id: "local", name: "Local build" }])],
]);
global.localStorage = {
  getItem: (key) => browserRecords.get(key) ?? null,
  setItem: () => {
    throw new Error("Cloud saves must not use browser storage");
  },
};
global.window = { addEventListener() {}, removeEventListener() {} };
let server = { records: [{ id: "remote", name: "Remote build" }], revision: 4 };
let loadError = false;
const saves = [];
const client = {
  from() {
    return {
      select() {
        return this;
      },
      eq() {
        return this;
      },
      async maybeSingle() {
        return loadError
          ? { error: new Error("Connection unavailable") }
          : { data: server };
      },
    };
  },
  async rpc(name, args) {
    assert.equal(name, "save_workspace_collection");
    assert.equal(args.expected_user_id, "owner");
    saves.push(args);
    if (args.expected_revision !== server.revision)
      return { error: { message: "Another device changed this collection" } };
    server = { records: args.new_records, revision: server.revision + 1 };
    return { data: server.revision };
  },
};
function mock(filename, exports) {
  const resolved = require.resolve(filename);
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports,
  };
}
mock("../src/lib/supabase/client.ts", {
  cloudConfigured: true,
  getSupabase: () => client,
});
mock("../src/context/AuthContext.tsx", {
  useAuth: () => ({ session: { user: { id: "owner" } } }),
});
const { useStoredCollection } = require("../src/lib/useStoredCollection.ts");
const seed = [{ id: "demo" }];
async function mount() {
  let value, renderer;
  function Probe() {
    value = useStoredCollection("projects", seed);
    return null;
  }
  await act(async () => {
    renderer = create(React.createElement(Probe));
  });
  return {
    get value() {
      return value;
    },
    async close() {
      await act(async () => renderer.unmount());
    },
  };
}
(async () => {
  let workspace = await mount();
  assert.equal(workspace.value.records[0].id, "remote");
  assert.equal(
    saves.length,
    0,
    "loading must never upload seed or browser data",
  );
  await act(async () => {
    workspace.value.setRecords((current) => [...current, { id: "first" }]);
    workspace.value.setRecords((current) => [...current, { id: "second" }]);
  });
  assert.deepEqual(
    saves.map((s) => s.expected_revision),
    [4, 5],
    "rapid saves must serialize revisions",
  );
  assert.equal(server.records.length, 3);
  assert.equal(workspace.value.pending, 0);
  server.revision++;
  await act(async () =>
    workspace.value.setRecords((current) => [...current, { id: "unsaved" }]),
  );
  assert.match(workspace.value.error, /Another device/);
  assert.equal(
    workspace.value.records.length,
    4,
    "failed changes remain available for backup",
  );
  const previous = saves.length;
  await act(async () => workspace.value.setRecords([{ id: "overwrite" }]));
  assert.equal(saves.length, previous, "conflicts pause further writes");
  await workspace.close();
  server = { records: [], revision: 0 };
  client.rpc = async (name, args) => {
    assert.equal(args.expected_revision, 0);
    saves.push(args);
    server = { records: args.new_records, revision: 1 };
    return { data: 1 };
  };
  workspace = await mount();
  assert.equal(workspace.value.records.length, 0);
  await act(async () => workspace.value.importLocal());
  assert.equal(
    server.records[0].id,
    "local",
    "explicit import uploads browser records",
  );
  assert.ok(
    browserRecords.has("paddock-projects"),
    "import preserves browser originals",
  );
  await workspace.close();
  loadError = true;
  workspace = await mount();
  assert.equal(workspace.value.isLoaded, false);
  assert.match(workspace.value.error, /Connection unavailable/);
  const count = saves.length;
  await act(async () => workspace.value.setRecords([{ id: "unsafe" }]));
  assert.equal(
    saves.length,
    count,
    "load failure must not overwrite cloud records",
  );
  await workspace.close();
  console.log(
    "Passed: cloud hydration, sequential saves, stale-device conflicts, explicit import, failed-load protection.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
