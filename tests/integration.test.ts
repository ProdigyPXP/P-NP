import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RULES, applyRules } from "../src/patches.ts";
import { buildPrefix, buildSuffix } from "../src/wrappers.ts";
import { buildManifest } from "../src/manifest.ts";

// Synthetic mini-bundle exhibiting all patch sites we care about.
const FIXTURE = `
class Prodigy{constructor(E){_instance=this),this._game=E}destroy(){this._prodigy=null}}
class GC{thing(){return A.q.instance.prodigy.gameContainer.bind("MathTower").to(X);}}
var M={};M.constants={"GameConstants.Build.VERSION":"2026.18.1","GameConstants.Debug.EDUCATION_ENABLED":false};
class Q{answerQuestion(){if(!this._isOpen){return this._dispatch();}}}
class EF{run(){const Z=this.findParameter("externalFactory");return Z();}}
class OQ{openQuestionInterfaceThenEmitNotifications(a,b,c,d,e){this._education.fire();}}
`;

describe("integration — full pipeline on synthetic bundle", () => {
  it("apply rules → wrap → manifest pipeline produces expected output", () => {
    const { output: patched, perRuleCounts } = applyRules(FIXTURE, RULES);

    for (const rule of RULES) {
      assert.ok(
        (perRuleCounts[rule.id] ?? 0) >= rule.minMatches,
        `rule ${rule.id} matched ${perRuleCounts[rule.id]} times, needs ${rule.minMatches}`
      );
    }

    const prefix = buildPrefix("4.4.0");
    const suffix = buildSuffix("4.4.0", "https://x/y.js", ["https://img/1.png"]);
    const wrapped = `${prefix}\n${patched}\n${suffix}`;

    assert.ok(wrapped.includes("window.__PNP__=this"));
    assert.ok(wrapped.includes("window.__pnp_safeBind"));
    assert.ok(wrapped.includes("__PNP_CONSTANTS_RAW__"));
    assert.ok(wrapped.includes("AUTO_ANSWER_CORRECT_PERCENT"));
    assert.ok(wrapped.includes("P-NP Patcher v4.4.0 — Prefix"));
    assert.ok(wrapped.includes("P-NP Patcher v4.4.0 — Suffix"));

    const manifest = buildManifest({
      patcherVersion: "4.4.0",
      rules: RULES,
      prefix,
      suffix
    });

    assert.equal(manifest.schemaVersion, 1);
    assert.equal(manifest.patcherVersion, "4.4.0");
    assert.match(manifest.hash, /^[0-9a-f]{16}$/);
    assert.equal(manifest.rules.length, RULES.length);
    assert.equal(manifest.prefix, prefix);
    assert.equal(manifest.suffix, suffix);
  });
});
