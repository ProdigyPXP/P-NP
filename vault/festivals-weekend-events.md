---
domain: festivals
module_ids: [94393, 53037, 51540, 71698, 46902, 57797, 88022]
line_range: [62176, 98793]
service_ids: ["1b9-7c6a", "86a-826a", "c0e-cbd7"]
status: complete
last_updated: "2026-04-13T15:30:00.000Z"
---

# Festivals & Weekend Events System

> Core service: module `94393`, lines 80842–81030. Service ID: `"1b9-7c6a"` (WeekendEvents).
> Festival quest management: module `53037`, lines 98259–98793. Service ID: `"86a-826a"` (FestivalQuestManager).
> Festival network handler: module `51540`, lines 84805–84867. Service ID: `"c0e-cbd7"`.

## Overview

The festivals system manages time-limited seasonal events (Springfest, Summerfest, Pumpkinfest, Winterfest, Starlight, Moonlight, Generic). The `WeekendEvents` service (`1b9-7c6a`) fetches event windows from CloudScript, tracks the active festival, caches festival config data, and provides multiplier queries. The `FestivalQuestManager` (`86a-826a`) handles per-festival quest/task trees, claim states, reward dispatch, and Segment analytics. Player daily state persists festival progress in `player.daily` (the `Vt` class at line 73097).

## Access Pattern

```js
// Access the active festival service:
const weekendEvents = _.instance.prodigy.gameContainer.get("1b9-7c6a");

// Check if a festival is active:
const festival = weekendEvents.getActiveFestival();
// returns { type: number, startDate, endDate, aboutScreen, entityId } | undefined

// Get the active festival's name (e.g. "springfest"):
const name = weekendEvents.getActiveFestivalName();

// Get the full festival config (reward wheel data, banner colors, etc.):
const config = weekendEvents.getFestivalConfig();

// Get bonus multiplier for a zone and event type:
const xpMult = weekendEvents.getMultiplier(zoneID, "Xp");
const curMult = weekendEvents.getMultiplier(zoneID, "Currency");
const titanMult = weekendEvents.getTitanShardMultiplier();

// Access the festival quest manager:
const questMgr = _.instance.prodigy.gameContainer.get("86a-826a");
const questData = questMgr.getCachedFestivalQuestData(); // synchronous, may be null

// Player daily festival state (via active player):
const daily = _.instance.prodigy.gameContainer.get("f4b-0454").daily;
daily.festivalType;           // current festival type string
daily.isFestivalDailyBattle; // boolean
daily.viewedProgressMenu;     // boolean
daily.currentWheelID;         // number
daily.getFestivalInstanceName(); // e.g. "springfest-2026"
```

## Key Classes & Functions

| Minified Name | Inferred Name | Line | Purpose |
|---------------|---------------|------|---------|
| `K` (module 94393) | `WeekendEvents` | 80872 | Main seasonal event service |
| `it` (module 53037) | `FestivalQuestManager` | 98386 | Festival quest/task/reward manager |
| `F` (module 53037) | `FestivalQuestData` | 98279 | Per-festival quest snapshot object |
| `O` (module 51540) | `FestivalNetworkHandler` | 84813 | CloudScript API wrapper for festivals |
| `Vt` (module 96535 area) | `PlayerDailyState` | 73097 | Player daily data incl. festival tracking |
| `kb` | `OpenFestivalMenu` prefab component | 127209 | Opens festival store/progress/about menus |
| `Fb` | `FestivalListener` prefab component | 127356 | Dispatches `onFestivalActive`/`onFestivalInactive` signals |
| `Ub` | `SetFestivalHudIcon` prefab component | 127329 | Sets festival icon in HUD |

## WeekendEvents (`1b9-7c6a`) — Module 94393, lines 80842–81030

### Properties

| Property | Type | Notes |
|----------|------|-------|
| `_festivalConfigs` | `FestivalConfig[]` | Array of all festival config objects fetched from server |
| `_activeFestival` | `{type, startDate, endDate, aboutScreen, entityId}` \| `undefined` | Currently active festival |
| `_eventMap` | `Record<string, Event[]>` | Event data grouped by type (Xp, Currency, TitanShard, etc.) |
| `lastFetchTime` | `number` | Timestamp of last data refresh; refetched every 30 minutes |
| `ELEMENTAL_ZONES` | `ZoneID[]` | [BONFIRE, FOREST, SHIPWRECK, SHIVERCHILL, SKYWATCH] |
| `INSTANCE_ZONES` | `ZoneID[]` | [ARCHIVES, ASTRALTOWER, CRYSTALCAVERNS, DARKTOWER, EARTHTOWER, FIRETOWER, ICETOWER, LAMPLIGHT, STORMTOWER, WATERTOWER] |
| `FESTIVALS` (static) | `string[]` | `[Springfest, Summerfest, Pumpkinfest, Winterfest, Starlight, Moonlight, Generic]` |

### Methods

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `awaitLoad()` | 80876 | `() => Promise<this>` | Lazy-load event data (30 min cache) |
| `fetchData()` | 80881 | `() => Promise<void>` | Fetches event windows + festival config from server |
| `getActiveFestival()` | 80978 | `() => ActiveFestival \| undefined` | Returns active festival object |
| `getActiveFestivalName()` | 80910 | `() => string` | Returns lowercase festival name or `""` |
| `getFestivalConfig()` | 80915 | `() => FestivalConfig \| undefined` | Returns config data for active festival |
| `handleFestivalProgressPopup()` | 80921 | `(onClose?, opts?) => PrefabMenu` | Opens FestivalProgressMenu popup |
| `getEvents(type)` | 80981 | `(type: EventType) => Event[]` | Get all events for a given bonus type |
| `getMultiplier(zoneID, type)` | 80985 | `(zone, type) => number` | Bonus multiplier for zone+type (returns 1 if none) |
| `getTitanShardMultiplier()` | 80974 | `() => number` | Titan Shard bonus multiplier (returns 1 if none) |
| `isMultiZone(zone)` | 80962 | `(zone) => boolean` | True if zone is Global/AllZones/AllInstances |
| `getZoneDisplayName(zone)` | 80965 | `(zone) => string` | Localized display name for a zone ID |
| `getRandomZoneID(scope)` | 80969 | `(scope) => ZoneID` | Random zone from elemental/instance/combined pool |
| `getFestivalIcon()` | 81008 | `() => string` | Asset key for active festival's HUD icon |
| `getEventDataRequest()` | 80992 | `() => Promise<{weeks}>` | Network call: getCurrentEventsData |
| `getFestivalConfigRequest()` | 81000 | `() => Promise<{festivals}>` | Network call: getFestivalConfigData |

### Festival Type Enum (`R` export of module 94393)

```js
// EventType enum values:
"Xp", "Currency", "TitanShard",
"Springfest", "Summerfest", "Pumpkinfest",
"Winterfest", "Starlight", "Moonlight", "Generic"
```

### Festival Type Index Enum (module 46902, line 63135)

```js
// FestivalType enum (numeric index = position in FESTIVALS array)
// Springfest=0, Summerfest=1, Pumpkinfest=2, Winterfest=3,
// StarlightFestival=4, MoonlightFestival=5, GenericFestival=6
```

### Festival Store IDs (line 127240)

| Festival | Store ID |
|----------|----------|
| Springfest | 24 |
| Summerfest | 37 |
| Pumpkinfest | 14 |
| Winterfest | 15 |
| StarlightFestival | 13 |
| MoonlightFestival | 71 |
| GenericFestival | 70 |

## FestivalNetworkHandler (`c0e-cbd7`) — Module 51540, lines 84805–84867

Extends a base CloudScript network handler. All methods are async:

| Method | Line | CloudScript Route | Purpose |
|--------|------|-------------------|---------|
| `completePastFestivals()` | 84814 | `weekendEvents.completePastFestivals` | Server-side cleanup of old festival currencies |
| `getCurrentEventsData()` | 84824 | `weekendEvents.getCurrentEventsData` | Fetch current active event windows |
| `getFestivalConfigData()` | 84829 | `weekendEvents.getFestivalConfigData` | Fetch festival config (prize wheels, banners, etc.) |
| `getChestData()` | 84834 | `festival.getChestData` | Fetch daily chest state |
| `setChestDate(ms)` | 84839 | `festival.setChestDate` | Update last chest open timestamp |
| `setChestSpins(n)` | 84846 | `festival.setChestSpins` | Set remaining chest spins |
| `getSeenCompletedTaskData()` | 84853 | `festival.getSeenCompletedTaskData` | Fetch which completed tasks player has seen |
| `setCompletedTasksSeen(questId, taskIds)` | 84858 | `festival.setCompletedTasksSeen` | Mark tasks as seen |

## FestivalQuestManager (`86a-826a`) — Module 53037, lines 98386–98793

Extends `BaseQuestManager` (module 78698). Tagged with `EQuestTag.Festival`.

### Key Properties

| Property | Type | Notes |
|----------|------|-------|
| `_currentFestivalQuests` | `FestivalQuestData \| null \| undefined` | `undefined` = not loaded yet, `null` = no active festival |
| `_latestDataVersion` | `number` | Monotonic version counter for cache invalidation |
| `onDataChanged` | `Signal` | Fires when quest data refreshes |
| `FESTIVAL_ROOT_TASK_ID` (static) | `"root"` | Root task ID |
| `FESTIVAL_CLAIM_STRING` (static) | `"claim"` | Suffix for claim task IDs |

### Key Methods

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `setup()` | 98390 | `() => Promise<void>` | Init: load quest data, set up event listeners |
| `getCurrentFestivalQuestData()` | 98418 | `() => Promise<FestivalQuestData \| null>` | Async, waits for latest version |
| `getCachedFestivalQuestData()` | 98427 | `() => FestivalQuestData \| null \| undefined` | Sync, may be stale |
| `updateFestivalQuestData()` | 98450 | `() => Promise<void>` | Rebuild quest snapshot from server |
| `completePastFestivals()` | 98430 | `() => void` | Trigger server-side past festival cleanup |
| `getAllProgressTaskCounts()` | 80941 (usage) | `() => Record<EQuestTabType, number>` | Count unclaimed tasks per tab (Story/Coop/Season/Rifts/Member) |

## FestivalQuestData — Module 53037, lines 98279–98370

Snapshot of the current festival quest state. Constructor takes `{questId, metadata, allTasks, states, videos, seenCompletedTasks, dataVersion}`.

### Key Methods

| Method | Line | Purpose |
|--------|------|---------|
| `parseTaskData(tasks)` | 98283 | Async: processes tasks into progress/claim buckets |
| `getQuestID()` | 98301 | Returns festival quest entity ID |
| `getTasks()` | 98304 | All tasks |
| `getProgressTasks()` | 98310 | Filterable progress tasks |
| `getClaimTasks()` | 98313 | Claim tasks (pattern: `{goalTaskId}-claim`) |
| `hasMadeQuestProgress()` | 98316 | True if any task is complete or has progress > 0 |
| `getUnclaimedQuestCount(type?, includingExpired?)` | 98325 | Returns `{unclaimedQuestCount, unclaimedMemberCount, unclaimedNonMemberCount, unseenQuestCount, unseenMemberCount, unseenNonMemberCount}` |
| `getStartDate()` | 98292 | `() => number` (ms timestamp) |
| `getEndDate()` | 98295 | `() => number` (ms timestamp) |
| `getVideoAsset(videoType)` | 98350 | Returns video asset data for portal popup |
| `updateSeenCompletedTasks(festivalId, taskIds)` | 98355 | Updates local seen-tasks state |

## Player Daily Festival State — Module 96535, class `Vt`, lines 73097–73223

Stored in `player.daily` (via `ActivePlayer`). Contains all per-day festival tracking:

### Properties

| Property | Type | Modding Notes |
|----------|------|---------------|
| `_festivalType` | `string` | Current festival type string |
| `_festivalProgress` | `{instanceID, viewedProgressMenu}` | Instance tracking |
| `_dailyBattleLimit` | `number` | Max daily festival battles |
| `_dailyBattleCount` | `number` | Battles played today |
| `_isDailyBattleComplete` | `Map` | Completion flag per battle type |
| `_isFestivalDailyBattle` | `boolean` | Whether current battle is a festival daily |
| `_currentWheelID` | `number` | Current prize wheel ID; setter triggers `isNewFestivalWheel = true` |
| `isNewFestivalWheel` | `boolean` | Flag for new wheel detection |
| `viewedProgressMenu` | `boolean` | Whether player has seen the progress menu |

### Methods

| Method | Line | Purpose |
|--------|------|---------|
| `init(data)` | 73165 | Hydrate from save data |
| `reset()` | 73172 | Reset to defaults |
| `start(type, limit, placements, encounters, refreshHours)` | 73185 | Begin a new festival daily period |
| `playedBattle(battleType)` | 73188 | Increment battle count or set complete |
| `isExpired(type)` | 73191 | True if festival changed or refresh interval elapsed |
| `setFestival(instanceId)` | 73194 | Update tracked festival instance |
| `getFestivalInstanceName()` | 73200 | Returns `"{name}-{year}"` e.g. `"springfest-2026"` |
| `getData()` | 73206 | Serialize to save format |
| `getDataAndClear()` | 73220 | Serialize and clear dirty flag |

## Festival Feature Flag (module 71698, line 63097)

```js
// Feature flag key: "festivals"
// default: { enabled: true, startDates: {}, endDates: {}, variant: 0 }
// Access via: (0, $.G)(H.o) in WeekendEvents.fetchData
```

## Festival Asset GUIDs (module 88022, line 62176)

Key festival assets registered in the asset enum:
| Asset Key | Purpose |
|-----------|---------|
| `Event_moonlightfest_json` | Moonlight festival atlas |
| `Event_october_json` | October/Halloween atlas |
| `Event_pumpkinfest_json` | Pumpkinfest atlas |
| `Event_starlight_festival_json` | Starlight festival atlas |
| `Event_summerfest_json` | Summerfest atlas |
| `Event_winterfest_json` | Winterfest atlas |

## Task Tab Types (module 57797, line 63113)

```js
// EQuestTabType enum (used by getAllProgressTaskCounts):
Story = "Story", Season = "Season", Rifts = "Rifts",
Member = "Member", Coop = "Coop"

// EQuestGoalType:
GOAL = "goal", CLAIM = "claim", STORY = "story", COOP = "coop"

// EFestivalBattleType:
Normal = "normal", Boss = "boss"
```

## Exposable Variables

- `_.instance.prodigy.gameContainer.get("1b9-7c6a").getActiveFestival()` — active festival object (read)
- `_.instance.prodigy.gameContainer.get("1b9-7c6a")._activeFestival` — writable active festival field
- `_.instance.prodigy.gameContainer.get("1b9-7c6a")._eventMap` — bonus multiplier map (read/modify)
- `_.instance.prodigy.gameContainer.get("f4b-0454").daily._dailyBattleCount` — battles today (writable to reset limit)
- `_.instance.prodigy.gameContainer.get("f4b-0454").daily._dailyBattleLimit` — max battles (writable)
- `_.instance.prodigy.gameContainer.get("f4b-0454").daily._isDailyBattleComplete` — completion map (clear to re-enable)
- `_.instance.prodigy.gameContainer.get("86a-826a").getCachedFestivalQuestData()` — live quest snapshot

## Hook Points

- `WeekendEvents.getActiveFestival()` at line 80978 — override to return a fake festival object and unlock festival features
- `WeekendEvents.getMultiplier(zone, type)` at line 80985 — override to return arbitrary XP/currency multipliers
- `WeekendEvents.getTitanShardMultiplier()` at line 80974 — override to set titan shard bonus
- `PlayerDailyState.isExpired(type)` at line 73191 — override to return `false` to prevent daily reset
- `PlayerDailyState.isDailyBattleComplete(type)` at line 73119 — override to always return `false` to bypass battle limit
- `FestivalQuestManager.getCachedFestivalQuestData()` at line 98427 — override to inject fake completed tasks for reward bypass
- `WeekendEvents.getFestivalConfig()` at line 80915 — override to inject custom prize wheel config

## Cross-References

- [[player-active-player]] — `player.daily` holds `PlayerDailyState` with festival progress
- [[quests-quest-manager-system]] — `FestivalQuestManager` extends `BaseQuestManager`, registered via `QuestManagerHub`
- [[membership-service]] — Member-only tasks in `getUnclaimedQuestCount` (isMemberLocked tasks)
- [[network-game-network-manager]] — Network routes consumed by FestivalNetworkHandler
- [[battle-system]] — `daily.isFestivalDailyBattle` flag wired into battle flow
- [[ui-framework-open-system]] — `handleFestivalProgressPopup` uses `prodigy.open.prefabMenu`
