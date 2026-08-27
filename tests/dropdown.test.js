const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const App = require("../index");
const { CATALOG } = require("../lib/catalog");
const { normalizeSearch } = require("../lib/factory");
const { parseCandidates, parseCommaIds, asBool, parseJson } = require("../lib/bodies");
const { fillPath } = require("../lib/request");

const PATH_PARAM = /\{(\w+)\}/g;
const SKIP_DYNAMIC = new Set(["provider", "external_id"]);

describe("CRUD dropdowns", () => {
  it("registers hidden list triggers for dropdowns", () => {
    for (const key of [
      "hidden_assessment",
      "hidden_org_task",
      "hidden_all_task",
      "hidden_assessment_task",
      "hidden_invitation",
      "hidden_pipeline",
      "hidden_enrollment",
      "hidden_webhook",
      "hidden_interview",
      "hidden_interview_template",
      "hidden_squad",
    ]) {
      assert.ok(App.triggers[key], `missing trigger ${key}`);
      assert.equal(App.triggers[key].display.hidden, true);
    }
  });

  it("uses a dynamic dropdown for path ids on CRUD operations", () => {
    for (const op of CATALOG) {
      const names = new Set();
      let match;
      const re = new RegExp(PATH_PARAM.source, "g");
      while ((match = re.exec(op.path))) names.add(match[1]);
      for (const name of names) {
        if (SKIP_DYNAMIC.has(name)) continue;
        const field = (op.inputFields || []).find((row) => row.key === name);
        assert.ok(field, `${op.resource}.${op.operation} missing field ${name}`);
        assert.ok(field.dynamic || field.choices, `${op.resource}.${op.operation} field ${name} needs a dropdown`);
      }
    }
  });

  it("loads assessment cases and enrollments only after a parent is chosen", () => {
    assert.equal(App.triggers.hidden_assessment_task.operation.perform.length, 2);
    return Promise.all([
      App.triggers.hidden_assessment_task.operation.perform({}, { inputData: {} }).then((rows) => {
        assert.deepEqual(rows, []);
      }),
      App.triggers.hidden_enrollment.operation.perform({}, { inputData: {} }).then((rows) => {
        assert.deepEqual(rows, []);
      }),
    ]);
  });
});

describe("search and input edge cases", () => {
  it("does not treat an empty paginated page as a search hit", () => {
    assert.deepEqual(normalizeSearch({ results: [], next: null }), []);
    assert.deepEqual(normalizeSearch([]), []);
    assert.deepEqual(normalizeSearch(null), []);
    assert.deepEqual(normalizeSearch({ slug: "demo" }), [{ slug: "demo" }]);
    assert.deepEqual(normalizeSearch({ results: [{ slug: "demo" }] }), [{ slug: "demo" }]);
  });

  it("rejects invalid candidates JSON instead of sending an empty invite", () => {
    assert.throws(() => parseCandidates("not-json"), /valid JSON/);
    assert.throws(() => parseCandidates("[{}]"), /email/);
    assert.deepEqual(parseCandidates('[{"email":"a@b.com","name":"Ada"}]'), [{ email: "a@b.com", name: "Ada" }]);
  });

  it("accepts case id lists from dropdowns or comma-separated text", () => {
    assert.deepEqual(parseCommaIds(["a", " b "]), ["a", "b"]);
    assert.deepEqual(parseCommaIds("a, b"), ["a", "b"]);
  });

  it("treats omitted send_email as false", () => {
    assert.equal(asBool(undefined, false), false);
    assert.equal(asBool("true", false), true);
    assert.equal(asBool("false", true), false);
  });

  it("rejects invalid JSON blobs with a clear label", () => {
    assert.throws(() => parseJson("{", "Config JSON"), /Config JSON/);
  });

  it("trims path params and rejects blanks", () => {
    assert.equal(fillPath("/assessments/{slug}/", { slug: " demo " }), "/assessments/demo/");
    assert.throws(() => fillPath("/assessments/{slug}/", { slug: "  " }), /Missing path parameter: slug/);
  });
});
