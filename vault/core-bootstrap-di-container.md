---
domain: core-bootstrap
module_ids: [61806, 35120, 36361, 3004, 42979, 81687]
line_range: [19458, 192960]
service_ids: []
status: complete
last_updated: 2026-04-13T00:00:00.000Z
---

# Core Bootstrap & DI Container

> Modules 61806, 35120, 36361, 3004, 42979, 81687. Lines 19458–192960 (key clusters).

## Overview

The core bootstrap system initializes the Prodigy game via a static `Boot.init()` call, creates the game engine (`Game` class, a custom wrapper around PixiJS), instantiates the `GameContext` singleton that glues everything together, and wires up an Inversify-backed dependency injection container (`ProdigyContainer`). All game services are registered in `initializeInjectionContainer()` and accessed via `gameContainer.get("<service-id>")`.

## Access Pattern

```js
// Access the global context (set up at game init):
const ctx = _.instance;   // or: GameContext._instance  (module 35120 export `q`)
const game = ctx.game;            // the Game engine
const prodigy = ctx.prodigy;      // the Prodigy facade

// Access the DI container (Inversify wrapper):
const gc = ctx.prodigy.gameContainer;   // ProdigyContainer (module 36361 export `r`)

// Get any registered service:
const playerDataService = gc.get("3e5-dac1");   // PlayerDataService
const membershipService = gc.get("859-25be");    // MembershipService
const networkService    = gc.get("e2e-9e38");    // NetworkService
```

## Key Classes & Functions

| Minified Name | Inferred Name | Module | Lines | Purpose |
|---------------|---------------|--------|-------|---------|
| `S` (mod 61806) | `GameInstanceManager` | 61806 | 19458–19477 | Singleton for the game + asset loader (used by new-gen ELA framework as `C.W$e`) |
| `S` (mod 35120) | `GameContext` | 35120 | 65896–65921 | Singleton holding `game` + `prodigy` refs; accessed as `M.q.instance` everywhere |
| `O` (mod 36361) | `ProdigyContainer` | 36361 | 39627–39676 | Inversify wrapper with `bind/get/resolve/unbind`; holds ALL game services |
| `C` (mod 3004) | `BindingTo` | 3004 | 39598–39626 | Fluent builder returned by `container.bind()`; supports `.to()`, `.toConstantValue()`, `.toDynamicValue()` |
| `S` (mod 3004) | `BindingInterface` | 3004 | 39603–39610 | Wraps `inversifyInterface`; adds `.asSingleton()` |
| `K` (mod 42979) | `Game` | 42979 | 19478–19739 | Core game engine. Wraps PixiJS Application. Owns `state`, `add`, `load`, `cache`, `sound`, `tweens`, `rootContainer`, `time`, `device`, `broadcaster`, `inputDispatcher`, `scale` |
| `Cw` (mod 81687) | `Prodigy` | 81687 | 187776–187889 | Main facade object. Owns `gameContainer`, `world`, `battle`, `audio`, `create`, `dialogue`, `open`, `assets`, `load`, `breadcrumbManager`, `skin`, `effects`, `icon`, `animation`, `education`, etc. |
| `UA` (mod 81687) | `Boot` | 81687 | 192474–192959 | Webpack entry state. `static init()` creates the game. Exposed as `window.Boot`. Extends game state base class `N.U` |

## Properties

### GameContext (`M.q.instance`, module 35120)

| Property | Type | Notes |
|----------|------|-------|
| `game` | `Game` | The game engine instance |
| `prodigy` | `Prodigy` | The Prodigy facade — set once, read-only after |

### Prodigy (`Cw`, module 81687, lines 187776–187889)

| Property | Type | Notes |
|----------|------|-------|
| `gameContainer` | `ProdigyContainer` | === `game.rootContainer` (the DI container) |
| `world` | `WorldManager` | World/zone manager |
| `battle` | object | Battle system |
| `audio` | `AudioManager` | Sound/music |
| `create` | `CreateHelper` | Factory for sprites, panels, fonts, buttons |
| `dialogue` | `DialogueManager` | Dialogue box system |
| `open` | `OpenHelper` | Open/close UI helpers |
| `assets` | `AssetManager` | Asset service (`bc6-2de9`) |
| `load` | `LoadService` | Load service (`2f4-8290`) |
| `effects` | service | `76c-8a05` |
| `breadcrumbManager` | `BreadcrumbManager` | Quest breadcrumb manager (`103-382e`) |
| `education` | object | Education subsystem |
| `skin` | `FestivalSkinManager` | Festival/event skin manager |
| `icon` | `IconHelper` | Icon factory |
| `animation` | `AnimationManager` | Spine/animation helper |
| `timeManager` | service | `6c6-02da` — ServerTimeManager |
| `metricsManager` | service | `09c-7a49` — MetricsManager |
| `urlProvider` | service | `76f-ff9c` — URLProvider |
| `version` | string | Game version string from `GameConstants.Build.VERSION` |

### Game (`K`, module 42979, lines 19478–19739)

| Property | Type | Notes |
|----------|------|-------|
| `rootContainer` | `ProdigyContainer` | The Inversify-backed DI container |
| `state` | `StateManager` | Game state machine |
| `add` | `AddHelper` | Object factory |
| `load` | `LoadManager` | Asset loader |
| `cache` | `CacheManager` | Asset cache |
| `sound` | `SoundManager` | Audio system |
| `tweens` | `TweenManager` | Animation tweens |
| `time` | `TimeManager` | Game time |
| `device` | `DeviceInfo` | Platform/device detection |
| `broadcaster` | `Broadcaster` | Event bus |
| `scale` | object | Scale/fullscreen manager |
| `stage` | object | Display stage |
| `rnd` | object | Random number generator |
| `inputDispatcher` | `InputDispatcher` | Input events (added in Boot.create) |
| `width` / `height` | number | 1280 × 720 |
| `versioned` | boolean | True if running on feature/release branch |
| `clientVersion` | string | Validated game version |

## Service ID Registry (from `initializeInjectionContainer`, line 187862)

All services registered in `Prodigy.initializeInjectionContainer()`:

| Service ID | Minified Class | Inferred Name |
|------------|---------------|---------------|
| `"83f-419b"` | `this.game` | Game engine (constant) |
| `C.t5G.FrameWorkManager` | symbol | FrameWorkManager |
| `C.$Bt.LocalizationService` | `C.Oap` | LocalizationService |
| `"35d-3bd9"` | `Re` | FlagProvider (feature flags) |
| `"d79-f761"` | `aE` | UserIdentityService |
| `"76c-8a05"` | `Ur.M` | EffectsManager |
| `"755-67f9"` | `Df` | unknown |
| `"76f-ff9c"` | `Kt.p` | URLProvider |
| `"bc6-2de9"` | `Xt.s` | AssetManager |
| `"2f4-8290"` | `Sw.a` | LoadService |
| `C.$Bt.IFSMController` | `C.rPI` | FSM Controller |
| `C.$Bt.FSMFactories` | `C.zL` | FSM Factories |
| `C.$Bt.FSMService` | `C.CQn` | FSM Service |
| `C.$Bt.FSMDataProvider` | `_f` | FSM Data Provider |
| `"961-7a09"` | `Af.S` | unknown |
| `"a18-60e1"` | `ot` | unknown |
| `"6c6-02da"` | `Wt.V` | ServerTimeManager |
| `"09c-7a49"` | `Fu.U` | MetricsManager |
| `"3e0-f05f"` | `Uu` | TracingService (startTracing/endTracing) |
| `"f1f-74d5"` | `qt` | unknown |
| `"9d5-5359"` | `qE` | unknown |
| `"b5f-11e9"` | `z` | unknown |
| `"50c-4791"` | `gi.I` | unknown |
| `"9db-29e6"` | `Rn.Z` | unknown |
| `"e2e-9e38"` | `rd.I` | NetworkService / SocketManager |
| `"58b-1f97"` | `Kr` | DataSourceService |
| `"de1-d8e8"` | `oE.K` | unknown |
| `"e47-29f8"` | `VE.u` | unknown (init called immediately) |
| `"05d-4fbd"` | `WE.F` | unknown |
| `"e53-774e"` | `Ts.$` | unknown |
| `"914-e029"` | `ys` | QuestManager (world) |
| `"b14-a6b7"` | `Es.k` | unknown |
| `"c90-6dce"` | `bs.n` | unknown |
| `"d16-ba07"` | `us.R` | unknown |
| `"d1b-d932"` | `We` | unknown |
| `"725-79b8"` | `Ii.p` | unknown |
| `"3dd-9676"` | `Fe.k` | unknown |
| `"c0e-cbd7"` | `lt.v` | unknown |
| `"4d1-1cd0"` | `Di.C` | unknown |
| `"e29-b7bc"` | `vE` | BattleStatsHandler |
| `"d8e-c62e"` | `TE` | unknown |
| `"b73-f3aa"` | `Ni.e` | unknown |
| `"d79-6645"` | `Je.g` | unknown |
| `"469-d0e6"` | `ki.S` | unknown |
| `"fcf-155f"` | `kE.Y` | unknown |
| `"a5a-3029"` | `$i.n` | PetInventoryService |
| `"0a9-669a"` | `fs.k` | unknown |
| `"032-4907"` | `xi.K` | unknown |
| `"8b8-ac14"` | `ut.s` | ResetTimeService |
| `"86a-826a"` | `ps.q` | unknown |
| `"ab9-3b05"` | `vs.n` | BattleStartQuestDataService |
| `"61f-b4dd"` | `gs.C` | unknown |
| `"cab-404e"` | `Cs.X` | unknown |
| `"4ad-1685"` | `Gs.O` | unknown |
| `"bc8-29c0"` | `js.V` | unknown |
| `"598-a095"` | `zn` | unknown |
| `"3d5-8baf"` | `$n` | unknown |
| `"f0f-49c0"` | multiple | Zone managers (multi-bind) |
| `"28d-440a"` | `If` | unknown |
| `"473-0f86"` | `C.xTJ` | unknown |
| `"6ac-4dfc"` | `C.xTJ` | unknown |
| `"c59-add2"` | `C.xTJ` | unknown |
| `"970-d7f0"` | `Ys.H` | UUIDService |
| `"3e5-dac1"` | `Pt.E` | PlayerDataService (main player data) |
| `"f4b-0454"` | dynamic | Player instance shortcut (`gameContainer.get("3e5-dac1").player`) |
| `"fb4-1d11"` | `kt.W` | unknown |
| `"388-d535"` | `Tt.C` constant | unknown |
| `"859-25be"` | `oe.F` | MembershipService |
| `"fa8-1c91"` | `Oe.Y` | SegmentAnalyticsService |
| `"6ef-abaa"` | `Xs` | AchievementsService |
| `"77d-652f"` | `ei` | unknown |
| `"9cb-d480"` | `oi` | unknown |
| `"129-07a6"` | `vi` | unknown |
| `"f74-8cd9"` | `ee.g` | unknown |
| `"a7e-4ed4"` | `DE` | MailService |
| `"996-b0e5"` | `uE` | unknown |
| `"28d-1894"` | multiple | unknown (multi-bind) |
| `"554-c7bf"` | `Y.x` | unknown |
| `"eea-e4eb"` | `Ef.Z` | unknown |
| `"28e-6256"` | `Nn.N` | unknown |
| `"994-b982"` | `Un` | unknown |
| `"558-fc7a"` | `Cf` | unknown |
| `C.t5G.PrefabService` | `C.iNH` | PrefabService |
| `C.t5G.PrefabDataProvider` | `Ws` | PrefabDataProvider |
| `"824-bd4f"` | `C.wNP` constant | PrefabLoader |
| `"77a-4873"` | `he.S` | unknown |
| `"749-61df"` | `yf` | PlayerRequirementsService |
| `"103-382e"` | `Vr.F` | BreadcrumbManager |
| `"e9e-ba5b"` | `Zt.t` constant | unknown |
| `"e80-ffcd"` | `C.myN` | HTTPRequestService |
| `"e05-96db"` | `Ae.d` | unknown |
| `"16b-0e3b"` | `Be` | unknown |
| `"e09-b5f2"` | `C.xTJ` | unknown |
| `"982-f50d"` | `we` | MatchmakingService |
| `"447-a1a3"` | `rE.O` | unknown |
| `"b81-b032"` | `xe` | unknown |
| `"006-df12"` | `Fs.m` | QuestManager (tutorial/main) |
| `"451-73fa"` | `Ds.u` | unknown |
| `"762-67ce"` | `ue` | unknown |
| `"21d-c988"` | `Rs.T` | unknown |
| `"1b9-7c6a"` | `Ue.n` | FestivalService |
| `"9d1-acc1"` | `Qt` | ChallengeService |
| `"966-0d7c"` | `qs.X` | unknown |
| `"89f-41b0"` | `As` | unknown |
| `"993-6945"` | `wf.b` | unknown |
| `"91b-7302"` | `Hi.m` | PetZoneService |
| `"448-2e69"` | `xE` | unknown |
| `"63e-20c0"` | `Dt.h` | unknown |
| `"b4d-59fa"` | `Ot`/`It` (lazy) | DifficultyService (resolved after feature flags) |
| `"07a-1f39"` | `mi.p` | unknown |
| `"a1b-38ec"` | `Ci.p` | unknown |
| `"735-0968"` | `Ai` | unknown |
| `"718-5c1b"` | `Mi.x` | unknown |
| `"3e5-aa0b"` | `yE.e` | unknown |
| `"133-ac29"` | `wE` | unknown |
| `"339-750c"` | `gE` | unknown |
| `"7dc-e254"` | `LE.L` | unknown |
| `"a8f-1513"` | `ji.q` | PetGearService |
| `"0c2-8b5d"` | `BE` | unknown |
| `"e9c-e5ff"` | `ks.U` | unknown |
| `"487-e5d0"` | `Ls.D` | unknown |
| `"468-2791"` | `UE.B` | unknown |
| `"e69-ec98"` | `Os.M` | unknown |
| `"ce8-51dc"` | `Is.Q` | unknown |
| `"0b9-1977"` | `Ud.E` | unknown |
| `"3dc-c899"` | `IE.b` | unknown |
| `"31b-2a99"` | `Pi.W` | BalanceService (get/check balance) |
| `"b2d-0f23"` | `xs.U` | unknown |
| `"17c-e966"` | `Ms` | unknown |
| `"075-03dc"` | `EE.v` | unknown |
| `"be3-03cd"` | `HE.J` | unknown |
| `"df1-b617"` | `Et.o` | unknown |
| `"f1f-ffaa"` | `Fi.x` | unknown |
| `"f9c-a49f"` | `mE` | DifficultyController (setCurrentDifficulty) |
| `"165-c9c8"` | `Xe` | unknown |
| `"8f3-87f4"` | `GE` | unknown |
| `"d23-ce78"` | `wt.j` | unknown |
| `"098-c8db"` | `Hs.W` | unknown |
| `"7d5-a3df"` | `le.zj` | unknown |
| `"336-324b"` | `Ss.w` constant | unknown |
| `"ecf-d1bb"` | `Tf._` | unknown |
| `"a6e-9947"` | `Sf.J` | unknown |
| `"afe-ef18"` | `ft.W` | unknown |
| `"af1-4ed1"` | `Bs.v` | unknown |
| `"a39-60f8"` | `FE.E` | unknown |
| `"907-8d89"` | `Us.z` | unknown |
| `L.SpellLevelDataProvider` | `ne` | SpellLevelDataProvider |
| `"857-aff5"` | `L.SpellLevelBonusConstants` | SpellLevelBonusConstants |
| `"83f-e686"` | `Bi.Z` | unknown |
| `"f52-f73c"` | `de.Z` | unknown |
| `"747-c6e2"` | `_t.Z` | unknown |
| `"110-e387"` | `ce.e` | unknown |
| `"9c4-661e"` | `$s.C` | unknown |
| `"420-a78f"` | `$E.j` | unknown |
| `"bcf-d1ea"` | `_E` | unknown |
| `"b23-43d9"` | `ti.m` | unknown |
| `"a2e-3475"` | `SE.W` | unknown |
| `"d4f-de7a"` | `_i.J` | unknown |
| `"caf-fed2"` | `mt`/`yt` | NativeAppBridge (platform-dependent) |
| `"737-d4a0"` | `this.game.cache` | Game cache (postCacheInit) |
| `C.t5G.AssetLoader` | `Aw.A` | AssetLoader (postCacheInit) |
| `"745-9b8b"` | `Tw` | ImageTintController (postCacheInit) |
| `"d3c-a01e"` | `kr` | unknown (postCacheInit) |

Additional zone/world sub-container bindings are registered via `ws.n` entries (one per zone type, bound to both a child container and the main container via dynamic value).

## Methods

### `Boot` (class `UA`, line 192474)

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `static init()` | 192481 | `() => void` | Entry point — calls `createGame()` + `logAntiTamperingWarning()` |
| `static createGame()` | 192484 | `() => void` | Creates PixiJS renderer, `Game`, `GameContext`, `Prodigy`, `AssetLoader`, registers all game states, starts `Boot` state |
| `init()` | 192508 | `() => void` | Boot state init: starts performance tracing, loads feature flags |
| `featureFlagsLoaded()` | 192523 | `(flags) => Promise` | Loads game-metadata JSON, dependency map, feature revisions, non-local assets, localization |
| `create()` | 192886 | `() => void` | Called after assets load; calls `prodigy.init()`, sets scale mode |
| `update()` | 192899 | `() => void` | Polls load flags; once all data loaded → broadcasts `Boot.LOADED`, starts `SplashScreen` state |
| `shutdown()` | 192912 | `() => void` | Ends tracing on shutdown |
| `static logAntiTamperingWarning()` | 192918 | `() => void` | Logs anti-cheat warning to devtools console |

### `Prodigy` (class `Cw`, line 187776)

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `initializeInjectionContainer()` | 187862 | `() => void` | Registers all ~120+ services in the DI container |
| `postCacheInit()` | 187886 | `() => void` | Binds cache-dependent services (AssetLoader, ImageTintController) |
| `init()` | 187810 | `() => void` | Sets log level, creates render textures |
| `start()` | 187825 | `(state, data, screenData) => void` | Navigates to a game state with loading screen |
| `startCoOp()` | 187835 | `(config) => void` | Loads and starts CoOp battle state |
| `loading()` | 187851 | `(show, block?) => void` | Shows/hides loading spinner overlay |
| `initializeBreadcrumbs()` | 187858 | `() => void` | Sets up quest breadcrumb manager for the current player |
| `bindToAlias()` | 187822 | `(alias, serviceIds[]) => void` | Registers multi-bind alias pointing to each of the given service IDs |

### `ProdigyContainer` (class `O`, module 36361, line 39627)

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `bind(id)` | 39650 | `(string) => BindingTo` | Start a new DI binding |
| `unbind(id)` | 39653 | `(string) => void` | Remove a binding (safe — checks first) |
| `rebind(id)` | 39656 | `(string) => BindingTo` | Unbind + bind |
| `get(id)` | 39659 | `(string) => any \| null` | Retrieve a service by ID (returns null if not bound) |
| `hasBinding(id, strict?)` | 39662 | `(string, bool) => bool` | Check if bound |
| `resolve(Class)` | 39665 | `(constructor) => instance` | Instantiate a class, injecting its dependencies |
| `unbindAll()` | 39668 | `() => void` | Clear all bindings |
| `static wrapContainer(inv)` | 39671 | `(InversifyContainer) => ProdigyContainer` | Wrap a raw Inversify container |

## Exposable Variables

- `_.instance` — not the standard path; access via `M.q.instance` in the bundle (module 35120)
  - In mod context: the `GameContext` singleton. Likely exposed as `window.prodigy` or accessible via devtools
- `M.q.instance.prodigy.gameContainer.get("3e5-dac1")` — PlayerDataService
- `M.q.instance.prodigy.gameContainer.get("859-25be")` — MembershipService
- `M.q.instance.prodigy.gameContainer.get("e2e-9e38")` — NetworkService
- `M.q.instance.prodigy.gameContainer.get("6c6-02da")` — ServerTimeManager
- `M.q.instance.prodigy.gameContainer.get("09c-7a49")` — MetricsManager
- `M.q.instance.prodigy.gameContainer.get("fa8-1c91")` — Segment analytics
- `M.q.instance.prodigy.gameContainer.get("f4b-0454")` — Player instance (shortcut)
- `M.q.instance.prodigy.version` — Game version string
- `window.Boot` — The `Boot` class itself (line 192959)
- `window.Boot.init()` — **Actual game entry point**

## Hook Points

- **`Prodigy.initializeInjectionContainer()` (line 187862)** — Override before game start to inject custom service implementations or mock services
- **`ProdigyContainer.get(id)` (line 39659)** — Intercept to return custom service instances for any service ID
- **`Boot.update()` (line 192899)** — Monitors boot flags; hook before `SplashScreen` starts
- **`Boot.featureFlagsLoaded()` (line 192523)** — Intercept to inject custom feature flags before game data load
- **`Boot.createGame()` (line 192484)** — `new Cw(T)` at line 192502 — Prodigy facade constructed here; intercept to set up mod hooks early

## Boot Sequence

1. `window.Boot.init()` called externally
2. `Boot.createGame()`:
   - Creates PixiJS renderer (`Ks.n`)
   - `new C.W$e(T)` — GameInstanceManager (module 61806)
   - `new M.q(T)` — GameContext (module 35120)
   - `new Cw(T)` — Prodigy facade; calls `initializeInjectionContainer()` + `postCacheInit()`; registers all services
   - Creates `AssetLoader`
   - Registers all game states (`Boot`, `Loading`, `TileScreen`, `SplashScreen`, `Faint`, `Museum`, `DinoDig`, `DanceDance`, `CoOp`, `SecureBattleRevamp`, `PrefabScene`, `DuelMatchmaking`, `Rifts`, `LootDashTransport`, `LootDashMenu`)
   - `state.start(Boot)`
3. `Boot.init()` — loads feature flags
4. `Boot.featureFlagsLoaded()` — loads game-metadata.json, dependency map, localization, non-local assets
5. `Boot.create()` — calls `prodigy.init()`, sets scale
6. `Boot.update()` — polls until all data loaded → broadcasts `Boot.LOADED` → `state.start(SplashScreen)`

## Game States

Registered in `Boot.createGame()` at line 192504:

| State Name | Class | Notes |
|------------|-------|-------|
| `Boot` | `UA` | Initial boot loader |
| `Loading` | `Eu.R` | Asset loading screen |
| `TileScreen` | `BA.b` | Main world/tile view |
| `SplashScreen` | `ad.S` | Splash/title screen |
| `Faint` | `LA.v` | Faint/defeat screen |
| `Museum` | `AA` | Museum mini-game |
| `DinoDig` | `Bw` | Dino Dig mini-game |
| `DanceDance` | `Mw` | Dance Dance mini-game |
| `CoOp` | `CA.w` | Co-op battle mode |
| `SecureBattleRevamp` | `wA` | Main battle state |
| `PrefabScene` | `kA.Q` | Prefab-based scene renderer |
| `DuelMatchmaking` | `xA` | PvP matchmaking |
| `Rifts` | `qw.n` | Rifts feature |
| `LootDashTransport` | `Hw` | Loot Dash transport |
| `LootDashMenu` | `Gw` | Loot Dash menu |

## Cross-References

- [[player]] — `"3e5-dac1"` (PlayerDataService) and `"f4b-0454"` (player shortcut) both registered here
- [[membership]] — `"859-25be"` (MembershipService) registered here; `"749-61df"` (PlayerRequirementsService)
- [[network]] — `"e2e-9e38"` (NetworkService) registered here
- [[battle]] — `"SecureBattleRevamp"` state registered; battle facade at `prodigy.battle`
- [[economy]] — `"31b-2a99"` (BalanceService) registered here
- [[quests]] — `"006-df12"`, `"914-e029"` (QuestManagers) registered here; `"103-382e"` BreadcrumbManager
- [[festivals]] — `"1b9-7c6a"` (FestivalService) registered here
- [[pets]] — `"a5a-3029"` (PetInventoryService), `"91b-7302"` (PetZoneService), `"a8f-1513"` (PetGearService) registered here
- [[education]] — `prodigy.education` facade; difficulty service `"b4d-59fa"`, `"f9c-a49f"`
