import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RULES, applyRules, hashRules, type PatchRule } from "../src/patches.ts";

describe("RULES shape", () => {
  it("includes the singleton-exposure rule", () => {
    const ids = RULES.map((r) => r.id);
    assert.ok(ids.includes("singleton-exposure"));
  });

  it("every rule has the full PatchRule shape", () => {
    for (const rule of RULES) {
      assert.equal(typeof rule.id, "string");
      assert.equal(typeof rule.description, "string");
      assert.equal(typeof rule.find, "string");
      assert.equal(typeof rule.flags, "string");
      assert.equal(typeof rule.replace, "string");
      assert.equal(typeof rule.minMatches, "number");
    }
  });

  it("rule ids are unique", () => {
    const ids = RULES.map((r) => r.id);
    assert.equal(new Set(ids).size, ids.length);
  });
});

describe("applyRules — substitutions on synthetic bundle", () => {
  it("singleton-exposure injects window.__PNP__", () => {
    const input = `class X{constructor(){_instance=this),this._game=E}destroy(){}}`;
    const { output, perRuleCounts } = applyRules(input, RULES);
    assert.ok(output.includes("window.__PNP__=this"));
    assert.ok((perRuleCounts["singleton-exposure"] ?? 0) >= 1);
  });

  it("safe-bind wraps gameContainer.bind calls", () => {
    const input = `A.q.instance.prodigy.gameContainer.bind("MathTower")`;
    const { output } = applyRules(input, RULES);
    assert.ok(output.includes("window.__pnp_safeBind"));
    assert.ok(!output.match(/[A-Za-z_$][\w$]*\.q\.instance\.prodigy\.gameContainer\.bind\(/));
  });

  it("constants exposure aliases the constants map", () => {
    const input = `var M={};M.constants={"GameConstants.Build.VERSION":"2026.18.1"}`;
    const { output } = applyRules(input, RULES);
    assert.ok(output.includes("__PNP_CONSTANTS_RAW__"));
  });

  it("answerQuestion bypass injects before the if-isOpen check", () => {
    const input = `answerQuestion(){if(!this._isOpen){this._doStuff()}}`;
    const { output, perRuleCounts } = applyRules(input, RULES);
    assert.ok(output.includes("AUTO_ANSWER_CORRECT_PERCENT"));
    assert.ok((perRuleCounts["answer-question-bypass"] ?? 0) >= 1);
  });

  it("externalFactory bypass wraps the findParameter call", () => {
    const input = `function f(){const Q=this.findParameter("externalFactory");return Q.thing()}`;
    const { output } = applyRules(input, RULES);
    assert.ok(output.includes("EDUCATION_ENABLED"));
    assert.ok(output.includes(`const Q=this.findParameter("externalFactory")`));
  });

  it("openQuestionInterfaceThenEmitNotifications bypass injects the early return", () => {
    const input = `class C{openQuestionInterfaceThenEmitNotifications(a,b,c,d,e){this._education.thing()}}`;
    const { output, perRuleCounts } = applyRules(input, RULES);
    assert.ok(output.includes("EDUCATION_ENABLED"));
    assert.ok((perRuleCounts["open-question-bypass"] ?? 0) >= 1);
  });
});

describe("applyRules — counting + return shape", () => {
  it("reports per-rule counts as numbers", () => {
    const { perRuleCounts } = applyRules("nothing here", RULES);
    for (const rule of RULES) {
      assert.equal(typeof perRuleCounts[rule.id], "number");
    }
  });

  it("preserves source when no rule matches", () => {
    const { output } = applyRules("just text", RULES);
    assert.equal(output, "just text");
  });
});

describe("hashRules", () => {
  it("returns a 16-char hex string", () => {
    const hash = hashRules(RULES);
    assert.equal(hash.length, 16);
    assert.match(hash, /^[0-9a-f]{16}$/);
  });

  it("is deterministic", () => {
    assert.equal(hashRules(RULES), hashRules(RULES));
  });

  it("changes when rules change", () => {
    const a: PatchRule = { id: "x", description: "", find: "a", flags: "g", replace: "b", minMatches: 1 };
    const b: PatchRule = { id: "x", description: "", find: "a", flags: "g", replace: "c", minMatches: 1 };
    assert.notEqual(hashRules([a]), hashRules([b]));
  });
});
