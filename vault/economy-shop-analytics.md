---
domain: economy
module_ids: [204247, 42959]
line_range: [204247, 204402]
service_ids: ["fa8-1c91", "50c-4791", "ab9-3b05"]
status: complete
last_updated: 2026-04-13T16:30:00.000Z
---

# Economy — Shop & Dynamic Store Analytics

> Shop analytics segment class `ee`, lines 204247–204402. Part of the main analytics module accessed via service `fa8-1c91`.

## Overview

The shop segment (`ee` class, part of the analytics `fa8-1c91` service's `.shop` property) tracks all purchase events across the static shop, the Dynamic Store (quest-backed offer system), and purchase failures. It also triggers quest events via the quest hub (`ab9-3b05`) to advance shop-related quests (the Dynamic Store's offer system is built on top of the quest engine).

`DynamicStoreDataProvider` (`50c-4791`) is the data layer: it fetches segmented offers from the network quest manager and filters them by availability.

## Access Pattern

```js
const segment = _.instance.prodigy.gameContainer.get("fa8-1c91");

// Track a shop purchase (analytics only — does not perform the purchase)
segment.shop.sendShopPurchaseCompletedEvent(shopId, shopDef, itemDef, isMagicoinBoosted);

// Check current shop transaction for item receipt correlation
segment.shop.getCurrentShopTransactionID();
segment.shop.getDynamicStoreSourceId("petShop"); // => "shop_v3_petShop"

// Access DynamicStore data
const ds = _.instance.prodigy.gameContainer.get("50c-4791");
const result = await ds.getDynamicStoreUIData({ storeKey: "petShop" });
if (result.isSuccess()) {
  const { store, offerReadById, specialOffer } = result.get();
}
```

## Key Classes & Functions

| Minified Name | Inferred Name | Line | Purpose |
|---|---|---|---|
| `ee` | `ShopSegment` | 204247 | Analytics for shop purchases/views/failures |
| `k` / `S` (module 42959) | `DynamicStoreDataProvider` | 83326 | Fetches quest-backed shop offer data |

## ShopSegment Methods (lines 204247–204402)

| Method | Line | Signature | Analytics Event |
|---|---|---|---|
| `getCurrentShopInstanceID()` | 204248 | `() => string` | Internal UUID for open shop session |
| `getCurrentShopTransactionID()` | 204251 | `() => string` | UUID for purchase correlation |
| `getDynamicStoreSourceId(storeKey)` | 204254 | `(string) => string` | Returns `"shop_v3_{storeKey}"` |
| `sendShopPurchaseCompletedEvent(shopId, shopDef, itemDef, isMagicoinBoosted?, extra?)` | 204263 | multi-param | "Shop Purchase Completed" |
| `startDynamicStoreTransaction(instanceId)` | 204290 | `(string) => string` | Creates a transaction UUID for dynamic store |
| `sendDynamicStorePurchaseCompletedEvent(data)` | 204296 | `(StoreEventData) => void` | "Shop Purchase Completed" (dynamic store variant) |
| `sendShopItemViewedEvent(shopId, shopDef, itemDef, extra?)` | 204305 | multi-param | "Shop Item Viewed" |
| `sendDynamicStoreItemViewedEvent(data)` | 204327 | `(StoreEventData) => void` | "Shop Item Viewed" (dynamic store variant) |
| `sendShopPurchaseFailedEvent(shopId, shopDef, itemDef, reason, extra?)` | 204333 | multi-param | "Shop Purchase Failed" |
| `sendDynamicStorePurchaseFailedEvent(data)` | 204356 | `(StoreEventData) => void` | "Shop Purchase Failed" (dynamic store, also triggers InsufficientCurrency event) |
| `sendShopQuestEvent(type, data)` | 204368 | `(string, object) => void` | Forwards shop events to quest engine (`ab9-3b05`) |
| `extractCommonStoreData(data)` | 204380 | `(StoreEventData) => object` | Builds shared analytics payload for dynamic store |

### Common analytics payload fields (from extractCommonStoreData, line 204380)

```js
{
  shop_name,        // store key string
  shop_id,          // "shop_v3_{storeKey}"
  category,
  is_member_locked, // item.data.member > 0
  item_name,        // from GameItemManager
  item_type,
  item_id,
  item_unlock_level,
  item_cost,
  currency,         // currency name string
  currency_id,
  currency_balance, // player.getCurrencyAmount(...)
  price,
  instance_type: "ShopVisit",
  instance_id,
  // + common event properties (level, zone, session_uuid, etc.)
}
```

## DynamicStoreDataProvider (module 42959, lines 83326–83374)

Injected services:
- `_player` via `f4b-0454` (current active player)
- `_segmentedOffers` via `487-e5d0`
- `_dynamicStoreQuestManager` via `8b8-ac14`
- `_networkHandler` via `075-03dc`

| Method | Line | Notes |
|---|---|---|
| `getDynamicStoreUIData(opts)` | 83330 | Fetches offers from quest manager, filters empty sections and SpecialOffer (only shown if user qualifies), marks new offers |
| `markOfferRead(offerId)` | 83354 | Updates `player.data.dynamicStore.seenOffers[offerId]`, syncs HUD badge state |
| `getHudWidgetItems()` | 83368 | Network fetch with 1-hour cache (`WIDGET_ITEM_FETCH_COOLDOWN = 1 hour`) |
| `getPlayerData()` | 83357 | Lazily initializes `player.data.dynamicStore = {seenOffers: {}}` |
| `cleanupUnusedPlayerData(data, offerMap)` | 83363 | Purges seenOffers entries older than 30 days (2592000000 ms) |

Player data shape for dynamic store:
```js
player.data.dynamicStore = {
  seenOffers: {
    [offerId: string]: number /* Date.now() timestamp */
  }
}
```

## Shop ID → Analytics Mapping

Defined in a separate module (lines 83285–83308):

| Shop ID | Category |
|---|---|
| 1 | PetShop |
| 2, 46 | WizardCenter |
| 4 | SpecialOffers |
| 5–8, 19 | RegionShop (per zone GUID) |
| 13 | StarlightShop |
| 14 | PumpkinfestShop |
| 15 | WinterfestShop |
| 21, 22 | TitanShop |
| 24, 25, 37, 70 | FestivalShop |
| 35, 36 | AcademyShop |
| 71 | MoonlightShop |

## Hook Points

- **`ShopSegment.sendShopPurchaseCompletedEvent()`** — intercept to observe all purchases
- **`DynamicStoreDataProvider.getDynamicStoreUIData()`** — return custom store data to modify the shop's offer list
- **`DynamicStoreDataProvider.getPlayerData()`** — directly manipulate `seenOffers` state
- **`sendShopQuestEvent()`** at line 204368 — shop purchases advance quests via `ab9-3b05`; intercept here to trigger quest advancement without actual purchase

## Cross-References

- [[economy-currency-and-payment]] — PaymentManager executes the actual currency deduction
- [[quests-quest-manager-system]] — Dynamic Store offers are quest tasks; purchase completion advances quest state via `ab9-3b05`
- [[inventory-backpack]] — Items land in backpack after purchase
- [[membership-service]] — `is_member_lock` checked against `item.data.member`
