---
domain: social
module_ids: ["81687"]
line_range: [167235, 173444]
service_ids: ["16b-0e3b", "824-bd4f", "fa8-1c91", "749-61df"]
status: complete
last_updated: 2026-04-13T14:00:00.000Z
---

# Social Menu System

> Module `81687`, lines ~167235–173444. Composed of multiple UI classes in the social tab.

## Overview

The Social tab UI, accessible from the HUD. Contains sub-panels: **Leaderboard** (class-vs-class rankings), **Battle Requests** (incoming duel invites), **Awards** (achievements list), and **Badges** (topic mastery badges). The top-level container `Gl` (SocialMenu) routes between views and tracks duel invite indicator state. Also includes `Ch` (FriendsListMenu) which is a separate modal showing friends/classmates/friend-requests.

## Access Pattern

```js
// The social menu is opened via prodigy.open:
_.instance.prodigy.open.social();   // approximate

// DuelInviteService is referenced internally:
_.instance.prodigy.gameContainer.get("16b-0e3b").getInvites().length; // battle request count
```

## Key Classes & Functions

| Minified Name | Inferred Name | Line | Purpose |
|---------------|---------------|------|---------|
| `Gl` | `SocialMenu` | 173339 | Top-level social modal with tab navigation |
| `xl` | `DuelRequestsPanel` | 173172 | Battle requests sub-panel (paginated invite list) |
| `Nl` | `AchievementPanel` | 173104 | Awards/achievements scrollable list |
| `Bl` | `BadgesMenu` | 173214 | Topic badge collections viewer |
| `Ch` | `FriendsListMenu` | 167235 | Separate friends/classmates/requests modal |
| `jl` | `FriendRequest` | 173446 | Model wrapper for a pending friend request |
| `Hl` | `FriendRequestCell` | 173474 | Renders a single friend request row |
| `Ul` (enum) | `SocialTab` | 173336 | Tab indices: Leaderboard=0, BattleRequests=1, Bounty=2, Award=3, Badge=4 |

## SocialMenu (`Gl`) — Tab Navigation

| Tab | Value | Class Created |
|-----|-------|--------------|
| Leaderboard | 0 | `Ll.Z` (LeaderboardMenu) |
| BattleRequests | 1 | `xl` (DuelRequestsPanel) |
| Award | 3 | `Nl` (AchievementPanel) |
| Badge | 4 | `Bl` (BadgesMenu) |

### Key Methods

| Method | Line | Purpose |
|--------|------|---------|
| `createMenu()` | 173345 | Loads prefab header, sets up buttons, opens default tab |
| `setMode(tabIndex)` | 173401 | Switches active panel, sends Segment tab event |
| `updateBattleRequestIndicator()` | 173424 | Toggles red indicator dot on Battle Requests button |
| `close()` | 173432 | Sends Segment interface-closed event, tears down |
| `destroy(opts)` | 173441 | Removes all invite listeners |

### Battle Requests Indicator Logic

```js
// The "battle request" button indicator lights up if there are pending invites:
this.hasPendingBattleRequests = this._duelInviteService.getInvites().length > 0;
// The button is locked/disabled when no pending requests exist.
```

## DuelRequestsPanel (`xl`) — Pending Invites List

Subscribes to `onInviteReceived`, `onInviteRemoved`, `onInviteCancelled`.  
Renders up to 3 invites per page (paginated scroll).  
Each invite cell has:
- Challenger's name (from `DuelInviteProto.name`)
- Accept button → calls `DuelInviteUI.acceptInvite(VB.Standard, invite)`
- Reject (X) button → calls `DuelInviteUI.rejectInvite(invite)`

## FriendsListMenu (`Ch`) — Friends/Classmates UI

| Property | Source |
|----------|--------|
| `friendsList` | `prodigy.friendsListNetworkHandler.friendsList` |
| `classList` | `prodigy.friendsListNetworkHandler.classList` |
| `friendRequestList` | `prodigy.friendsListNetworkHandler.friendRequestList` |

Three view buttons: Friends, Classmates, Requests.  
Classmate appearance is resolved from `friendsListNetworkHandler.classList`.

### `friendsListNetworkHandler` Access Pattern

```js
const handler = _.instance.prodigy.friendsListNetworkHandler;
handler.friendsList;           // array of friend player objects
handler.classList;             // array of classmate player objects
handler.friendRequestList;     // pending friend requests
handler.isClassmate(userID);   // boolean
handler.isFriend(userID);      // boolean
handler.getFriend(userID);     // single friend object
handler.getFriendsCap();       // max friend count
handler.acceptFriendRequest(userID, requestID);
handler.rejectFriendRequest(userID, requestID);
handler.getUserAppearance(list, force); // loads appearance data for list
```

## BadgesMenu (`Bl`) — Topic Mastery Badges

- `badgeData` from `prodigy.education.getAllTopicBadges()` — array of badge collections
- Collections: Stone, Amber, Garnet, Emerald, Ruby, Topaz, Amethyst, Diamond (8 total)
- Each collection has multiple topic slots with skill progress and rank stars (1–7 stars)
- Breadcrumb: `jr.B.FEATURE_BADGES` / `jr.B.BREADCRUMB_CLICKED_BADGES_BUTTON`

## Hook Points

- `SocialMenu.setMode(tab)` at line 173401 — intercept tab switches
- `SocialMenu.updateBattleRequestIndicator()` at line 173424 — override to force indicator always on
- `DuelRequestsPanel.createChallenge()` at line 173189 — override to intercept accept/reject UI
- `FriendsListMenu` constructor at line 167237 — intercept friends list population

## Cross-References

- [[social-duel-invite-service]] — service `16b-0e3b` — powers battle requests panel
- [[social-duel-invite-ui]] — `DuelInviteUI` static class called from invite cells
- [[ui-framework-open-system]] — `prodigy.open` dispatches social menu
- [[player-active-player]] — `friendsListNetworkHandler` is on the player game object
