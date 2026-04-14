---
domain: dungeons
module_ids: [50751, 153363, 154963, 155145, 10730, 28930, 113287, 116087, 237560, 240817, 255057]
line_range: [62850, 255534]
service_ids: ["b5f-11e9", "129-07a6", "9cb-d480"]
status: complete
last_updated: 2026-04-13T17:30:00.000Z
---

# Dungeons System

> Modules 50751, 153363+, 154963, 237560. Service IDs: `b5f-11e9` (DungeonManager), `DungeonDataProvider` (raw data), `129-07a6` (TowerDungeonGenerator), `9cb-d480` (ArchivesDungeonGenerator).

## Overview

The dungeon system covers two major dungeon types: **Crystal Caverns** (roguelite adventure dungeons) and **Dark Tower / Academy Towers** (floor-based tower climbs). Both share a common procedural layout generator, a `DungeonState` state-persistence class, and a `DungeonZone` base class for zone management. The system is seeded, randomly generates room grids with critical paths, monsters, golden pages, and side paths.

## Access Pattern

```js
// Get the DungeonManager (deserializes dungeon configs from game data)
const dungeonManager = _.instance.prodigy.gameContainer.get("b5f-11e9");

// Get a dungeon config by ID (returns deserialized DungeonGeneratorConfig)
const config = dungeonManager.getDungeon(2); // 2 = Archives run, 3 = first-time Archives run

// Get Crystal Caverns dungeon state for logged-in player
const state = _.instance.prodigy.gameContainer.get("3e5-dac1").player.state.getDungeonState(CrystalCavernsDungeonState, "crystal_caverns");

// Get Crystal Caverns zone
const zone = _.instance.prodigy.world.zones["CRYSTALCAVERNS"];

// Enter dungeon programmatically
zone.enterDungeon();
// Exit dungeon
zone.exitDungeon();
```

## Key Classes & Functions

| Minified Name | Inferred Name | Line | Purpose |
|---------------|---------------|------|---------|
| `D` (module 50751) | `DungeonState` | 78591 | Per-dungeon run state (maps, bosses, checkpoints, conditions) |
| `oi` (module ~154963) | `DungeonGenerator` | 154963 | Procedural layout generator — builds room grid |
| `vi` (module ~155237) | `TowerDungeonGenerator` | 155237 | Tower variant of generator (no golden pages, start-room boss) |
| `H` (module ~153368) | `DungeonGeneratorConfig` | 153368 | Serializable config: grid size, crit path len, rooms, monsters |
| `V` (module ~153478) | `MonsterDrop` | 153478 | Drop data model (type, ID, quantity) |
| `W` (module ~153504) | `ExtraPathConfig` | 153504 | Config for extra path generation |
| `q` (module ~153536) | `RoomConfig` | 153536 | Room config (tilemap string, FSM ID) |
| `K` (module ~153556) | `DungeonConfigDeserializer` | 153556 | Deserializes game-data JSON into DungeonGeneratorConfig |
| `z` (module ~153618) | `DungeonManager` | 153618 | Service `b5f-11e9`; holds DI container and calls getDungeon() |
| `hi` (module ~155145) | `DungeonDataProvider` | 155145 | Service `DungeonDataProvider`; reads raw dungeon data via `Zt.t.getItem("dungeon", id)` |
| `V` (module ~237560) | `DungeonZone` | 237560 | Base zone class for dungeons: `enterDungeon`, `exitDungeon`, `addCollected`, `defeatMonster`, `openWheel` |
| `Oi` (module ~240817) | `CrystalCavernsZone` | 240817 | Crystal Caverns zone, extends DungeonZone; ID = `CRYSTALCAVERNS`, currency=15 |
| `vt` (module ~255057+) | `AcademyTowerZone` | 255057 | Tower zone: `enterDungeon` per floor, tracks `monstersDefeated`, boss state, segment events |
| `ce` | `AdventureLevelText` | 113288 | UI component: shows dungeon run level (or player level if no run) |
| `ue` | `CompleteDungeonUI` | 113344 | UI: `restartDungeon()`, `leaveDungeon()`, `completeRun()` |
| `fe` | `ContinueDungeonRun` | 113356 | UI: `continueDungeonRun()` — teleports to current map |
| `be` | `DungeonPlayerSpawner` | 113363 | Spawns player at checkpoint location on dungeon entry |
| `ge` | `DungeonSpawnDataProvider` | 113398 | Provides spawn location from checkpoint data |
| `me` | `EnterDungeon` | 113408 | Map event: resets run, calls `startDungeonRun`, teleports |
| `Fe` | `MapCheckpoint` | 113646 | Map event: sets checkpoint when player reaches higher index |
| `FS` | `DungeonConditionEvaluator` | 136154 | Evaluates active conditions, sets/gets condition flags on DungeonState |
| `ai` | `MonsterRoomConfig` (inline) | 154954 | Runtime monster config for a room (drops, difficulty) |
| `si` | `ItemRoomConfig` (inline) | 154935 | Runtime item config for a room (golden pages = ID 18, academy pages = ID 19) |
| `bi` | `TowerFloorExitComponent` | 155157 | Handles floor elevator exit logic, boss-defeat detection, next-floor popup |

## Properties

### DungeonState (module 50751, line 78591)

| Property | Type | Default | Modding Notes |
|----------|------|---------|---------------|
| `_data.persistentData.bossesStatus` | number (bitfield) | 0 | Tracks which bosses defeated all-time (bit per boss) |
| `_data.runData.bossesStatus` | number (bitfield) | 0 | Tracks bosses defeated this run |
| `_data.runData.currentMap` | string | null | Current map key in dungeon |
| `_data.runData.level` | number | 1 | Player level when run started |
| `_data.runData.seed` | number | 0 | Seed for procedural generation (Date.now() on start) |
| `_data.phaseData.checkpoint` | object | null | `{index, location:{x,y}, facingDirection}` |
| `_data.phaseData.mapObjectStatus` | object | {} | Bit-packed map object completion flags |
| `_data.phaseData.conditionStatus` | object | {} | Map of condition name → boolean |
| `_data.persistentData.completedRuns` | number | 0 | Total completed runs |

### DungeonGeneratorConfig (module ~153368)

| Property | Type | Notes |
|----------|------|-------|
| `seed` | number\|null | RNG seed; null until set |
| `gridWidth` / `gridHeight` | number | Grid dimensions |
| `minCritPathLength` / `maxCritPathLength` | number | Critical path length range |
| `monsterIDs` | number[] | Possible monster IDs for this dungeon |
| `minEncounters` / `maxEncounters` | number | Monster room count range |
| `monsterDrops` | MonsterDrop[] | Items dropped by monsters |
| `goldenPages` | number | Count of golden pages to place |
| `battleDifficulty` | number | Battle difficulty (default 3) |
| `extraPaths` | ExtraPathConfig | Side path configuration |
| `normalRooms` / `monsterRooms` | RoomConfig[] | Tilemap/FSM pool for room types |
| `endRoom` | RoomConfig | The boss/end room config |

## Methods

### DungeonState (line 78591)

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `startDungeonRun()` | 78699 | `() => void` | Resets run data, sets level + seed, clears phase data |
| `resetPhaseData()` | 78703 | `() => void` | Clears phase data (checkpoints, map objects) |
| `resetRunData()` | 78706 | `() => void` | Clears run data |
| `resetAllData()` | 78709 | `() => void` | Clears everything (persistent + run + phase) |
| `getCurrentMap()` | 78611 | `() => string\|null` | Active dungeon map key |
| `setCurrentMap(E)` | 78615 | `(string) => void` | Set active map |
| `getLevel()` | 78618 | `() => number` | Stored level at run start |
| `isRunStarted()` | 78622 | `() => boolean` | True if run or phase data is non-empty |
| `isValid()` | 78712 | `() => boolean` | True if seed and currentMap are defined |
| `setCheckpoint(index, position, facingDir)` | 78625 | `(number, {x,y}, number) => void` | Save checkpoint |
| `getCheckpointIndex()` | 78635 | `() => number` | Returns index (-1 if none) |
| `getCheckpointLocation()` | 78639 | `() => {x,y}\|null` | Returns location or null |
| `getFacingDirection()` | 78643 | `() => number` | Returns checkpoint facing direction |
| `getCompletedRuns()` | 78647 | `() => number` | Total completed runs |
| `setCompletedRuns(n)` | 78651 | `(number) => void` | |
| `setPersistentBossesStatus(n)` | 78654 | `(number) => void` | Bit-set: all-time boss defeats |
| `getPersistentBossesStatus()` | 78657 | `() => number` | |
| `setRunBossesStatus(n)` | 78661 | `(number) => void` | Bit-set: run boss defeats |
| `getRunBossesStatus()` | 78664 | `() => number` | |
| `getSeed()` | 78668 | `() => number` | |
| `setMapObjectCompleted(id, done)` | 78672 | `(number, boolean) => void` | Bit-set per map object |
| `isMapObjectCompleted(id)` | 78678 | `(number) => boolean` | |
| `setConditionActive(name, val)` | 78687 | `(string, boolean) => void` | |
| `isConditionActive(name)` | 78691 | `(string) => boolean` | |
| `getActiveConditions()` | 78695 | `() => string[]` | |
| `isBossDefeatedAllTime(idx)` | ~78530 | `(number) => boolean` | 0=GrumpyYeti, 1=Makalu, 2=CrystalGolem, 3=Glacias, 4=WinstonVonLoot |
| `isBossDefeatedCurrentRun(idx)` | ~78540 | `(number) => boolean` | Same boss indices |
| `setBossDefeated(idx)` | ~78545 | `(number) => void` | Marks boss defeated in both persistent+run |

### DungeonZone base (line 237560)

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `enterDungeon(seed?)` | 237561 | `(number?) => void` | Creates generator, builds layout, teleports player to start room |
| `exitDungeon(drop?)` | 237577 | `(item?) => void` | Teleports to `this.exitMap` at (855, 480) |
| `teleportInDungeon(mapConfig, x?, y?)` | 237567 | `(mapConfig, number, number) => void` | Moves within dungeon to specified room |
| `defeatMonster(id, items, mods)` | 237597 | | Adds "monster" to collected, increments Archives achievement |
| `addCollected(key, value)` | 237594 | `(string, string) => void` | Adds to room collectedItems tracking |
| `resetCooldown()` | 237580 | `() => void` | Sets lastDungeonRun timestamp, marks player updated |
| `openWheel(screen, wheelId)` | 237620 | | Opens prize wheel popup |
| `getBattleMods()` | 237584 | | Returns `{difficulty, drops:[{ID:19, type:"currency", N:5}]}` |
| `goToEnd()` | 237600 | `() => void` | Debug: teleport to end room |

### DungeonManager `b5f-11e9` (line 153618)

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `getDungeon(id)` | 153622 | `(number) => DungeonGeneratorConfig` | Returns deserialized config from game data |

### DungeonDataProvider (line 155145)

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `getDungeon(id)` | 155146 | `(number) => object` | Raw `Zt.t.getItem("dungeon", id).data` |

### DungeonGenerator `oi` (line 154963)

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `initDungeon(config)` | 154967 | `(DungeonGeneratorConfig) => void` | Sets config, creates seeded RNG |
| `createLayout()` | 154970 | `() => Layout` | Generates complete room grid with crit path, monsters, pages |
| `addCriticalPath(length)` | 154990 | `(number) => void` | Builds required path from center |
| `addMonsters(count)` | 155037 | `(number) => void` | Places monsters in off-crit rooms |
| `addExtraPaths(count)` | 155045 | `(number) => void` | Adds branching side paths |
| `addGoldenPages(count)` | 155064 | `(number) => void` | Places golden page items |
| `addPages(count)` | 155072 | `(number) => void` | Places academy pages |
| `assignRoomTilemaps()` | 155080 | `() => void` | Assigns tilemap strings to rooms |
| `getAllRooms(includeCritPath?)` | 155095 | `(boolean) => MapConfig[]` | Returns all placed rooms |

## Boss Types (line 62879)

| Value | Name | Notes |
|-------|------|-------|
| `"Dungeon Boss"` | DungeonBoss | Crystal Caverns bosses |
| `"Tower Boss"` | TowerBoss | Dark Tower floor bosses |
| `"Zone Boss"` | ZoneBoss | Regular zone bosses |
| `"Event"` | EventBoss | Festival/event bosses |
| `"Final Boss"` | FinalBoss | |

`x = E => [R.DungeonBoss, R.TowerBoss].includes(E)` — utility function to check if a battle type is dungeon-type (line 62887).

## Crystal Caverns Bosses (line ~78530)

Boss indices in `DungeonState`:
- 0 = Grumpy Yeti
- 1 = Makalu
- 2 = Crystal Golem
- 3 = Glacias
- 4 = Winston Von Loot

Battle types used: `"DungeonMonsterBattle"` (regular), `"DungeonBossBattle"` (boss).

## DI Container Bindings (line 187865)

```js
gameContainer.bind("b5f-11e9").to(z).asSingleton()         // DungeonManager
gameContainer.bind(DungeonDataProvider).to(hi).asSingleton()  // DungeonDataProvider — bound via CLASS SYMBOL, not string hash
gameContainer.bind("9cb-d480").to(oi)                        // DungeonGenerator (Crystal Caverns / Archives)
gameContainer.bind("129-07a6").to(vi)                        // TowerDungeonGenerator
```

> **Note (reconciliation):** `DungeonDataProvider` is bound via class symbol, not a string ID. Do not use `gameContainer.get("DungeonDataProvider")` — use `gameContainer.get("b5f-11e9")` (DungeonManager) to access dungeon configs. See [[reconciliation-report]] §4b.

Tower floor enters use generator IDs from `_towerData.floorConfigs[floor-1].generator` retrieved via `b5f-11e9`.

Archives uses IDs 2 (normal run) and 3 (first-time run).

## Exposable Variables

- `_.instance.prodigy.gameContainer.get("3e5-dac1").player.state.getDungeonState(CrystalCavernsDungeonState, "crystal_caverns")` — get Crystal Caverns `DungeonState`
- `_.instance.prodigy.world.zones["CRYSTALCAVERNS"]` — Crystal Caverns zone object
- `dungeonState.getSeed()` — current run seed (read/write via `getRunSchema().seed`)
- `dungeonState.getLevel()` — level stored at run start (writable for modding difficulty)
- `dungeonState.resetAllData()` — **hook point**: call to completely reset dungeon progress
- `dungeonState.setBossDefeated(idx)` — **hook point**: mark any boss as defeated without battle

## Hook Points

Methods that can be overridden for modding:

- `DungeonState.isBossDefeatedAllTime(idx)` (line ~78530) — override to fake all bosses defeated (unlock content)
- `DungeonState.isRunStarted()` (line 78622) — override to always/never have an active run
- `DungeonZone.enterDungeon()` (line 237561) — override to skip seed generation or inject custom layout
- `DungeonZone.getBattleMods()` (line 237584) — override difficulty or drops for dungeon battles
- `DungeonZone.exitDungeon()` (line 237577) — intercept dungeon exit
- `DungeonGenerator.createLayout()` (line 154970) — override to inject custom room configurations
- `AcademyTowerZone.enterDungeon()` (line 255383) — intercept tower floor entry (change floor config)
- `PlayerState.isBlockedByDarkTowerMemberGate()` (line 73698) — override to always return `false` (bypass member gate at floor 5)

## Crystal Caverns Zone Details (line 240817)

- Zone ID: `CRYSTALCAVERNS`
- Battle BG: `"battle-shiverchill-inside"`
- Quest hub: `"crystal_caverns-DungeonHub"`
- BGM ID: 32
- Currency ID: 15 (crystal currency, used in backpack check on entry)
- Maps: Phase1 (prefab), Phase2 (prefab), Phase3 (prefab), DungeonHub (regular map)
- Feature flag: `gameContainer.get("35d-3bd9").getValue("enableCrystalCaverns", true)`

## Academy Tower Details (line ~255057)

- `dungeonGenerator`: `"129-07a6"` (TowerDungeonGenerator)
- Tower zone tracks `CurrentFloor`, `TotalFloors`, `goalTotal` (battles per floor)
- `isTowerComplete()` / `isWardenSaved` control post-completion paths
- Tower progress stored in player state: `player.getTowerProgress()` / `player.completeTower(floor)`
- Dark Tower member gate at floor 5+: `player.isBlockedByDarkTowerMemberGate()` (line 73698)
- Tower floor config `battlesPerFloor` determines `goalTotal`
- Warden room key is item type=`"item"`, ID from `_towerData.wardenRoomKeyID`

## Cross-References

- [[player-active-player]] — player state holds all `DungeonState` instances via `getDungeonState()`; tower progress stored in `player.data.tower`
- [[battle-system]] — battle type `"DungeonMonsterBattle"` / `"DungeonBossBattle"` set on battle start; boss level injected from `dungeonState.getLevel()`
- [[membership-service]] — Dark Tower member gate via `player.isBlockedByDarkTowerMemberGate()` using `MAX_FREE_MEMBER_FLOOR = 5`
- [[zones-world-manager]] — `world.getZone()`, `world.it()` used for zone navigation
- [[economy]] — `openWheel()` and `exitDungeon()` trigger prize wheel; dungeon currency ID 15
- [[inventory-backpack]] — dungeon checks/consumes currency ID 18 on Crystal Caverns entry
