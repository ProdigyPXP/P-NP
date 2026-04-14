---
domain: reconciliation
module_ids: []
line_range: []
service_ids: []
status: complete
last_updated: 2026-04-13T18:30:00.000Z
---

# Reconciliation Report — Game Version 2026.18.1

> Cross-reference of all vault notes vs. `analysis/GAME_ANALYSIS.md` vs. `ProdigyMathGameHacking/typings/*.d.ts`.

## Overview

This report identifies discrepancies, missing information, stale data, and gaps between the 16 domain-specific vault notes, the GAME_ANALYSIS.md patcher findings, and the legacy ProdigyMathGameHacking TypeScript typings. It also documents which service IDs are confirmed resolved vs. still unknown.

---

## 1. Patcher Status (GAME_ANALYSIS.md vs. Vault Notes)

### Confirmed Broken Patcher Patterns (GAME_ANALYSIS.md §1–8)

The GAME_ANALYSIS.md is fully consistent with findings from the vault notes. Key confirmations:

| Pattern | Status | Vault Reference |
|---------|--------|-----------------|
| `window,function(app)` regex | BROKEN — arrow function IIFE | [[core-bootstrap-di-container]] §Boot |
| `var game = {}` regex | BROKEN — no such global | [[core-bootstrap-di-container]] §Prodigy |
| `prototype.hasMembership=` regex | BROKEN — class method syntax | [[membership-service]] §Hook Points |
| `answerQuestion=function()` regex | BROKEN — class method syntax | [[education-system]] §Hook Points |
| Singleton at `M.q.instance` | CONFIRMED | [[core-bootstrap-di-container]] §GameContext |
| Entry point `window.Boot.init()` | CONFIRMED | [[core-bootstrap-di-container]] §Boot |

### Patcher Fix Recommendation (from GAME_ANALYSIS.md §11)

The GAME_ANALYSIS.md recommends `Option C` for app detection:
```js
const app = source.match(/([A-Za-z_$][\w$]*)\.q\.instance\.prodigy/)?.[1] ?? null;
```

This is cross-validated by the vault notes: `M.q.instance` (GameContext) is confirmed at module 35120, lines 65896–65921. The minified letter (`M` or `Y`) varies by build — the regex is the correct approach.

**Gap**: GAME_ANALYSIS.md suggests using `"Boot"` as the `game` variable replacement. The vault confirms `Boot` is exposed as `window.Boot` (line 192959). However, the actual singleton access path is `_.instance` (via `M.q.instance`), not `Boot` — the patcher's lodash injection for `_.instance` needs the `M.q.instance` reference.

---

## 2. Access Pattern Discrepancy: Old Typings vs. Current Architecture

The `ProdigyMathGameHacking/typings/` files describe the **old pre-modernized** game architecture (likely pre-2025). There are significant structural differences:

### 2a. Global Access Pattern — CHANGED

| Aspect | Old Typings | Current (Vault) |
|--------|-------------|-----------------|
| Player access | `_.player` (direct lodash property) | `_.instance.prodigy.gameContainer.get("3e5-dac1").player` |
| Network manager | `gameContainer.get("NetworkManager")` (by name) | `gameContainer.get("e2e-9e38")` (by hash ID) |
| Boot data | `game.state.states.Boot._gameData` | Boot module 81687, now uses `Prodigy` facade |
| `_.instance` | Was `app.instance` (patcher pattern) | Is `M.q.instance` (GameContext singleton) |

### 2b. GameContainer Binding Keys — CHANGED

The old typings use **named string keys** like `"NetworkManager"`, `"PlayerService"`, `"DungeonService"`, etc. The current game uses **hashed IDs** like `"e2e-9e38"`, `"3e5-dac1"`, `"b5f-11e9"`.

**Cross-reference of old name → new hash ID:**

| Old Name | New Hash ID | Vault Note |
|----------|-------------|------------|
| `"NetworkManager"` | `"e2e-9e38"` | [[network-game-network-manager]] |
| `"PlayerService"` / `"LoggedInPlayer"` | `"3e5-dac1"` | [[player-active-player]] |
| `"DungeonService"` | `"b5f-11e9"` | [[dungeons-system]] |
| `"PrefabLoader"` | `"824-bd4f"` | [[ui-framework-open-system]] |
| `"BreadcrumbManager"` | `"103-382e"` | [[quests-quest-manager-system]] |
| `"DuelInviteService"` | `"16b-0e3b"` | [[social-duel-invite-service]] |
| `"MatchmakingService"` | `"982-f50d"` | [[core-bootstrap-di-container]] |
| `"HttpClient"` | `"e80-ffcd"` | [[network-http-socket-infrastructure]] |
| `"FeatureRequirements"` | `"749-61df"` | [[player-active-player]] |
| `"UUIDProvider"` | `"970-d7f0"` | [[core-bootstrap-di-container]] |
| `"AnalyticsService"` | `"fa8-1c91"` | [[core-bootstrap-di-container]] |
| `"ArchivesDungeonGenerator"` | `"9cb-d480"` | [[dungeons-system]] |
| `"TowersDungeonGenerator"` (old: `"TowersDungeonGenerator"`) | `"129-07a6"` | [[dungeons-system]] |
| `"PrefabService"` | `C.t5G.PrefabService` (symbol) | [[core-bootstrap-di-container]] |
| `"FSMController"` / `"IFSMController"` | `C.$Bt.IFSMController` (symbol) | [[core-bootstrap-di-container]] |
| `"Education"` | `prodigy.education` (not DI service, facade prop) | [[education-system]] |
| `"Items"` / `"GameItemManager"` | Static class, no DI ID | [[inventory-game-item-manager]] |
| `"TimeManager"` | `"6c6-02da"` | [[core-bootstrap-di-container]] |
| `"AssetLoader"` | `C.t5G.AssetLoader` (symbol, postCacheInit) | [[core-bootstrap-di-container]] |

### 2c. Player Class — CHANGED

The old typings describe a **monolithic `Player` class** directly accessible. The current architecture splits this:

| Old Typing | Current Equivalent |
|-----------|-------------------|
| `_.player` (direct) | `_.instance.prodigy.gameContainer.get("3e5-dac1").player` |
| `player.P` (membership flag, boolean) | Removed — now `hasMembership()` delegates to `859-25be.isMember` |
| `player.it` (used as hasMembership alias) | Replaced by proper `hasMembership()` method at line 73310 |
| `player.world` (object with id/name) | `player.data.zone` (string), world obj via `prodigy.world` |
| `player.grade`, `player.curriculumTreeID` | Now in `player._educationData.grade`, `player.curriculumTreeID` |
| `Player.getAoeEvolutions()` | No such static method found in current bundle |
| `Player.getSingleShotEvolutions()` | No such static method found in current bundle |
| `Player.getHeartsFromCurve()` | Replaced by `Creature.getMaxHearts()`, not on Player directly |
| `setMembership(player, member)` signature | Current: `setMembership(obj?)` — just sets `et` flag from `obj.isMember` |
| `hasMembership(): Player["it"]` | Current: `hasMembership(): boolean` via service `859-25be` |
| `player.username` | Not found in current ActivePlayer class |
| `player.name` (PlayerName object) | Now `player.appearance.name` (WizardAppearance sub-object) |
| `player.owners[]` | Not found in current bundle — likely removed |
| `player.playerTeachers[]` | Not found — likely removed |
| `player.playerParents[]` | Not found — likely removed |
| `player.broadcastId` | Not found in current bundle |
| `player.chatID` | Not found — chat managed elsewhere |
| `player.type` (string grade?) | Not found in this form |

### 2d. Game State Inventory — CHANGED

The old typings have game states: `Boot, Loading, PVPLoading, TileScreen, Login, Battle, PVP, Faint, CharSelect, CharCreate, Museum, DinoDig, DanceDance, CoOp, TestScreen, PrefabScene`.

The current boot registers states at line 192504:

| Old State | Current State | Notes |
|-----------|---------------|-------|
| `Battle` | `SecureBattleRevamp` | Old `Battle` state REMOVED |
| `PVP` | `DuelMatchmaking` | PvP matchmaking renamed |
| `PVPLoading` | (removed) | No separate PvP loading state |
| `Login` | (removed) | Login handled by Catalyst SDK externally |
| `CharSelect` | (removed) | Character selection removed |
| `CharCreate` | (removed) | Character creation removed |
| `TestScreen` | (removed) | Debug state removed |
| — | `SplashScreen` | New: Splash screen |
| — | `Rifts` | New: Rifts feature |
| — | `LootDashTransport` | New: Loot Dash |
| — | `LootDashMenu` | New: Loot Dash |

### 2e. `prodigy.d.ts` Discrepancies

| Old Property | Current Equivalent | Notes |
|-------------|-------------------|-------|
| `prodigy.giftBoxController` | Not found as property | May be accessible via service |
| `prodigy.user` | No such property | Removed; player via `gameContainer.get("f4b-0454")` |
| `prodigy.pvpNetworkHandler` | No such property | PvP via `16b-0e3b` service |
| `prodigy.classModeController` | No such property | Class mode via education system |
| `prodigy.notifications` | No such property | Not found in current Prodigy facade |
| `prodigy.debugMisc` | Not in current facade | Removed |
| `prodigy.network` | No direct `.network` property | Use `gameContainer.get("e2e-9e38")` |
| `prodigy.world` | CONFIRMED at `prodigy.world` | WorldManager |
| `prodigy.open` | CONFIRMED at `prodigy.open` | OpenHelper / `fu` class |
| `prodigy.battle` | CONFIRMED as object | Battle system facade |
| `prodigy.dialogue` | CONFIRMED at `prodigy.dialogue` | DialogueManager |
| `prodigy.gameContainer` | CONFIRMED | ProdigyContainer |
| `prodigy.version` | CONFIRMED | Version string |

---

## 3. Service ID Gaps — Unresolved in Vault Notes

The following service IDs appear in `core-bootstrap-di-container.md` but are marked "unknown" and have not been resolved by any domain agent:

| Service ID | Minified Class | Best Guess |
|------------|---------------|------------|
| `"755-67f9"` | `Df` | Unknown |
| `"961-7a09"` | `Af.S` | Unknown |
| `"a18-60e1"` | `ot` | Unknown |
| `"f1f-74d5"` | `qt` | Unknown |
| `"9d5-5359"` | `qE` | Unknown |
| `"58b-1f97"` | `Kr` | DataSourceService (partially identified in GAME_ANALYSIS §9) |
| `"de1-d8e8"` | `oE.K` | GraphQL/membership network handler (used in `sendMembershipQueryRequest`) |
| `"e47-29f8"` | `VE.u` | Unknown (init called immediately on bind) |
| `"05d-4fbd"` | `WE.F` | Unknown |
| `"d1b-d932"` | `We` | Unknown |
| `"725-79b8"` | `Ii.p` | Unknown |
| `"3dd-9676"` | `Fe.k` | Unknown |
| `"4d1-1cd0"` | `Di.C` | Unknown |
| `"e29-b7bc"` | `vE` | `BattleStatsHandler` (from bootstrap table) |
| `"d8e-c62e"` | `TE` | Unknown |
| `"b73-f3aa"` | `Ni.e` | Unknown |
| `"469-d0e6"` | `ki.S` | Unknown |
| `"fcf-155f"` | `kE.Y` | Unknown |
| `"032-4907"` | `xi.K` | Unknown |
| `"61f-b4dd"` | `gs.C` | Unknown |
| `"cab-404e"` | `Cs.X` | Unknown |
| `"bc8-29c0"` | `js.V` | Unknown |
| `"598-a095"` | `zn` | Unknown |
| `"3d5-8baf"` | `$n` | Unknown |
| `"28d-440a"` | `If` | Unknown |
| `"473-0f86"` | `C.xTJ` | Socket/network variant |
| `"e09-b5f2"` | `C.xTJ` | Socket/network variant |
| `"447-a1a3"` | `rE.O` | Unknown |
| `"451-73fa"` | `Ds.u` | Unknown |
| `"762-67ce"` | `ue` | Unknown |
| `"21d-c988"` | `Rs.T` | Unknown |
| `"9d1-acc1"` | `Qt` | `ChallengeService` |
| `"89f-41b0"` | `As` | Unknown |
| `"993-6945"` | `wf.b` | Unknown |
| `"448-2e69"` | `xE` | Unknown |
| `"63e-20c0"` | `Dt.h` | Unknown |
| `"07a-1f39"` | `mi.p` | Unknown |
| `"a1b-38ec"` | `Ci.p` | Unknown |
| `"735-0968"` | `Ai` | Unknown |
| `"718-5c1b"` | `Mi.x` | Unknown |
| `"3e5-aa0b"` | `yE.e` | Unknown |
| `"133-ac29"` | `wE` | Unknown |
| `"339-750c"` | `gE` | Unknown |
| `"7dc-e254"` | `LE.L` | Unknown |
| `"0c2-8b5d"` | `BE` | Unknown |
| `"e9c-e5ff"` | `ks.U` | Unknown |
| `"487-e5d0"` | `Ls.D` | Unknown |
| `"468-2791"` | `UE.B` | Unknown |
| `"e69-ec98"` | `Os.M` | Unknown |
| `"ce8-51dc"` | `Is.Q` | Unknown |
| `"3dc-c899"` | `IE.b` | Unknown |
| `"075-03dc"` | `EE.v` | Unknown |
| `"be3-03cd"` | `HE.J` | Unknown |
| `"df1-b617"` | `Et.o` | Unknown |
| `"f1f-ffaa"` | `Fi.x` | Unknown |
| `"165-c9c8"` | `Xe` | Unknown |
| `"8f3-87f4"` | `GE` | Unknown |
| `"d23-ce78"` | `wt.j` | Unknown |
| `"098-c8db"` | `Hs.W` | Unknown |
| `"7d5-a3df"` | `le.zj` | Unknown |
| `"ecf-d1bb"` | `Tf._` | Unknown |
| `"a6e-9947"` | `Sf.J` | Unknown |
| `"afe-ef18"` | `ft.W` | Unknown |
| `"af1-4ed1"` | `Bs.v` | Unknown |
| `"a39-60f8"` | `FE.E` | Unknown |
| `"907-8d89"` | `Us.z` | Unknown |
| `"83f-e686"` | `Bi.Z` | Unknown |
| `"f52-f73c"` | `de.Z` | Unknown |
| `"747-c6e2"` | `_t.Z` | Unknown |
| `"110-e387"` | `ce.e` | Unknown |
| `"9c4-661e"` | `$s.C` | Unknown |
| `"420-a78f"` | `$E.j` | Unknown |
| `"bcf-d1ea"` | `_E` | Unknown |
| `"b23-43d9"` | `ti.m` | Unknown |
| `"a2e-3475"` | `SE.W` | Unknown |
| `"d4f-de7a"` | `_i.J` | Unknown |
| `"737-d4a0"` | `this.game.cache` | Game cache (postCacheInit) |
| `"745-9b8b"` | `Tw` | ImageTintController |
| `"d3c-a01e"` | `kr` | Unknown (postCacheInit) |

**Note on `"de1-d8e8"`**: The GAME_ANALYSIS.md §9 identifies a service at line 71407 and [[membership-service]] references it as `de1-d8e8` used for membership GraphQL queries (`sendMembershipQueryRequest`). This is likely a `GraphQLNetworkHandler` or `MembershipGraphQLService`.

**Note on `"6ac-4dfc"`, `"c59-add2"`, `"e09-b5f2"`**: All bound to `C.xTJ` class — confirmed in [[network-http-socket-infrastructure]] as `SocketInterface` variants (different transports or configurations).

---

## 4. Cross-Domain Inconsistencies Found

### 4a. `hasMembership()` — Two Different Implementations

| Class | Line | Implementation | Notes |
|-------|------|----------------|-------|
| `ActivePlayer` (`zt`, module 96535) | 73310 | Delegates to `859-25be.isMember` | Correct, current implementation |
| Base Player (`ct`, module 129) | 76981 | Returns `this.et` (local flag) | Legacy flag set by `setMembership()` on login |

**Conflict**: [[player-active-player]] correctly documents both. [[membership-service]] documents the `zt` version. No vault note flags that the base class (`ct`, used for RemotePlayer) still uses the legacy `et` flag and does NOT check the `859-25be` service. This is intentional for multiplayer — remote players' membership status comes from the protobuf init, not the service.

### 4b. `DungeonDataProvider` Service ID

[[dungeons-system]] lists `"DungeonDataProvider"` (the raw class name) as a service ID. This is **incorrect** — it is bound using the class symbol `DungeonDataProvider` (not a string hash). The [[core-bootstrap-di-container]] correctly shows: `gameContainer.bind(DungeonDataProvider).to(hi).asSingleton()`. Modders should access it via `gameContainer.get("b5f-11e9")` (DungeonManager) rather than the raw provider.

**Correction to [[dungeons-system]] frontmatter**: `service_ids` should not list `"DungeonDataProvider"` as a string hash ID.

### 4c. `"31b-2a99"` — Dual Attribution

Both [[economy-currency-and-payment]] (as `HardCurrencyDataProvider`) and [[pets-kennel-system]] (as `HardCurrencyService`) describe service `31b-2a99` under different names. The underlying class is the same — `it`/`V` (module 43754) exported as `W`. The naming inconsistency is cosmetic but could confuse modders. The economy note's name (`HardCurrencyDataProvider`) better matches the class export name.

### 4d. Battle System — `_.instance.game.state.states.get()` vs `game.state.get()`

[[battle-system]] documents:
```js
_.instance.game.state.states.get("SecureBattleRevamp")
```

[[zones-world-manager]] documents:
```js
_.instance.game.state.get("TileScreen")
```

The old typings show `game.state.states` as the `GameStates` dict. The vault uses both `.states.get()` (battle) and `.get()` (zones) — these should be consistent. The `StateManager` likely has both `.states` (the map) and a `.get()` shorthand on `GameState`. Both patterns are probably correct (`.get()` may be a shorthand wrapper).

### 4e. `zones-world-manager.md` Cross-Reference Points to Non-Existent Notes

The zones note has cross-references:
- `[[quests-system]]` — should be `[[quests-quest-manager-system]]`
- `[[pets-zone]]` — no such note exists (pet zone service `91b-7302` is documented in [[pets-kennel-system]] and [[core-bootstrap-di-container]])
- `[[academy-zone]]` — no such note exists (academy zone not separately documented)
- `[[dungeons]]` — should be `[[dungeons-system]]`

### 4f. Education System — Access Path Discrepancy

[[education-system]] shows:
```js
const education = _.instance.prodigy.education;
```

The old typings show `prodigy.d.ts` has `gameContainer.get("Education")` (old binding by name). The vault correctly reflects the current architecture — `prodigy.education` is a **facade property** on the `Prodigy` class, NOT a DI-bound service. The old binding name `"Education"` no longer exists.

### 4g. `player.et` vs `player.P` (Membership Flag)

Old typings: `Player["P"]` (boolean) used as membership flag (`hasMembership(): Player["it"]` — also odd, `it` is a method on WorldManager).

Current: `ActivePlayer.et` (private-ish, set in base class `setMembership()`). Old typings used `P`, current uses `et`. This rename is significant — any old mod code checking `player.P` will not work with the current bundle.

### 4h. `inventory-backpack.md` — Missing `mathTownFrame`, `mathTownInterior` Types

Old typings `backpack.d.ts` list item types: `"mathTownFrame"` and `"mathTownInterior"`. The [[inventory-backpack]] vault note omits these from its data structure table. They should be added as valid backpack item types (Math Town decoration items).

### 4i. `player.d.ts` — Missing Methods in Vault Notes

Methods in the old typings not documented in [[player-active-player]]:
- `player.changeCurrentHearts(amount, something)` — HP change with secondary param
- `player.changeCurrentHeartsPercent(percent)` — percentage-based HP change
- `player.changeEnergy(energy)` — MP/energy change
- `player.setEnergy(energy)` — direct energy set
- `player.getEnergy()` — read energy
- `player.getStatHealth()` / `player.getStatPower()` — stat getters
- `player.createDataClone()` — returns Player clone
- `player.diffAttackSlots(level)` — attack slot comparison
- `player.canCatch()` — whether player can catch a pet
- `player.castSpell(prop0)` — client-side spell cast
- `player.addBountyScore(n)` — bounty score
- `player.getBountyScore()` — bounty score getter
- `player.anyPetsAboveLevel(level)` — kennel level check
- `player.healTeam(hearts)` / `player.healTeamMember(hearts, ...)` — team heal methods
- `player.setMemberDebug()` — debug membership setter (likely calls `debugSetMembership`)

Some of these may have been removed in the current version; others may still exist but were missed by the player domain agent.

---

## 5. Confirmed Correct Information (Validated Across Sources)

The following key facts are consistent across all three sources (vault notes, GAME_ANALYSIS.md, typings):

1. **`_.instance`** — The global access point, exposed via lodash under the `instance` property. In the current game this resolves to `M.q.instance` (GameContext singleton, module 35120).

2. **`gameContainer.get("3e5-dac1").player`** — Primary player access. Both GAME_ANALYSIS.md and vault confirm this.

3. **`gameContainer.get("859-25be").isMember`** — The single source of truth for membership. Confirmed at line 73310.

4. **`player.changeGold(delta)`** — Gold modification API, confirmed at line 73540 with cap at 1e9.

5. **`player.forceSaveCharacter()`** — Save trigger, confirmed at line 74284.

6. **`prodigy.open`** — UI opening system, confirmed as `fu` class in [[ui-framework-open-system]].

7. **`world.it(mapKey)`** — Teleportation API, confirmed at line 251383 in [[zones-world-manager]].

8. **`education.onQuestionAnswered`** — Signal-based hook for answer events, confirmed in [[education-system]].

9. **Protobuf `Membership.decode` bypass** — Confirmed in [[data-models-protobuf]] and [[membership-service]].

10. **`Battle` → `SecureBattleRevamp`** — Old battle state fully replaced, confirmed in [[battle-system]] and [[core-bootstrap-di-container]].

---

## 6. Gaps Not Covered by Any Domain Agent

These topics appear in the old typings or GAME_ANALYSIS.md but have no vault coverage:

| Topic | Source | Priority |
|-------|--------|----------|
| VoucherService / VoucherDataProvider | old typings | Low |
| SurveyController / SurveyDataProvider | old typings | Low |
| GeolocationService | old typings | Low |
| ChatManager / StoreService / StoreManager | old typings | Low |
| NicknameFactory / NicknameController / NicknameProvider | old typings | Low |
| JWTAuthProvider / SessionTokenAuthProvider | old typings | Medium (auth flow) |
| InputBlocker | old typings | Low |
| RemoteLogger | old typings | Low |
| Math Tower as DI service (`"MathTower"`) | old typings | Medium |
| `GameEventReceivers` / `GameEventBroadcaster` | old typings | Medium (event bus) |
| `GameBattleDataFactory` / `GameStartDataFactory` etc. | old typings | Low |
| Mail system (MailExtension, MailExtensionController) | old typings | Medium |
| Rifts game state / LootDash | vault (bootstrapped states) | Medium |
| `SegmentAnalyticsService` full method catalog | vault (mentioned but not detailed) | Medium |
| `FlagProvider` / `35d-3bd9` full API | vault (mentioned in multiple notes) | High |
| `DifficultyService` `"b4d-59fa"` / `"f9c-a49f"` full API | vault (mentioned, not detailed) | High |
| `"de1-d8e8"` identity (membership GraphQL handler) | vault (unresolved) | High |
| FSM system full coverage | vault (mentioned, not detailed) | Medium |
| Achievement system | vault (mentioned, not detailed) | Medium |
| `CatalystSDK` / authentication flow | vault (mentioned, not detailed) | High |

---

## 7. Corrections Applied to Existing Notes

### [[dungeons-system]] — Service ID Correction

The `service_ids` frontmatter incorrectly lists `"DungeonDataProvider"` as a string hash. This is a class symbol binding, not a string ID. The correct modding access is via `"b5f-11e9"` (DungeonManager).

### [[zones-world-manager]] — Cross-Reference Corrections

Several cross-reference wikilinks point to non-existent notes:
- `[[quests-system]]` → `[[quests-quest-manager-system]]`
- `[[pets-zone]]` → coverage in [[pets-kennel-system]] (service `91b-7302`)
- `[[academy-zone]]` → no dedicated note (future work)
- `[[dungeons]]` → `[[dungeons-system]]`

### [[player-active-player]] — `hasMembership()` Clarification

The note correctly documents both `ct.hasMembership()` (returns `this.et`) and `zt.hasMembership()` (delegates to `859-25be`). Should explicitly note that `ct` version is only used for RemotePlayer (co-op opponents), NOT for the logged-in player.

---

## 8. Recommended Priority Actions for Future Agents

1. **`"35d-3bd9"` (FlagProvider)** — Feature flags control large portions of game behavior (kennel limits, pet evolution, etc.). A dedicated `feature-flags.md` note is needed.

2. **`"de1-d8e8"` identity** — The membership GraphQL handler is referenced in [[membership-service]] but never analyzed. Likely at lines ~71405–71420.

3. **`"b4d-59fa"` / `"f9c-a49f"` (DifficultyService/Controller)** — Referenced in education and battle but not fully documented.

4. **CatalystSDK authentication** — The entire login/JWT flow is undocumented. Services `JWTAuthProvider`, `SessionTokenAuthProvider` from old typings have no current equivalent documented.

5. **FSM system** — `IFSMController`, `FSMFactories`, `FSMService`, `FSMDataProvider` are bound via symbol IDs (not hash strings). Quest cutscenes, NPC interactions, and many battle sequences all depend on FSM.

6. **Mail system** — `"a7e-4ed4"` (MailService) in [[core-bootstrap-di-container]] is unanalyzed.

7. **Achievements system** — `"6ef-abaa"` (AchievementsService) is unanalyzed.

---

## Summary

| Category | Count |
|----------|-------|
| Domains with complete vault notes | 15 |
| Service IDs fully resolved | ~40 |
| Service IDs still unknown | ~70 |
| Confirmed broken patcher patterns | 4 |
| Old typing paths now invalid | ~25 |
| Cross-domain inconsistencies found | 9 |
| Gaps requiring future analysis | 7 high-priority |

The vault notes are **largely accurate and internally consistent** for game version 2026.18.1. The primary gap is the large number of unknown service IDs (mostly internal helpers), several missing domain analyses (feature flags, authentication, mail, FSM), and the complete architectural divergence from the old ProdigyMathGameHacking typings which describe a pre-2024 game version.

## Cross-References

- [[core-bootstrap-di-container]] — canonical service ID registry
- [[player-active-player]] — primary player access patterns
- [[membership-service]] — membership bypass hook points
- [[education-system]] — answer bypass hook points
- [[battle-system]] — battle state architecture
- [[network-game-network-manager]] — network facade
