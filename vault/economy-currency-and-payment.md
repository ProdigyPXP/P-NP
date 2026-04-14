---
domain: economy
module_ids: [90744, 43754, 10471, 13381, 42959, 2519]
line_range: [62434, 62442, 65006, 65061, 83310, 83375, 84868, 85116, 205917, 206010]
service_ids: ["0b9-1977", "50c-4791", "31b-2a99"]
status: complete
last_updated: 2026-04-13T16:30:00.000Z
---

# Economy — Currency & Payment System

> PaymentManager module `90744`, lines 205917–205977. Service ID: `0b9-1977`
> HardCurrencyDataProvider module `43754`, lines 84868–85116. Service ID: `31b-2a99`
> DynamicStoreDataProvider module `42959`, lines 83310–83374. Service ID: `50c-4791`
> CurrencyExchangeRate module `13381`, lines 65006–65061
> HardCurrencyIDs module `10471`, lines 62434–62442

## Overview

The economy system manages all gold, soft-currency (backpack items), and hard-currency (Magicoin / premium coins) transactions. `PaymentManager` (`0b9-1977`) is the unified spend/exchange gateway — every purchase goes through it. `HardCurrencyDataProvider` (`31b-2a99`) wraps the `SecureInventory` service to read/spend Magicoin balances via the network. `DynamicStoreDataProvider` (`50c-4791`) fetches the task-quest-backed offer lists that populate the in-game shop.

## Access Pattern

```js
// PaymentManager — primary economy interface
const pm = _.instance.prodigy.gameContainer.get("0b9-1977");

// Check affordability
pm.canAfford({ currency: 1, type: "gold", value: 500 }); // gold
pm.canAfford({ currency: 27, value: 10 }); // Magicoin

// Spend (returns Promise)
await pm.spend({ currency: 1, type: "gold", value: 500 }, "myMod");
await pm.spend({ currency: 27, value: 10 }, "myMod");

// Exchange hard currency to soft
const converted = pm.exchange({ currency: 27, value: 5 }, 1 /*gold*/);

// HardCurrencyDataProvider
const hc = _.instance.prodigy.gameContainer.get("31b-2a99");
hc.getBalance(27); // Magicoin balance
hc.canAfford({ currency: 27, value: 10 });

// DynamicStoreDataProvider
const ds = _.instance.prodigy.gameContainer.get("50c-4791");
const result = await ds.getDynamicStoreUIData({ storeKey: "petShop" });

// Gold shortcut — directly on player
_.instance.prodigy.gameContainer.get("f4b-0454").getGold();
_.instance.prodigy.gameContainer.get("f4b-0454").changeGold(9999);
_.instance.prodigy.gameContainer.get("f4b-0454").getCurrencyAmount(27); // Magicoin
```

## Key Classes & Functions

| Minified Name | Inferred Name | Line | Purpose |
|---|---|---|---|
| `x` (module 90744) | `PaymentManager` | 205932 | Unified currency gateway |
| `it` / `V` (module 43754) | `HardCurrencyDataProvider` | 84923 | Magicoin balance + pet cost tables |
| `k` / `S` (module 42959) | `DynamicStoreDataProvider` | 83326 | Quest-backed shop offer data |
| `C` (module 13381) | `CurrencyExchangeRate` | 65013 | Piecewise-linear Magicoin→soft rates |
| `I` (module 2519) | `MakePaymentComponent` | 205987 | UI component wrapping PaymentManager |

## Hard Currency IDs (module 10471, line 62440)

```js
const MEMBER_RESTRICTED_HC = [27];          // Magicoin — locked behind membership
const ALL_HARD_CURRENCY_IDS = [27, 28, 29, 30]; // All premium currency IDs
```

Currency ID `27` = Magicoin (the primary premium coin). IDs 28–30 are additional premium currency types (festival-specific, etc.).

## Properties

### PaymentManager (module 90744, line 205932)

| Property | Type | Injected Service | Notes |
|---|---|---|---|
| `_hardCurrencyDataProvider` | `HardCurrencyDataProvider` | `31b-2a99` | Hard currency operations |
| `_playerDataProvider` | `LoggedInPlayer` | `3e5-dac1` | Reads player gold / backpack |
| `_analytics` | analytics service | `fa8-1c91` | Sends item removed events |

### HardCurrencyDataProvider (module 43754, line 84923)

| Property | Type | Notes |
|---|---|---|
| `onBalanceChanged` | Signal | Fires when any hard currency balance changes |
| `onAffordableCacheChanged` | Signal | Fires when pet affordability changes |
| `_cachedAffordablePetsAmount` | number | Cached count of evolvable affordable pets |
| `_previousBalances` | Map<currencyId, number> | Used for delta tracking in analytics |

## Methods

### PaymentManager

| Method | Line | Signature | Purpose |
|---|---|---|---|
| `exchange(val, targetCurrency)` | 205933 | `(CurrencyValue, number) => CurrencyValue` | Convert hard→soft or soft→soft using exchange table |
| `canAfford(val)` | 205940 | `(CurrencyValue) => boolean` | True if player can pay (delegates to HC or gold/backpack) |
| `spend(val, label?, meta?)` | 205943 | `async (CurrencyValue, string, object) => void` | Deducts currency, throws if insufficient |
| `sendAnalyticsEvents(val, label, meta)` | 205958 | internal | Sends item_removed analytics event |
| `isStandardCurrencyValue(val)` | 205965 | predicate | type === "currency" |
| `isHardCurrencyValue(val)` | 205969 | predicate | standard + id in `[27,28,29,30]` |
| `isGoldCurrencyValue(val)` | 205972 | predicate | type === "gold" or standard currency id === 1 |

### HardCurrencyDataProvider

| Method | Line | Signature | Purpose |
|---|---|---|---|
| `getBalance(currencyId)` | 84948 | `(number) => number` | Reads from SecureInventory |
| `getPreviousBalance(currencyId)` | 84955 | `(number) => number` | Delta tracking |
| `canAfford(val)` | 84959 | `(CurrencyValue) => boolean` | Checks balance + membership gate |
| `isHardCurrencyMemberLocked(amount?)` | 84962 | `(number?) => boolean` | True when earned Magicoin flag off + non-member |
| `spend(val, meta)` | 84966 | `async (CurrencyValue, object) => void` | Network call to server, sends analytics |
| `grantCaptureTutorialMagicoin(player)` | 84973 | `async (Player) => void` | Grants tutorial Magicoin via network |
| `claimAllowances(player)` | 84983 | `async (Player) => void` | Claims monthly Magicoin allowance (WizardBank / BattlePass source) |
| `petAcquisitionCost(petId, kind)` | 85003 | `(number, "rescue"\|"evolution") => CurrencyValue\|undefined` | Returns Magicoin cost for pet rescue/evo from cost tables |
| `petMergeIngredientCost(petId)` | 85043 | `(number) => CurrencyValue` | Returns Magicoin cost to merge a pet |

### DynamicStoreDataProvider

| Method | Line | Signature | Purpose |
|---|---|---|---|
| `getDynamicStoreUIData(opts)` | 83330 | `async (opts) => Result<StoreUIData>` | Fetches quest-backed offer sections for shop UI |
| `markOfferRead(offerId)` | 83354 | `(string) => void` | Marks an offer seen, syncs to network |
| `getHudWidgetItems()` | 83368 | `async () => HudWidgetItem[]` | Fetches items for HUD shop widget (cached 1h) |

### CurrencyExchangeRate (module 13381)

| Method | Line | Signature | Purpose |
|---|---|---|---|
| `from(currencyId).to(targetId)` | 65019 | factory | Returns piecewise exchange rate table |
| `applyExchangeRate(amount, rate)` | 65024 | `(number, rate) => number` | Interpolates through breakpoints |
| `setOverrideRates(overrides)` | 65014 | `(object) => void` | **Modding hook**: override any exchange rate at runtime |

#### Exchange rate data (embedded in bundle, line 65011)

Magicoin (27) → Gold (1): breakpoints `[1, 20, 40, 190, 340, 860, 1600, 5600]` Magicoin → `[1, 45, 100, 525, 1060, 2850, 5670, 20000]` gold.

## Player Gold & Currency Methods (module 129, lines 77066–77079)

On the Player class (`f4b-0454`):

| Method | Line | Notes |
|---|---|---|
| `getGold()` | 77066 | Reads `player.data.gold`, validates to 0 if missing |
| `getCurrencyAmount(id, type?)` | 77071 | Dispatches to HC provider for ids 27–30, gold for id 1, backpack otherwise |
| `changeGold(delta)` | 73540 | Adds/subtracts gold; clamps to `[0, 1e9]`; broadcasts ItemReceived/ItemConsumed; increments GoldEarned/GoldSpent achievements |

### changeGold (line 73540) — detailed

```js
changeGold(delta) {
  if (delta > 0) {
    achievements.increment(GoldEarned, delta);
    broadcaster.broadcast(ItemReceived, [{ ID:1, type:"gold", N:delta, balance: getGold()+delta }]);
  } else if (delta < 0) {
    achievements.increment(GoldSpent, Math.min(Math.max(gold, 0), Math.abs(delta)));
    broadcaster.broadcast(ItemConsumed, [...]);
  }
  player.data.gold = getGold() + delta;
  if (player.data.gold < 0) delete player.data.gold;
  if (player.data.gold > MAX_SAFE_INTEGER) player.data.gold = 1e9;
  player.updated = true;
}
```

**Modding**: Call `player.changeGold(amount)` to add gold. The balance cap is hardcoded to `1e9`. Achievements and broadcasts fire automatically.

## Spin Wheel Methods (Player, lines 73648–73662)

| Method | Line | Signature | Purpose |
|---|---|---|---|
| `setSpinDate(wheelId)` | 73648 | `(number) => void` | Records today's date for a given wheel |
| `spinWheel(wheelId)` | 73651 | `(number) => void` | Increments `numSpins{id}` counter |
| `canSpin(wheelId)` | 73654 | `(number) => boolean` | True if spins remain today (members get 2, non-members 1; wheel 3 uses different logic) |
| `canPurchaseSpin(wheelId, config)` | 73657 | `(number, config) => boolean` | True if purchasable extra spins remain |
| `getNumSpins(wheelId)` | 73664 | `(number) => number` | Returns raw spin counter |

**Modding hook**: Override `canSpin()` to always return `true` for unlimited spins. Or set the debug flag `GameConstants.Debug.UNLIMITED_WHEEL_SPINS` (via `Dt.s.set()`).

## Shop ID Mapping (module `83278`, lines 83285–83308)

The `A` export maps shop integer IDs → analytics labels (GA enum values):

| Shop ID | Analytics Label |
|---|---|
| 1 | PetShop |
| 2 | WizardCenter |
| 4 | SpecialOffers |
| 5, 6, 7, 8, 19 | RegionShop (per zone) |
| 13 | StarlightShop |
| 14 | PumpkinfestShop |
| 15 | WinterfestShop |
| 25, 24, 37, 70 | FestivalShop |
| 21, 22 | TitanShop |
| 35, 36 | AcademyShop |
| 46 | WizardCenter |
| 71 | MoonlightShop |

IDs `[40, 41, 42, 43, 44, 23, 9, 11, 12, 47, 66, 68, 69]` are listed as `C` (likely deprecated/unused).

## Exposable Variables

- `_.instance.prodigy.gameContainer.get("f4b-0454").getGold()` — current gold balance (read)
- `_.instance.prodigy.gameContainer.get("f4b-0454").changeGold(9999999)` — add gold
- `_.instance.prodigy.gameContainer.get("f4b-0454").getCurrencyAmount(27)` — Magicoin balance
- `_.instance.prodigy.gameContainer.get("31b-2a99").getBalance(27)` — Magicoin via HC provider
- `_.instance.prodigy.gameContainer.get("0b9-1977").canAfford({currency:27, value:1})` — affordability check

## Hook Points

- **`changeGold(delta)`** at line 73540 — override to intercept all gold changes
- **`PaymentManager.spend()`** at line 205943 — override to make all purchases free (return without deducting)
- **`PaymentManager.canAfford()`** at line 205940 — override to always return `true`
- **`HardCurrencyDataProvider.canAfford()`** at line 84959 — override for unlimited Magicoin perception
- **`HardCurrencyDataProvider.isHardCurrencyMemberLocked()`** at line 84962 — override to return `false` (allows non-members to use earned Magicoin)
- **`Player.canSpin(wheelId)`** at line 73654 — override to always return `true` (unlimited wheel spins)
- **`CurrencyExchangeRate.setOverrideRates()`** at line 65014 — set custom exchange rates at runtime

## Cross-References

- [[player-active-player]] — `changeGold`, `getGold`, `getCurrencyAmount` live on the Player class
- [[inventory-secure-inventory]] — HardCurrencyDataProvider reads balances via SecureInventory (`b2d-0f23`)
- [[inventory-backpack]] — soft currency items stored in backpack
- [[membership-service]] — Magicoin membership gate checked via `hasMembership()` / `isHardCurrencyMemberLocked()`
- [[economy-prize-wheel]] — wheel spins consume gold/Magicoin via PaymentManager
- [[economy-shop-analytics]] — analytics events for all purchase flows
