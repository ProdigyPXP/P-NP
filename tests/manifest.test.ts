import test from "node:test";
import assert from "node:assert/strict";
import { buildManifest, hashManifest } from "../src/manifest.ts";

const RULE = {
  id: "demo",
  description: "demo rule",
  find: "abc",
  flags: "g",
  replace: "xyz",
  minMatches: 1
};

test("buildManifest includes defaultMenuUrl", () => {
  const m = buildManifest({
    patcherVersion: "9.9.9",
    rules: [RULE],
    prefix: "P",
    suffix: "S",
    defaultMenuUrl: "https://example.com/bundle.js"
  });
  assert.equal(m.schemaVersion, 1);
  assert.equal(m.patcherVersion, "9.9.9");
  assert.equal(m.defaultMenuUrl, "https://example.com/bundle.js");
  assert.equal(typeof m.hash, "string");
  assert.equal(m.hash.length, 16);
});

test("hashManifest changes when defaultMenuUrl changes", () => {
  const a = hashManifest([RULE], "P", "S", "https://example.com/a.js");
  const b = hashManifest([RULE], "P", "S", "https://example.com/b.js");
  assert.notEqual(a, b, "hash must include defaultMenuUrl");
});

test("hashManifest stable across equal inputs", () => {
  const a = hashManifest([RULE], "P", "S", "https://example.com/x.js");
  const b = hashManifest([RULE], "P", "S", "https://example.com/x.js");
  assert.equal(a, b);
});
