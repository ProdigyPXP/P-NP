---
domain: social
module_ids: ["52850"]
line_range: [102916, 103060]
service_ids: ["16b-0e3b", "3e5-dac1", "ab9-3b05"]
status: complete
last_updated: 2026-04-13T14:00:00.000Z
---

# DuelInviteUI (Static Controller)

> Module `52850`, lines 102916–103060. Not a service — static class `L` exported as `e`.

## Overview

Static utility class that orchestrates the full PvP duel invite flow from a UI perspective. Provides the high-level API for sending, accepting, rejecting invites and transitioning into a `SecureBattleRevamp` state. Called by other UI panels (friend list card, social menu, duels-stadium) and the `DuelInviteUpdate` component.

## Access Pattern

```js
// Access via the module export (no DI registration):
// Inside mods, typically via the game state or broadcaster
// The static class is accessible as the export "e" from module 52850

// Trigger a duel invite to a player object:
DuelInviteUI.invite(variantType, opponentPlayerObject, callbackFn);

// Get pending invites:
DuelInviteUI.getActiveInvites(); // same as gameContainer.get("16b-0e3b").getInvites()
```

## Key Classes & Functions

| Minified Name | Inferred Name | Line | Purpose |
|---------------|---------------|------|---------|
| `L` | `DuelInviteUI` | 102932 | Static controller for duel invite flow |

## Static Properties / Accessors

| Property | Line | Notes |
|----------|------|-------|
| `_duelInviteService` | 102933 | `gameContainer.get("16b-0e3b")` — lazy getter |
| `_localPlayer` | 102936 | `gameContainer.get("3e5-dac1").player` — lazy getter |

## Methods

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `invite(variant, opponent, callback?)` | 102939 | static async | Main entry: if opponent already invited us, accept; else reject all + send |
| `getActiveInvites()` | 102946 | `() => DuelInviteProto[]` | Delegates to invite service |
| `getPlayerFromInvite(invite)` | 102949 | `(invite) => PlayerObject` | Constructs a PlayerObject from a DuelInviteProto or legacy invite data |
| `acceptInvite(variant, invite, callback?)` | 102973 | static | Accepts invite, rejects others, fetches battle quest data, starts battle |
| `rejectInvite(invite)` | 102985 | static | Delegates to invite service |
| `rejectAllInvites()` | 102988 | static | Rejects every pending invite |
| `sendInvite(variant, opponent, callback?)` | 102991 | static async | Sends invite, waits for `onInviteSent`, then starts battle |
| `startBattle(variant, localP, opponent, roomId, callback?, questData?)` | 103007 | static | Pushes `SecureBattleRevamp` game state with PvP config |
| `onBattleEnd(game, prevState, target, result)` | 103040 | static | Returns to world or tower after duel ends |
| `getBattleTypeFromVariant(variant)` | — | static | Maps `VB.Standard`/`VB.DuelsStadium` to battle type |

## Duel Variant Types (`VB` enum from module `10670`)

| Value | Meaning |
|-------|---------|
| `VB.Standard` | Normal world-based PvP duel |
| `VB.DuelsStadium` | Duels-Stadium matchmaking |

## Battle Start Config

When `startBattle()` fires, it configures `SecureBattleRevamp` with:
```js
{
  battleType: BattleType.PvP,       // from variant
  hostUserId: string,
  guestUserId: string,
  roomId: string,                   // from DuelMatchmaking state or roomConfig
  activeQuestIDs: string[],
  questEventsToSend: QuestEvent[]
}
```
Background: `Battle_coliseum_outside_bg` / `Battle_coliseum_outside_fg`.

## Hook Points

- `startBattle()` at line 103007 — override to change battle config, background, or callbacks
- `invite()` at line 102939 — override to intercept all PvP invite initiations
- `acceptInvite()` at line 102973 — override to always accept or modify the room ID

## Cross-References

- [[social-duel-invite-service]] — service `16b-0e3b` — underlying invite state management
- [[battle-system]] — `SecureBattleRevamp` state is the destination
- [[social-social-menu]] — `xl` (DuelRequestsPanel) calls `DuelInviteUI.acceptInvite/rejectInvite`
