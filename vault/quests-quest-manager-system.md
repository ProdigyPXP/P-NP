---
domain: quests
module_ids: [78698, 3001, 45918, 80434, 87761, 3606, 98938, 62886, 29891, 7408]
line_range: [64191, 99498]
service_ids: ["ab9-3b05", "b14-a6b7", "c90-6dce", "d16-ba07", "86a-826a", "0a9-669a", "8b8-ac14", "e53-774e"]
status: complete
last_updated: 2026-04-13T12:00:00.000Z
---

# Quest Manager System

> Modules 78698, 3001, 45918, 80434, 87761, 3606, 98938, 62886, 29891, 7408. Lines 64191–99498. Central service: `QuestManagerHub` at `ab9-3b05`.

## Overview

The quest system is a server-side quest engine in which the client sends "quest events" and the server returns updated progress. All quest types — zone story quests, player goals (FTUE), battle pass, festivals, daily login calendar, dynamic store — share a common base class (`bt`, module 78698) that talks to a cloud-script network handler (`e53-774e`). A central `QuestManagerHub` (`L`, module 3001, service `ab9-3b05`) fans events out to all registered sub-managers and aggregates their responses. Breadcrumbs (module 7408, `C.O`) are a separate bitmask system that tracks one-time UI/tutorial milestones; they are stored on `player.state.data.breadcrumbs` and accessed via `_.instance.prodigy.breadcrumbManager`.

## Access Pattern

```js
// QuestManagerHub — all quest types:
const hub = _.instance.prodigy.gameContainer.get("ab9-3b05");

// Zone story quests (e.g. Firefly Forest):
const zoneQM = _.instance.prodigy.gameContainer.get("b14-a6b7");   // global ZoneQuestManager
const forestQM = _.instance.prodigy.gameContainer.get("a9e-dc91"); // FireflyForest local

// Player Goals (FTUE):
const goals = _.instance.prodigy.gameContainer.get("c90-6dce");

// Battle Pass:
const bp = _.instance.prodigy.gameContainer.get("d16-ba07");

// Festival:
const fest = _.instance.prodigy.gameContainer.get("86a-826a");

// Daily Login Calendar:
const dlc = _.instance.prodigy.gameContainer.get("0a9-669a");

// Dynamic Store:
const store = _.instance.prodigy.gameContainer.get("8b8-ac14");

// Breadcrumb Manager (FTUE milestones):
const bc = _.instance.prodigy.breadcrumbManager;
```

## Key Classes & Functions

| Minified Name | Inferred Name | Module | Lines | Purpose |
|---|---|---|---|---|
| `bt` | `BaseQuestManager` | 78698 | 96940–97288 | Abstract base for all quest managers — fetches data/progress from server, dispatches onComplete handlers, sends events |
| `L` | `QuestManagerHub` | 3001 | 99093–99227 | Aggregates all sub-managers; fans out events every 5 min (PLAY_MINUTES) and on question answered |
| `R` (mod 45918) | `ZoneQuestManager` | 45918 | 99324–99342 | Global zone quest manager — wraps base, shows error on fetch failure for non-tutorial players |
| `I` (mod 87761) | `LocalZoneQuestManager` | 87761 | 98804–98869 | Per-zone manager — sends events only when the player is in the matching zone; updates legacy quest tracker on zone object |
| `G` (mod 3606) | `PlayerGoalsQuestManager` | 3606 | 98896–99075 | FTUE player goals with paired goal/award tasks, surface filtering, anti-tutorial award gates |
| `N,x,L,k,B,U,F,G,j,$,H` | Zone-specific managers (Academy, Bonfire, BonfireHard, etc.) | 80434 | 99358–99496 | Thin subclasses of `LocalZoneQuestManager` — set `_zoneId`, `_tags`, `_difficultyMode` |
| `C.O` (mod 7408) | `BreadcrumbRegistry` + `BreadcrumbManager` | 7408 | 64971–65003 | One-time milestone tracking via bitmasks per feature, stored on player state |

## EQuestTag Enum (module 98938, line 64191)

| Tag Value | Meaning |
|---|---|
| `"battle-pass"` | BattlePass quest manager |
| `"daily-login-calendar"` | Daily login calendar |
| `"ultimates"` | Ultimates |
| `"zone-quests"` | Global zone quest manager |
| `"local-zone-quests"` | Per-zone local managers |
| `"ftue-player-goal-quests"` | Player Goals (FTUE) |
| `"dynamic-store"` | Dynamic Store |
| `"festival"` | Festival |
| `"state-challenge"` | State Challenge |
| `"firefly-forest"` | Firefly Forest zone |
| `"shiverchill"` | Shiverchill Mountains |
| `"bonfire-spire"` | Bonfire Spire |
| `"skywatch"` | Skywatch |
| `"shipwreck-shore"` | Shipwreck Shore |
| `"academy-endgame"` | Academy endgame |
| `"*-hard"` / `"*-expert"` variants | Hard/Expert mode per zone |

## Zone Quest Manager Injection Keys (module 80434, lines 99430–99496)

| Zone | Normal Service ID | Hard Service ID |
|---|---|---|
| Firefly Forest | `"a9e-dc91"` | `"2d7-2d0f"` |
| Shiverchill | `"722-6296"` | `"a52-9759"` |
| Bonfire Spire | `"585-efc5"` | `"432-1663"` |
| Shipwreck Shore | `"143-913d"` | `"3da-ab92"` |
| Skywatch | `"703-efc4"` | `"46a-5a7f"` |
| Academy (endgame) | `"744-2b2d"` | — |

Quest IDs follow the pattern `"quest-{tag}"`, e.g. `"quest-firefly-forest"`.

## EQuestEventType Enum (module 62886, line 64217) — Key Values

| Event | String Value | Typical Use |
|---|---|---|
| `NONE` | `"None"` | Initial poll / mark dirty |
| `WIN_ANY_BATTLE` | `"WinAnyBattle"` | Win any battle |
| `ANSWER_QUESTION_CORRECTLY` | `"AnswerQuestionCorrectly"` | Sent hub-wide on correct answer |
| `COLLECT_ITEM` | `"CollectItem"` | Item collected |
| `RESCUE_PET` | `"RescuePet"` | Pet rescued |
| `ENTER_MAP` | `"EnterMap"` | Zone entered |
| `SPEAK_WITH_NPC` | `"SpeakWithNPC"` | NPC dialogue |
| `DEFEAT_ENCOUNTER` | `"DefeatEncounter"` | Battle encounter defeated |
| `FSM_COMPLETE_SEQUENCE` | `"FsmCompleteSequence"` | FSM-gated story step |
| `QUEST_OBJECT_STATE_EVALUATED` | `"QuestObjectStateEvaluated"` | Object state step |
| `PLAY_MINUTES` | `"PlayMinutes"` | Sent every 5 minutes by hub |
| `START_QUEST` | `"StartQuest"` | Player goals on login |

## EOnCompleteHandlerType Enum (module 29891, line 64227) — Key Values

These are the `onComplete` handler types embedded in quest task definitions that execute client-side after a task completes:

| Type | String | Effect |
|---|---|---|
| `GOT_ITEM` | `"GotItem"` | Give item to player |
| `GOT_PET` | `"GotPet"` | Give pet to player |
| `PLAY_DIALOGUE` | `"PlayDialogue"` | Run NPC dialogue sequence |
| `TELEPORT_TO_MAP` | `"TeleportToMap"` | Warp player to map |
| `OFFER_TELEPORT` | `"OfferTeleport"` | Ask player before warping |
| `LOAD_PREFAB` | `"LoadPrefab"` | Load UI prefab by GUID |
| `SEND_QUEST_EVENT_VIA_HUB` | `"SendQuestEventViaHub"` | Trigger another quest event |
| `COMPLETE_TUTORIAL` | `"CompleteTutorial"` | Mark tutorial done, set state |
| `TRIGGER_STORE_OFFER` | `"TriggerStoreOffer"` | Queue a dynamic store offer |
| `BROADCAST` | `"Broadcast"` | Fire a game event |
| `GIVE_ULTIMATE` | `"GiveUltimate"` | Grant an ultimate |
| `ENABLE_INPUT` | `"EnableInput"` | Toggle game input |
| `REMOVE_UNSECURE_ITEM` | `"RemoveUnsecureItem"` | Remove item from backpack |
| `GIVE_BATTLE_PASS_XP` | `"GiveBattlePassXp"` | Grant XP to battle pass |

## Methods — BaseQuestManager (module 78698)

| Method | Lines | Signature | Purpose |
|---|---|---|---|
| `setup()` | 96944 | `() => Promise<void>` | Called on init; override to add setup logic |
| `fetchQuestData()` | 96959 | `() => Promise<{active: Map, inactive: Map}>` | Fetch quest definitions from server (cached) |
| `fetchQuestProgress()` | 97011 | `() => Promise<{active: Map, inactive: Map}>` | Fetch quest progress from server; also sends NONE event on first load |
| `getQuestProgress(questId)` | 96983 | `(string) => Promise<QuestProgress>` | Progress for one quest |
| `getTasksInProgress(tags?, questIds?, params?)` | 97108 | `(...) => Promise<QuestTask[]>` | All in-progress tasks matching filters |
| `sendQuestEvent(type, data, questIds?)` | 97149 | `(EventType, data, string[]?) => Promise<Response>` | Send event to server, process task completions |
| `processQuestProgressResponse(response)` | 97037 | `(Response) => Promise<void>` | Compare old vs new progress, fire `onQuestTaskComplete` / `onQuestTaskStart`, run `onComplete` handlers |
| `setupValidTasks(tags?, questIds?)` | 97243 | `(...) => Promise<void>` | Run `onSetupTasks` handlers for in-progress tasks |
| `sendQuestEventViaHub(type, data)` | 99121 | `(EventType, data) => Promise` | Hub-level: fans event out to all managers then calls server once |
| `getCurrentQuestID()` | 97268 | `() => string \| undefined` | Override per manager; base returns undefined |
| `cleanup()` | 97269 | `() => void` | Dispose event signals |

## Methods — QuestManagerHub (module 3001)

| Method | Lines | Purpose |
|---|---|---|
| `setup()` | 99107 | Register all sub-managers, start PLAY_MINUTES timer, subscribe to question answered events |
| `sendQuestEventViaHub(type, data)` | 99121 | Pre-filter across all managers → single network call → post-process all |
| `getBattleStartQuestData(battleType, subType)` | 99141 | Get quest IDs and event types relevant for battle start |
| `getCurrentQuestIDs()` | 99160 | Collect current quest IDs from all sub-managers |
| `getTasksInProgress(tags?)` | 99211 | Aggregate in-progress tasks from all sub-managers |
| `isCutsceneTaskInProgress()` | 99193 | True if any manager has a cutscene task in progress |
| `setupValidTasks()` | 99203 | Run setup handlers across all sub-managers |

## Properties

| Property | Type | Access | Notes |
|---|---|---|---|
| `bt._tags` | `string[]` | instance | EQuestTag values; used in network requests |
| `bt.onQuestTaskStart` | `Signal<QuestTask>` | instance | Dispatched when a task's prerequisites are satisfied |
| `bt.onQuestTaskComplete` | `Signal<QuestTask>` | instance | Dispatched when a task transitions to COMPLETE |
| `G._awardAvailable` | `boolean` | instance | Player Goals: true if any award task is claimable |
| `G._questComplete` | `boolean` | instance | Player Goals: true if goals quest is finished |
| `G.pairedTasks` | `PairedTask[]` | getter | Paired (goal + award) task pairs, max 4 surfaced |

## Player.data.questSystem (setQuestSystem / getQuestSystem)

The `questSystem` property on `player.data` (lines 74397–74407) is a key-value store of zone IDs → quest system version:

```js
player.data.questSystem["forest"] // → EQuestSystemVersion
// Values: "Legacy" | "Revised" | "RevisedWithPlayerGoals" | "PlayerGoalsFtue" | "PlayerGoalsPostFtue"
```

`setQuestSystem(zoneId, version)` at line 74397 writes to this. Used to migrate old players to the new quest system.

## Breadcrumb System (module 7408, lines 64971–65003)

The breadcrumb manager (`_.instance.prodigy.breadcrumbManager`) tracks one-time boolean milestones using 32-bit bitmasks per feature. Each feature is a string key (e.g. `"endgame-quest"`, `"battle-tutorial"`) with up to 32 named breadcrumbs indexed 0–31.

Key methods:
- `isBreadcrumbComplete(featureName, breadcrumbName)` → `boolean`
- `completeBreadcrumb(featureName, breadcrumbName)` → void (sets bit, persists to server)
- `resetBreadcrumb(featureName, breadcrumbName)` → void
- `resetBreadcrumbs(featureName)` → void (clear all bits for feature)

Notable features registered:
- `FEATURE_ENDGAME_QUEST` — 13 breadcrumbs for Puppet Master storyline
- `FEATURE_BATTLE_TUTORIAL` — 13 breadcrumbs for battle FTUE
- `FEATURE_CAMPAIGN_REPLAY` — 11 breadcrumbs for Hard/Expert mode FTUE
- `FEATURE_ACADEMY_TOWERS`, `FEATURE_ZONE_ENTRY_ILLUSTRATION`, `FEATURE_ZONE_UNLOCKED_POPUP` — zone unlock milestones

## Exposable Variables

- `_.instance.prodigy.gameContainer.get("ab9-3b05")` — QuestManagerHub, all quest types
- `_.instance.prodigy.gameContainer.get("b14-a6b7")` — Global ZoneQuestManager
- `_.instance.prodigy.gameContainer.get("c90-6dce")` — PlayerGoalsQuestManager (FTUE goals)
- `_.instance.prodigy.gameContainer.get("d16-ba07")` — BattlePassQuestManager
- `_.instance.prodigy.gameContainer.get("86a-826a")` — FestivalQuestManager
- `_.instance.prodigy.gameContainer.get("a9e-dc91")` — FireflyForest local manager
- `_.instance.prodigy.breadcrumbManager.isBreadcrumbComplete("endgame-quest", "BREADCRUMB_ENDGAME_QUEST_SAW_WORLD_MAP_DIALOGUE")` — check endgame quest step
- `_.instance.prodigy.gameContainer.get("3e5-dac1").player.data.questSystem` — quest system version map

## Hook Points

- `sendQuestEvent(type, data)` on any manager — override to intercept or fabricate quest event responses
- `processQuestProgressResponse(response)` — override to inject fake task completions; `onQuestTaskComplete` fires handlers that give items, teleport player, play dialogue
- `onQuestTaskComplete` signal — add listener to react when any task completes
- `onQuestTaskStart` signal — add listener to react when a task becomes active
- `isBreadcrumbComplete()` — patch to return `true` for any breadcrumb to unlock gated content
- `getTasksInProgress()` — return empty array to suppress quest UI
- `PlayerGoalsQuestManager.updateFlags()` at line 98953 — controls `_awardAvailable` and `_questComplete` flags; patch to unlock rewards

## Modding Notes

To force-complete a zone quest task (e.g. skip a cutscene task):
```js
const hub = _.instance.prodigy.gameContainer.get("ab9-3b05");
hub.sendQuestEventViaHub("FsmCompleteSequence", { sequenceId: "<task-id>" });
```

To check if player has completed tutorial (used extensively as gate):
```js
_.instance.prodigy.gameContainer.get("f4b-0454").hasCompletedTutorial();
```

To read raw quest progress for zone:
```js
const forest = _.instance.prodigy.gameContainer.get("a9e-dc91");
const progress = await forest.getQuestProgress("quest-firefly-forest");
console.log(progress.tasks); // array of {id, status, data}
```

## Cross-References

- [[player-active-player]] — `player.data.questSystem`, `player.state.data.breadcrumbs`, `setQuestSystem()`
- [[zones-world-manager]] — `zone.questHub`, `zone.getCurrentQuestID()`, `zone.allQuestsAreComplete`; LocalZoneQuestManager calls `getZoneObject()` to sync tracker
- [[core-bootstrap-di-container]] — `ab9-3b05` bound as `QuestManagerHub`; all sub-managers bound individually
- [[network-game-network-manager]] — quest network handler (`e53-774e`) makes cloudscript POST calls `quests.getQuestData`, `quests.getQuestProgress`, `quests.sendQuestEvent`
- [[education]] — `hub.onQuestionAnswered` wired to `education.onQuestionAnswered`; triggers `ANSWER_QUESTION_CORRECTLY` / `ANSWER_QUESTION_INCORRECTLY` hub events
- [[battle-system]] — `hub.getBattleStartQuestData()` wires battle outcomes to quest progress
