const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const App = require("../index");
const { PUBLIC_API_OPERATIONS } = require("../lib/operations.contract");
const { CATALOG, zapierKey } = require("../lib/catalog");
const { ASSESS_WEBHOOK_EVENTS } = require("../lib/events");

describe("n8n Public API parity", () => {
  it("catalog covers every contracted resource.operation", () => {
    const keys = new Set(CATALOG.map((row) => `${row.resource}.${row.operation}`));
    for (const row of PUBLIC_API_OPERATIONS) {
      assert.ok(keys.has(`${row.resource}.${row.operation}`), `missing ${row.resource}.${row.operation}`);
    }
  });

  it("registers a Zapier create or search for every catalog row", () => {
    for (const row of CATALOG) {
      const key = zapierKey(row);
      if (row.kind === "search") {
        assert.ok(App.searches[key], `missing search ${key}`);
      } else {
        assert.ok(App.creates[key], `missing create ${key}`);
      }
    }
  });

  it("covers at least 60 Public API operations", () => {
    assert.ok(PUBLIC_API_OPERATIONS.length >= 60, `only ${PUBLIC_API_OPERATIONS.length}`);
  });

  it("exposes all n8n webhook events on the REST Hook trigger", () => {
    const choices = App.triggers.new_event.operation.inputFields[0].choices.map((c) => c.value);
    for (const ev of ASSESS_WEBHOOK_EVENTS) {
      assert.ok(choices.includes(ev.value), `missing event ${ev.value}`);
    }
  });

  it("uses custom API key auth with org test", () => {
    assert.equal(App.authentication.type, "custom");
    assert.ok(App.authentication.fields.some((f) => f.key === "api_key"));
  });
});
