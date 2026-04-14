---
domain: social
module_ids: ["9439"]
line_range: [86489, 86603]
service_ids: ["336-324b"]
status: complete
last_updated: 2026-04-13T14:00:00.000Z
---

# QuickQuiz Multiplayer Match Controller

> Lines 86489–86603. Part of module `9439` (lines 88529–88708 region). Service `336-324b` = `QuickQuizManager`.

## Overview

The QuickQuiz multiplayer mode (`LootDash` battle type) uses a real-time match system where multiple players race through math questions. The `Q` class (MultiplayerQuickQuizMatchController) extends a base match controller to handle live opponent synchronization via the multiplayer socket (via `QuickQuizManager`). It can also fall back to AI bots when match count is low.

## Access Pattern

```js
// QuickQuizManager (manages the socket channel for quick quiz):
const qqManager = _.instance.prodigy.gameContainer.get("336-324b");
qqManager.onQuickQuizMessageReceived.add(handler, ctx);
qqManager._allMessages;   // history of all received messages this session
qqManager.currentQuickQuizId;
qqManager.currentAssignmentId;
qqManager.leaveQuickQuizChannel();
```

## Key Classes & Functions

| Minified Name | Inferred Name | Line | Purpose |
|---------------|---------------|------|---------|
| `Q` | `MultiplayerQuickQuizMatchController` | 86489 | Live multiplayer variant of QuickQuiz match |
| `q` (base) | `QuickQuizMatchController` | before 86489 | Base match controller (handles bots/home mode too) |
| `X` | `MatchControllerFactory` | 86604 | Maps match type enum to controller class |

## Match Types (enum `B1` from `N` module)

| Value | Controller | Matchmaking |
|-------|-----------|-------------|
| `B1.Home` | Bot-based home match | `gK.Bots` |
| `B1.QuickQuiz` | `Q` (Multiplayer) | `gK.Multiplayer` |

## Multiplayer Message Types (enum `H9` from module `K`)

| Value | Meaning |
|-------|---------|
| `H9.QuizEnded` | Host signals quiz is over → `beginForcedEndQuickQuiz()` |
| `H9.PlayerProgressUpdated` | Opponent advanced a question stage |

## Key Methods

| Method | Line | Purpose |
|--------|------|---------|
| `handleMultiplayerMessage(msg)` | 86500 | Routes `channelData`, `userList`, `playerJoined`, `broadcastAction` |
| `handleUserListMessage(list)` | 86531 | Processes initial user list as joined events |
| `handleCustomChannelDataMessage(data)` | 86534 | Updates `_channelData` for stage index lookups |
| `handlePlayerJoined(info)` | 86546 | Adds opponent with appearance; dispatches `onOpponentJoined` |
| `handleOpponentUpdate(data)` | 86577 | Queues or directly calls `advanceOpponent` based on player count |
| `advanceOpponent(data)` | 86580 | Sets opponent stage, fires `onOpponentAdvanced` after delay (10s) |
| `beginForcedEndQuickQuiz()` | 86526 | Ends loot dash when host signals `QuizEnded` |
| `completeMatch(won)` | 86591 | Marks assignment completed, leaves quiz channel |
| `cleanup()` | 86598 | Removes message listener, clears timeouts |
| `joinMatch()` | 86495 | Calls super, then immediately dispatches join/opponent events |

## Opponent Batching

When `numCurrentPlayers >= batchUpdatesAtPlayerCount`, opponent updates are batched and processed via `window.setInterval` (interval = `config.matchboard.batchUpdatesAtPlayerCount`).

## Bot Mode (Home Match)

When `B1.Home` is used, the controller generates N-1 bots with random appearances (`generateRandomAppearance()`). Bots advance at random intervals configured by `matchSetup.minimumMatchSearchTimeMs`/`maximumMatchSearchTimeMs`.

## Opponent Appearance Data Shape

```js
{
  playerId: number,
  currentStageIndex: number,
  appearanceData: {
    face, hair: { color, style }, hat, skin, eyeColor, outfit, weapon, boot
  }
}
```

## Hook Points

- `handleMultiplayerMessage(msg)` at line 86500 — intercept to modify opponent data or suppress events
- `advanceOpponent(data)` at line 86580 — override to freeze/manipulate opponent positions
- `handlePlayerJoined(info)` at line 86546 — override to inject fake opponent appearances

## Cross-References

- [[social-multiplayer-socket]] — socket transport for message delivery
- [[education]] — question answering feeds into `onQuestionAnswered` which updates match data
- [[battle-system]] — LootDash (`R.gu.LootDash`) is a battle type in the battle state
