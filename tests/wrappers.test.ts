import { describe, it } from "node:test";
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
    assert.equal(typeof buildSuffix("4.4.0", "https://example.com/bundle.js", ["https://img/1.png"]), "string");
  });

  it("interpolates the version into the patcher header", () => {
    const out = buildSuffix("4.4.0", "https://example.com/bundle.js", []);
    assert.ok(out.includes("P-NP Patcher v4.4.0 — Suffix"));
  });

  it("interpolates the GUI link verbatim into the loader fetch", () => {
    const guiLink = "https://raw.githubusercontent.com/foo/bar/main/dist/bundle.js";
    const out = buildSuffix("4.4.0", guiLink, []);
    assert.ok(out.includes(guiLink));
  });

  it("serializes displayImages as a JSON array literal in console.image", () => {
    const out = buildSuffix("4.4.0", "https://x/y.js", ["https://a/1.png", "https://b/2.png"]);
    assert.ok(out.includes(JSON.stringify(["https://a/1.png", "https://b/2.png"])));
  });

  it("calls SW.Load.decrementLoadSemaphore at the top", () => {
    const out = buildSuffix("4.4.0", "https://x/y.js", []);
    assert.ok(out.includes("SW.Load.decrementLoadSemaphore()"));
  });

  it("schedules the CheatGUI loader via setTimeout(15000)", () => {
    const out = buildSuffix("4.4.0", "https://x/y.js", []);
    assert.ok(/setTimeout\b/.test(out));
    assert.ok(/,\s*15000\)/.test(out));
  });

  it("polls every 500ms to re-apply window._ properties", () => {
    const out = buildSuffix("4.4.0", "https://x/y.js", []);
    assert.ok(/setInterval\b/.test(out));
    assert.ok(/,\s*500\)/.test(out));
  });

  it("exposes _.player via discovery", () => {
    const out = buildSuffix("4.4.0", "https://x/y.js", []);
    assert.ok(out.includes("PlayerService"));
    assert.ok(out.includes("_.player") || out.includes('"player"'));
  });

  it("exposes _.membership via discovery + setMembership helper", () => {
    const out = buildSuffix("4.4.0", "https://x/y.js", []);
    assert.ok(out.includes("MembershipService"));
    assert.ok(out.includes("setMembership"));
  });
});
