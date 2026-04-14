---
domain: membership
module_ids: [63352, 66582, 63011, 80003, 96535, 1195, 91620, 12270, 60228]
line_range: [63011, 143110]
service_ids: ["859-25be"]
status: complete
last_updated: 2026-04-13T05:30:00.000Z
---

# Membership System

> Core service module `63352`, lines 75700–75761. Service ID: `859-25be`. Registered as `oe.F` singleton in the DI container.

## Overview

Handles membership state tracking, feature-flag-based tier detection, and membership date management. The `MembershipService` (`F` / minified `M`) is the single source of truth for whether a player has an active subscription and which features they can access. It is backed by data fetched via `catalyst.featureAccess.update()` (the Catalyst API) and stores results as a protobuf `Membership` object.

## Access Pattern

```js
// Primary access — returns MembershipService instance:
const membership = _.instance.prodigy.gameContainer.get("859-25be");

// From mod code — check membership:
const isMember = membership.isMember;           // boolean
const tier     = membership.memberTier;          // MemberTier enum value (see below)
const features = membership.data.features;       // string[] of active feature keys

// Through ActivePlayer (service "3e5-dac1"):
const player = _.instance.prodigy.gameContainer.get("3e5-dac1");
player.player.hasMembership();                   // bool
player.player.hasMembershipFeatureAccess("battlepass_premium"); // bool

// Shortcut via f4b-0454 (LoggedInPlayer facade):
_.instance.prodigy.gameContainer.get("f4b-0454").hasMembership();
```

## Key Classes & Functions

| Minified Name | Inferred Name | Module | Line | Purpose |
|---|---|---|---|---|
| `M` (export `F`) | `MembershipService` | `63352` | 75713 | Main membership state service (DI singleton `859-25be`) |
| `S` (export `_$`) | `MemberTier` (enum) | `66582` | 65586 | Numeric enum for all membership tiers |
| `A` (export `rH`) | `MemberTierNameMap` | `66582` | 65597 | Maps tier int → display string |
| `C` (export `kG`) | `ULTIMATE_TIERS` | `66582` | 65606 | Array of ultimate-level tiers |
| `S` (export `D`) | `MemberFeature` (enum) | `63011` | 65576 | String enum of all feature-access keys |
| `S` (export `D`) | `WizardBankMemberTier` (enum) | `80003` | 64636 | Legacy string-based tier names (`non_member`, `core`, `plus`, `ultra`) |
| `zt` | `ActivePlayer` | `96535` | 73227 | Wraps `MembershipService` calls; provides `hasMembership()`, `getMemberTier()` etc. |
| `B` | `LoggedInPlayerService` | `1195` | 71850 | Facade service (`3e5-dac1`) — delegates membership calls to `ActivePlayer` |
| `z` | `SegmentedOffersManager` | `91620` | 109104 | Tracks segmented offer availability; listens to `MembershipResponseReceived` broadcast |

## MembershipService Properties (`859-25be`)

| Property | Type | Notes |
|---|---|---|
| `isMember` | `boolean` | `true` if `_data.active === true`. **Primary hook point.** |
| `memberTier` | `MemberTier` enum | Derived from `hasFeatureAccess()` calls on feature keys (see logic below) |
| `memberStartDate` | `string \| null` | ISO date string; set from `_data.membershipStartTs` |
| `memberEndDate` | `string \| null` | ISO date string; set from `_data.membershipEndTs`; null if no end date |
| `data` | `Membership` (protobuf) | Raw membership data: `active`, `memberStartDate`, `memberEndDate`, `membershipStartTs`, `membershipEndTs`, `features[]` |

## MembershipService Methods

| Method | Line | Signature | Purpose |
|---|---|---|---|
| `get isMember` | 75717 | `() => boolean` | Returns `_data?.active === true` |
| `get memberTier` | 75721 | `() => MemberTier` | Evaluates feature flags to determine tier (see tier logic) |
| `get memberStartDate` | 75724 | `() => string \| null` | ISO start date |
| `get memberEndDate` | 75727 | `() => string \| null` | ISO end date, null if ongoing |
| `hasFeatureAccess(feature)` | 75730 | `(E: string) => boolean` | Checks if `feature` string is in `_data.features[]` |
| `updateFeatureAccess()` | 75734 | `() => Promise<Membership>` | Fetches fresh data from Catalyst, updates `_data`, returns it |
| `refreshMembership()` | 75744 | `() => Promise<Membership \| null>` | Like `updateFeatureAccess` but no-ops if `_data` is null; used after purchase |
| `convertFeatureAccessResponseToMembership(E)` | 75751 | `(response) => Membership` | Converts Catalyst response to protobuf `Membership.create(E.data)` |
| `updateMembershipDates()` | 75754 | `() => void` | Updates `_memberStartDate` / `_memberEndDate` from `_data` timestamps |
| `debugSetMembership(active, startDate, endDate)` | 75758 | stub | Empty in production; hook point for patching |

## Tier Detection Logic

The `memberTier` getter works as follows (line 75722):

```js
hasFeatureAccess("battlepass_premium")
  ? hasFeatureAccess("ultimate_memberbox")
    ? hasFeatureAccess("bonus_coins_880") || hasFeatureAccess("bonus_coins_ultimate_bundle_880")
      ? MemberTier.MemberUltra
      : MemberTier.MemberPlus
    : MemberTier.MemberCore
  : MemberTier.NonMember
```

## MemberTier Enum (module `66582`, line 65595)

```js
// Export: D._$ from module 66582
MemberTier.NonMember           = 0
MemberTier.MemberLevelUp       = 1   // legacy Battle Pass tier
MemberTier.MemberUltimateMath  = 2   // legacy
MemberTier.MemberUltimateBundle= 3   // legacy
MemberTier.MemberCore          = 101
MemberTier.MemberPlus          = 102
MemberTier.MemberUltra         = 103
```

`kG` (from module 66582) is an array of "ultimate" tiers: `[MemberUltra, MemberUltimateBundle, MemberUltimateMath]`.

## MemberFeature Keys (module `63011`, line 65583)

```js
// Export: D.D from module 63011
BATTLE_PASS_PREMIUM               = "battlepass_premium"        // any member
DAILY_LOGIN_CALENDAR_ULTIMATE_REWARD = "daily_login_calendar_ultimate_reward"
DAILY_LOGIN_CALENDAR_THRESHOLD_REWARD = "daily_login_calendar_threshold_reward"
LEGACY_EPICS                      = "epics_v1"
WIZARD_DASH_LEVEL_1_REVIVES       = "wizard_dash_level_1_revives"
WIZARD_DASH_LEVEL_2_REVIVES       = "wizard_dash_level_2_revives"
MYTHICAL_EPICS                    = "epics_v2"
ULTIMATE_MEMBERBOX                = "ultimate_memberbox"        // Plus+Ultra
CORE_COINS                        = "coins_350"
PLUS_AND_ULTRA_COINS              = "coins_720"
ULTRA_BONUS_COINS                 = "bonus_coins_880"           // Ultra only
ULTIMATE_BONUS_COINS              = "bonus_coins_ultimate_bundle_880"
CHARGED_LEVELS_DECAY_IMMUNITY     = "charged_levels_decay_immunity"
MEMBERSHIP_UPGRADE_REWARD_SMALL   = "membership_upgrade_reward_small"
MEMBERSHIP_UPGRADE_REWARD_MEDIUM  = "membership_upgrade_reward_medium"
MEMBERSHIP_UPGRADE_REWARD_LARGE   = "membership_upgrade_reward_large"
PET_MERGE_UPSELL_REPEATABLE       = "pet_merge_upsell_repeatable"
PET_EVOLUTION_UPSELL_REPEATABLE   = "pet_evolution_upsell_repeatable"
MEMBER_LEVEL_BOOST                = "member_level_boost"
```

## ActivePlayer Membership Methods (module `96535`, lines ~73310–74474)

| Method | Line | Purpose |
|---|---|---|
| `hasMembership()` | 73310 | Delegates to `gameContainer.get("859-25be").isMember` |
| `hasLegacyMembership()` | 73313 | `hasMembership() && !service_749_61df.meetsRequirementsDeprecated(15)` |
| `hasMembershipFeatureAccess(feature)` | 73318 | Delegates to `859-25be.hasFeatureAccess(feature)` |
| `getActiveMembershipId()` | 73321 | Async; sends GraphQL `upgradeOptions` query, returns first math membership ID |
| `getAllActiveMemberships()` | 73328 | Async; returns all active memberships from GraphQL |
| `getActiveMathMembership()` | 73333 | Async; filters for math-category memberships |
| `getMembershipUpsellData(force)` | 73340 | Returns cached upsell data or calls `fetchMembershipUpsell()` |
| `fetchMembershipUpsell()` | 73345 | Non-member: returns `NonMember` tier. Member: fetches upgrade options via GraphQL |
| `processMembershipUpgradeOptions(resp)` | 73352 | Sets `membershipUpsell.tier` and `upgradeOptions` from GraphQL response |
| `filterForMathMemberships(list)` | 73360 | Filters `activeMemberships` where `categories.includes("Math")` |
| `getMemberTier()` | 74418 | Returns `gameContainer.get("859-25be").memberTier` |
| `isAtMaxMembershipTier()` | 74421 | Checks if player is at the highest tier for their variant |
| `sendMembershipQueryRequest()` | 74444 | Sends GraphQL `upgradeOptions` query via `de1-d8e8` network handler |
| `hasMembershipUpgradeOptions()` | 74468 | `membershipUpsell.upgradeOptions.length > 0` |
| `canPurchaseMembershipInGame()` | 74472 | Non-member OR (not partial user AND has upgrade options) |

## DI Container Registration (line 187876)

```js
this.gameContainer.bind("859-25be").to(oe.F).asSingleton();
// oe.F = MembershipService (module 63352, export F)
// Catalyst API dependency bound as:
this.gameContainer.bind("966-0d7c").to(qs.X).asSingleton();
// qs.X = CatalystService (injected into MembershipService via @inject("966-0d7c"))
```

## Membership Lifecycle

1. **Login**: `LoggedInPlayerService.postLoginInitialization()` (line 71969) → calls `refreshMembershipData()` which calls `player.getAllActiveMemberships()` via GraphQL.
2. **Feature data**: `MembershipService.updateFeatureAccess()` calls `_catalyst.featureAccess.update()` — this is the Catalyst REST call that returns the `features[]` array.
3. **After purchase**: `MembershipParent.updateMembershipStatus()` (line 143087) → calls `refreshMembership()` on `859-25be`, retries up to 3x if `active` is false, then calls `ChargedLevels.updateDecayImmunity()` and `checkMemberUpgradeReward()`.
4. **Purchase prompt**: `prodigy.open.membershipInfo()` or `prodigy.open.membershipParent()` — opens the membership purchase flow.
5. **Membership change broadcast**: `H3.MembershipResponseReceived` event is dispatched after purchase; `SegmentedOffersManager` listens to re-evaluate upsell eligibility.

## Exposable Variables

```js
const ms = _.instance.prodigy.gameContainer.get("859-25be");

ms.isMember           // read: boolean — is active member
ms.memberTier         // read: 0/101/102/103 — membership tier
ms.memberStartDate    // read: ISO string
ms.memberEndDate      // read: ISO string | null
ms._data              // read/write: raw Membership protobuf — modify .active and .features[] to bypass

// Bypass membership check completely (easiest mod):
ms._data = { active: true, features: ["battlepass_premium", "ultimate_memberbox", "bonus_coins_880"] };
// Or patch the getter:
Object.defineProperty(ms, 'isMember', { get: () => true });
```

## Hook Points

- **`MembershipService.isMember` getter** (line 75717) — override the getter on the singleton instance to always return `true`. This bypasses all `hasMembership()` checks across the game.
- **`MembershipService.hasFeatureAccess(feature)`** (line 75730) — override to return `true` for any feature key to unlock specific features without full membership.
- **`MembershipService.memberTier` getter** (line 75721) — override to return `MemberTier.MemberUltra` (103) to enable all ultra features.
- **`MembershipService.debugSetMembership()`** (line 75758) — empty stub in prod; inject implementation here to set `_data` directly.
- **`ActivePlayer.hasMembership()`** (line 73310) — override on the player instance to return `true`.
- **Player protobuf `member` field** (line 76984) — `setMembership(E)` reads `E.isMember` from the server response; intercept this to inject membership at login.
- **Debug command `SetMembership`** (lines 112466, 112662) — an in-game debug menu button exists that calls the `It.SetMembership` command; its handler presumably calls `debugSetMembership()` or sets `_data` directly.

## Membership Upsell / Segmented Offers

`SegmentedOffersManager` (`z`, module `91620`, service bound via `(0, O.injectable)()`) manages contextual upsell offers:
- Listens to `H3.MembershipResponseReceived` broadcast
- `processMembershipRequirement()` checks if the player's current membership package changed after a purchase
- `userCanReceiveSegmentedOffers()`: non-member OR has upgrade options, tutorial complete, not on native app

## Server API Endpoints (module `48417`)

Membership-related network API endpoints exposed in the `D` (SocketCommands) constant:
- `MemberJar.GetMemberJarData` → `"memberJar.getMemberJarData"`
- `MemberJar.UpdateMemberJarRewards` → `"memberJar.updateMemberJarRewards"`
- `MemberJar.ResetMemberJarData` → `"memberJar.resetMemberJarData"`
- `MembershipUpgradeReward.CheckMemberUpgradeReward` → `"membershipUpgradeReward.checkMemberUpgradeReward"`
- `MembershipUpgradeReward.GetCollectedRewardsData` → `"membershipUpgradeReward.getCollectedRewardsData"`
- `MembershipUpgradeReward.CollectMemberUpgradeReward` → `"membershipUpgradeReward.collectMemberUpgradeReward"`
- `ChargedLevels.AwardMemberOnlyChargedLevelXp` → `"chargedLevels.awardMemberOnlyChargedLevelXp"`
- `ChargedLevels.UpdateDecayImmunity` → `"chargedLevels.updateDecayImmunity"`
- `Kennel.MemberUpgradeEvolve` → `"kennel.memberUpgradeEvolve"`
- `SegmentedOffers.RedeemOffer` → `"segmentedOffers.redeemOffer"`
- `SegmentedOffers.GetOffers` → `"segmentedOffers.getOffers"`

## Cross-References

- [[player-active-player]] — `ActivePlayer` (`zt`) delegates all membership calls to `859-25be`
- [[core-bootstrap-di-container]] — DI bindings for `859-25be` → `MembershipService`, `3e5-dac1` → `LoggedInPlayerService`
- [[data-models-protobuf]] — `Membership` protobuf message (fields: `active`, `memberStartDate`, `memberEndDate`, `membershipStartTs`, `membershipEndTs`, `features[]`)
