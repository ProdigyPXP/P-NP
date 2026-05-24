export const buildPrefix = (version: string): string => {
  return `
/** P-NP Patcher v${version} — Prefix **/
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
/** Pre-init _.constants as empty obj with Map-like API so game-side patches don't crash
 *  before the suffix wires up __PNP_CONSTANTS_RAW__. Real values populated post-game-load. **/
if (!window._.constants) {
  var _c = Object.create(null);
  _c.get = function(k) { return _c[k]; };
  _c.set = function(k, v) { _c[k] = v; return _c; };
  _c.has = function(k) { return k in _c; };
  _c.constants = _c;
  window._.constants = _c;
}

/** Fix Inversify duplicate binding errors (e.g. "Ambiguous match: MathTower").
 *  Some installers bind services to the GLOBAL gameContainer and can fire more
 *  than once in the patched execution context. We define a helper that the
 *  game-code patch below uses to safely bind (rebind if already bound). */
window.__pnp_safeBind = function(container, id) {
  try {
    var inv = container._inversifyContainer || container;
    if (typeof inv.isBound === 'function' && inv.isBound(id)) {
      return (typeof container.rebind === 'function') ? container.rebind(id) : inv.rebind(id);
    }
  } catch(e) {}
  return container.bind(id);
};

/** Guard SW.Load.decrementLoadSemaphore against duplicate calls.
 *  ROOT CAUSE: The old extension build (fetch+onreset approach) appends a second
 *  SW.Load.decrementLoadSemaphore() call after the game code, AND the patcher
 *  suffix calls it too → createGame() fires twice → all Inversify bind() calls
 *  run twice on the same container → "Ambiguous match found for MathTower" crash.
 *
 *  Fix: wrap the function so only the FIRST call triggers createGame().
 *  This works for both old extension (fetch+onreset) and new extension (doc-rewrite). */
/** Runtime service discovery — enumerate Inversify bindings and match by shape (duck-typing).
 *  This replaces hardcoded service IDs that break every game update. */
window.__pnp_discoverService = function(gc, shapeFn, label) {
  try {
    var map = gc._inversifyContainer._bindingDictionary._map;
    if (!map) return null;
    var hexPattern = /^[0-9a-f]{2,4}-[0-9a-f]{2,6}$/;
    var iter = map.keys();
    var next = iter.next();
    while (!next.done) {
      var id = next.value;
      next = iter.next();
      if (typeof id !== 'string' || !hexPattern.test(id)) continue;
      try {
        var inst = gc.get(id);
        if (inst && shapeFn(inst)) {
          console.log("[Play Origin] Discovered " + label + " \\u2192 " + id);
          return inst;
        }
      } catch(e) {}
    }
  } catch(e) {
    console.warn("[Play Origin] Discovery failed for " + label + ":", e);
  }
  return null;
};

if (typeof SW !== 'undefined' && SW.Load && typeof SW.Load.decrementLoadSemaphore === 'function') {
  var _pnpOrigDecrement = SW.Load.decrementLoadSemaphore.bind(SW.Load);
  SW.Load.decrementLoadSemaphore = function() {
    if (window.__PNP_SEM_DECREMENTED__) {
      console.warn("[Play Origin] SW.Load.decrementLoadSemaphore() called twice — blocking duplicate createGame()");
      return;
    }
    window.__PNP_SEM_DECREMENTED__ = true;
    return _pnpOrigDecrement();
  };
}
`;
};

export const buildSuffix = (
  version: string,
  guiLink: string,
  displayImages: ReadonlyArray<string>
): string => {
  return `
/** P-NP Patcher v${version} — Suffix **/

/* ── 1. Immediate: Signal game script loaded ── */
SW.Load.decrementLoadSemaphore();
console.log("%cP-NP Patcher", "font-size:40px;color:#540052;font-weight:900;font-family:sans-serif;");
console.log("%cVersion ${version}", "font-size:20px;color:#000025;font-weight:700;font-family:sans-serif;");
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

    /* _.constants → raw plain object with Map-compatible .get()/.set() + self-alias .constants
     * WHY: cheatGUI uses _.constants.constants["GameConstants.X"] = val (plain object writes)
     *      patcher game-side bypasses use _.constants.get("GameConstants.X") (Map-like reads)
     *      Both must work on the same underlying storage. We make _.constants the raw object
     *      and bolt on get/set/has methods + a .constants self-alias so every call site works. */
    if (W.__PNP_CONSTANTS_RAW__) {
      var raw = W.__PNP_CONSTANTS_RAW__;
      /* bolt Map-like API onto the plain object */
      raw.get = function(key) { return raw[key]; };
      raw.set = function(key, val) { raw[key] = val; return raw; };
      raw.has = function(key) { return key in raw; };
      /* self-alias: _.constants.constants["GameConstants.X"] = val */
      raw.constants = raw;
      W._.constants = raw;
    }

    /* _.player → discovered dynamically from DI container by shape.
     * Cache the SERVICE (stable ref), not the player object (.player getter
     * returns a new object each call). */
    Object.defineProperty(W._, "player", {
      get: function() {
        if (W.__PNP_PLAYER_SVC__) return W.__PNP_PLAYER_SVC__.player;
        try {
          var gc = W.__PNP__ && W.__PNP__.prodigy && W.__PNP__.prodigy.gameContainer;
          if (!gc) return null;
          var svc = W.__pnp_discoverService(gc, function(inst) {
            try { var p = inst.player; return p && typeof p === 'object' && ('data' in p); }
            catch(e) { return false; }
          }, "PlayerService");
          if (svc) {
            W.__PNP_PLAYER_SVC__ = svc;
            return svc.player;
          }
        } catch(e) {}
        return null;
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

    /* _.network → discovered dynamically from DI container by shape */
    Object.defineProperty(W._, "network", {
      get: function() {
        if (W.__PNP_NETWORK__) return W.__PNP_NETWORK__;
        try {
          var gc = W.__PNP__ && W.__PNP__.prodigy && W.__PNP__.prodigy.gameContainer;
          if (!gc) return null;
          var nm = W.__pnp_discoverService(gc, function(inst) {
            return typeof inst.getCharData === 'function'
                && ('processPlayer' in inst)
                && typeof inst.sendZoneEvent === 'function';
          }, "NetworkManager");
          if (nm && typeof nm === "object") {
            if (!nm.game) {
              Object.defineProperty(nm, "game", {
                get: function() { return W.__PNP__ && W.__PNP__.game; },
                enumerable: true, configurable: true
              });
            }
            W.__PNP_NETWORK__ = nm;
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

    /* Escape battle helper — handles SecureBattleRevamp via BattleController */
    W._.functions.escapeBattle = () => {
      try {
        const g = W.__PNP__?.game;
        const currentState = g?.state?.current;
        if (currentState === "PVP") {
          g.state.states.PVP.endPVP();
        } else if (currentState === "CoOp") {
          W.__PNP__.prodigy.world.$(W._.player?.data?.zone);
        } else if (currentState === "SecureBattleRevamp") {
          const st = g.state.states.get("SecureBattleRevamp");
          const bc = st?._battleController;
          if (bc?.escapeBattle) bc.escapeBattle();
          else g?.state?.callbackContext?.runAwayCallback();
        } else {
          g?.state?.callbackContext?.runAwayCallback();
        }
      } catch(e) { console.warn("[Play Origin] escapeBattle failed:", e); }
    };

    /* _.membership → discovered by shape (isMember getter + hasFeatureAccess).
     * Service ID drifts per build; shape is stable. */
    Object.defineProperty(W._, "membership", {
      get: function() {
        if (W.__PNP_MEMBERSHIP__) return W.__PNP_MEMBERSHIP__;
        try {
          var gc = W.__PNP__ && W.__PNP__.prodigy && W.__PNP__.prodigy.gameContainer;
          if (!gc) return null;
          var ms = W.__pnp_discoverService(gc, function(inst) {
            return inst && typeof inst.hasFeatureAccess === 'function'
                && 'isMember' in inst;
          }, "MembershipService");
          if (ms) { W.__PNP_MEMBERSHIP__ = ms; return ms; }
        } catch(e) {}
        return null;
      },
      enumerable: true, configurable: true
    });

    /* _.functions.setMembership(bool) — deep membership override.
       memberTier is derived from three hasFeatureAccess checks, so forcing it to return
       true auto-promotes to Ultra tier. We snapshot the original _data on first call so
       disable restores it. */
    W._.functions.setMembership = function(active) {
      var ms = W._.membership;
      if (!ms) return false;
      if (!W.__PNP_MEMBERSHIP_ORIG__) {
        W.__PNP_MEMBERSHIP_ORIG__ = { data: ms._data };
      }
      if (active) {
        var start = new Date(Date.now() - 86400000).toISOString();
        var end = new Date(Date.now() + 365 * 86400000 * 10).toISOString();
        ms._data = {
          active: true,
          features: [],
          membershipStartTs: start,
          membershipEndTs: end
        };
        Object.defineProperty(ms, "hasFeatureAccess", {
          value: function() { return true; },
          configurable: true, writable: true
        });
        try { ms.updateMembershipDates && ms.updateMembershipDates(); } catch(e) {}
        try { W._.player && W._.player.unlockMemberItems && W._.player.unlockMemberItems(); } catch(e) {}
      } else {
        ms._data = W.__PNP_MEMBERSHIP_ORIG__.data;
        if (Object.getOwnPropertyDescriptor(ms, "hasFeatureAccess")) {
          delete ms.hasFeatureAccess;
        }
        try { ms.updateMembershipDates && ms.updateMembershipDates(); } catch(e) {}
      }
      try { W._.player && (W._.player.appearanceChanged = true); } catch(e) {}
      return true;
    };

    if (!W.__PNP_PROPS_APPLIED__) {
      W.__PNP_PROPS_APPLIED__ = true;
      console.log("[Play Origin] Properties applied to window._");
    }
  }

  /* Lodash loads as a SEPARATE script AFTER game.min.js.
     When it loads, it overwrites window._ entirely — and the game keeps
     reassigning window._ (chunks, runInContext, etc.) indefinitely.
     We PERMANENTLY poll and re-apply our properties whenever they're
     missing. The 500ms interval is negligible overhead. */
  _applyProps();

  var _pnpPollTick = function() {
    try {
      const desc = Object.getOwnPropertyDescriptor(window._, 'instance');
      if (!desc || !desc.get || !window.__PNP__) {
        _applyProps();
      }
      /* Singleton auto-fix: the constructor may fire twice (onreset context).
         Our patch captures the first instance, but the REAL fully-initialized
         singleton (with #prodigy set) is stored on the class's static _instance.
         Detect the mismatch and update __PNP__ to the real one. */
      if (window.__PNP__ && !window.__PNP__.prodigy) {
        try {
          var ctor = Object.getPrototypeOf(window.__PNP__).constructor;
          if (ctor._instance && ctor._instance !== window.__PNP__ && ctor._instance.prodigy) {
            window.__PNP__ = ctor._instance;
            console.log("[Play Origin] Singleton auto-fixed to real instance (prodigy available)");
          }
        } catch(e) {}
      }
      /* Trigger lazy discovery for player and network via their getters */
      if (!window.__PNP_PLAYER_SVC__ && window.__PNP__) {
        try { void window._.player; } catch(e) {}
      }
      if (!window.__PNP_NETWORK__ && window.__PNP__) {
        try { void window._.network; } catch(e) {}
      }
    } catch(e) { _applyProps(); }
  };
  setInterval(_pnpPollTick, 500);
})();

/* ── 3. CheatGUI loader (delayed to ensure game is ready) ── */
var _pnpLoadGUI = async () => {
  try {
    eval(await (await fetch("${guiLink}")).text());
  } catch(e) {
    console.error("[Play Origin] CheatGUI load failed:", e);
  }
};
setTimeout(_pnpLoadGUI, 15000);
console.trace = () => {};
`;
};
