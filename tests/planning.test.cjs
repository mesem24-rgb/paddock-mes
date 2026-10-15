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

const {
  weekDates,
  shiftDate,
  conflictingTasks,
} = require("../src/lib/planning.ts");
assert.deepEqual(weekDates("2026-10-18"), [
  "2026-10-12",
  "2026-10-13",
  "2026-10-14",
  "2026-10-15",
  "2026-10-16",
  "2026-10-17",
  "2026-10-18",
]);
assert.equal(weekDates("2027-01-01")[0], "2026-12-28");
assert.equal(shiftDate("2026-03-07", 1), "2026-03-08");
const task = (id, date, time, hours, status = "To Do", projectId = "p") => ({
  id,
  projectId,
  title: id,
  projectName: projectId,
  status,
  priority: "Medium",
  dueDate: date,
  assignee: "Michael",
  scheduledDate: date,
  scheduledTime: time,
  estimatedHours: hours,
});
assert.deepEqual(
  [
    ...conflictingTasks([
      task("a", "2026-10-14", "09:00", 2),
      task("b", "2026-10-14", "11:00", 1),
    ]),
  ],
  [],
  "touching work blocks do not overlap",
);
assert.deepEqual(
  [
    ...conflictingTasks([
      task("a", "2026-10-14", "09:00", 2),
      task("b", "2026-10-14", "10:00", 1),
    ]),
  ].sort(),
  ["p:a", "p:b"],
);
assert.deepEqual(
  [
    ...conflictingTasks([
      task("a", "2026-10-14", "23:30", 2),
      task("b", "2026-10-15", "00:30", 1),
    ]),
  ].sort(),
  ["p:a", "p:b"],
  "overlap detection spans midnight",
);
assert.equal(
  conflictingTasks([
    task("a", "2026-10-14", "09:00", 2),
    task("b", "2026-10-14", "10:00", 1, "Completed"),
  ]).size,
  0,
);
assert.deepEqual(
  [
    ...conflictingTasks([
      task("a", "2026-10-14", "09:00", 2),
      task("a", "2026-10-14", "10:00", 1, "To Do", "other"),
    ]),
  ].sort(),
  ["other:a", "p:a"],
  "task keys distinguish projects",
);
console.log(
  "Passed: Monday-first weeks, year boundaries, date shifting, adjacent/overlapping blocks, midnight overlaps, completed tasks.",
);

const { needsAttention } = require("../src/lib/attention.ts");
const reminders = needsAttention(
  [
    {
      id: "build",
      name: "Build",
      clientName: "Client",
      status: "In Progress",
      dueDate: "2026-10-14",
      tasks: [
        {
          id: "done",
          title: "Done",
          status: "Completed",
          dueDate: "2026-10-13",
        },
        { id: "due", title: "Do work", status: "To Do", dueDate: "2026-10-14" },
      ],
    },
  ],
  [
    {
      id: "active",
      companyName: "Client",
      status: "Active",
      followUpDate: "2026-10-13",
      followUpAction: "Ask for files",
    },
    {
      id: "archived",
      companyName: "Old",
      status: "Archived",
      followUpDate: "2026-10-12",
    },
  ],
  [
    {
      id: "paid",
      description: "Paid",
      status: "Paid",
      sendDate: "2026-10-10",
      dueDate: "2026-10-11",
    },
    {
      id: "send",
      description: "Deposit",
      status: "Planned",
      sendDate: "2026-10-14",
      dueDate: "2026-10-20",
      trigger: "Contract signed",
    },
    { id: "future", status: "Planned", sendDate: "2026-10-15" },
    { id: "due-today", status: "Sent", dueDate: "2026-10-14" },
  ],
  "2026-10-14",
);
assert.equal(reminders.length, 5);
assert.equal(reminders[0].id, "client:active");
assert.ok(reminders.some((r) => r.id === "project:build"));
assert.ok(reminders.some((r) => r.id === "task:build:due"));
assert.ok(
  reminders
    .find((r) => r.id === "invoice:send")
    .detail.includes("Contract signed"),
);
console.log(
  "Passed: due follow-ups, attention ordering, paid/completed/archived exclusions, invoice conditions.",
);

const {
  buildTemplates,
  createBuildPlan,
} = require("../src/lib/buildTemplates.ts");
assert.deepEqual(createBuildPlan(undefined, "2026-10-14", "2026-11-14"), {
  milestones: [],
  tasks: [],
});
for (const template of buildTemplates) {
  const plan = createBuildPlan(template.id, "2026-10-14", "2026-11-14");
  assert.equal(plan.milestones.length, template.stages.length);
  assert.equal(
    plan.tasks.length,
    template.stages.reduce((sum, stage) => sum + stage.tasks.length, 0),
  );
  assert.equal(plan.milestones.at(-1).dueDate, "2026-11-14");
  assert.ok(
    plan.tasks.every(
      (t) => t.dueDate >= "2026-10-14" && t.dueDate <= "2026-11-14",
    ),
  );
  assert.equal(
    new Set([...plan.tasks, ...plan.milestones].map((item) => item.id)).size,
    plan.tasks.length + plan.milestones.length,
  );
}
const shortPlan = createBuildPlan("website", "2026-12-31", "2027-01-01");
assert.equal(shortPlan.milestones.at(-1).dueDate, "2027-01-01");
console.log(
  "Passed: blank templates, generated plan sizes, unique IDs, project-window dates and year boundary.",
);

const {
  nextMonthlyDate,
  scheduleNextMonthlyInvoice,
} = require("../src/lib/recurringInvoices.ts");
assert.equal(nextMonthlyDate("2026-01-31"), "2026-02-28");
assert.equal(nextMonthlyDate("2028-01-31"), "2028-02-29");
assert.equal(nextMonthlyDate("2026-12-15"), "2027-01-15");
const monthly = {
  id: "monthly",
  projectId: "p",
  description: "Maintenance",
  amount: 500,
  sendDate: "2026-01-31",
  dueDate: "2026-02-14",
  trigger: "Monthly maintenance",
  status: "Paid",
  recurrence: "Monthly",
};
let series = scheduleNextMonthlyInvoice([monthly], monthly.id);
const feb = series[1];
assert.equal(feb.sendDate, "2026-02-28");
assert.equal(feb.dueDate, "2026-03-14");
assert.equal(feb.status, "Planned");
assert.equal(feb.amount, 500);
assert.equal(feb.projectId, "p");
assert.equal(feb.trigger, monthly.trigger);
assert.equal(series[0].status, "Paid");
assert.equal(series[0].nextInvoiceId, feb.id);
assert.equal(feb.sourceInvoiceId, monthly.id);
assert.equal(
  scheduleNextMonthlyInvoice(series, monthly.id),
  series,
  "repeating the action must not create a duplicate or save unchanged state",
);
series = scheduleNextMonthlyInvoice(series, feb.id);
assert.equal(
  series[2].sendDate,
  "2026-03-31",
  "month-end billing day must not drift after February",
);
const oneoff = [{ ...monthly, recurrence: undefined }];
assert.equal(scheduleNextMonthlyInvoice(oneoff, monthly.id), oneoff);
console.log(
  "Passed: monthly billing, leap/year boundaries, payment terms, month-end anchors, source links and duplicate prevention.",
);

const { invoiceReadiness } = require("../src/lib/invoiceReadiness.ts");
const { dailyPlan } = require("../src/lib/dailyPlan.ts");
const day = "2026-10-15";
const approvalProject = {
  id: "p", name: "Client build", clientName: "Example Client", status: "In Progress", dueDate: "2026-11-15",
  milestones: [{ id: "approval", title: "Client approval", status: "In Progress", dueDate: "2026-10-14" }],
  tasks: [
    { ...task("scheduled", day, "09:00", 2), dueDate: "2026-10-14" },
    task("overlap", day, "10:00", 1),
    { ...task("anytime", day, "", 0), dueDate: "2026-10-20" },
    { id: "unscheduled", title: "Unscheduled deadline", status: "To Do", dueDate: "2026-10-14" },
    task("done", day, "08:00", 8, "Completed"),
    task("tomorrow", "2026-10-16", "09:00", 3),
  ],
};
const linkedInvoice = { id: "linked", projectId: "p", milestoneId: "approval", description: "Approval payment", amount: 4500, status: "Planned", sendDate: "2026-10-10", dueDate: "2026-10-25", trigger: "Client approval confirmed" };
assert.equal(invoiceReadiness(linkedInvoice, [approvalProject], day).ready, false, "an old send date must not bypass a pending milestone");
assert.equal(invoiceReadiness({ ...linkedInvoice, milestoneId: undefined }, [approvalProject], day).ready, true, "legacy scheduled invoices still work");
assert.equal(invoiceReadiness(linkedInvoice, [], day).ready, false, "missing project must not release a linked invoice");
assert.equal(invoiceReadiness({ ...linkedInvoice, milestoneId: "missing" }, [approvalProject], day).ready, false);
const completedApproval = { ...approvalProject, milestones: [{ ...approvalProject.milestones[0], status: "Completed", completedDate: day }] };
const futureLinked = { ...linkedInvoice, sendDate: "2026-11-01" };
assert.equal(invoiceReadiness(futureLinked, [completedApproval], day).ready, true, "completion releases a milestone invoice before its planning date");
assert.equal(invoiceReadiness(futureLinked, [approvalProject], day).ready, false, "reopening a milestone restores waiting for planned invoices");
for (const status of ["Sent", "Paid"]) assert.equal(invoiceReadiness({ ...linkedInvoice, status }, [completedApproval], day).ready, false);
assert.equal(invoiceReadiness({ ...linkedInvoice, milestoneId: undefined, sendDate: "" }, [completedApproval], day).ready, false);
const billing = [futureLinked, { ...linkedInvoice, id: "paid-linked", status: "Paid" }, { ...linkedInvoice, id: "due-payment", milestoneId: undefined, status: "Sent", dueDate: day }];
const clientsForDay = [
  { id: "client", companyName: "Example Client", status: "Active", followUpDate: "2026-10-14", followUpAction: "Request content" },
  { id: "archived", status: "Archived", followUpDate: day },
];
const plan = dailyPlan([completedApproval], clientsForDay, billing, day);
assert.deepEqual(plan.scheduled.map(t => t.id), ["scheduled", "overlap", "anytime"]);
assert.equal(plan.hours, 3);
assert.equal(plan.unestimated, 1);
assert.ok(plan.conflicts.has("p:scheduled"));
assert.ok(!plan.actions.some(item => item.id === "task:p:scheduled"), "scheduled overdue tasks must not appear twice");
assert.ok(plan.actions.some(item => item.id === "task:p:unscheduled"));
assert.ok(plan.actions.some(item => item.id === "client:client"));
assert.ok(plan.actions.some(item => item.id === "invoice:linked"));
assert.ok(plan.actions.some(item => item.id === "invoice:due-payment" && item.kind === "Payment due today"));
assert.ok(!plan.actions.some(item => item.id === "invoice:paid-linked" || item.id === "client:archived"));
assert.ok(!dailyPlan([approvalProject], clientsForDay, billing, day).actions.some(item => item.id === "invoice:linked"));
assert.equal(scheduleNextMonthlyInvoice([{ ...monthly, milestoneId: "approval" }], monthly.id)[1].milestoneId, undefined, "recurrence must not reuse a completed milestone");
console.log("Passed: milestone readiness, reopening, missing links, legacy dates, daily-plan deduplication, capacity, conflicts, and payment actions.");

(async () => {
  const React = require("react");
  const { create, act } = require("react-test-renderer");
  const mock = (filename, exports) => {
    const resolved = require.resolve(filename);
    require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
  };
  let activeProject = approvalProject;
  let savedInvoice;
  const taskUpdates = [], completedFollowups = [];
  mock("../src/context/ProjectContext.tsx", { useProjects: () => ({ projects: [activeProject], isLoaded: true, updateTask: (...args) => taskUpdates.push(args) }) });
  mock("../src/context/ClientContext.tsx", { useClients: () => ({ clients: clientsForDay, isLoaded: true, completeFollowUp: id => completedFollowups.push(id) }) });
  mock("../src/context/InvoiceContext.tsx", { useInvoices: () => ({ invoices: [], isLoaded: true, addInvoice: invoice => { savedInvoice = invoice; }, updateInvoice() {}, scheduleNextInvoice() {} }) });
  mock("next/link", { __esModule: true, default: props => React.createElement("a", props, props.children) });
  const InvoicePage = require("../src/app/(dashboard)/invoices/page.tsx").default;
  let renderer;
  await act(async () => { renderer = create(React.createElement(InvoicePage)); });
  await act(async () => renderer.root.findByProps({ name: "project" }).props.onChange({ target: { value: "p" } }));
  await act(async () => renderer.root.findByProps({ name: "milestoneId" }).props.onChange({ target: { value: "approval" } }));
  const RealFormData = global.FormData;
  const formValues = { project: "p", description: "Approval payment", amount: "4500", sendDate: day, dueDate: "2026-10-25", trigger: "Client approval", recurrence: "One-off" };
  global.FormData = class { get(key) { return formValues[key] ?? ""; } };
  try {
    await act(async () => renderer.root.findByType("form").props.onSubmit({ preventDefault() {}, currentTarget: { reset() {} } }));
    assert.equal(savedInvoice.milestoneId, "approval", "invoice form must persist the selected milestone");
    assert.equal(savedInvoice.status, "Planned", "linking must not send or pay an invoice");
    await act(async () => renderer.root.findByProps({ name: "project" }).props.onChange({ target: { value: "p" } }));
    await act(async () => renderer.root.findByProps({ name: "milestoneId" }).props.onChange({ target: { value: "approval" } }));
    formValues.recurrence = "Monthly";
    savedInvoice = undefined;
    await act(async () => renderer.root.findByType("form").props.onSubmit({ preventDefault() {}, currentTarget: { reset() {} } }));
    assert.equal(savedInvoice, undefined, "monthly invoices must not retain a one-off milestone trigger");
    assert.match(renderer.root.findByProps({ role: "alert" }).props.children, /one-off invoices/);
    await act(async () => renderer.root.findByProps({ name: "project" }).props.onChange({ target: { value: "p" } }));
    assert.equal(renderer.root.findByProps({ name: "milestoneId" }).props.value, "", "project changes clear milestone selection");
  } finally { global.FormData = RealFormData; }
  await act(async () => renderer.unmount());
  const DailyPlan = require("../src/components/dashboard/DailyPlan.tsx").default;
  activeProject = completedApproval;
  await act(async () => { renderer = create(React.createElement(DailyPlan, { day, capacity: 2 })); });
  assert.match(JSON.stringify(renderer.toJSON()), /Over capacity/);
  await act(async () => renderer.root.findAllByType("button").find(b => b.props.children === "Mark task complete").props.onClick());
  assert.deepEqual(taskUpdates[0], ["p", "scheduled", { status: "Completed" }]);
  await act(async () => renderer.root.findAllByType("button").find(b => b.props.children === "Mark follow-up done").props.onClick());
  assert.deepEqual(completedFollowups, ["client"]);
  await act(async () => renderer.unmount());
  console.log("Passed: invoice milestone form persistence, monthly exclusion, project-switch reset, daily capacity, task completion, and follow-up completion.");
})().catch(error => { console.error(error); process.exitCode = 1; });
