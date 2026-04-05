import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GUI_LINK, PRODIGY_CODE_ORIGIN, PRODIGY_LOAD_URL, VERSION } from "./constants.js";
import { displayImages } from "./displayImages.js";

const FETCH_TIMEOUT_MS = 30000;

type GameStatus = {
  gameClientVersion: string;
};

export type PatchResult = {
  outputDir: string;
  gameClientVersion: string;
  publicGameHash: string | null;
  loadGamePath: string;
  patchDegraded: boolean;
};

const parseGameStatus = (launcherHtml: string): GameStatus => {
  const match = launcherHtml.match(/gameStatusDataStr\s*=\s*'([^']+)'/);
  if (!match?.[1]) {
    throw new Error("Unable to find gameStatusDataStr in launcher HTML.");
  }

  return JSON.parse(match[1]) as GameStatus;
};

const parseLoadGameUrl = (launcherHtml: string): string => {
  const scriptMatch = launcherHtml.match(/https:\/\/code\.prodigygame\.com\/js\/load-game-[a-f0-9]+\.min\.js/i);
  if (!scriptMatch?.[0]) {
    throw new Error("Unable to locate load-game URL in launcher HTML.");
  }

  return scriptMatch[0];
};

const parsePublicGameHash = (loadGameSource: string): string | null => {
  const hashMatch = loadGameSource.match(/public-game-([a-fA-F0-9]+)\.min\.js/);
  return hashMatch?.[1] ?? null;
};

const isJavaScript = (content: string): boolean => {
  const trimmed = content.trim();
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html") || trimmed.startsWith("<HTML")) {
    return false;
  }
  if (trimmed.startsWith("{") && trimmed.includes('"error"')) {
    return false;
  }
  return true;
};

type PatchContext = {
  patchDegraded: boolean;
};

const patchGameFile = (source: string, ctx: PatchContext): string => {
  // ── Modern Webpack 5 Detection ──
  // The game uses an arrow-function IIFE with __webpack_modules__ and exports to window.
  // There are NO global app/game variables. Instead, an inversify singleton is used:
  //   X.q.instance.prodigy.gameContainer.get(serviceId)
  // where X varies per module scope (N, Y, F, M, etc.).

  const patches: Array<[string | RegExp, string]> = [];
  let corePatched = false;

  // ── 1. Singleton Exposure ──
  // Find the main prodigy singleton constructor. It's the ONLY one that:
  //   - takes 1 arg (the Phaser game)
  //   - sets _instance and _game
  //   - is immediately followed by destroy() that nulls _prodigy
  // Pattern: _instance=this),this._game=E}destroy(){
  const singletonPatched = source.replace(
    /(_instance=this\),this\._game=([A-Za-z_$][\w$]*)\}destroy\(\)\{)/,
    `_instance=this),window.__PNP__=this,this._game=$2}destroy(){`
  );
  if (singletonPatched !== source) {
    source = singletonPatched;
    console.log("  ✓ Singleton exposure injected (window.__PNP__)");
    corePatched = true;
  } else {
    console.warn("  ✗ Could not find singleton constructor pattern");
  }

  // ── 2. hasMembership ──
  // NOTE: We do NOT force hasMembership=true at the source level because that
  // crashes the membership initialization flow (upgradeOptions is never set,
  // causing TypeError at login). Instead, expose the membership service so the
  // CheatGUI can toggle it dynamically AFTER the game finishes initializing.
  // The service ID is "859-25be" and the property is .isMember.

  // ── 3. Expose Constants Map ──
  // The game defines: A.constants={"GameConstants.Build.VERSION":"2026.18.1",...}
  // We capture this object to window so the suffix can create a Map from it.
  patches.push([
    `A.constants={"GameConstants`,
    `A.constants=window.__PNP_CONSTANTS_RAW__={"GameConstants`
  ]);

  // ── 4. Answer Question Bypass (modern class method syntax) ──
  // answerQuestion(){if(!this._isOpen){ → inject bypass before the if
  patches.push([
    `answerQuestion(){if(!this._isOpen)`,
    `answerQuestion(){if(window._&&window._.constants&&!window._.constants.get('GameConstants.Debug.EDUCATION_ENABLED')){const _w=Math.random()<(window._.constants.get('GameConstants.Debug.AUTO_ANSWER_CORRECT_PERCENT')||1);this.onQuestionAnswered.dispatch(_w,0,null);_w?this.onQuestionAnsweredCorrectly.dispatch(0,null):this.onQuestionAnsweredIncorrectly.dispatch(0,null);return}if(!this._isOpen)`
  ]);

  // ── 5. External Factory Bypass ──
  // Inject before: const E=this.findParameter("externalFactory")
  patches.push([
    /(const [A-Za-z_$]=this\.findParameter\("externalFactory"\))/,
    `if(window._&&window._.constants&&!window._.constants.get('GameConstants.Debug.EDUCATION_ENABLED')){const _w=Math.random()<(window._.constants.get('GameConstants.Debug.AUTO_ANSWER_CORRECT_PERCENT')||1);this.finish({answerCorrect:_w,responseTime:0});return}$1`
  ]);

  // ── 6. openQuestionInterfaceThenEmitNotifications bypass ──
  patches.push([
    /openQuestionInterfaceThenEmitNotifications\(([A-Za-z_$]),([A-Za-z_$]),([A-Za-z_$]),([A-Za-z_$]),([A-Za-z_$])\)\{this\._education/,
    `openQuestionInterfaceThenEmitNotifications($1,$2,$3,$4,$5){if(window._&&window._.constants&&!window._.constants.get('GameConstants.Debug.EDUCATION_ENABLED')){$5&&$5(!0,10,1,!1,!1,{});return}this._education`
  ]);

  // ── Apply all search-replace patches ──
  const patchedCore = patches.reduce((current, [searchValue, replacementValue], index) => {
    const result = current.replace(searchValue, replacementValue);
    if (result === current) {
      console.warn(`  ✗ Patch ${index + 1} did not match (non-critical)`);
    } else {
      console.log(`  ✓ Patch ${index + 1} applied`);
    }
    return result;
  }, source);

  if (!corePatched) {
    console.warn("WARNING: Could not inject singleton exposure. Setting patchDegraded=true.");
    ctx.patchDegraded = true;
  }

  // ── Prefix: runs BEFORE game code ──
  const prefix = `
/** P-NP Patcher v${VERSION} — Prefix **/
const _getBox=(o,t)=>({string:"+",style:"font-size: 1px; padding: 0 "+Math.floor(o/2)+"px; line-height: "+t+"px;"});
console.image=((o,t=1)=>{const e=new Image;e.onload=(()=>{const n=_getBox(e.width*t,e.height*t);
console.log("%c"+n.string,n.style+"background: url("+o+"); background-size: "+e.width*t+"px "
+e.height*t+"px; color: transparent;")}),e.src=o});
const _pnpOldLog = console.log.bind(console);
console.log = (...d) => {
  if (d && d.length && typeof d[0] === "string" && d[0].includes("This is a browser feature for developers only")) return "lol no";
  if (new Error().stack?.split("\\n").reverse()[0]?.includes("load-identity")) return "denied";
  return _pnpOldLog(...d);
};
/** Ensure window._ exists before game code (lodash may load separately) **/
if (typeof window._ === 'undefined' || window._ === null) window._ = {};
window.__PNP_ORIG_UNDERSCORE__ = window._;
window._.variables = Object.create(null);
`;

  // ── Suffix: runs AFTER game code ──
  const suffix = `
/** P-NP Patcher v${VERSION} — Suffix **/

/* ── 1. Immediate: Signal game loaded ── */
SW.Load.onGameLoad();
console.log("%cP-NP Patcher", "font-size:40px;color:#540052;font-weight:900;font-family:sans-serif;");
console.log("%cVersion ${VERSION}", "font-size:20px;color:#000025;font-weight:700;font-family:sans-serif;");
console.image((e => e[Math.floor(Math.random() * e.length)])(${JSON.stringify(displayImages)}));

/* ── 2. Setup P-NP properties (waits for lodash if needed) ── */
(function _pnpSetup() {
  function _applyProps() {
    const W = window;
    if (!W._) W._ = {};

    /* variables & functions namespaces */
    if (!W._.variables) W._.variables = Object.create(null);
    W._.functions = Object.create(null);

    /* _.instance → the prodigy singleton exposed by our constructor patch */
    Object.defineProperty(W._, "instance", {
      get: () => W.__PNP__,
      enumerable: true, configurable: true
    });

    /* _.constants → Map built from the raw constants object */
    if (W.__PNP_CONSTANTS_RAW__) {
      W._.constants = new Map(Object.entries(W.__PNP_CONSTANTS_RAW__));
    }

    /* _.player → player service from DI container */
    Object.defineProperty(W._, "player", {
      get: () => {
        try { return W.__PNP__?.prodigy?.gameContainer?.get("3e5-dac1")?.player; }
        catch(e) { return null; }
      },
      enumerable: true, configurable: true
    });

    /* _.gameData */
    Object.defineProperty(W._, "gameData", {
      get: () => {
        try { return W.__PNP__?.game?.state?.states?.get?.("Boot")?._gameData; }
        catch(e) { return null; }
      },
      enumerable: true, configurable: true
    });

    /* _.localizer */
    Object.defineProperty(W._, "localizer", {
      get: () => {
        try { return W.__PNP__?.prodigy?.gameContainer?.get("LocalizationService"); }
        catch(e) { return null; }
      },
      enumerable: true, configurable: true
    });

    /* _.network → NetworkManager from DI container (service "e2e-9e38")
       CheatGUI expects: _.network.processPlayer (bool), _.network.game._paused,
       _.network.getCharData(uid) */
    Object.defineProperty(W._, "network", {
      get: function() {
        if (W.__PNP_NETWORK__) return W.__PNP_NETWORK__;
        try {
          var gc = W.__PNP__ && W.__PNP__.prodigy && W.__PNP__.prodigy.gameContainer;
          if (!gc) return null;
          var nm = gc.get("e2e-9e38");
          if (nm && typeof nm === "object") {
            if (!nm.game) {
              Object.defineProperty(nm, "game", {
                get: function() { return W.__PNP__ && W.__PNP__.game; },
                enumerable: true, configurable: true
              });
            }
            W.__PNP_NETWORK__ = nm;
            console.log("[P-NP] NetworkManager resolved (e2e-9e38)");
            return nm;
          }
        } catch(e) {}
        return null;
      },
      enumerable: true, configurable: true
    });

    /* _.hack → self-reference */
    Object.defineProperty(W._, "hack", {
      get: () => W._, enumerable: true, configurable: true
    });

    /* Escape battle helper */
    W._.functions.escapeBattle = () => {
      try {
        const g = W.__PNP__?.game;
        const currentState = g?.state?.current;
        if (currentState === "PVP") g.state.states.PVP.endPVP();
        else if (currentState === "CoOp") W.__PNP__.prodigy.world.$(W._.player?.data?.zone);
        else g?.state?.callbackContext?.runAwayCallback();
      } catch(e) { console.warn("[P-NP] escapeBattle failed:", e); }
    };

    if (!W.__PNP_PROPS_APPLIED__) {
      W.__PNP_PROPS_APPLIED__ = true;
      console.log("[P-NP] Properties applied to window._");
    }
  }

  /* Lodash loads as a SEPARATE script AFTER game.min.js.
     When it loads, it overwrites window._ entirely — and the game keeps
     reassigning window._ (chunks, runInContext, etc.) indefinitely.
     We PERMANENTLY poll and re-apply our properties whenever they're
     missing. The 500ms interval is negligible overhead. */
  _applyProps();

  setInterval(() => {
    try {
      const desc = Object.getOwnPropertyDescriptor(window._, 'instance');
      if (!desc || !desc.get || !window.__PNP__) {
        _applyProps();
      }
      /* Lazy-resolve NetworkManager: it registers AFTER game init,
         so we poll until we can cache it. */
      if (!window.__PNP_NETWORK__ && window.__PNP__) {
        try {
          var gc = window.__PNP__.prodigy && window.__PNP__.prodigy.gameContainer;
          if (gc) {
            var nm = gc.get("e2e-9e38");
            if (nm && typeof nm === "object") {
              if (!nm.game) {
                Object.defineProperty(nm, "game", {
                  get: function() { return window.__PNP__ && window.__PNP__.game; },
                  enumerable: true, configurable: true
                });
              }
              window.__PNP_NETWORK__ = nm;
              console.log("[P-NP] NetworkManager resolved (e2e-9e38)");
            }
          }
        } catch(e) { /* service not registered yet */ }
      }
    } catch(e) { _applyProps(); }
  }, 500);
})();

/* ── 3. CheatGUI loader (delayed to ensure game is ready) ── */
setTimeout(() =>
  (async () => {
    try {
      const guiUrl = window.__PHEX_GUI_URL__ || "${GUI_LINK}";
      eval(await (await fetch(guiUrl)).text());
    } catch(e) {
      console.error("[P-NP] CheatGUI load failed:", e);
    }
  })(), 15000);
console.trace = () => {};
`;

  return `${prefix}\n${patchedCore}\n${suffix}`;
};

const patchPublicGameFile = (source: string): string => {
  return `
(() => {
  const console = new Proxy({}, { get: () => () => {} });
  ${source}
})();
`;
};

const fetchText = async (url: string): Promise<string> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed for ${url} (${response.status} ${response.statusText}).`);
    }

    const text = await response.text();
    return text;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const runPatch = async (outputDir = "patched-output"): Promise<PatchResult> => {
  const ctx: PatchContext = { patchDegraded: false };

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

  if (!isJavaScript(gameSource)) {
    throw new Error(`Fetched game.min.js does not appear to be valid JavaScript.`);
  }
  if (!isJavaScript(loadGameSource)) {
    throw new Error(`Fetched load-game.min.js does not appear to be valid JavaScript.`);
  }

  const publicGameHash = parsePublicGameHash(loadGameSource);
  const publicGameUrl = publicGameHash
    ? `${PRODIGY_CODE_ORIGIN}/js/public-game-${publicGameHash}.min.js`
    : null;
  const publicGameSource = publicGameUrl ? await fetchText(publicGameUrl) : null;

  if (publicGameSource && !isJavaScript(publicGameSource)) {
    throw new Error(`Fetched public-game.min.js does not appear to be valid JavaScript.`);
  }

  console.log("Applying patches...");
  const patchedGame = patchGameFile(gameSource, ctx);
  const patchedPublicGame = publicGameSource ? patchPublicGameFile(publicGameSource) : null;

  const resolvedOutputDir = path.resolve(outputDir);
  await mkdir(resolvedOutputDir, { recursive: true });

  const writes: Array<Promise<void>> = [
    writeFile(path.join(resolvedOutputDir, "game.min.js"), `// game.min.js v${gameVersion}\n\n${patchedGame}`, "utf8"),
    writeFile(
      path.join(resolvedOutputDir, "metadata.json"),
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          patcherVersion: VERSION,
          gameVersion,
          publicGameHash,
          loadGamePath,
          patchDegraded: ctx.patchDegraded,
          source: {
            gameUrl,
            publicGameUrl,
            loadGameUrl,
            loadUrl: PRODIGY_LOAD_URL
          }
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

  return {
    outputDir: resolvedOutputDir,
    gameClientVersion: gameVersion,
    publicGameHash,
    loadGamePath,
    patchDegraded: ctx.patchDegraded
  };
};

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  const outputDir = process.argv[2] ?? "patched-output";

  runPatch(outputDir)
    .then((result) => {
      console.log(`Patched files written to ${result.outputDir}`);
      console.log(`gameClientVersion=${result.gameClientVersion}`);
      console.log(`publicGameHash=${result.publicGameHash}`);
      console.log(`loadGamePath=${result.loadGamePath}`);
      if (result.patchDegraded) {
        console.warn(`WARNING: patchDegraded=true - some patches may not have been applied`);
      }
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      console.error(message);
      process.exitCode = 1;
    });
}
