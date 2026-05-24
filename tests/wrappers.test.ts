import { describe, it, test } from "node:test";
import assert from "node:assert/strict";
import { buildPrefix, buildSuffix } from "../src/wrappers.ts";

describe("buildPrefix", () => {
  it("returns a string", () => {
    assert.equal(typeof buildPrefix("9.9.9"), "string");
  });

  it("interpolates the version into the patcher header", () => {
    const out = buildPrefix("9.9.9");
    assert.ok(out.includes("P-NP Patcher v9.9.9 — Prefix"));
  });

  it("includes console.image helper", () => {
    const out = buildPrefix("4.4.0");
    assert.ok(out.includes("console.image"));
  });

  it("defines window.__pnp_safeBind", () => {
    const out = buildPrefix("4.4.0");
    assert.ok(out.includes("window.__pnp_safeBind"));
  });

  it("defines window.__pnp_discoverService", () => {
    const out = buildPrefix("4.4.0");
    assert.ok(out.includes("window.__pnp_discoverService"));
  });

  it("guards SW.Load.decrementLoadSemaphore against duplicate calls", () => {
    const out = buildPrefix("4.4.0");
    assert.ok(out.includes("__PNP_SEM_DECREMENTED__"));
  });

  it("pre-inits window._.constants with map-like API", () => {
    const out = buildPrefix("4.4.0");
    assert.ok(out.includes("window._.constants"));
  });
});

describe("buildSuffix", () => {
  it("returns a string", () => {
    assert.equal(typeof buildSuffix("4.4.0", ["https://img/1.png"]), "string");
  });

  it("interpolates the version into the patcher header", () => {
    const out = buildSuffix("4.4.0", []);
    assert.ok(out.includes("P-NP Patcher v4.4.0 — Suffix"));
  });

  it("serializes displayImages as a JSON array literal in console.image", () => {
    const out = buildSuffix("4.4.0", ["https://a/1.png", "https://b/2.png"]);
    assert.ok(out.includes(JSON.stringify(["https://a/1.png", "https://b/2.png"])));
  });

  it("calls SW.Load.decrementLoadSemaphore at the top", () => {
    const out = buildSuffix("4.4.0", []);
    assert.ok(out.includes("SW.Load.decrementLoadSemaphore()"));
  });

  it("schedules the CheatGUI loader via setTimeout(15000)", () => {
    const out = buildSuffix("4.4.0", []);
    assert.ok(/setTimeout\b/.test(out));
    assert.ok(/,\s*15000\)/.test(out));
  });

  it("polls every 500ms to re-apply window._ properties", () => {
    const out = buildSuffix("4.4.0", []);
    assert.ok(/setInterval\b/.test(out));
    assert.ok(/,\s*500\)/.test(out));
  });

  it("exposes _.player via discovery", () => {
    const out = buildSuffix("4.4.0", []);
    assert.ok(out.includes("PlayerService"));
    assert.ok(out.includes("_.player") || out.includes('"player"'));
  });

  it("exposes _.membership via discovery + setMembership helper", () => {
    const out = buildSuffix("4.4.0", []);
    assert.ok(out.includes("MembershipService"));
    assert.ok(out.includes("setMembership"));
  });

  test("buildSuffix references window.__ORIGIN_MENU_URL__ instead of baking a URL", () => {
    const suffix = buildSuffix("4.4.1", ["https://example.com/img.png"]);
    assert.match(suffix, /window\.__ORIGIN_MENU_URL__/);
    assert.doesNotMatch(suffix, /raw\.githubusercontent\.com\/ProdigyPXP\/ProdigyOrigin/);
    assert.doesNotMatch(suffix, /https?:\/\/[^"]*bundle\.js/);
  });

  test("buildSuffix interpolates version and displayImages", () => {
    const suffix = buildSuffix("9.9.9", ["https://example.com/a.png", "https://example.com/b.png"]);
    assert.match(suffix, /Version 9\.9\.9/);
    assert.match(suffix, /https:\/\/example\.com\/a\.png/);
    assert.match(suffix, /https:\/\/example\.com\/b\.png/);
  });
});
