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
