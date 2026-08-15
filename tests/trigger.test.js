const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const trigger = require("../triggers/new_event");

describe("New Assess Event trigger", () => {
  it("ignores webhook.test pings", () => {
    const rows = trigger.operation.perform(
      {},
      { cleanedRequest: { event: "webhook.test", id: "evt_test" }, inputData: { event: "candidate.passed" } },
    );
    assert.deepEqual(rows, []);
  });

  it("returns matching events", () => {
    const payload = { event: "candidate.passed", id: "evt_1", data: { passed: true } };
    const rows = trigger.operation.perform({}, { cleanedRequest: payload, inputData: { event: "candidate.passed" } });
    assert.deepEqual(rows, [payload]);
  });

  it("drops events that do not match the Zap filter", () => {
    const rows = trigger.operation.perform(
      {},
      { cleanedRequest: { event: "candidate.failed" }, inputData: { event: "candidate.passed" } },
    );
    assert.deepEqual(rows, []);
  });
});
