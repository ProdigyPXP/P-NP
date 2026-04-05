import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GUI_LINK, PRODIGY_CODE_ORIGIN, PRODIGY_LOAD_URL, VERSION } from "./constants.js";
import { displayImages } from "./displayImages.js";

type GameStatus = {
  gameClientVersion: string;
};

export type PatchResult = {
  outputDir: string;
  gameClientVersion: string;
  publicGameHash: string | null;
  loadGamePath: string;
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

const patchGameFile = (source: string): string => {
  const app = source.match(/window,function\(([^)]+)\)/)?.[1] ?? null;
  const game = source.match(/var\s+([A-Za-z_$][\w$]*)\s*=\s*\{\}/)?.[1] ?? null;

  const patches: Array<[string | RegExp, string]> = [];

  if (app && game) {
    patches.push([
      `s),this._game=${game}`,
      `s),this._game=${game};
		window.oldLodash = window._;
		let lodashChecker = setInterval(() => {
			if (window.oldLodash !== window._) {
				window._ = window.oldLodash;
				clearInterval(lodashChecker);
			}
		});
		Object.defineProperty(window._, "instance", {
			get: () => ${app}.instance,
			enumerable: true,
			configurable: true
		});`
    ]);
    patches.push([`${app}.constants=Object`, `window._.constants=${app},${app}.constants=Object`]);
    patches.push([`window,function(${app}){var ${game}={};`, `window,function(${app}){var ${game}={};window._.modules=${game};`]);
    patches.push([`${app}.prototype.hasMembership=`, `${game}.prototype.hasMembership=_=>true,${game}.prototype.originalHasMembership=`]);
  }

  patches.push(
    [
      "answerQuestion=function(){",
      `answerQuestion=function(){
			if (!_.constants.get('GameConstants.Debug.EDUCATION_ENABLED')) {
				const wasCorrect = Math.random() < _.constants.get('GameConstants.Debug.AUTO_ANSWER_CORRECT_PERCENT');
				this.onQuestionAnswered.dispatch(wasCorrect, 0, null);
				if (wasCorrect) {
					this.onQuestionAnsweredCorrectly.dispatch(0, null);
				} else {
					this.onQuestionAnsweredIncorrectly.dispatch(0, null);
				}
				return;
			}
		`
    ],
    [
      /type\.sendEvent=function\((.), (.), (.)\) \{/,
      `type.sendEvent=function($1, $2, $3) {
			if (!_.constants.get('GameConstants.Debug.EDUCATION_ENABLED')) {
				return
			}
		`
    ],
    [
      /(var .=this.findParameter\("externalFactory"\))/,
      `
	if (!_.constants.get('GameConstants.Debug.EDUCATION_ENABLED')) {
		const wasCorrect = Math.random() < _.constants.get('GameConstants.Debug.AUTO_ANSWER_CORRECT_PERCENT');
		this.finish({ answerCorrect: wasCorrect, responseTime: 0 });
		return;
	}
	$1`
  ],
    [
      /openQuestionInterfaceThenEmitNotifications=function\((.), (.), (.), (.), (.)\) \{/,
      `openQuestionInterfaceThenEmitNotifications=function($1, $2, $3, $4, $5) {
	if (!_.constants.get('GameConstants.Debug.EDUCATION_ENABLED')) {
		const wasCorrect = true;
		const skill = {}
		const questionAnswerResponse = { eventType, skill, wasCorrect };
		this.fireEvent(MathTowerNotificationType.TOWER_TOWN_QUESTION_ANSWERED, questionAnswerResponse);
		if (callback) {
			callback(wasCorrect, 10, 1, false, false, skill);
		}
		return;
	}
	`
    ],
    [/\.\.setContentVisible\(!1\)\}\)/, "})"]
  );

  const patchedCore = patches.reduce((current, [searchValue, replacementValue]) => {
    return current.replace(searchValue, replacementValue);
  }, source);

  const playerAccessor = source.match(/instance\.prodigy\.gameContainer\.get\("...-...."\)\.player/)?.[0] ?? null;

  const prefix = `
/** DO NOT TOUCH **/
const _getBox=(o,t)=>({string:"+",style:"font-size: 1px; padding: 0 "+Math.floor(o/2)+"px; line-height: "+t+"px;"});
console.image=((o,t=1)=>{const e=new Image;e.onload=(()=>{const n=_getBox(e.width*t,e.height*t);
console.log("%c"+n.string,n.style+"background: url("+o+"); background-size: "+e.width*t+"px "
+e.height*t+"px; color: transparent;")}),e.src=o});
/** ok touch now */
const oldLog = console.log.bind(console);
console.log = (...d) => {
	if (d && d.length && typeof d[0] === "string" && d[0].includes("This is a browser feature for developers only")) return "lol no";
	if (new Error().stack?.split("\\n").reverse()[0]?.includes("load-identity")) return "denied";
	return oldLog(...d);
};
_.variables = Object.create(null);
`;

  const suffix = `
_.functions = Object.create(null);
_.functions.escapeBattle = () => {
	const currentState = _.instance.game.state.current;
	if (currentState === "PVP") _.instance.game.state.states.PVP.endPVP();
	else if (currentState === "CoOp") _.instance.prodigy.world.$(_.player.data.zone);
	else _.instance.game.state.callbackContext.runAwayCallback();
};
${playerAccessor ? `Object.defineProperty(_, "player", {
  get: () => _.${playerAccessor},
  enumerable: true,
  configurable: true
});` : ""}
Object.defineProperty(_, "gameData", {
	get: () => _.instance.game.state.states.get("Boot")._gameData,
	enumerable: true,
	configurable: true
});
Object.defineProperty(_, "localizer", {
	get: () => _.instance.prodigy.gameContainer.get("LocalizationService"),
	enumerable: true,
	configurable: true
});
Object.defineProperty(_, "network", {
	get: () => _.player.game.input.onDown._bindings[0].context,
	enumerable: true,
	configurable: true
});
Object.defineProperty(_, "hack", {
	enumerable: true,
	configurable: true,
	get: () => _
});

console.log("%cP-NP Patcher", "font-size:40px;color:#540052;font-weight:900;font-family:sans-serif;");
console.log("%cVersion ${VERSION}", "font-size:20px;color:#000025;font-weight:700;font-family:sans-serif;");

console.image((e => e[Math.floor(Math.random() * e.length)])(${JSON.stringify(displayImages)}));
SW.Load.onGameLoad();
setTimeout(() =>
	(async () =>
		eval(
			await (
				await fetch(
					"${GUI_LINK}"
				)
			).text()
		)
	)(), 15000);
console.trace = () => {};

window.oldLodash = window._;
let lodashChecker = setInterval(() => {
	if (window.oldLodash !== window._) {
		window._ = window.oldLodash;
		clearInterval(lodashChecker);
	}
});
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
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed for ${url} (${response.status} ${response.statusText}).`);
  }

  return response.text();
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

  const publicGameHash = parsePublicGameHash(loadGameSource);
  const publicGameUrl = publicGameHash
    ? `${PRODIGY_CODE_ORIGIN}/js/public-game-${publicGameHash}.min.js`
    : null;
  const publicGameSource = publicGameUrl ? await fetchText(publicGameUrl) : null;

  const patchedGame = patchGameFile(gameSource);
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
    loadGamePath
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
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      console.error(message);
      process.exitCode = 1;
    });
}
