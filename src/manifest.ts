import { createHash } from "node:crypto";
import type { PatchRule } from "./patches.ts";

export type Manifest = {
  schemaVersion: 1;
  patcherVersion: string;
  hash: string;
  rules: ReadonlyArray<PatchRule>;
  prefix: string;
  suffix: string;
  defaultMenuUrl: string;
};

export const hashManifest = (
  rules: ReadonlyArray<PatchRule>,
  prefix: string,
  suffix: string,
  defaultMenuUrl: string
): string => {
  const canonical = JSON.stringify({ rules, prefix, suffix, defaultMenuUrl });
  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
};

export const buildManifest = (input: {
  patcherVersion: string;
  rules: ReadonlyArray<PatchRule>;
  prefix: string;
  suffix: string;
  defaultMenuUrl: string;
}): Manifest => ({
  schemaVersion: 1,
  patcherVersion: input.patcherVersion,
  hash: hashManifest(input.rules, input.prefix, input.suffix, input.defaultMenuUrl),
  rules: input.rules,
  prefix: input.prefix,
  suffix: input.suffix,
  defaultMenuUrl: input.defaultMenuUrl
});
