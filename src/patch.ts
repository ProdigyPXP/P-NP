import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GUI_LINK, PRODIGY_CODE_ORIGIN, PRODIGY_LOAD_URL, VERSION } from "./constants.js";
import { displayImages } from "./displayImages.js";
import { RULES, applyRules } from "./patches.js";
import { buildPrefix, buildSuffix } from "./wrappers.js";
import { buildManifest } from "./manifest.js";

const FETCH_TIMEOUT_MS = 30000;

type GameStatus = { gameClientVersion: string };

export type PatchResult = {
  outputDir: string;
  gameClientVersion: string;
  publicGameHash: string | null;
  loadGamePath: string;
  patchDegraded: boolean;
  manifestHash: string;
};

const parseGameStatus = (launcherHtml: string): GameStatus => {
  const match = launcherHtml.match(/gameStatusDataStr\s*=\s*'([^']+)'/);
  if (!match?.[1]) throw new Error("Unable to find gameStatusDataStr in launcher HTML.");
  return JSON.parse(match[1]) as GameStatus;
};

const parseLoadGameUrl = (launcherHtml: string): string => {
  const m = launcherHtml.match(/https:\/\/code\.prodigygame\.com\/js\/load-game-[a-f0-9]+\.min\.js/i);
  if (!m?.[0]) throw new Error("Unable to locate load-game URL in launcher HTML.");
  return m[0];
};

const parsePublicGameHash = (loadGameSource: string): string | null => {
  const hashMatch = loadGameSource.match(/public-game-([a-fA-F0-9]+)\.min\.js/);
  return hashMatch?.[1] ?? null;
};

const isJavaScript = (content: string): boolean => {
  const trimmed = content.trim();
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html") || trimmed.startsWith("<HTML")) return false;
  if (trimmed.startsWith("{") && trimmed.includes('"error"')) return false;
  return true;
};

const patchPublicGameFile = (source: string): string => `
(() => {
  const console = new Proxy({}, { get: () => () => {} });
  ${source}
})();
`;

const fetchText = async (url: string): Promise<string> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Request failed for ${url} (${response.status} ${response.statusText}).`);
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
};

export const runPatch = async (outputDir = "patched-output"): Promise<PatchResult> => {
  const launcherHtml = await fetchText(PRODIGY_LOAD_URL);
  const gameStatus = parseGameStatus(launcherHtml);
  const loadGameUrl = parseLoadGameUrl(launcherHtml);

  const gameVersion = gameStatus.gameClientVersion;
  const gameUrl = `${PRODIGY_CODE_ORIGIN}/code/${gameVersion}/game.min.js?v=${gameVersion}`;
  const loadGamePath = new URL(loadGameUrl).pathname;

  const [gameSource, loadGameSource] = await Promise.all([
    fetchText(gameUrl),
    fetchText(loadGameUrl)
  ]);

  if (!isJavaScript(gameSource)) throw new Error("Fetched game.min.js does not appear to be valid JavaScript.");
  if (!isJavaScript(loadGameSource)) throw new Error("Fetched load-game.min.js does not appear to be valid JavaScript.");

  const publicGameHash = parsePublicGameHash(loadGameSource);
  const publicGameUrl = publicGameHash
    ? `${PRODIGY_CODE_ORIGIN}/js/public-game-${publicGameHash}.min.js`
    : null;
  const publicGameSource = publicGameUrl ? await fetchText(publicGameUrl) : null;

  if (publicGameSource && !isJavaScript(publicGameSource)) {
    throw new Error("Fetched public-game.min.js does not appear to be valid JavaScript.");
  }

  // Build prefix/suffix with current VERSION/displayImages baked in.
  // GUI_LINK is exported as manifest.defaultMenuUrl (extension applies it).
  const prefix = buildPrefix(VERSION);
  const suffix = buildSuffix(VERSION, displayImages);

  // VERIFY rules apply cleanly to the live bundle. Set patchDegraded if not.
  console.log(`[patcher] verifying ${RULES.length} rule(s) against live bundle`);
  const { output: patchedCore, perRuleCounts } = applyRules(gameSource, RULES);
  const degraded = RULES.filter((r) => (perRuleCounts[r.id] ?? 0) < r.minMatches);
  const patchDegraded = degraded.length > 0;

  for (const rule of RULES) {
    const n = perRuleCounts[rule.id] ?? 0;
    const ok = n >= rule.minMatches ? "✓" : "✗";
    console.log(`  ${ok} rule "${rule.id}" matched ${n}x (min ${rule.minMatches})`);
  }

  if (patchDegraded) {
    console.warn(
      `[patcher] WARNING: ${degraded.length} rule(s) below minMatches — ` +
      `setting patchDegraded=true. Extension will still apply the manifest as-is.`
    );
  }

  // Build manifest + verification bundle.
  const manifest = buildManifest({
    patcherVersion: VERSION,
    rules: RULES,
    prefix,
    suffix,
    defaultMenuUrl: GUI_LINK
  });
  const verificationBundle = `${prefix}\n${patchedCore}\n${suffix}`;
  const patchedPublicGame = publicGameSource ? patchPublicGameFile(publicGameSource) : null;

  const resolvedOutputDir = path.resolve(outputDir);
  await mkdir(resolvedOutputDir, { recursive: true });

  const writes: Array<Promise<void>> = [
    writeFile(
      path.join(resolvedOutputDir, "manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8"
    ),
    writeFile(
      path.join(resolvedOutputDir, "game.min.js"),
      `// game.min.js v${gameVersion} (verification copy — extension uses manifest.json)\n\n${verificationBundle}`,
      "utf8"
    ),
    writeFile(
      path.join(resolvedOutputDir, "metadata.json"),
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          patcherVersion: VERSION,
          gameVersion,
          publicGameHash,
          loadGamePath,
          patchDegraded,
          manifestHash: manifest.hash,
          perRuleCounts,
          source: { gameUrl, publicGameUrl, loadGameUrl, loadUrl: PRODIGY_LOAD_URL }
        },
        null,
        2
      )}\n`,
      "utf8"
    )
  ];

  if (patchedPublicGame) {
    writes.push(writeFile(path.join(resolvedOutputDir, "public-game.min.js"), patchedPublicGame, "utf8"));
  }

  await Promise.all(writes);

  console.log(`[patcher] wrote manifest.json (hash=${manifest.hash})`);
  console.log(`[patcher] wrote game.min.js (verification copy, ${verificationBundle.length} bytes)`);

  return {
    outputDir: resolvedOutputDir,
    gameClientVersion: gameVersion,
    publicGameHash,
    loadGamePath,
    patchDegraded,
    manifestHash: manifest.hash
  };
};

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  const outputDir = process.argv[2] ?? "patched-output";
  runPatch(outputDir)
    .then((result) => {
      console.log(`Patched files written to ${result.outputDir}`);
      console.log(`gameClientVersion=${result.gameClientVersion}`);
      console.log(`manifestHash=${result.manifestHash}`);
      console.log(`patchDegraded=${result.patchDegraded}`);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      console.error(message);
      process.exitCode = 1;
    });
}
