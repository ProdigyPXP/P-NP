---
domain: social
module_ids: ["97860", "3332"]
line_range: [43546, 44034]
service_ids: []
status: complete
last_updated: 2026-04-13T14:00:00.000Z
---

# Multiplayer Socket Client (SocketCluster Wrapper)

> Module `97860`, lines 43554–44033. No direct service ID — instantiated inside `CatalystSDKWrapper` and stored as `.multiplayer`.

## Overview

Wraps the SocketCluster client (`scriptcom`/`socketcluster-client`) for real-time multiplayer. Handles channel subscription, authentication, reconnect loops, broadcast message deduplication, and user-list/status streaming. This is the low-level transport layer that all co-op/PvP/zone-presence features build on.

## Access Pattern

```js
// The high-level wrapper is on the network manager:
const net = _.instance.prodigy.gameContainer.get("e2e-9e38");
// The raw Multiplayer object is at:
const mp = net._multiplayerService; // or via CatalystSDKWrapper
// DuelInviteService is registered under:
const invite = _.instance.prodigy.gameContainer.get("16b-0e3b");
```

## Key Classes & Functions

| Minified Name | Inferred Name | Line | Purpose |
|---------------|---------------|------|---------|
| `I` (class) | `Multiplayer` | 43563 | Main SocketCluster wrapper |

## Properties

| Property | Type | Default | Modding Notes |
|----------|------|---------|---------------|
| `_maxAuthRetries` | number | 5 | Max deauth retry count |
| `_authRetries` | number | 0 | Current retry count |
| `_wasDisconnected` | boolean | false | Set on disconnect event |
| `_moveOnAreaPerChannel` | boolean | false | Toggles per-channel area movement |
| `_clientID` | string | — | Player client/user ID |
| `_multiplayerURL` | string | — | WSS endpoint URL |
| `_client` | SocketCluster client | — | Raw SC client |
| `BroadcastActionType` | static string | `"broadcastAction"` | Type tag for broadcast messages |

## Methods

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `connect()` | 43584 | `() => void` | Initiates socket connection + deauth listener |
| `authenticate(token)` | 43588 | `(string) => Promise<void>` | Sends login invoke with JWT token |
| `subscribe(channelName, handler)` | 43603 | `(string, fn) => Promise<void>` | Subscribes to a channel, processes events + history |
| `unsubscribe(channelName)` | 43969 | `(string) => Promise<void>` | Closes + unsubscribes from channel |
| `moveOnArea(channelName, data)` | 43976 | `(string, obj) => Promise<void>` | Transmits player position on a zone channel |
| `addNotificationListener(handler)` | 43987 | `(fn) => Promise<void>` | Subscribes to personal notification channel |
| `addStatusListener(userIDs, handler)` | 43994 | `(string[], fn) => Promise<void>` | Subscribes to status channels for a list of users |
| `addClientBroadcastListener(handler)` | 44024 | `(fn) => Promise<void>` | Subscribes to client-wide broadcast channel |
| `getNotificationChannelName()` | 44014 | `() => string\|undefined` | Returns auth-token notification channel |
| `onDeauthenticated()` | 43894 | `() => Promise<void>` | Auto-reconnect loop on deauth (max 5 retries) |
| `onReconnect(handler)` | 43932 | `(fn) => Promise<void>` | Fires handler when reconnected after disconnect |
| `cleanupOldToken()` | 44022 | `() => void` | Removes SC auth token from localStorage |

## Hook Points

- `authenticate(token)` at line 43588 — override to log/intercept the JWT token used for multiplayer auth
- `onDeauthenticated()` at line 43894 — override to prevent auto-reconnect or inject custom auth
- `subscribe()` / `processSubscriptionEvents()` at lines 43603/43610 — intercept to sniff all channel messages

## Cross-References

- [[social-duel-invite-service]] — uses the notification channel for duel invite messages
- [[network-game-network-manager]] — `NetworkManager` (service `e2e-9e38`) owns the `Multiplayer` instance
- [[social-coop-titan]] — Co-op titan battles use socket rooms managed by this transport
