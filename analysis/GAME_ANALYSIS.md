# P-NP Patcher Analysis: Game Structure and Regex Pattern Findings

**Analysis Date:** 2026-04-05
**Game Version:** 2026.18.1
**File Analyzed:** game.beautified.js (265,076 lines), game.min.js

---

## Executive Summary

The P-NP patcher is BROKEN for the current game version. The regex patterns used to detect `app` and `game` variables are based on an OLD webpack bundle format that no longer exists in the current game. The game now uses modern ES6 modules with explicit exports instead of the legacy IIFE-based webpack pattern the patcher expects.

**Result:** The patcher will report `patchDegraded=true` on the current game version because it cannot find the `app` and `game` variables.

---

## 1. Webpack Bundle Structure

### Current Format (What the Game Actually Has)

The game uses modern webpack 5 with a self-executing function that exports to `window`:

```javascript
(() => {
    var __webpack_modules__ = {
        51151: function(E, w, T) { /* module code */ },
        // ... thousands more modules ...
    };

    var __webpack_module_cache__ = {};

    function __webpack_require__(E) {
        var w = __webpack_module_cache__[E];
        if (void 0 !== w) return w.exports;
        var T = __webpack_module_cache__[E] = {
            id: E,
            loaded: !1,
            exports: {}
        };
        return __webpack_modules__[E].call(T.exports, T, T.exports, __webpack_require__), T.loaded = !0, T.exports
    }

    // ... webpack helpers (__webpack_require__.n, __webpack_require__.d, etc.) ...

    __webpack_require__(85409), __webpack_require__(19587);
    var __webpack_exports__ = __webpack_require__(81687),
        __webpack_export_target__ = window;
    for (var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
    __webpack_exports__.__esModule && Object.defineProperty(__webpack_export_target__, "__esModule", {
        value: !0
    })
})();
```

**Key Properties:**
- Self-executing IIFE (arrow function syntax)
- Modern `__webpack_modules__` object with numeric keys
- Direct export to `window` via loop
- Entry point: Module 81687 which exports `{ Boot }`

### What the Patcher Expects (Old Format)

The patcher looks for:
```javascript
window,function(app_variable_name)
```

This pattern comes from OLD webpack 4 era where the bootstrap looked like:
```javascript
(function(window) {
    // webpack_require logic
    // module definitions
})(window);
```

**CRITICAL ISSUE:** This old pattern does NOT exist in the modern game.

---

## 2. App Variable Analysis

### Current Situation: NO SINGLE "APP" VARIABLE

The game does NOT have a single `app` variable exported to the global scope. Instead, it uses:

1. **Singleton Pattern:** `M.q.instance` or `Y.q.instance` (depending on minification)
   - Module pattern where a single instance is stored in a variable like `Y.q`
   - This appears to be an inversify singleton container

2. **Boot Module:** Line 192474 - `class UA extends N.U`
   - This is the actual game initialization class
   - Static method: `Boot.createGame()` at line 192491
   - Creates a Phaser game instance: `new Ks.n(...)`
   - **The actual game instance is stored as:** `M.q.instance.game`

### Game Instance Creation

**File Location:** Lines 192491-192529
**Code Pattern:**
```javascript
static createGame() {
    const E = D.ENV.WEBGL2;
    D.settings.PREFER_ENV = E, D.settings.MIPMAP_TEXTURES = 0;
    const w = {
        forceCanvas: !1,
        clearBeforeRender: !0,
        backgroundAlpha: 1,
        resolution: 1,
        preserveDrawingBuffer: !0,
        antialias: !1
    },
    T = new Ks.n({  // <- THIS is the Phaser game instance
        width: 1280,
        height: 720,
        parent: "game-container",
        roundPixels: !1,
        failIfMajorPerformanceCaveat: !1
    }, w);
    T.init(), new C.W$e(T), new M.q(T), new Cw(T);
    // ... state initialization ...
}
```

**The problem:** This `T` variable (Phaser game) is NOT exposed to the window scope. It's only accessible via:
- `M.q.instance.game` (M.q is the singleton instance)

### What Patcher Should Match Instead

Since there's no simple `app` variable, the patcher needs to match:
1. The inversify container instance: `M.q.instance` or similar
2. Access it via `_.instance` (underscore is lodash, which the patcher injects)

---

## 3. Game Variable Analysis

### Current Situation: COMPLEX MODULE EXPORTS

The patcher looks for:
```javascript
var game_variable_name = {}
```

**This pattern does NOT exist in the modern game.**

Instead, the game has:

1. **Modularized State:** Game state is managed through Phaser's state manager
   - Game states (Boot, Loading, TileScreen, etc.)
   - Registered at Lines 192526-192532

2. **Inversify Container:** All services/dependencies are in the container
   - Accessed via: `M.q.instance.prodigy.gameContainer.get(serviceId)`
   - Services are NOT exported as a simple object

3. **Service Locator Pattern:**
   - Player data: `_.instance.prodigy.gameContainer.get("3e5-dac1").player`
   - Game data: `_.instance.game.state.states.get("Boot")._gameData`
   - These are NOT in a simple `game = {}` variable

---

## 4. Membership Check Analysis

### Current Implementation

**File Location:** Line 73310
**Code:**
```javascript
hasMembership() {
    return Y.q.instance.prodigy.gameContainer.get("859-25be").isMember
}
```

### What Patcher Expects

The patcher searches for:
```javascript
prototype.hasMembership=
```

And tries to replace with:
```javascript
prototype.hasMembership=_=>true,prototype.originalHasMembership=
```

### Problem

The minified code uses:
```javascript
hasMembership() {
    // Method definition in arrow function or method shorthand
}
```

NOT:
```javascript
hasMembership =
prototype.hasMembership =
```

The method is defined as a class method, not a prototype assignment. The patcher's regex will NOT match this.

### Where to Find It

**Beautified:** Line 73310
**Minified:** Would need to search for the hashed service ID "859-25be" combined with `.isMember`

---

## 5. Lodash Hack Analysis

### Current Status: SHOULD WORK

The patcher injects:
```javascript
window.oldLodash = window._;
let lodashChecker = setInterval(() => {
    if (window.oldLodash !== window._) {
        window._ = window.oldLodash;
        clearInterval(lodashChecker);
    }
});
Object.defineProperty(window._, "instance", {
    get: () => app.instance,
    enumerable: true,
    configurable: true
});
```

**Issue:** This assumes there's an `app` variable that has an `.instance` property.

The game does have this structure:
- `M.q.instance` or `Y.q.instance` is the singleton
- But it's NOT exposed as a global variable named `app`

The patcher injects at the END of the file, so it could theoretically access this after the game loads IF the patcher can:
1. Find the correct singleton reference
2. Expose it as `_.instance`

---

## 6. Answer Question Bypass Analysis

### Current Implementation in Game

**File Location:** Line 116147
**Code:**
```javascript
answerQuestion() {
    // Game-specific answer handling
}
```

The patcher searches for:
```javascript
answerQuestion=function(){
```

### Problem

Modern code uses:
- Arrow functions: `answerQuestion = () => {}`
- Class methods: `answerQuestion() {}`

NOT the old `function(){}` syntax. The regex will NOT match modern syntax.

### Related Functions

The game has multiple question-answering systems:
1. `sendEvent` (searched for at line 108 in patcher)
2. `openQuestionInterfaceThenEmitNotifications` (line 126 in patcher)
3. `.setContentVisible(!1)` pattern (line 140 in patcher)

These are also likely in modern syntax that won't match the patcher's regexes.

---

## 7. Patcher Regex Patterns Analysis

### Pattern 1: App Variable Detection

**Patcher Code (Line 61):**
```javascript
const app = source.match(/window,function\(([^)]+)\)/)?.[1] ?? null;
```

**Status:** BROKEN - This pattern does NOT exist in modern game

**Why It Fails:**
- Old webpack: `}(window)` at the end
- New webpack: `})()` (arrow function IIFE)
- Pattern searches for parameter passing, which doesn't happen in arrow function

**What It Should Match Instead:**
- The webpack bootstrap IIFE signature (arrow function)
- Then look for the singleton instance pattern
- Pattern: Look for `M.q.instance` or `Y.q.instance` or similar

---

### Pattern 2: Game Variable Detection

**Patcher Code (Line 62):**
```javascript
const game = source.match(/var\s+([A-Za-z_$][\w$]*)\s*=\s*\{\}/)?.[1] ?? null;
```

**Status:** BROKEN - This pattern does NOT exist in modern game

**Why It Fails:**
- The game doesn't export a plain `var x = {}` object
- All state is in modules and the inversify container
- No simple object export matches this pattern

**What It Should Match Instead:**
- Module definitions within `__webpack_modules__`
- Specifically look for the Boot module or player data module
- Pattern: Could search for module IDs like "3e5-dac1" (player) or similar

---

## 8. Patches That Will Fail

### Core Patches (Lines 67-89)

```javascript
if (app && game) {
    patches.push([
        `s),this._game=${game}`,
        // ... lodash setup ...
    ]);
    patches.push([`${app}.constants=Object`, ...]);
    patches.push([`window,function(${app}){var ${game}={};`, ...]);
    patches.push([`${app}.prototype.hasMembership=`, ...]);
} else {
    console.warn("WARNING: Could not detect app/game variables...");
    ctx.patchDegraded = true;
}
```

**All of these will FAIL because:**
1. `app` will be `null` (no match)
2. `game` will be `null` (no match)
3. The conditional goes to `else` block
4. `patchDegraded = true` is set
5. Core patches are NOT applied

### Answer Question Patches (Lines 91-141)

These MIGHT work because they search for function names, not variable assignments:
- `answerQuestion=function(){` - Needs update for arrow functions
- `type.sendEvent=function(` - Needs update
- `.setContentVisible` - Might work

---

## 9. Service Locator Patterns Found

### Inversify Container Access Pattern

Throughout the game, the DI container is accessed as:
```javascript
M.q.instance.prodigy.gameContainer.get(service_id)
```

**Service IDs Found:**
- `"3e5-dac1"` - Player service
- `"859-25be"` - Membership service with `.isMember` property
- `"749-61df"` - Requirements/legacy membership
- `"824-bd4f"` - Prefab loader
- `"76f-ff9c"` - Worker path service
- `"35d-3bd9"` - Data/assets service
- `"09c-7a49"` - Metrics manager
- `"3e0-f05f"` - Tracing service
- `"58b-1f97"` - Some service (referenced at line 71405)
- `"de1-d8e8"` - Another service (referenced at line 71407)
- `"LocalizationService"` - By name
- `"AssetLoader"` - By type/name

### Entry Point

**Module 81687** - The `Boot` class and main export

**Module 19587** - UI component registration

**Modules 85409** - Empty/setup module

---

## 10. Specific Line Numbers and Context

### Boot Class Definition
- **Location:** Line 192474
- **Class Name:** `UA extends N.U`
- **Static init():** Line 192483
- **Static createGame():** Line 192491
- **Exported as:** `{ Boot: () => UA }`

### hasMembership Method
- **Location:** Line 73310
- **Context:** Player class
- **Implementation:** Returns `Y.q.instance.prodigy.gameContainer.get("859-25be").isMember`

### Webpack Exports
- **Location:** Line 265070
- **Code:** `var __webpack_exports__ = __webpack_require__(81687)`
- **Module:** 81687 is the main boot/export module

---

## 11. Recommendations for Patcher Updates

### Immediate Fix - Regex Pattern Updates

#### 1. App Variable Detection (Line 61)

**Current (BROKEN):**
```javascript
const app = source.match(/window,function\(([^)]+)\)/)?.[1] ?? null;
```

**Option A - Look for singleton pattern:**
```javascript
const app = source.match(/(?:var\s+|)([A-Za-z_$][\w$]*)\s*=\s*\{\s*instance\s*:/)?.[1] ?? null;
```

**Option B - Look for webpack module map:**
```javascript
const app = source.match(/var\s+__webpack_modules__\s*=\s*\{/)?.[0] ?? null;
// Then extract the singleton reference from within modules
```

**Option C - Search for known singleton pattern:**
```javascript
const app = source.match(/([A-Za-z_$][\w$]*)\.q\.instance\.prodigy/)?.[1] ?? null;
```
This would find the letter before `.q.instance.prodigy` (e.g., `M` or `Y`)

#### 2. Game Variable Detection (Line 62)

**Current (BROKEN):**
```javascript
const game = source.match(/var\s+([A-Za-z_$][\w$]*)\s*=\s*\{\}/)?.[1] ?? null;
```

**Recommendation - Look for Boot class:**
```javascript
const game = source.match(/class\s+([A-Za-z_$][\w$]*)\s+extends.*\{[^}]*static\s+createGame/)?.[1] ?? null;
// Or simpler:
const game = "Boot"; // The game class is always called Boot
```

#### 3. Membership Check Pattern (Line 85)

**Current (BROKEN):**
```javascript
`${app}.prototype.hasMembership=`,
`${game}.prototype.hasMembership=_=>true,...`
```

**Recommendation - Look for method definition:**
```javascript
/hasMembership\s*\(\s*\)\s*\{[^}]*\.isMember/
```

#### 4. Answer Question Pattern (Lines 93-140)

**Current patterns search for:**
- `answerQuestion=function(){` - Needs to handle arrow functions
- `type.sendEvent=function(` - Needs to handle arrow functions
- `openQuestionInterfaceThenEmitNotifications=function(` - Needs updates

**Recommendation:**
```javascript
// Make regex handle both function(){} and () => {} and shorthand
/answerQuestion\s*[=:]\s*(?:function\s*\(|(?:\([^)]*\)\s*=>))/
```

### Major Rewrite Needed

The current patcher architecture assumes:
1. A single `app` variable exists globally
2. A single `game` variable with methods/properties

The new game structure requires:
1. Discovering the inversify container singleton
2. Understanding the modular structure
3. Injecting into module code rather than global variables
4. Using service IDs to access functionality

**This will require significant changes to the patcher's core logic.**

---

## 12. Summary Table

| Component | Current Status | Location | Pattern Match |
|-----------|----------------|----------|----------------|
| webpack bootstrap | Modern ES6 | Line 265069+ | (() => { ... })() |
| app variable | No global var | N/A | FAILS - no match |
| game variable | No global var | N/A | FAILS - no match |
| Singleton pattern | `M.q.instance` | Throughout | Found in minified |
| Boot class | `class UA` | Line 192474 | Works |
| hasMembership | Class method | Line 73310 | FAILS - not prototype.x = |
| answerQuestion | Class/module method | Line 116147 | FAILS - modern syntax |
| Inversify container | Uses service IDs | Throughout | Found but not used |
| Entry point | Module 81687 | Line 265070 | Works |

---

## Conclusion

**The P-NP patcher CANNOT work with the current game version because:**

1. The fundamental assumptions about webpack structure are outdated
2. The `app` variable detection regex will not match (returns `null`)
3. The `game` variable detection regex will not match (returns `null`)
4. Without both variables, the core patches are skipped
5. The patcher will report `patchDegraded = true`

**To fix this, the patcher needs a complete rewrite to:**
1. Detect the modern webpack module format
2. Locate the singleton inversify container
3. Patch method definitions within class definitions
4. Update all function syntax matching to handle modern JavaScript
5. Use the service locator pattern instead of global variables
