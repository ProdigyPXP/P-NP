---
domain: network
module_ids: [62459, 89839, 5668, 70330]
line_range: [26901, 39379]
service_ids: ["e80-ffcd", "6ac-4dfc", "e05-96db", "c59-add2"]
status: complete
last_updated: 2026-04-13T10:00:00.000Z
---

# HTTP Client, Socket Interface, and Channel Infrastructure

> Multiple modules. Primary: Module 62459 (lines 26901–39379), Module 89839 (lines 59631–59854), Module 70330 (lines 236352–236550), Module 5668 (lines 236587–236652).

## Overview

This group covers the low-level network transport layer:
- **`HttpClient`** (`Xa`, service `e80-ffcd`) — Fetch-based HTTP client with retry, interceptors, and default response handlers
- **`SocketInterface`** (`za`/`Ka`, service `6ac-4dfc`) — Thin Socket.IO wrapper used by APIClient for legacy WS connections (multiplayer room system, matchmaking)
- **`SynapseService`** (`B`, service `e05-96db`) — Catalyst-based pub/sub channel service for modern multiplayer (world/zone/feature channels)
- **`SocketService`** (`5668`) — Component-level socket wrapper used by co-op battles and room-based scenes

---

## HttpClient (service `e80-ffcd`, module 62459)

### Access Pattern

```js
const http = _.instance.prodigy.gameContainer.get("e80-ffcd");

// Build a request and send:
const req = new http.constructor.Request() // or use the builder pattern below
// In practice, the Request builder class is exported as u1k from module 62459
const request = (new A.u1k)
  .setBaseURI("https://api.prodigy.game/")
  .setMethod(A.iXQ.Get)
  .setTimeout(30000);
const response = await http.sendRequest(request);
response.wasSuccessful(); // true if 2xx and no error message
response.getData();       // parsed JSON data (if convertToJson interceptor was used)
response.getHeader("content-type");
```

### Classes (module 62459)

#### `Qa` — `HttpResponse`

| Method | Line | Purpose |
|--------|------|---------|
| `setHttpStatusCode(code)` | 36163 | |
| `getHttpStatusCode()` | 36166 | |
| `setHeader(name, value, override?)` | 36169 | |
| `getHeader(name)` | 36173 | Case-insensitive |
| `setBody(data)` | 36177 | Raw ArrayBuffer |
| `getBody()` | 36180 | |
| `setErrorMessage(msg)` | 36183 | |
| `getErrorMessage()` | 36186 | |
| `wasSuccessful()` | 36189 | `status >= 200 && <= 299 && errorMessage === null` |
| `setData(data)` | 36192 | Parsed data (set by convertToJson interceptor) |
| `getData()` | 36195 | |

#### `Xa` — `HttpClient` (injectable, `e80-ffcd`)

| Method | Line | Purpose |
|--------|------|---------|
| `setDefaultHeader(name, value)` | 36203 | Set header for all requests |
| `setBaseURI(uri)` | 36209 | Default base URI |
| `setDefaultResponseHandler(code, fn, ctx?)` | 36215 | Register handler for HTTP status code |
| `clearDefaultResponseHandler(code)` | 36222 | Remove handler |
| `sendRequest(request)` | 36226 | Main entry: runs interceptors → fetch |
| `sendFetchRequest(req, init, resolve, attempt?)` | 36252 | Internal: actual `fetch()` call with timeout |
| `retryRequest(req, init, resolve, attempt)` | 36285 | Retry with exponential backoff |

**Timeout behavior**: Uses `window.setTimeout` with `E.getTimeout()` (default 10,000ms in Request). On timeout, retries if retry count allows, else returns 408.

**Default response handler matching**: Checks exact status code, then wildcard (e.g. `4xx`).

#### `tr` — `HttpRequest` builder (exported as `u1k`)

| Method | Line | Purpose |
|--------|------|---------|
| `setBaseURI(uri)` | 36358 | |
| `setRequestURI(path)` | 36364 | Combined with baseURI |
| `setMethod(method)` | 36386 | GET/POST/PUT/PATCH/DELETE/HEAD |
| `setHeader(name, value)` | 36346 | Request header |
| `setQueryParameter(name, value)` | 36370 | URL query param |
| `setBody(body)` | — | Body object (JsonBody or form) |
| `setTimeout(ms)` | — | Override default 10s timeout |
| `addRequestInterceptor(fn, ctx?)` | 36392 | Pre-send hook |
| `addResponseInterceptor(fn, ctx?)` | — | Post-receive hook |
| `getFullURI()` | 36376 | Builds full URL with query params |
| `shouldIncludeCredentials()` | — | For cross-origin cookies |
| `setRetryCount(n)` | — | Number of retries |

**Retry defaults**: delay 1s, increment 2s, max delay 15s.

#### `Ya` — `HttpMethod` enum

```
Get = "GET", Post = "POST", Put = "PUT", Patch = "PATCH", Delete = "DELETE", Head = "HEAD"
```
(Exported as `iXQ` from module 62459)

#### `Za` — `JsonResponseInterceptor` (static)

```js
// Used as: request.addResponseInterceptor(A.XKG.convertToJson)
Za.convertToJson(response); // Parses ArrayBuffer → JSON, sets response.data
```

#### `Ja` — `JsonRequestBody` (exported as `_A9`)

```js
new Ja({ query: "...", variables: {} })
// getData() → JSON.stringify(jsonObject)
// getContentType() → "application/json"
```

---

## SocketInterface (service `6ac-4dfc`, module 62459)

Thin wrapper around Socket.IO that the `APIClient` uses for the **legacy multiplayer server** (room-based: joinZone/leaveZone, playerJoined/playerLeft events). Used for PvP matchmaking socket as well (separate instance, service `c59-add2`).

### Key Events (`qa` / `KZk` enum, line 36111)

| Event | Socket value |
|-------|-------------|
| `Connect` | `"connect"` |
| `Disconnect` | `"disconnect"` |
| `Reconnecting` | `"reconnecting"` |
| `Reconnect` | `"reconnect"` |
| `Message` | `"message"` |
| `PlayerJoined` | `"playerJoined"` |
| `PlayerLeft` | `"playerLeft"` |
| `PlayerList` | `"playerList"` |
| `ConnectError` | `"connect_error"` |
| `ConnectFailed` | `"connect_failed"` |
| `Error` | `"error"` |
| `ReconnectAttempt` | `"reconnect_attempt"` |
| `Matched` | `"matched"` |
| `WaitTimeExhausted` | `"waitTimeExhausted"` |

### Methods (`za`/`Ka` class, line 36114)

| Method | Line | Purpose |
|--------|------|---------|
| `connect(url, port?, opts?)` | 36118 | Creates Socket.IO connection |
| `disconnect()` | 36127 | Disconnects and nulls socket |
| `addListener(event, fn)` | 36130 | Adds socket/io event listener |
| `removeListener(event, fn)` | 36137 | Removes event listener |
| `emitEvent(event, data?)` | 36144 | `socket.emit(event, data)` |
| `setQuery(data)` | 36147 | Updates socket.io.opts.query |
| `isConnected()` | 36150 | Returns `socket.connected` |
| `get id` | 36115 | Socket ID |

IO_EVENTS (routed to `socket.io` not `socket`): Reconnect, ReconnectAttempt, ReconnectError, ReconnectFailed.

---

## SynapseService (service `e05-96db`, module 70330)

The modern multiplayer pub/sub layer. Backed by a **Catalyst SDK** multiplayer client. Used by `GameNetworkManager` for world/zone channel subscriptions (player positions, zone actions).

### Access Pattern

```js
const synapse = _.instance.prodigy.gameContainer.get("e05-96db");

synapse.isSubscribedToWorld(); // boolean
synapse.onNotificationReceived.add(handler, ctx); // notifications from all friends/party
synapse.onError.add(handler, ctx);

// Join a world channel:
await synapse.joinWorldChannel("Lamplight Town", onMessage, onError);

// Set social status:
await synapse.setUserStatus("available"); // or "unavailable"

// Get friends' online statuses:
const statuses = await synapse.getFriendsStatuses([123, 456, 789]);
```

### Channel Name Helpers (module `59287`, imported as `N.K`)

```js
N.K.getWorldChannelName(worldName)          // "{clientId}-{sanitized worldName}"
N.K.getZoneMapChannelName(world, zone)      // "{clientId}-{world}-{zone}"
N.K.sanitizeName(name)                      // lowercase + replace non-alnum with "-"
```

### Key Methods

| Method | Line | Purpose |
|--------|------|---------|
| `connect()` | 236376 | Lazy-connect Catalyst multiplayer, auth JWT, set listeners |
| `joinWorldChannel(name, onMsg, onErr, force?)` | 236409 | Subscribe to world channel |
| `leaveWorldChannel()` | 236461 | Unsubscribe from world channel |
| `createAndJoinWorldChannel(name, onMsg, onErr)` | 236428 | Create + join world via CloudScript |
| `joinLocationChannel(channel, onMsg, ...)` | 236390 | Subscribe to zone map channel |
| `leaveLocationChannel()` | 236401 | Unsubscribe from zone map channel |
| `createAndJoinZoneMapChannel(world, zone, ...)` | 236443 | Create + join zone map via CloudScript |
| `joinFeatureChannel(channel, onMsg, ...)` | 236469 | Subscribe to feature channel (co-op, etc.) |
| `leaveFeatureChannel(channel)` | 236484 | |
| `leaveAllFeatureChannels()` | 236490 | |
| `moveOnArea(target)` | 236495 | Send player movement on current zone channel |
| `setUserStatus(status)` | 236500 | CloudScript Social.SetStatus |
| `getFriendsStatuses(ids)` | 236511 | Throttled, max 100 IDs, interval 10s |
| `isSubscribedToWorld()` | 236537 | `_worldChannel !== null` |
| `destroy()` | 236540 | Dispose all signals |

**Signals:**
- `onError` — general error
- `onNotificationReceived` — notification from channel (co-op invites, friend joins, etc.)

**Error types** (`A` enum, line 236369):
- `DoesNotExist = "Channel does not exist"`
- `Full = "Channel is full"`

### Notification Message Format

When a notification arrives on the channel:
```js
{
  type: "notification",       // OR "playerJoined"
  notificationInfo: { action, data, target }
}
```
The action matches `M.m` (NotificationMessageType enum, module 17516):
- `RequestJoinTeam`, `JoinTeam`, `PlayerLeftTeam`, `StartCoOpTitanMatch`
- `QuestionAnswered`, `JoinTeamFailed`, `PlayerRejoinTeam`, `PlayerJoined`

---

## SocketService Component (module 5668, lines 236587–236652)

Used by scene/prefab components (especially co-op battle scenes). Injected via `@inject("f4b-0454")` for player ID, not a top-level DI service.

### Class: SocketService (module 5668, line 236608)

Extends a base component class. Provides per-room message dispatching used inside battle/titan scenes.

| Signal | Purpose |
|--------|---------|
| `onConnect` | Room connected |
| `onMessage` | Inbound message dispatched to scene states |
| `onPlayerJoined` | Player joined the room |
| `onPlayerDisconnect` | Player left the room |

The room ID comes from `this._multiplayerRoomID`.

---

## Raw WebSocket Client (module 89839, lines 59631–59854)

Low-level `AGClientSocket` class (`D`) — this is the raw SocketCluster/Asyngular client used underneath the Catalyst multiplayer SDK. It is **not** directly used by game code; it's used internally by the Catalyst SDK.

Key behaviors:
- Handshake via `#handshake` event with auth token
- Ping-pong keepalive (`#1` / `#2` protocol v1, empty strings for v2)
- LZString compression is handled at `GameNetworkManager` level (not here)
- Connect timeout: configurable via `connectTimeout` option
- Ping timeout: configurable, closes socket with code 4000

---

## Exposable Variables

```js
// HTTP client - useful for making authenticated requests:
const http = _.instance.prodigy.gameContainer.get("e80-ffcd");
// Intercept all 403s:
http.setDefaultResponseHandler(403, () => { /* don't logout */ });
http.clearDefaultResponseHandler(403);

// Synapse service - subscribe to all zone messages:
const synapse = _.instance.prodigy.gameContainer.get("e05-96db");
synapse.onNotificationReceived.add((msg) => console.log(msg), null);
```

## Hook Points

- **`HttpClient.sendRequest(req)`** at line 36226 — intercept all outbound HTTP calls
- **`HttpClient.setDefaultResponseHandler(code, fn)`** at line 36215 — override any HTTP error handler
- **`SynapseService.onNotificationReceived`** — tap into all co-op/social notifications before they're processed
- **`SynapseService.moveOnArea(target)`** at line 236495 — intercept player movement messages

## Cross-References

- [[network-game-network-manager]] — `GameNetworkManager` uses `e80-ffcd` and `6ac-4dfc`
- [[social]] — Uses `e05-96db` for friend status updates
- [[battle-system]] — Co-op titan battles use `SocketService` component and `e05-96db` feature channels
- [[core-bootstrap-di-container]] — DI bindings for all these services
