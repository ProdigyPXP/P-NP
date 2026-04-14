---
domain: battle
module_ids: [60155, 58203, 37987, 81687, 28628, 52551, 13302, 41866, 11454, 58690, 54705]
line_range: [62844, 62889, 105952, 106941, 107389, 107459, 153342, 192960, 260591, 260652]
service_ids: ["35d-3bd9", "4ad-1685", "16b-0e3b"]
status: complete
last_updated: 2026-04-13T12:30:00.000Z
---

# Battle System (SecureBattleRevamp)

> Core modules: 60155 (lines 105952–106941), 58203 (lines 107389–107459), module 81687 (lines 153342–192960, major game module). Enums: modules 41866, 11454, 58690, 54705, 13302 (lines 260591–260652).

## Overview

Prodigy's battle system is a server-authoritative turn-based combat engine called **SecureBattleRevamp**. All battle logic runs on the server (via CloudScript), and the client receives `EBattleStateUpdate` events to drive animations. The client-side `BattleController` (`Jt`, module 60155) manages two teams (`leftTeam` = Home, `rightTeam` = Away), the active unit, spell cards, and post-battle flow.

## Access Pattern

```js
// Access the active SecureBattleRevamp game state:
const battleState = _.instance.game.state.states.get("SecureBattleRevamp");

// The battle controller (after battle starts):
const bc = battleState._battleController;

// Home team units:
bc.leftTeam.units

// Active unit (whose turn it is):
bc.activeUnit

// Force-start a battle from anywhere (calls prodigy.battle.start):
_.instance.prodigy.battle.start(mods, onEscape, onVictory, onDefeat, onFaint);
```

## Key Enums

### ETeamId (module 41866, line 260609)
| Value | String | Meaning |
|-------|--------|---------|
| `ETeamId.Home` | `"home"` | Player team (left side) |
| `ETeamId.Away` | `"away"` | Enemy team (right side) |

### EBattleStateUpdate (module 58690, line 260629)
Server-sent state update event types:
| Key | String Value | Meaning |
|-----|-------------|---------|
| `SetActiveUnit` | `"setActiveUnit"` | Whose turn starts |
| `CastSpell` | `"castSpell"` | A spell was cast |
| `Escape` | `"escape"` | A unit escaped |
| `DefeatUnit` | `"defeatUnit"` | A unit was defeated |
| `ModifyMp` | `"modifyMp"` | MP changed |
| `ModifyLevel` | `"modifyLevel"` | Level changed |
| `ModifySpellCooldown` | `"modifySpellCooldown"` | Spell cooldown updated |
| `ModifyUnitTeam` | `"modifyUnitTeam"` | Unit moved to another team |
| `AddUnit` | `"addUnit"` | Unit added to battle |
| `ReviveUnit` | `"reviveUnit"` | Unit revived |
| `AddAffix` | `"addAffix"` | Affix (buff/debuff/shield) applied |
| `RemoveAffix` | `"removeAffix"` | Affix removed |
| `AddStatusEffect` | `"addStatusEffect"` | Status effect added |
| `TriggerStatusEffect` | `"triggerStatusEffect"` | Status effect triggered |
| `RemoveStatusEffect` | `"removeStatusEffect"` | Status effect removed |
| `SkipTurn` | `"skipTurn"` | Turn skipped |
| `EndBattle` | `"endBattle"` | Battle ended (has `victoriousTeamId`) |
| `NewRound` | `"newRound"` | New round started |
| `CustomEvent` | `"event"` | Custom named event |
| `DebugMessage` | `"debugMessage"` | Debug info |

### EBattleAction (module 11454, line 260619)
Player actions sent to server:
| Key | String | Meaning |
|-----|--------|---------|
| `CastSpell` | `"castSpell"` | Cast a spell |
| `UseConsumable` | `"useConsumable"` | Use consumable item |
| `RescuePet` | `"rescuePet"` | Rescue defeated enemy pet |
| `PowerUp` | `"powerUp"` | Use power-up |
| `EscapeBattle` | `"escapeBattle"` | Run from battle |
| `Fumble` | `"fumble"` | Missed / incorrect answer |

### EDamageInformation flags (module 54705, line 260640)
Bitfield for damage display:
`None=0, CriticalHit=1, Effective=2, Ineffective=4, Missed=8, Heal=16, Fumble=32, Absorb=64, Reflected=128, Dodge=256`

### EUnitType / EUnitCategory (module 28628, line 62874)
```
UnitType: Wizard, Pet, Boss, Titan, Object, Miniboss
UnitCategory: DungeonBoss, TowerBoss, ZoneBoss, EventBoss, FinalBoss, Wizard, Mythic, Enemy
```

## BattleController (class `Jt`, module 60155, lines 106091–106941)

The main client-side battle orchestrator.

### Properties
| Property | Type | Modding Notes |
|----------|------|---------------|
| `leftTeam` | `BattleTeam` | Home team — player side |
| `rightTeam` | `BattleTeam` | Enemy team — away side |
| `activeUnit` | `BattleUnit` | Whose turn it currently is |
| `battleConstants` | `BattleConstants` | Battle config (rescueSpellId, etc.) |
| `battleResult` | `BattleResult` | Post-battle result panel |
| `battleStats` | object | Stats tracking (type string, etc.) |
| `leftTeamId` | `ETeamId.Home` | Always `"home"` |
| `rightTeamId` | `ETeamId.Away` | Always `"away"` |

### Methods
| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `initBattlePrefab(E)` | 106176 | `(battleData) => Promise` | Loads all battle prefabs, binds teams |
| `startStateMachine()` | ~106300 | `() => void` | Begins turn flow after prefab loaded |
| `resumeLastBattleState(E)` | 106233 | `(resumedSegmentData)` | Resume after disconnect |
| `processBattleStateUpdates(E)` | 106358 | `(updates[])` | Convert server updates to state handlers |
| `clearBattleState()` | ~107452 | `() => Promise` | Calls `battle.clearBattleState` CloudScript |
| `registerBattleEndHandlers(B)` | 106206 | `(stateMachine)` | Sets up victory/defeat callbacks |
| `initBattleStats()` | 106300 | `() => void` | Disables save during battle |
| `getTeamById(teamId)` | 106466 | `(teamId) => BattleTeam` | Get team by ID |
| `getUnits()` | 106469 | `() => BattleUnit[]` | All units in battle |
| `setActiveUnit(unit)` | 106489 | `(unit) => Promise` | Switch whose turn indicator shows |
| `showBattleResult(...)` | 106607 | `(...)` | Show post-battle rewards panel |
| `getUnitsToAward()` | 106641 | `() => string[]` | Units that receive XP |
| `destroy()` | 106828 | `() => void` | Full cleanup |

## NetworkHandler (class `I`, module 58203, lines 107389–107459)

The CloudScript bridge for battle events. Registered as `NetworkHandler` in the scene DI container.

### Methods
| Method | Line | CloudScript Route | Purpose |
|--------|------|-----------------|---------|
| `createBattle(config)` | 107408 | `battle.start` | Start new battle on server |
| `doBattleAction(action, battleId)` | 107429 | `battle.action` | Send player action (spell cast etc.) |
| `resumeBattle()` | 107442 | `battle.resume` | Resume interrupted battle |
| `escapeBattle()` | 107447 | `battle.escape` | Run from battle |
| `clearBattleState()` | 107452 | `battle.clearBattleState` | Clear server battle state |

## SecureBattleRevamp Game State (class `wA`, module 81687, line 191895)

Extends `Pu.f` (a Phaser/game state). Accessed via `_.instance.game.state.states.get("SecureBattleRevamp")`.

### Methods
| Method | Line | Purpose |
|--------|------|---------|
| `startBattleRequest(config, mods)` | 191896 | Entry point: sets `_config`, starts the state |
| `resumeBattleRequest(resumeData, mods)` | 191900 | Resume entry point |
| `init(remoteConfig, isResume)` | 191907 | Async init: binds DI, loads prefabs, calls server |
| `handleFatalBattleError()` | 191958 | Calls `onFatalError` or `onEscape` or teleport to world |
| `preloadLocalAssets()` | 191961 | Loads backgrounds, spell prefabs locally |
| `preloadRemoteAssets(battleData)` | 191974 | Loads unit spine/asset files from CDN |
| `getUnitAssets(units)` | 191990 | Builds asset load list from unit data |

### Init Flow (line 191907–191956)
1. Bind `BattleState`, `RemoteConfig`, `LocalConfig`, `DifficultyMode` to scene DI
2. Call `_A.getBattleController(remoteConfig)` to get the right controller subclass
3. Show loading screen
4. Force-save player character
5. Call `requestBattleStart(remoteConfig)` or `requestBattleResume()`
6. Get `battleId` from server response
7. Preload unit assets, load prefab
8. Start state machine (`startStateMachine()`) or resume (`resumeLastBattleState()`)

## Battle Type Registry (module 81687, lines 191759–191892)

A map of `EBattleType → BattleController subclass`. Key entries:
| Battle Type | Controller Class | Notes |
|-------------|-----------------|-------|
| `Titan` | `cA` | Titan co-op |
| `CrystalCavernsGrumpyYeti` | `pS` | |
| `CrystalCavernsMakalu` | inline class | Complex shell-game boss mechanics |
| `PumpkinfestBoss` | `BS` | Festival event boss |
| `EndGamePuppetMaster` | `YS` | Final boss |
| `FestivalDailyBoss` | `hS.R` | Festival daily battle |
| All quest/zone bosses | `Qw.V` | Default base class |

## DailyBattleTracker (class `Vt`, module 96535, lines 73097–73223)

Tracks daily battle limits and festival progress. Lives inside the player's data.

### Properties
| Property | Type | Notes |
|----------|------|-------|
| `_dailyBattleLimit` | number | Default 1 |
| `_dailyBattleCount` | number | Times played today |
| `_dailyBossBattleRematchCount` | number | Boss rematch count |
| `_isDailyBattleComplete` | `Map<BattleType, bool>` | Per-type completion |
| `inPostBattleFlow` | boolean | True during post-battle flow |

### Methods
| Method | Line | Purpose |
|--------|------|---------|
| `init(data)` | 73165 | Load from save data |
| `start(festivalType, limit, placementMap, encounterMap, interval)` | 73185 | Start new daily battle session |
| `playedBattle(battleType)` | 73188 | Increment counter on battle end |
| `isDailyBattleComplete(type)` | 73119 | Check if limit reached |
| `isExpired(festivalType)` | 73191 | Check if daily refresh needed |
| `getData()` | 73206 | Serialize for save |

## Post-Battle Flow Manager (class `Ut`, module 2652, lines 95625–95797)

Registered as `PostBattleFlowManager` prefab component. Orchestrates the post-battle reward screens.

### State Machine Order (victory path)
1. `St` — Rescue pets (if applicable)
2. `rt` — Pet evolution prompts
3. `bt` or `vt` — Rewards display (vt = member jar variant)
4. `It` — Rift key obtained dialogue
5. `ct` — Academy/Noot unlock dialogue (FSM 57)
6. `kt` — Membership upsell video (home/school variant)

### Key Methods
| Method | Line | Purpose |
|--------|------|---------|
| `setupPostBattleStates(isMember, showVideo)` | 95670 | Build victory state list |
| `setupPostDefeatStates()` | 95679 | Show defeat screen |
| `redeemStarsThroughMemberJar()` | 95732 | Cash in stored member stars |
| `enableExpressMode(reason)` | 95765 | Skip animations (bot battles, etc.) |

## Exposable Variables

```js
// Access current battle controller (during a battle):
const bc = _.instance.game.state.states.get("SecureBattleRevamp")?._battleController;

// All units in battle:
const units = bc?.getUnits();

// Active unit (whose turn it is):
const activeUnit = bc?.activeUnit;
// activeUnit.data.health.current — current HP
// activeUnit.data.health.max — max HP
// activeUnit.currentMp — current MP
// activeUnit.spells — array of available spells
// activeUnit.data.teamId — "home" or "away"

// Force escape:
bc?.escapeBattle?.();

// Daily battle count:
const player = _.instance.prodigy.gameContainer.get("f4b-0454");
player.dailyBattleTracker._dailyBattleCount;
player.dailyBattleTracker._dailyBattleLimit;
```

## Hook Points

- **`startBattleRequest(config, mods)` at line 191896** — Override to intercept/modify battle start params before state starts
- **`handleFatalBattleError()` at line 191958** — Override to catch battle failures
- **`processBattleStateUpdates(updates)` at line 106358** — Override to intercept or inject server state updates
- **`getStateOverride(update)` pattern (e.g. line 191813)** — Each battle controller subclass can override state handling per `EBattleStateUpdate` type
- **`initBattlePrefab(data)` at line 106176** — Override to modify teams/units before battle starts
- **`EBattleStateUpdate.EndBattle` handler** — Intercept to detect victory/defeat
- **`GameConstants.Battle.FORCE_CAST` at line 71660** — Set to a spell index to force the player to always cast that spell
- **`GameConstants.Battle.ESCAPE_CHANCE` at line 71656** — Set to 1.0 for guaranteed escape
- **`GameConstants.Battle.MEMBER_STARS_PERCENTAGE` at line 71653** — XP multiplier for members

## Cross-References

- [[player-active-player]] — `f4b-0454` (ActivePlayer) is paused/resumed during battle; has `dailyBattleTracker`, `battleResumeData`, `battleStreak`
- [[network-game-network-manager]] — `e2e-9e38` used for social status during battle
- [[membership]] — `859-25be` checked in post-battle flow for member rewards
- [[data-models-protobuf]] — `Battle`, `BattleAction`, `Unit`, `Spell` protobuf schemas used in PvP/duel flow
- [[ui-framework-open-system]] — `prodigy.open.postBattleLossMenu()`, `postBattleMembershipVideoMenu()` called from post-battle flow
- [[pets]] — `31b-2a99` (HardCurrencyDataProvider) used for pet rescue costs
- [[education]] — Math questions triggered during battle turns via `d79-f761` (question interface)
