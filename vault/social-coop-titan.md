---
domain: social
module_ids: ["8083", "13021"]
line_range: [192961, 197158]
service_ids: []
status: complete
last_updated: 2026-04-13T14:00:00.000Z
---

# Co-Op Titan Battle System

> Module `8083`, lines 192961–197158 (Co-Op battle initializer). Module `13021`, lines 232266–232280 (TitanPartyUtils helper).

## Overview

The Co-Op Titan mode allows multiple players to fight a Titan boss together in real-time via the multiplayer socket. Each player joins a socket "room", a team is assembled with real player data, and battle actions (attacks, question answers) are synchronized over the socket. The system is separate from standard 1v1 PvP duels.

## Access Pattern

```js
// Check if the local player is currently in a Titan co-op party:
const inParty = _.instance.prodigy.gameContainer.get("3e5-dac1").player.coOpTeamHandler?.IsOnTeam;

// Via TitanPartyUtils (module 13021):
// w.isInTitanParty() - checks player.coOpTeamHandler.IsOnTeam
```

## Key Classes & Functions

| Minified Name | Inferred Name | Line | Purpose |
|---------------|---------------|------|---------|
| `A` (module 13021) | `TitanPartyUtils` | 232272 | Static helpers for titan party state |
| `Qt` | `CoOpTeamInitializer` | 194592 | Creates co-op team player objects from player data |
| `Xt` | `CoOpBattleInstaller` (host) | 194631 | DI installer binding CoOpTeamInitializer + heartbeat timeout |
| `Yt` | `TeammateAttackListener` | ~194540 | Listens to socket for teammate attack messages |

## TitanPartyUtils Methods

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `isTitanMap(mapID)` | 232273 | `(string) => boolean` | Returns true if map ID ends with `-titan` |
| `isInTitanParty()` | 232276 | `() => boolean` | Returns `player.coOpTeamHandler.IsOnTeam` |

## CoOpTeamInitializer (`Qt`)

### `createCoOpTeam(localPlayer, teammates)`

1. Builds player slot for `localPlayer` (appearance, chargedLevel, userID, name, level, transform)
2. Adds `Vt` component to local player slot (marks as local)
3. For each `teammate` in `w[]`, builds additional player slots
4. Each player gets: `TeammateAttackListener` (listens for socket attack events), `Name`, `Level`, `Element` (always `Wizard`) DI bindings

### `createPlayer(data, factory?, teams?)`

Creates a game object via `PlayerFactory`, binds shared `DamageReceiver` and `Health` from the team's `DamageReceiver`, injects `BattleTeamMember` reference.

## Protobuf Messages for Co-Op (lines 1838–2820)

All defined in module `51151` (protobufjs — data-models domain):

| Proto | Fields | Purpose |
|-------|--------|---------|
| `CoOpTeamProto` | `teamMembers: CoOpTeamMemberProto[]` | Full team roster |
| `CoOpTeamMemberProto` | `userID`, `appearance`, `equipment`, `level`, etc. | Single member data |
| `CoOpTeamJoinSuccessProto` | `socketRoomID`, `team: CoOpTeamProto` | Sent on successful join |
| `CoOpTeamDisbandedProto` | — | Team was disbanded |
| `CoOpTeamJoinRequestProto` | — | Request to join a team |
| `CoOpTeamErrorProto` | — | Error response |
| `CoOpTeamReadyUpProto` | — | Player ready signal |
| `CoOpTeamMatchDetailsProto` | `teammates[]` | Match configuration |
| `StartCoOpTitanMatchProto` | `matchDetails: CoOpTeamMatchDetailsProto` | Start the titan match |
| `CoOpTitanHostReadyCheckProto` | — | Host checks if all ready |
| `CoOpTitanHostReadyResponseProto` | — | Response to ready check |
| `CoOpTitanPlayerAttackedProto` | `sourcePlayerID`, `spellID`, `damage`, `missed`, `titanHealth` | Attack event |
| `CoOpTitanTitanAttackedProto` | `targetPlayerID`, `damage`, `spellID`, `titanAttackID` | Titan attacks player |
| `CoOpTitanQuestionAnsweredProto` | `playerID`, `correct`, `questionID` | Question result sync |

## DI Bindings (Co-Op Battle Container)

| Key | Binding |
|-----|---------|
| `"CoOpTeamInitializer"` | `new CoOpTeamInitializer(Container)` |
| `"ClientHeartbeatDisconnectTime"` | from feature flag `coOpClientHeartbeatTimeout` (default: `GameConstants.CO_OP_TITAN.CLIENT_HEARTBEAT_TIMEOUT`) |
| `"CoOpTeammateData"` | `initializationData.teammates` |
| `"AfterBattleDestination"` | `initializationData.returnToMap` |
| `"TitanInfo"` | `new TitanInfo(titanNetworkID, titanAssetID)` |
| `"BattleActionQueue"` | `BattleActionQueue` (singleton) |
| `"CurrentCoOpTeam"` | bound via game object with `CoOpTeam` component |

## `createCoOpTeam` Battle Flow

```
joinMultiplayerServer("zone-login") 
  → CoOpTeamJoinSuccessProto received
  → build CoOpTeamMatchDetailsProto (with teammates list)
  → StartCoOpTitanMatchProto sent 
  → CoOpTitanHostReadyCheckProto exchanged
  → battle begins, synchronized via CoOpTitanPlayerAttackedProto etc.
```

## Hook Points

- `TitanPartyUtils.isInTitanParty()` at line 232276 — override to fake "in party" state
- `TitanPartyUtils.isTitanMap(mapID)` at line 232273 — override to make any map a "titan map"
- `TeammateAttackListener.receivedMessage(msg)` at ~194585 — intercept to modify incoming attack damage/spell

## Cross-References

- [[social-multiplayer-socket]] — socket transport used for room joining and message passing
- [[data-models-protobuf]] — CoOp proto definitions are in protobuf module `51151`
- [[battle-system]] — Co-Op Titan is a special battle type using the battle DI container
- [[zones-world-manager]] — `isMultiplayerDisabled` flag gates zone multiplayer entry
