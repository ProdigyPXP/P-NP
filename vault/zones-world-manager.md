---
domain: zones
module_ids: [73678, 87820, 7612, 26022, 2212, 76224, 30226]
line_range: [65638, 252027]
service_ids: []
status: complete
last_updated: 2026-04-13T10:00:00.000Z
---

# Zones & World Manager

> Zone ID enum: module 73678, lines 65638–65651.
> Zone base class (`et`): module 87820, lines 251494–252027.
> WorldManager (`cc`): module 7612, lines 238249–251493.
> TileScreen game state: module 26022, lines 198663–199918.
> WorldMap UI controller (`jt`): module 76224, lines 222433–223400.
> CampaignReplayUtils (`x.J` / `J.J`): module 2212, lines 81846–81951.
> Utils with `isCoreZone`: module 30226, lines 232340–232928.

## Overview

The zone system manages all world exploration in Prodigy. `WorldManager` owns a dictionary of instantiated zone objects and handles teleportation via `world.it()`. Each zone extends the `Zone` base class (`et`) which stores maps, quests, scenes, and state. The `TileScreen` Phaser game state renders the tile-based exploration maps.

## Access Pattern

```js
// Get the WorldManager (accessed directly from the prodigy singleton)
const world = _.instance.prodigy.world;

// Get current zone ID string (e.g. "forest")
const zoneId = world.getCurrentZone();

// Get current map string (e.g. "forest-C8")
const map = world.getCurrentMap();

// Get zone object by ID
const zone = world.getZone("forest");

// Teleport to a map by map key
world.it("forest-C8");          // teleport to map forest-C8
world.it("shiverchill-A1", x, y); // teleport with coords
world.teleportToCurrentMap();   // reload current map

// Get zone quest state
const questState = zone.getQuestState(); // { ID, req, seq, state }

// Get/set zone flags (persistent, keyed to player state)
zone.getState("chest1");           // returns stored value
zone.setState("chest1", 1);        // sets stored value

// TileScreen reference
const ts = _.instance.game.state.get("TileScreen");
ts.zone;       // current Zone object
ts.data;       // current MapData object
ts.user;       // player character object
ts.path;       // pathfinder
ts.walkEnabled; // toggle player walking
```

## Zone ID Enum (`ZoneID` / `A_`)

Module 73678, lines 65638–65651. Exported as `A_`.

| Constant | String Value |
|----------|-------------|
| `FOREST` | `"forest"` |
| `SHIVERCHILL` | `"shiverchill"` |
| `SKYWATCH` | `"skywatch"` |
| `BONFIRE` | `"bonfire_spire"` |
| `SHIPWRECK` | `"shipwreck_shore"` |
| `ACADEMY` | `"academy"` |
| `HOUSE` | `"house"` |
| `LAMPLIGHT` | `"lamplight"` |
| `DYNO` | `"dyno"` |
| `DARKTOWER` | `"darktower"` |
| `ARCHIVES` | `"archives"` |
| `TOWERTOWN` | `"tower_town"` |
| `CRYSTALCAVERNS` | `"crystal_caverns"` |
| `DRAGONISLE` | `"dragon_isle"` |
| `MOON` | `"moon"` |
| `EARTHTOWER` | `"earthtower"` |
| `ICETOWER` | `"icetower"` |
| `STORMTOWER` | `"stormtower"` |
| `FIRETOWER` | `"firetower"` |
| `WATERTOWER` | `"watertower"` |
| `ASTRALTOWER` | `"astraltower"` |
| `FORESTHARD` | `"forest_hard"` |
| `SHIVERCHILLHARD` | `"shiverchill_hard"` |
| `SKYWATCHHARD` | `"skywatch_hard"` |
| `BONFIREHARD` | `"bonfire_spire_hard"` |
| `SHIPWRECKHARD` | `"shipwreck_shore_hard"` |
| `ACADEMYHARD` | `"academy_hard"` |
| `FORESTEXPERT` | `"forest_expert"` |
| `SHIVERCHILLEXPERT` | `"shiverchill_expert"` |
| `SKYWATCHEXPERT` | `"skywatch_expert"` |
| `BONFIREEXPERT` | `"bonfire_spire_expert"` |
| `SHIPWRECKEXPERT` | `"shipwreck_shore_expert"` |
| `ACADEMYEXPERT` | `"academy_expert"` |

Also exported: `D3` = array of 5 "normal" elemental zones `[bonfire, forest, shipwreck, shiverchill, skywatch]`; `s0` = all 10 core quest zones (Regular + Hard). `isCoreZone(zoneId)` checks if the zone ID is in `s0`.

## WorldManager Class (`cc`)

Module 7612, lines 251206–251493 (within the large module 238249–251493).

### Key Properties

| Property | Type | Notes |
|----------|------|-------|
| `zones` | `Record<string, Zone>` | All zone objects indexed by zone ID string |
| `_currentMap` | `string` | Current map tag e.g. `"forest-C8"` |
| `_previousMap` | `string` | Previous map tag |
| `mapChanged` | `Signal` | Dispatched after each teleport |
| `pippetEncounterDaily` | any | Daily pippet encounter data |
| `pippetEncounterSpawn` | any | Pippet spawn state |

### Key Methods

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `it` | 251383 | `(mapKey, x?, y?, data?, opts?)` | **Main teleport function** — the core way to move the player to any map |
| `teleportToCurrentMap` | 251413 | `()` | Reload current map |
| `getCurrentZone` | 251438 | `() => string` | Returns zone ID part of current map (splits on `-`) |
| `getCurrentZoneObject` | 251441 | `() => Zone` | Returns Zone instance for current zone |
| `getCurrentMap` | 251423 | `() => string` | Returns full map key e.g. `"forest-C8"` |
| `getCurrentMapTag` | 251444 | `() => string` | Returns map tag part e.g. `"C8"` |
| `setCurrentMap` | 251426 | `(map: string)` | Sets `_currentMap` and `_previousMap` |
| `getZone` | 251451 | `(zoneId: string) => Zone` | Lookup zone by ID |
| `getZoneHub` | 251457 | `(zoneId: string) => string` | Returns hub map key for given zone |
| `goToZoneHub` | 251454 | `(zoneId: string)` | Teleports to zone hub |
| `inZoneHub` | 251475 | `() => bool` | True if player is on the hub map |
| `inDeprecatedZone` | 251478 | `() => bool` | True if current zone is deprecated |
| `isValidLocation` | 251379 | `(map: string) => bool` | Checks if map exists |
| `isZoneSinglePlayer` | 251435 | `(zoneId: string) => bool` | True for e.g. TowerTown |
| `getCurrentCurrency` | 251447 | `() => string?` | Returns currency type for current zone |
| `playScene` | 251416 | `(sceneKey: string)` | Plays a cutscene by `{zone}-{scene}` key |
| `enter` | 251247 | `() => Promise` | Called on world entry, wires multiplayer |

### Static Constants

| Constant | Value |
|----------|-------|
| `cc.DEFAULT_ZONE` | `"forest-C8"` |
| `cc.TUTORIAL_MAP` | `"house-exterior"` |
| `cc.TUTORIAL_MAP_STARTING_POSITION` | `{x: 685, y: 385}` |
| `cc.DEPRECATED_ZONES` | `["activity_zone", "toyzone", "elemental_guardian", "earthtower", "icetower", "crystal_caverns"]` |
| `cc.SINGLE_PLAYER_ZONES` | `["tower_town"]` |

## Zone Base Class (`et`)

Module 87820, lines 251494–252027.

### Constructor Properties (set per zone subclass)

| Property | Type | Notes |
|----------|------|-------|
| `ID` | `string` | Zone ID string (e.g. `"forest"`) |
| `states` | `string[]` | Named state keys for this zone (mapped to player state) |
| `maps` | `Record<string, MapData>` | All maps in this zone |
| `quests` | `Record<number, Quest>` | Numbered quest objects |
| `scenes` | `Record<string, SceneData>` | Cutscene data |
| `monsters` | any | Encounter pool |
| `bgmID` | `number` | Background music ID (default: 3) |
| `battleBG` | `string` | Battle background asset key |
| `difficultyMode` | `DifficultyMode` | `Regular` / `Hard` / `Expert` |
| `difficultyModeAgnostic` | `boolean` | If true, skips difficulty checks |
| `questHub` | `string` | Hub map key (e.g. `"forest-C8"`) |
| `defaultOnFaint` | `string` | Map to respawn on faint |
| `zoneIndex` | `number` | Index used in WorldMap UI |
| `questManagerIdentifier` | `string` | DI service ID for this zone's QuestManager |
| `currency` | `string?` | Currency type (if zone has special currency) |

### Key Methods

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `teleport` | 251562 | `(mapTag, x?, y?, data?, ld?)` | Internal teleport into this zone's map |
| `teleportPrefabScene` | 251631 | `(mapTag, x?, y?, opts?)` | Teleport to a prefab-based map |
| `setup` | 251667 | `(game, screen, data)` | Called before map loads, wires quest |
| `start` | 251673 | `(game, screen, data)` | Called when map starts |
| `update` | 251677 | `(game, screen, data)` | Per-frame update |
| `cleanup` | 251681 | `()` | Destroys zone resources when leaving |
| `process` | 251685 | `(...)` | Quest/daily state processing |
| `handleLeaving` | 251663 | `(leaveType, callback)` | Called before leaving zone |
| `getState` | 251713 | `(key: string\|number) => any` | Read persistent zone state from player data |
| `setState` | 251718 | `(key: string\|number, value)` | Write persistent zone state to player data |
| `getQuestState` | 251726 | `() => QuestState?` | Shortcut for `getState("quest")` |
| `getCurrentQuestID` | 251806 | `() => number` | Returns current quest ID (0 if none) |
| `getCurrentQuest` | 251704 | `() => Quest?` | Returns current quest object |
| `startQuest` | 251744 | `(questId, force?)` | Starts a quest |
| `completeQuest` | 251765 | `(questId) => bool` | Completes a quest, advances to next |
| `isQuestStarted` | 251754 | `(questId) => bool` | Checks if quest is active |
| `isQuestComplete` | 251758 | `(questId) => bool` | Checks all quest conditions |
| `isQuestProcessed` | 251794 | `(questId) => bool` | True if quest was processed |
| `testQuest` | 251857 | `(questId, start?, seq?)` | Debug: jump to quest state |
| `defeatMonster` | 251816 | `(monsterId, pos, unique, ...)` | Records monster defeat |
| `isUniqueEncounterDefeated` | 251821 | `(idx) => bool` | Checks unique encounter state |
| `getBattle` | 251907 | `(screen, intro, mods, cb)` | Returns battle start binding |
| `getBattleMods` | 251916 | `() => null` | Override to add battle modifiers |
| `getMap` | 251553 | `(tag) => MapData` | Returns map by tag key |
| `getScene` | 251556 | `(tag) => SceneData` | Returns scene by key |
| `initScene` | 251656 | `(sceneData, zone)` | Launches a cutscene via TileScreen |
| `isTutorialZone` | 251615 | `() => bool` | True for ACADEMY or HOUSE |
| `hasFoundKeystone` | — | via `isKeystonePlaced` getter | Checks if keystone is placed |
| `spawnPetsInZoneButton` | 251926 | `()` | Spawns the Pets in Zone UI button |

### State Storage Pattern

Zone state is stored in player state under keys like:
- `zone-{zoneId}-{stateIndex}` for named states (numeric index into `states[]`)
- `zone-{zoneId}-quest` for quest state
- `zone-{zoneId}-quest-proc` for processed flag
- `zone-{zoneId}-uniqueEncounters-{mapTag}-{encounterId}` for unique encounter tracking

### Static Properties

```js
et.ZONE_KEYSTONES = {
  forest: 3, shiverchill: 4, bonfire_spire: 11,
  shipwreck_shore: 17, skywatch: 10,
  // ... same IDs for Hard and Expert variants
}

et.ZONE_TOWERS = {
  forest: 1, shiverchill: 3, bonfire_spire: 5,
  shipwreck_shore: 6, skywatch: 4
}
```

## TileScreen Game State

Module 26022, lines 198663–199918. Class `Wt` (extends `Vt.c` which extends Phaser.State).

Access via `_.instance.game.state.get("TileScreen")`.

### Key Properties

| Property | Type | Notes |
|----------|------|-------|
| `zone` | `Zone` | Current zone object |
| `data` | `MapData` | Current map object |
| `zoneName` | `string` | Map key used for asset loading |
| `isMapScreen` | `boolean` | True if exploration (not a scene) |
| `walkEnabled` | `boolean` | Toggles player movement |
| `user` | `PlayerCharacter` | Player sprite/character |
| `path` | `Pathfinder` | Pathfinding system |
| `events` | array | Active NPCs / events on map |
| `isCutscenePlaying` | `boolean` | True during cutscenes |
| `questProgress` | `QuestProgressUI` | Quest HUD element |
| `popupsProcessed` | `boolean` | Whether zone popups were shown |
| `onStartComplete` | `Signal` | Fires when map start completes |

### Key Methods

| Method | Line | Purpose |
|--------|------|---------|
| `initMap` | 199464 | Sets zone + map data before screen loads |
| `initScene` | 199467 | Sets up a cutscene instead of a map |
| `create` | 199471 | Phaser create lifecycle |
| `screenSetup` | 199474 | Initializes tile rendering, quest, FX |
| `start` | 199495 | Phaser start — calls `startAsync` |
| `startAsync` | 199500 | Async start: handles popups, OTP, cutscenes |
| `process` | — | Calls `zone.process()` |
| `shutdown` | 199444 | Cleanup when leaving |

## WorldMap UI Controller (`jt`)

Module 76224, lines 222433–223400. Class `jt` (minified). The world map UI prefab controller.

### Key Static Methods

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `getZoneData` | 223288 | `(zoneId) => ZoneConfig?` | Finds zone config from `BUTTONS_CONFIG` |
| `getHighestAvailableZoneData` | 223291 | `(difficulty?) => ZoneConfig` | Returns highest unlocked zone config |
| `getZoneDataFromDungeon` | 223303 | `(dungeonZoneId) => ZoneConfig?` | Finds zone data by dungeon ID |
| `isZoneLocked` | 223309 | `(zoneId) => bool` | Checks if zone is locked for player |
| `isZoneLockedParams` | 223317 | `(config, reqs, ...)` | Lower-level lock check |
| `isZoneFeatureFlagLocked` | 223331 | `(config) => bool` | Checks feature flag |
| `goTo` | 223123 | `(mapKey, eventName?, ...)` | Full zone transition (with analytics) |
| `startZone` | 223134 | `(target: string)` | Calls `world.it()` or `prodigy.start()` |
| `setDifficultyMode` | 223373 | `(mode)` | Sets worldmap difficulty mode |
| `getDifficultyMode` | 223376 | `() => DifficultyMode` | Returns current worldmap difficulty |
| `enterDungeon` | 223120 | `(zoneData, eventName, ...)` | Navigate to dungeon hub |
| `generateZoneData` | 223078 | `(config) => summary` | Generates serializable zone summary |

### `BUTTONS_CONFIG`

Static array of `ZoneConfig` objects for every zone shown on the world map, in order. Each config has:
- `.zone` — zone ID string
- `.tag` — display tag (e.g. `"Shiverchill"`)
- `.difficultyMode` — `Regular`/`Hard`/`Expert`
- `.prefabIndex` — index in the world map prefab's icon containers
- `.requirementsID` — feature requirements ID for lock check
- `.questHub` — hub map key
- `.dungeon` — dungeon config (if applicable)
- `.nameKey` — localization key for zone name
- `.splashImage` — splash image asset
- `.isUnreleased` — boolean
- `.featureFlagLock` — feature flag name (if locked by flag)

Static difficulty mode: `jt.DIFFICULTY_MODE` — the currently selected map difficulty. Changing this calls `WorldMapDifficultyModeChanged` broadcast.

## CampaignReplay / Zone Utility Methods (module 2212)

Lines 81846–81951. Contains several `static` utility methods relevant to zones:

| Method | Line | Purpose |
|--------|------|---------|
| `isZoneMapDifficultyModeAgnostic` | 81945 | Returns `true` if zone ignores difficulty mode (e.g. Titan maps) |
| `canShowNarrativeIntro` | 81907 | Checks if narrative intro can play for given map |
| `getHighestUnlockedDifficulty` | 81927 | Returns `Regular`/`Hard`/`Expert` based on player achievements |
| `shouldShowWorldMapHardModeFtue` | 81912 | FTUE check for hard mode |

## Zone State Persistence Pattern

Zone state lives in **player server state** (accessed via `player.state`), NOT in the zone object itself. Zone objects are stateless — they read/write to `player.state` on demand.

```js
// Reading zone state (from mod code):
const playerState = _.instance.prodigy.gameContainer.get("3e5-dac1").player.state;

// Zone quest state:
playerState.get("zone-forest-quest");          // { ID, req, state, seq }

// Named zone state (e.g. chest1 is states[0]):
playerState.get("zone-forest-0");              // chest1 value

// Unique encounter tracking:
playerState.get("zone-forest-uniqueEncounters-C8-1");

// Keystone state:
playerState.get("keystones-forest");           // null / Placed
```

## Exposable Variables

- `_.instance.prodigy.world` — WorldManager instance (full zone control)
- `_.instance.prodigy.world.zones` — dictionary of all Zone objects
- `_.instance.prodigy.world.getCurrentZone()` — current zone ID string
- `_.instance.prodigy.world.getCurrentMap()` — current map key
- `_.instance.prodigy.world.getZone("forest")` — Zone object
- `_.instance.game.state.get("TileScreen").zone` — same zone via TileScreen
- `_.instance.game.state.get("TileScreen").walkEnabled` — toggle movement

## Hook Points

| Hook | Line | How to Use |
|------|------|-----------|
| `world.it(map, x, y)` | 251383 | Override to intercept all teleportation |
| `zone.teleport(tag, x, y, ...)` | 251562 | Override per-zone teleport |
| `Zone.prototype.getState` | 251713 | Override to fake zone state |
| `Zone.prototype.setState` | 251718 | Override to intercept state writes |
| `Zone.prototype.getQuestState` | 251726 | Override to fake quest state |
| `Zone.prototype.isQuestComplete` | 251758 | Override to force quest completion |
| `Zone.prototype.completeQuest` | 251765 | Override to hook quest completion |
| `TileScreen.prototype.start` | 199495 | Hook map load completion |
| `TileScreen.walkEnabled` | setter | `false` freezes the player |
| `WorldMap.isZoneLocked` | 223309 | Override to unlock all zones on world map |
| `WorldMap.isZoneLockedParams` | 223317 | Override to bypass lock params |

## Cross-References

- [[player-active-player]] — zone state is stored in `player.state`; `player.data.zone` holds current zone map key
- [[quests-quest-manager-system]] — each zone owns numbered quest objects; quest state stored in `zone-{id}-quest`
- [[core-bootstrap-di-container]] — `"e2e-9e38"` NetworkManager called on zone entry/exit
- [[battle-system]] — `zone.getBattle()` builds battle parameters; `zone.battleBG` sets background
- [[dungeons-system]] — dungeon zones (`DARKTOWER`, `ARCHIVES`, etc.) extend the Zone base
- [[pets-kennel-system]] — `"91b-7302"` (PetZoneService) provides `getPetsInZone()`; Zone base calls `spawnPetsInZoneButton()`
