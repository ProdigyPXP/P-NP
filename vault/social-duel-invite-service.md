---
domain: social
module_ids: ["81687"]
line_range: [154543, 154800]
service_ids: ["16b-0e3b", "b81-b032"]
status: complete
last_updated: 2026-04-13T14:00:00.000Z
---

# Duel Invite Service (MultiplayerSocketDuelingInviteService / SynapseDuelingInviteService)

> Module `81687`, lines 154543–154800. Service ID: `16b-0e3b`.

## Overview

Manages peer-to-peer PvP duel invite flow over the multiplayer socket. Sends, receives, accepts, rejects, and cancels duel invitations. Two concrete implementations exist: `MultiplayerSocketDuelingInviteService` (real-time via socket) and `SynapseDuelingInviteService` (extends the base, adds Synapse notification polling). Registered in the DI container as `16b-0e3b`.

## Access Pattern

```js
const duelInviteService = _.instance.prodigy.gameContainer.get("16b-0e3b");

// Check pending invites
const invites = duelInviteService.getInvites(); // DuelInviteProto[]

// Subscribe to events
duelInviteService.onInviteReceived.add((invite) => console.log("Got invite from", invite.userID));
duelInviteService.onInviteRemoved.add((invite) => {});
duelInviteService.onInviteCancelled.add((invite) => {});
duelInviteService.onInviteRejected.add((userID) => {});
duelInviteService.onInviteSent.add((invite) => {});
duelInviteService.onInviteFailed.add((errorType) => {});
```

## Key Classes & Functions

| Minified Name | Inferred Name | Line | Purpose |
|---------------|---------------|------|---------|
| `ke` | `MultiplayerSocketDuelingInviteService` | 154543 | Socket-based duel invite handling |
| `Be` | `SynapseDuelingInviteService` | 154699 | Extends `ke`, adds Synapse push notifications |
| `xe` | `BattleRoomService` | 154503 | CloudScript client to create/cancel duel rooms; service `b81-b032` |

## Properties

| Property | Type | Default | Modding Notes |
|----------|------|---------|---------------|
| `_invites` | `DuelInviteProto[]` | `[]` | Current pending incoming invites |
| `onInviteReceived` | Signal | — | Fired when a new invite arrives |
| `onInviteCancelled` | Signal | — | Fired when inviter cancels |
| `onInviteRejected` | Signal | — | Fired when invitee rejects |
| `onInviteSent` | Signal<DuelInviteProto> | — | Fired after send succeeds |
| `onInviteFailed` | Signal<ErrorType> | — | Fired if room creation fails |
| `onInviteRemoved` | Signal | — | Fired when invite is removed from list (accept/reject) |

## Methods

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `getInvites()` | 154553 | `() => DuelInviteProto[]` | Returns current pending invites |
| `sendInvite(opponent)` | 154556 | `(PlayerObject) => void` | Creates battle room then sends protobuf invite over socket |
| `rejectInvite(invite)` | 154627 | `(DuelInviteProto) => void` | Sends rejection and removes from list |
| `acceptInvite(invite)` | 154641 | `(DuelInviteProto) => void` | Removes from list, fires `onInviteRemoved` |
| `cancelInvite(userID)` | 154645 | `(number) => void` | Sends cancellation message to target |
| `processMessage(msg)` | 154656 | `(SocketMessage) => void` | Routes incoming socket messages to events |
| `sendDuelRequestAnsweredEvent(idx, invite, response)` | 154681 | — | Segment analytics for duel response |
| `destroy()` | 154550 | `() => void` | Disposes all signals |

## Socket Message Types (internal enum `Le`)

| Value | Key | Meaning |
|-------|-----|---------|
| `"duel_invite"` | `Le.Invite` | Incoming duel invite |
| `"duel_invite_rejection"` | `Le.InviteRejected` | Target rejected invite |
| `"duel_invite_cancelled"` | `Le.InviteCancelled` | Sender cancelled invite |

## `sendInvite` Data Flow

1. Calls `BattleRoomService.getRoomId(opponentUserID)` — CloudScript `Battle.Duel.CreateChannel`
2. Builds `DuelInviteProto` with player appearance, equipment, name, level, team, membership
3. Emits `{ action: "duel_invite", target: opponentUserID, data: <proto bytes> }` via multiplayer socket
4. Dispatches `onInviteSent` with the proto
5. On failure: dispatches `onInviteFailed` with `ServiceUnreachable`, `BattleRoomUnavailable`, or `Unknown`

## DI Dependencies (injected by DI decorators)

| Property | Service ID | Type |
|----------|-----------|------|
| `_multiplayerSocket` | `6ac-4dfc` | MatchmakingSocket |
| `_loggedInPlayer` | `3e5-dac1` | LoggedInPlayer |
| `_featureFlags` | `35d-3bd9` | FeatureFlagsProvider |
| `_battleService` | `b81-b032` | BattleRoomService |
| `_segment` | `fa8-1c91` | SegmentAnalytics |

## Exposable Variables

- `_.instance.prodigy.gameContainer.get("16b-0e3b").getInvites()` — array of pending DuelInviteProto objects
- `_.instance.prodigy.gameContainer.get("16b-0e3b")._invites` — direct array (writable — can inject fake invites)

## Hook Points

- `sendInvite(opponent)` at line 154556 — intercept to bypass room creation or inject custom invite data
- `processMessage(msg)` at line 154656 — intercept to spoof incoming invites
- `acceptInvite(invite)` at line 154641 — override to always accept or log
- `getInvites()` at line 154553 — override to return fake invites for testing UI

## Cross-References

- [[social-duel-invite-ui]] — `DuelInviteUI` static class that calls `get("16b-0e3b")`
- [[social-social-menu]] — `SocialMenu` subscribes to invite events for the battle-requests tab
- [[social-multiplayer-socket]] — underlying socket transport
- [[network-game-network-manager]] — service `e2e-9e38` — `canUseMultiplayer()` gated check
