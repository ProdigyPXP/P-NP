---
domain: network
module_ids: [10312, 200]
line_range: [233670, 235384]
service_ids: ["e2e-9e38"]
status: complete
last_updated: 2026-04-13T10:00:00.000Z
---

# GameNetworkManager (service `e2e-9e38`)

> Module 10312 + 200, lines 233670–235384. Service ID: `e2e-9e38`

## Overview

The `GameNetworkManager` (`at`/`Z` class, exported as `at.I`) is the central network facade for Prodigy. It wraps an internal `APIClient` (`X` class) that handles raw HTTP and WebSocket calls, and delegates zone/world multiplayer to the `SynapseService` (`e05-96db`). It manages login, character fetch/save, socket zone membership, all social/friend/titan/feed API calls, matchmaking, and inactivity logout.

## Access Pattern

```js
// Get the service:
const nm = _.instance.prodigy.gameContainer.get("e2e-9e38");

// Example: force-save player and check login state
nm.loggedIn;           // boolean
nm.characterProcessed; // boolean
nm.saving;             // boolean (currently saving character)

// Emit a zone message:
nm.emitMessage({ action: "move", data: { target: { x: 10, y: 5 } } });

// Logout:
nm.logout(true); // true = redirect to launcher
```

## Key Classes & Functions

| Minified Name | Inferred Name | Line | Purpose |
|---------------|---------------|------|---------|
| `X` | `APIClient` | 233706 | Low-level HTTP + Socket.IO wrapper |
| `at` / `Z` | `GameNetworkManager` | 234405 | High-level game network facade (DI service) |

### APIClient (`X`) — lines 233706–234396

Internal class instantiated once inside `GameNetworkManager` as `this.api`. Not directly injectable — all calls go through the manager.

| Method | Line | Purpose |
|--------|------|---------|
| `request(method, url, data, ...)` | 233722 | Generic HTTP request via fetch |
| `joinMultiplayerServer(world, ...)` | 233788 | Connects Socket.IO to multiplayer server |
| `emitMessage(event, handlers)` | 233877 | Emits a socket event |
| `loginSDK()` | 233933 | Calls Catalyst authHandler.login(), sets JWT |
| `login(success, fail)` | 233955 | Public login wrapper |
| `getCharacter(success, fail)` | 233885 | Fetches character data via CloudScript |
| `updateCharacter(data, success, fail)` | 234000 | Saves character via CloudScript |
| `logout()` | 233995 | Disconnects socket, calls gameLoaderLogout |
| `sendGraphQLRequest(query, vars)` | 234388 | POST to `graphql/` with identity auth |
| `startMatchmaking(bucketId)` | 234194 | Connects to matchmaking Socket.IO server |
| `quitMatchmaking()` | 234280 | Disconnects matchmaking socket |
| `getWorldList(success, fail)` | 233880 | GET multiplayer world list |
| `attachStudentUsingClassCode(code, ...)` | 233964 | GraphQL mutation `JoinClassroom` |
| `getCurriculumAndGrade(player, subject)` | 234054 | GraphQL query for curriculum |
| `saveAnswer(data, success, fail, err)` | 234104 | POST to answer API |
| `getUserFeed(...)` | 234109 | GET social feed |
| `createUserFeed(...)` | 234120 | POST social feed entry |
| `getTitans(success, fail)` | 234167 | GET titan list |
| `getTitan(id, success, fail)` | 234174 | GET specific titan |
| `hitTitan(id, success, fail)` | 234181 | POST titan hit |
| `getFriendList(success, fail)` | 234283 | GET friends |
| `sendFriendRequest(id, ...)` | 234304 | POST friend request |
| `acceptFriendRequest(id, ...)` | 234314 | POST accept |
| `rejectFriendRequest(id, ...)` | 234319 | DELETE reject |
| `removeFriend(id, ...)` | 234324 | DELETE remove friend |
| `getGiftBoxes(...)` | 234329 | GET gift boxes |
| `getMatchmakingMaxRange()` | 234274 | Returns `3` (hardcoded) |
| `getMatchmakingMaxWait()` | 234278 | Returns `10` (hardcoded) |
| `static getDefaultSettings(urlProvider)` | 234363 | Builds API URL map |
| `static compressMessage(msg, schema)` | 233949 | LZString.compressToUTF16 compress |
| `static decompressMessage(msg, schema)` | 233969 | LZString.decompressFromUTF16 decompress |

**Default API URL map** (from `getDefaultSettings`):
| Key | URL Pattern |
|-----|-------------|
| `multiplayer` | `{apiRoot}/multiplayer-api/` |
| `friend` | `{apiRoot}/friend-api/` |
| `education` | `{loaderUrl}/education-api/` |
| `titan` | `{apiRoot}/titan-api/` |
| `gameFeed` | `{apiRoot}/game-feed-api/` |
| `gameAPI` | `{apiRoot}/game-api/` |
| `answer` | `{answerUrl}/` |
| `matchmaking` | `{matcherApiRoot}/` |
| `root` | `{loaderUrl}/game-api/` |

Socket.IO reconnect config: delay 10s, max delay 15s, max attempts 10.

---

### GameNetworkManager (`at`) — lines 234405–235379

Registered as `@injectable()` with DI constructor params:
- `@inject("83f-419b")` → game instance
- `@inject("6c6-02da")` → time manager
- `@inject("76f-ff9c")` → metrics manager (3rd param)
- `@inject("09c-7a49")` → network request counter

## Properties

| Property | Type | Default | Modding Notes |
|----------|------|---------|---------------|
| `loggedIn` | `boolean` | `false` | True after `processLoginSuccess()` |
| `characterProcessed` | `boolean` | `false` | True after character fetched. Gate for save loop. |
| `saving` | `boolean` | `false` | Currently running updateCharacter call |
| `socketConnected` | `boolean` | `true` | Socket connection state |
| `offlineTimer` | `number` | `-1` | Countdown to kick (-1 = not active) |
| `expiredToken` | `boolean` | `false` | Token expired state |
| `isActivityDialogOpen` | `boolean` | `false` | Inactivity popup open |
| `zone` | `object\|null` | `null` | Current zone object (has `onMessage`, `onPlayerList`, etc.) |
| `world` | `object\|null` | `null` | Current world object |
| `api` | `APIClient` | — | Internal low-level client |
| `onSocketMessage` | `Signal` | — | Dispatched for every incoming zone socket message |
| `onPlayerJoinedSignal` | `Signal` | — | Dispatched when another player joins zone |
| `onPlayerLeftSignal` | `Signal` | — | Dispatched when player leaves zone |
| `onPlayerListSignal` | `Signal` | — | Dispatched with full player list |
| `onSocketReconnect` | `Signal` | — | Dispatched on zone map socket reconnect |
| `onPlayerSaved` | `Signal` | — | Dispatched after successful character save |

**Static properties:**
- `at.MESSAGE_SCHEMAS.info` — Array of ~35 dot-path field names used for LZString compress/decompress of multiplayer messages
- `at.emitMessageCount` — Counter for all outbound socket messages

## Methods

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `login(...)` | 234830 | `(success, fail, ..., retries)` | Login with retry up to 3x |
| `getCharacter(...)` | 234841 | `(callback, player, success, fail)` | Fetch char with retry up to 5x |
| `logout(redirect?)` | 234852 | `(redirect: boolean)` | Full logout, clears tokens, disconnects |
| `updateCharacter()` | 234859 | `()` | Auto-save loop (called every 3s) |
| `joinMultiplayerServer(world, zone, ...)` | 234507 | `(world, zone, success, fail, fullErr)` | Joins Synapse world channel |
| `joinZone(zone)` | 234515 | `(zone)` | Subscribe to zone map channel |
| `leaveZone()` | 234521 | `()` | Unsubscribe from zone map channel |
| `emitMessage(event)` | 234547 | `(event: {action, data, target?})` | Route outbound socket message by action type |
| `onMessage(event, decompress?)` | 234609 | `(event, decompress)` | Receive + dispatch inbound socket message |
| `canUseMultiplayer()` | 234943 | `()` | `loggedIn && characterProcessed && socketConnected` |
| `getCharData(userID, fields)` | 234478 | Async | Fetch another player's char fields |
| `getWorldList(success, fail)` | 234488 | Async | Via MultiplayerMessageService |
| `attachClassCode(code, success, fail)` | 234532 | Async | GraphQL JoinClassroom mutation |
| `getFriendsList(success, fail)` | 234615 | Async | Wraps api.getFriendList (or test data) |
| `getTotalFriendRequests(success, fail)` | 234634 | Async | |
| `getFriendRequestList(...)` | 234648 | Async | |
| `sendFriendRequest(id, ...)` | 234660 | Async | |
| `cancelFriendRequest(id, ...)` | 234667 | Async | |
| `acceptFriendRequest(id, ...)` | 234674 | Async | |
| `rejectFriendRequest(id, ...)` | 234681 | Async | |
| `removeFriend(id, ...)` | 234688 | Async | |
| `getTitans(success, fail)` | 234695 | Async | |
| `getTitan(id, ...)` | 234702 | Async | |
| `hitTitan(id, ...)` | 234709 | Async | |
| `getTitanUserData(success, fail)` | 234716 | Async | |
| `getUserFeed(...)` | 234730 | Async | |
| `createUserFeed(...)` | 234723 | Async | |
| `likeUserFeed(...)` | 234737 | Async | |
| `shareUserFeed(...)` | 234744 | Async | |
| `deleteUserFeed(...)` | 234751 | Async | |
| `completeAssignment(id)` | 234758 | Sync | GraphQL completeAssignment mutation |
| `answerQuestion(data)` | 234763 | Async | POST to answer API |
| `updatePlanStudent(plan)` | 234774 | Sync | |
| `finishPlacement(data)` | 234783 | Async | GraphQL completePlacementTest |
| `setCurriculum(data, success, fail)` | 234788 | Async | |
| `setInitialGrades(data, success, fail)` | 234794 | Async | |
| `startMatchmaking(bucketId)` | 234499 | Async | Delegates to api.startMatchmaking |
| `quitMatchmaking()` | 234504 | Sync | Delegates to api.quitMatchmaking |
| `getClassCodes()` | 234810 | Async | GraphQL fetchAllClassCodes |
| `getCurrentClassCode()` | 234815 | Async | GraphQL fetchCurrentClassCode |
| `getCurriculumAndGrade(player, subject?)` | 234820 | Async | |
| `startInactiveTimer()` | 234907 | Sync | Shows inactivity dialog after N seconds |
| `stopInactiveTimer()` | 234910 | Sync | Cancels timer |
| `showTokenExpiredPopup()` | 234885 | Sync | Opens modal + triggers logout |
| `showInvalidCharacterPopup()` | 234894 | Sync | HTTP 418 handler |
| `refreshMultiplayer()` | 234526 | Sync | Emits "refresh" to socket |
| `generalErrorHandler(name, fail, code, msg)` | 234474 | Sync | Routes error by HTTP code (426 = version error) |
| `versionError()` | 235003 | Sync | Opens "out of date" dialog + logout |
| `processLoginSuccess(...)` | 234984 | Sync | Sets tokens, initializes subject/player |
| `processCharacterSuccess(...)` | 234992 | Sync | Merges char data, broadcasts PlayerInitialized |
| `processCharacterFailure(...)` | 234995 | Sync | Retry up to 5x |
| `processWorldMessage(E)` | 235015 | Sync | Handles "subscribed" world event |
| `processZoneLocationMessage(E)` | 235029 | Sync | Routes all zone socket action types |
| `handleNotificationMessages(E)` | 235309 | Sync | Routes notification-channel messages |
| `fetchStudentData(subject)` | 235359 | Async | GraphQL fetchStudentData |
| `get isCurrentlySaving` | 235376 | getter | Returns `this.saving` |

## emitMessage Action Types (from module 35564, line 235391)

The `et.x` enum (exported from module 35564):

| Action | Socket Value |
|--------|-------------|
| `Move` | `"move"` |
| `FX` | `"fx"` |
| `Chat` | `"chat"` |
| `Transform` | `"transform"` |
| `HostTeam` | `"create_co_op_team"` |
| `TeamDisbanded` | `"co_op_team_disbanded"` |
| `TeamUpdated` | `"co_op_team_updated"` |
| `HostHeartbeat` | `"co_op_host_heartbeat"` |
| `SyncHealth` | `"co_op_health_sync"` |
| `PlayerAttacked` | `"player_attacked"` |
| `TitanAttacked` | `"titan_attacked"` |
| `TitanDefeated` | `"titan_defeated"` |
| `PlayersDefeated` | `"players_defeated"` |
| `Change` | `"change"` |
| `Info` | `"info"` |
| `RequestJoinTeam` | `"request_co_op_team_join"` |
| `JoinTeam` | `"join_co_op_team"` |
| `PlayerLeftTeam` | `"co_op_player_left_team"` |
| `StartCoOpTitanMatch` | `"start_co_op_titan"` |
| `QuestionAnswered` | `"question_answered"` |
| `JoinTeamFailed` | `"join_co_op_team_failed"` |
| `PlayerRejoinTeam` | `"co_op_player_rejoin_team"` |
| `Catapult` | `"catapult"` |

## Character Save Loop

`updateCharacter()` is called every 3 seconds via `setInterval` from the constructor. Flow:
1. Guard: not saving, not expired, loggedIn, characterProcessed, player exists, session token valid
2. If offline timer expired → logout
3. Get `player.getUpdatedData()` — only saves if dirty
4. Validate JWT still valid → call `api.updateCharacter()`
5. On success: dispatch `onPlayerSaved`, reset `updateFailedTime`
6. On failure (409/503): start offline timer

## HTTP Default Response Handlers (set in constructor)

| Status | Handler |
|--------|---------|
| 418 | `showInvalidCharacterPopup()` — read-only character |
| 403 | `showTokenExpiredPopup()` — token expired |
| 412 | `onReadOnlyCharacter()` — read-only login |

## Exposable Variables

```js
const nm = _.instance.prodigy.gameContainer.get("e2e-9e38");

// State checks:
nm.loggedIn               // Is the player authenticated?
nm.characterProcessed     // Has character data been loaded?
nm.saving                 // Is a save in progress?
nm.canUseMultiplayer()    // All three above + socketConnected

// Internal API client (not recommended to call directly):
nm.api                    // APIClient instance

// Signals to intercept:
nm.onSocketMessage.add(callback, context);   // All incoming zone messages
nm.onPlayerSaved.add(callback, context);     // After every successful save
nm.onSocketReconnect.add(callback, context); // Zone map reconnection
nm.onPlayerJoinedSignal.add(callback, context);
nm.onPlayerLeftSignal.add(callback, context);
```

## Hook Points

- **`canUseMultiplayer()`** at line 234943 — override to enable multiplayer in restricted contexts
- **`updateCharacter()`** at line 234859 — override the save loop to intercept or modify save data
- **`answerQuestion(data)`** at line 234763 — intercept answer submissions before they reach the server
- **`logout(redirect)`** at line 234852 — intercept logout to prevent redirect or cleanup
- **`onMessage(event)`** at line 234609 — intercept all inbound socket messages before they dispatch
- **`emitMessage(event)`** at line 234547 — intercept all outbound socket messages
- **`processCharacterSuccess(cb, player, data, status)`** at line 234992 — hook into character data after load
- **`processLoginSuccess(cb, data, token, status)`** at line 234984 — hook into login flow

## Cross-References

- [[network-http-socket-infrastructure]] — `HttpClient` (e80-ffcd), `SocketInterface` (6ac-4dfc), `Request`/`Response` builders (module 62459)
- [[network-synapse-channel-service]] — `SynapseService` (e05-96db), world/zone channel management (module 70330)
- [[player]] — `PlayerDataProvider` (3e5-dac1), character data, player.getUpdatedData()
- [[battle-system]] — co-op titan battle socket messages
- [[social]] — Friends list, user feed, matchmaking
- [[core-bootstrap-di-container]] — DI container where `e2e-9e38` is bound
