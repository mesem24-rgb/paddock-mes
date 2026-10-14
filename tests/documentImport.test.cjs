/* eslint-disable @typescript-eslint/no-require-imports -- The test harness uses CommonJS to transpile TypeScript without a separate build. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
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

const docx = Buffer.from(
  "UEsDBBQAAAAIAOpkTl33S4B1wgAAAHYBAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbH2QuQ7CMAyGX6XKiqgRAwOiLMAKDLyAlbptRC7FLsfbk3INCBjt//gsLw7XSFxcnPVcqU4kzgFYd+SQyxDJZ6UJyaHkMbUQUR+xJZhOJjPQwQt5GcvQoZaLNTXYWyk2l7xmE3ylEllWxephHFiVwhit0ShZh5OvPyjjJ6HMybuHOxN5lA0KvhIG5TfgmdudKCVTU7HHJFt02QXnkGqog+5dTpb/a77cGZrGaHrnh7aYgiZm41tny7fi0PjX/XB/9/IGUEsDBBQAAAAIAOpkTl1hey9DiQAAAPIAAAALAAAAX3JlbHMvLnJlbHONzzsOAiEQBuCrEA6ws1pYGKCy2dZ4AQLDIy6PDBj19lJYrMbCcuaffH9GnHHVPZbcQqyNPdKam+Sh93oEaCZg0m0qFfNIXKGk+xjJQ9Xmqj3Cfp4PQFuDK7E12WIlp8XuOLs8K/5jF+eiwVMxt4S5/6j4uhiyJo9d8nshC/a9ngbLQQn4eFG9AFBLAwQUAAAACADqZE5dKkDEnZUAAADfAAAAEQAAAHdvcmQvZG9jdW1lbnQueG1sbY9BCsIwEEWvEnoAp7hwEWI3xb0LL5CmYxvJZEISSXt7E0EEcfM+w+fxGVXkzOZJ6LPYyPkky7lbcw4SIJkVSacDB/S1u3MknesZFygc5xDZYErWL+Tg2PcnIG19N6giJ573lqEhNuRhdLaOSHHZNAWHYmQK2u8KWtkY3wy/3jXyA00Vb5iyKDglm/GPBZ9Z+L40vABQSwECFAMUAAAACADqZE5d90uAdcIAAAB2AQAAEwAAAAAAAAAAAAAAgAEAAAAAW0NvbnRlbnRfVHlwZXNdLnhtbFBLAQIUAxQAAAAIAOpkTl1hey9DiQAAAPIAAAALAAAAAAAAAAAAAACAAfMAAABfcmVscy8ucmVsc1BLAQIUAxQAAAAIAOpkTl0qQMSdlQAAAN8AAAARAAAAAAAAAAAAAACAAaUBAAB3b3JkL2RvY3VtZW50LnhtbFBLBQYAAAAAAwADALkAAABpAgAAAAA=",
  "base64",
);

const { extractDocument } = require("../src/lib/extractDocument.ts");
const { extractSuggestions } = require("../src/lib/documentImport.ts");
const { POST } = require("../src/app/api/documents/extract/route.ts");
const tableContract = extractSuggestions("PREPARED FOR Example Manufacturing\nPROJECT INVESTMENT$15,000\n\nProject\n\nWebsite Modernization\n40% AT SIGNING\n30% AT MILESTONE\n30% BEFORE COMPLETION\n$6,000\n$4,500\n$4,500");
assert.equal(tableContract.clientName, "Example Manufacturing");
assert.equal(tableContract.projectName, "Website Modernization");
assert.equal(tableContract.budget, "15000");
assert.deepEqual(tableContract.billing.map(b => b.amount), ["6000", "4500", "4500"]);
assert.ok(tableContract.billing.every(b => !b.sendDate && !b.dueDate));
const fullContract = extractSuggestions("Client Example Person, doing business as Example Agency\nProject Agency Website\nExample Agency | Project Fee $3,800\nPayment in full Upon signing and before work begins $3,800\nFuture integration may cost $1,500 to $2,500");
assert.equal(fullContract.clientName, "Example Agency");
assert.equal(fullContract.contactName, "Example Person");
assert.equal(fullContract.budget, "3800");
assert.equal(fullContract.billing[0].amount, "3800");
const tableInvoice = extractSuggestions("Invoice Date October 2, 2026\nProject Agency Website\nFROM\nExample Developer\nprovider@example.com\nBILL TO\nExample Person\nExample Agency\nclient@example.com\nBalance Due $3,800");
assert.equal(tableInvoice.email, "client@example.com");
assert.equal(tableInvoice.clientName, "Example Agency");
assert.equal(tableInvoice.billing[0].sendDate, "2026-10-02");
assert.equal(tableInvoice.billing[0].amount, "3800");
const source =
  "Client: Example Company\nClient contact: Example Owner\nClient email: owner@example.com\nProject: Test website\nTotal: $3,800\nStart date: 2026-10-20\nCompletion date: November 20, 2026\nDeposit: $1,900";
const suggestions = extractSuggestions(source);
assert.equal(suggestions.clientName, "Example Company");
assert.equal(suggestions.email, "owner@example.com");
assert.equal(suggestions.budget, "3800");
assert.equal(suggestions.startDate, "2026-10-20");
assert.equal(suggestions.dueDate, "2026-11-20");
assert.equal(suggestions.billing[0].amount, "1900");
assert.equal(suggestions.billing[0].sendDate, "");
assert.equal(suggestions.billing[0].dueDate, "");
assert.equal(
  extractSuggestions("We mentioned $999 but did not label a total").budget,
  "",
);
assert.equal(extractSuggestions("Start date: 2026-13-40").startDate, "");
assert.equal(extractSuggestions("Start date: February 31, 2026").startDate, "");
const invoice = extractSuggestions(
  "Invoice total: $500\nInvoice date: 2026-10-14\nDue date: 2026-10-28",
);
assert.equal(invoice.billing[0].amount, "500");
assert.equal(invoice.billing[0].dueDate, "2026-10-28");
function pdf() {
  const stream =
    "BT /F1 12 Tf 40 740 Td (Client: Example Company) Tj 0 -20 Td (Project: Test website) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let result = "%PDF-1.4\n",
    offsets = [0];
  objects.forEach((o, i) => {
    offsets.push(Buffer.byteLength(result));
    result += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(result);
  result += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((o) => String(o).padStart(10, "0") + " 00000 n ")
    .join("\n")}\ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(result);
}
(async () => {
  assert.equal(
    await extractDocument("sample.txt", new TextEncoder().encode(source)),
    source,
  );
  assert.match(await extractDocument("sample.docx", docx), /Example Company/);
  assert.match(await extractDocument("sample.pdf", pdf()), /Example Company/);
  await assert.rejects(
    () => extractDocument("sample.exe", new Uint8Array()),
    /Use a PDF/,
  );
  const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
    savedKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test";
  assert.equal(
    (
      await POST(
        new Request("http://localhost/api/documents/extract", {
          method: "POST",
        }),
      )
    ).status,
    401,
    "cloud imports require sign-in",
  );
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const form = new FormData();
  form.append("file", new File([source], "sample.txt"));
  const response = await POST(
    new Request("http://localhost/api/documents/extract", {
      method: "POST",
      body: form,
    }),
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).text, source);
  const empty = new FormData();
  empty.append("file", new File([""], "empty.txt"));
  assert.equal(
    (
      await POST(
        new Request("http://localhost/api/documents/extract", {
          method: "POST",
          body: empty,
        }),
      )
    ).status,
    400,
  );
  if (savedUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = savedUrl;
  if (savedKey) process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = savedKey;
  const React = require("react");
  const { create, act } = require("react-test-renderer");
  function mock(filename, exports) {
    const resolved = require.resolve(filename);
    require.cache[resolved] = {
      id: resolved,
      filename: resolved,
      loaded: true,
      exports,
    };
  }
  const client = {
    id: "client",
    companyName: "Example Company",
    contactName: "Existing Owner",
    email: "existing@example.com",
    status: "Active",
    contacts: [],
    notes: [],
  };
  const project = {
    id: "project",
    name: "Old project",
    clientId: client.id,
    clientName: client.companyName,
    budget: 1000,
    startDate: "2026-10-01",
    dueDate: "2026-11-01",
    documents: [],
    tasks: [{ id: "keep-task" }],
    milestones: [],
  };
  let updates = [],
    clientUpdates = [];
  mock("../src/context/ClientContext.tsx", {
    useClients: () => ({
      clients: [client],
      isLoaded: true,
      createClient() {
        throw new Error("Existing client should not be recreated");
      },
      updateClient: (id, fields) => clientUpdates.push({ id, fields }),
    }),
  });
  mock("../src/context/ProjectContext.tsx", {
    useProjects: () => ({
      projects: [project],
      isLoaded: true,
      createProject() {
        throw new Error("Existing project should not be recreated");
      },
      updateProject: (id, fields) => updates.push({ id, fields }),
    }),
  });
  mock("../src/context/InvoiceContext.tsx", {
    useInvoices: () => ({
      isLoaded: true,
      addInvoice() {
        throw new Error("No invoice should be generated without a suggestion");
      },
    }),
  });
  mock("../src/lib/supabase/client.ts", { getSupabase: () => null });
  mock("next/link", {
    __esModule: true,
    default: (props) => React.createElement("a", props, props.children),
  });
  const Page = require("../src/app/(dashboard)/documents/page.tsx").default;
  let renderer;
  await act(async () => {
    renderer = create(React.createElement(Page));
  });
  const reviewSource =
    "Client: Example Company\nProject: Reviewed website\nTotal: $3,800\nStart date: 2026-10-20\nCompletion date: 2026-11-20";
  await act(async () =>
    renderer.root
      .findByType("textarea")
      .props.onChange({ target: { value: reviewSource } }),
  );
  await act(async () =>
    renderer.root
      .findAllByType("button")
      .find((b) => b.props.children === "Review extracted fields")
      .props.onClick(),
  );
  assert.equal(updates.length, 0, "analysis must never mutate records");
  await act(async () =>
    renderer.root
      .findAllByType("select")[0]
      .props.onChange({ target: { value: "project" } }),
  );
  await act(async () =>
    renderer.root
      .findAllByType("button")
      .find((b) => b.props.children === "Apply reviewed changes")
      .props.onClick(),
  );
  assert.equal(updates[0].id, "project");
  assert.equal(updates[0].fields.clientId, "client");
  assert.equal(updates[0].fields.budget, 3800);
  assert.equal(updates[0].fields.name, "Reviewed website");
  assert.equal(updates[0].fields.documents[0].sourceText, reviewSource);
  assert.equal(
    updates[0].fields.tasks,
    undefined,
    "unrelated task fields must not be overwritten",
  );
  assert.equal(
    clientUpdates.length,
    0,
    "existing client fields require explicit opt-in",
  );
  await act(async () => renderer.unmount());
  console.log(
    "Passed: labeled suggestions, missing/invalid dates, invoice amounts, PDF/DOCX/TXT extraction, upload endpoint and sign-in guard.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
