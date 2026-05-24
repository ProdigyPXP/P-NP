import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildManifest, hashManifest, type Manifest } from "../src/manifest.ts";
import { RULES } from "../src/patches.ts";

describe("buildManifest", () => {
  it("produces a Manifest with schemaVersion=1", () => {
    const m = buildManifest({
      patcherVersion: "4.4.0",
      rules: RULES,
      prefix: "PREFIX",
      suffix: "SUFFIX"
    });
    assert.equal(m.schemaVersion, 1);
  });

  it("includes patcherVersion verbatim", () => {
    const m = buildManifest({
      patcherVersion: "9.9.9",
      rules: RULES,
      prefix: "P",
      suffix: "S"
    });
    assert.equal(m.patcherVersion, "9.9.9");
  });

  it("attaches the hash field as a 16-char hex string", () => {
    const m = buildManifest({
      patcherVersion: "4.4.0",
      rules: RULES,
      prefix: "P",
      suffix: "S"
    });
    assert.equal(m.hash.length, 16);
    assert.match(m.hash, /^[0-9a-f]{16}$/);
  });

  it("the hash field equals hashManifest(rules, prefix, suffix)", () => {
    const m = buildManifest({
      patcherVersion: "4.4.0",
      rules: RULES,
      prefix: "P",
      suffix: "S"
    });
    assert.equal(m.hash, hashManifest(RULES, "P", "S"));
  });
});

describe("hashManifest", () => {
  it("is deterministic", () => {
    assert.equal(hashManifest(RULES, "P", "S"), hashManifest(RULES, "P", "S"));
  });

  it("changes when prefix changes", () => {
    assert.notEqual(hashManifest(RULES, "P1", "S"), hashManifest(RULES, "P2", "S"));
  });

  it("changes when suffix changes", () => {
    assert.notEqual(hashManifest(RULES, "P", "S1"), hashManifest(RULES, "P", "S2"));
  });

  it("changes when rules change", () => {
    const empty: Manifest["rules"] = [];
    assert.notEqual(hashManifest(RULES, "P", "S"), hashManifest(empty, "P", "S"));
  });
});
