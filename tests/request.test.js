const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { fillPath, unwrap, asList, paginationParams, publicUrl } = require("../lib/request");

describe("request helpers", () => {
  it("fills path params", () => {
    assert.equal(fillPath("/assessments/{slug}/", { slug: "senior-backend" }), "/assessments/senior-backend/");
  });

  it("rejects missing path params", () => {
    assert.throws(() => fillPath("/invites/{token}/", {}), /Missing path parameter: token/);
  });

  it("unwraps legacy envelopes", () => {
    assert.deepEqual(unwrap({ status: "success", data: { id: "1" } }), { id: "1" });
    assert.deepEqual(unwrap({ invite_token: "inv" }), { invite_token: "inv" });
  });

  it("flattens paginated results", () => {
    assert.deepEqual(asList({ results: [{ id: 1 }] }), [{ id: 1 }]);
    assert.deepEqual(asList([{ id: 1 }]), [{ id: 1 }]);
  });

  it("builds pagination query params", () => {
    assert.deepEqual(paginationParams({ cursor: "abc", page_size: 50 }), { cursor: "abc", page_size: 50 });
    assert.deepEqual(paginationParams({}), {});
  });

  it("prefixes the Public API path", () => {
    const url = publicUrl({ authData: { base_url: "https://assess.praxicraft.com" } }, "/org/");
    assert.equal(url, "https://assess.praxicraft.com/api/v1/public/org/");
  });
});
