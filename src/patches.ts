import { createHash } from "node:crypto";

export type PatchRule = {
  id: string;
  description: string;
  find: string;     // RegExp source (no surrounding slashes)
  flags: string;    // RegExp flags ("" = first-match only; include "g" for replace-all)
  replace: string;
  minMatches: number;
};

// Ordered list of regex find/replace rules applied to game.min.js.
// All current Play Origin in-source patches converted to regex form, preserving
// first-match-vs-all semantics from the original patcher.
export const RULES: ReadonlyArray<PatchRule> = [
  {
    id: "singleton-exposure",
    description: "Expose the prodigy singleton on window.__PNP__ in its constructor",
    find: "(_instance=this\\),this\\._game=([A-Za-z_$][\\w$]*)\\}destroy\\(\\)\\{)",
    flags: "",
    replace: "_instance=this),window.__PNP__=this,this._game=$2}destroy(){",
    minMatches: 1
  },
  {
    id: "safe-bind",
    description: "Wrap every gameContainer.bind call with __pnp_safeBind for idempotent (re)binding",
    find: "([A-Za-z_$][\\w$]*\\.q\\.instance\\.prodigy\\.gameContainer)\\.bind\\(",
    flags: "g",
    replace: "window.__pnp_safeBind($1,",
    minMatches: 1
  },
  {
    id: "expose-constants",
    description: "Alias the constants map onto window.__PNP_CONSTANTS_RAW__",
    find: "([A-Za-z_$][\\w$]*)\\.constants=\\{\"GameConstants",
    flags: "",
    replace: "$1.constants=window.__PNP_CONSTANTS_RAW__={\"GameConstants",
    minMatches: 1
  },
  {
    id: "answer-question-bypass",
    description: "Inject auto-answer bypass before the isOpen check in answerQuestion()",
    find: "answerQuestion\\(\\)\\{if\\(!this\\._isOpen\\)",
    flags: "",
    replace:
      "answerQuestion(){if(window._&&window._.constants&&!window._.constants.get('GameConstants.Debug.EDUCATION_ENABLED')){const _w=Math.random()<(window._.constants.get('GameConstants.Debug.AUTO_ANSWER_CORRECT_PERCENT')||1);this.onQuestionAnswered.dispatch(_w,0,null);_w?this.onQuestionAnsweredCorrectly.dispatch(0,null):this.onQuestionAnsweredIncorrectly.dispatch(0,null);return}if(!this._isOpen)",
    minMatches: 1
  },
  {
    id: "external-factory-bypass",
    description: "Inject auto-answer bypass before const X=this.findParameter(\"externalFactory\")",
    find: "(const [A-Za-z_$]=this\\.findParameter\\(\"externalFactory\"\\))",
    flags: "",
    replace:
      "if(window._&&window._.constants&&!window._.constants.get('GameConstants.Debug.EDUCATION_ENABLED')){const _w=Math.random()<(window._.constants.get('GameConstants.Debug.AUTO_ANSWER_CORRECT_PERCENT')||1);this.finish({answerCorrect:_w,responseTime:0});return}$1",
    minMatches: 1
  },
  {
    id: "open-question-bypass",
    description: "Inject early-return into openQuestionInterfaceThenEmitNotifications",
    find: "openQuestionInterfaceThenEmitNotifications\\(([A-Za-z_$]),([A-Za-z_$]),([A-Za-z_$]),([A-Za-z_$]),([A-Za-z_$])\\)\\{this\\._education",
    flags: "",
    replace:
      "openQuestionInterfaceThenEmitNotifications($1,$2,$3,$4,$5){if(window._&&window._.constants&&!window._.constants.get('GameConstants.Debug.EDUCATION_ENABLED')){$5&&$5(!0,10,1,!1,!1,{});return}this._education",
    minMatches: 1
  }
];

export type ApplyRulesOutcome = {
  output: string;
  perRuleCounts: Record<string, number>;
};

export const applyRules = (
  source: string,
  rules: ReadonlyArray<PatchRule>
): ApplyRulesOutcome => {
  const perRuleCounts: Record<string, number> = {};
  let output = source;
  for (const rule of rules) {
    const re = new RegExp(rule.find, rule.flags);
    let count = 0;
    output = output.replace(re, (...args) => {
      count += 1;
      const groups = args.slice(1, -2);
      let result = rule.replace;
      groups.forEach((g, i) => {
        result = result.replace(new RegExp("\\$" + (i + 1), "g"), g ?? "");
      });
      return result;
    });
    perRuleCounts[rule.id] = count;
  }
  return { output, perRuleCounts };
};

export const hashRules = (rules: ReadonlyArray<PatchRule>): string => {
  const canonical = JSON.stringify(rules);
  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
};
