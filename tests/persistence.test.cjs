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
const records = new Map();
global.localStorage = {
  getItem: (key) => records.get(key) ?? null,
  setItem: (key, value) => records.set(key, value),
};
global.window = { localStorage, addEventListener() {}, removeEventListener() {} };
const {
  ClientProvider,
  useClients,
} = require("../src/context/ClientContext.tsx");
const {
  ProjectProvider,
  useProjects,
} = require("../src/context/ProjectContext.tsx");
const {
  InvoiceProvider,
  useInvoices,
} = require("../src/context/InvoiceContext.tsx");
const { projectTasks, localDate } = require("../src/lib/planning.ts");
async function mount(Provider, hook) {
  let value;
  function Probe() {
    value = hook();
    return null;
  }
  let renderer;
  await act(async () => {
    renderer = create(
      React.createElement(Provider, null, React.createElement(Probe)),
    );
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
  records.set("paddock-clients", "[]");
  records.set("paddock-projects", "[]");
  let clients = await mount(ClientProvider, useClients);
  let client;
  await act(async () => {
    client = clients.value.createClient({
      companyName: "Test client",
      contactName: "Test Owner",
      email: "owner@example.com",
      status: "Active",
      source: "Referral",
    });
  });
  assert.equal(
    client.companyName,
    "Test client",
    "createClient returns synchronously without throwing",
  );
  assert.equal(clients.value.clients[0].id, client.id);
  await clients.close();
  clients = await mount(ClientProvider, useClients);
  assert.equal(
    clients.value.clients[0].id,
    client.id,
    "clients survive provider remount",
  );
  await clients.close();
  let projects = await mount(ProjectProvider, useProjects);
  let project;
  await act(async () => {
    project = projects.value.createProject({
      name: "Test build",
      clientName: "Test client",
      description: "Build",
      status: "Planning",
      priority: "Medium",
      budget: 1000,
      startDate: "2026-10-14",
      dueDate: "2026-11-14",
      technology: [],
    });
  });
  await act(async () =>
    projects.value.addTask(project.id, {
      title: "Build homepage",
      status: "To Do",
      priority: "High",
      dueDate: "2026-10-20",
      assignee: "Michael",
    }),
  );
  let task = projects.value.projects[0].tasks[0];
  await act(async () =>
    projects.value.updateTask(project.id, task.id, {
      scheduledDate: "2026-10-15",
      scheduledTime: "09:00",
      estimatedHours: 2,
      status: "In Progress",
    }),
  );
  await projects.close();
  projects = await mount(ProjectProvider, useProjects);
  task = projectTasks(projects.value.projects)[0];
  assert.equal(task.projectId, project.id);
  assert.equal(task.scheduledTime, "09:00");
  assert.equal(task.estimatedHours, 2);
  assert.equal(task.status, "In Progress");
  await projects.close();
  let invoices = await mount(InvoiceProvider, useInvoices);
  await act(async () =>
    invoices.value.addInvoice({
      projectId: project.id,
      description: "Deposit",
      amount: 500,
      sendDate: "2026-10-14",
      dueDate: "2026-10-21",
      trigger: "Contract signed",
      status: "Planned",
    }),
  );
  const id = invoices.value.invoices[0].id;
  await act(async () => invoices.value.updateInvoice(id, "Paid"));
  await invoices.close();
  invoices = await mount(InvoiceProvider, useInvoices);
  assert.equal(invoices.value.invoices[0].status, "Paid");
  assert.equal(invoices.value.invoices[0].amount, 500);
  await invoices.close();
  assert.equal(
    localDate(new Date(2026, 9, 14, 23, 59)),
    "2026-10-14",
    "date keys use the local calendar day",
  );
  console.log(
    "Passed: client creation, project/task scheduling persistence, invoice payment persistence, local dates.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
