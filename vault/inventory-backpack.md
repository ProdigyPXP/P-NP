---
domain: inventory
module_ids: [51894]
line_range: [74486, 74771]
service_ids: []
status: complete
last_updated: 2026-04-13T12:30:00.000Z
---

# Backpack (Player Item Storage)

> Module `51894`, lines 74486–74771. Exported as `x` (aliased `H`). Not a DI service — accessed as a property on the active player: `player.backpack`.

## Overview

The `Backpack` class is the primary player-side item container. It stores all items the player "owns" in typed arrays under `this.data`, exposes CRUD methods (`add`, `consume`, `hasItem`, `getItem`), broadcasts item-received/consumed events to the game broadcaster, and tracks a dirty flag (`updated`) for save serialization. It is **not** stored in the DI container — it is instantiated directly on the player object.

## Access Pattern

```js
// Via the active player service:
const player = _.instance.prodigy.gameContainer.get("3e5-dac1").player;
const backpack = player.backpack;

// Add an item (type, id, isLocked, quantity):
backpack.add("hat", 42);
backpack.add("currency", 2, false, 10);

// Check quantity:
backpack.hasItem("weapon", 5);   // returns count (0 if absent)

// Remove:
backpack.consume("key", 13, 1);

// Get all of a type:
backpack.getBackpackItemsByType("hat");  // Array of { ID, type, N? }

// Unlock all member-locked items (removes L flag):
backpack.unlockAllItems();
```

## Key Classes & Functions

| Minified Name | Inferred Name | Line | Purpose |
|---------------|---------------|------|---------|
| `x` (exported `H`) | `Backpack` | 74503 | Main item container for the player |

## Data Structure

`backpack.data` is a plain object with arrays of item records keyed by type:

```js
{
  hat:               [{ ID: number, type: "hat", N?: number, hp?: number, L?: 1 }, ...],
  boots:             [{ ID, type, N?, speed? }],
  weapon:            [{ ID, type, N?, power? }],
  outfit:            [{ ID, type, N?, defence? }],
  item:              [{ ID, type, N?, difficulty? }],
  fossil:            [...],
  key:               [{ ID, type, lvl, difficulty, seed? }],
  relic:             [...],
  currency:          [{ ID, type, N }],
  follow:            [{ ID, type }],
  mount:             [{ ID, type }],
  spellRelic:        [{ ID, type }],
  costume:           [{ ID, type }],
  mathTownFrame:     [{ ID, type }],          // Math Town decoration (frame)
  mathTownInterior:  [{ ID, type }],          // Math Town decoration (interior)
}
```

**Item record fields:**
- `ID` — numeric item ID matching game data
- `type` — string category
- `N` — quantity (absent means 1; capped at 99 for non-currency)
- `L` — if `1`, item is "locked" (member-only, hidden in UI until unlocked)
- `hp` / `power` / `defence` / `speed` — stats cached from game data on `setItemStats()`
- `difficulty` — difficulty mode (set by `setItemDifficulties()`, relevant for keys/quest items)
- `lvl` — for keys: highest completed level for this keystone

## Properties

| Property | Type | Default | Modding Notes |
|----------|------|---------|---------------|
| `data` | `object` | see above | Root item store — directly writable |
| `updated` | `boolean` | `false` | Dirty flag — set to `true` to force save |
| `onKeyAddedToBackpack` | `Signal` | — | Dispatched when a keystone is added |

## Invalid Items (Filtered Out)

Items in `x.invalidItems` (static) are excluded from `getBackpackItemsByType`:
- `currency-1` (gold — tracked separately via `player.data.gold`)
- `currency-27`, `currency-28`, `currency-29`, `currency-30`

## Methods

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `constructor` | 74504 | `()` | Initializes empty `data` with all type arrays |
| `sortBackpackGearByStats` | 74521 | `static (items[]) => void` | Sort gear by combined stat totals |
| `getDataAndClear` | 74529 | `() => data` | Returns data and resets `updated=false` (used by save) |
| `unlockAllItems` | 74532 | `() => void` | Removes `L` flag from all items (membership bypass hook) |
| `setItems` | 74541 | `(data) => void` | Replace entire backpack data, run stat/difficulty init |
| `setItemStats` | 74544 | `() => void` | Populate `hp`/`power`/`defence`/`speed` from game data |
| `setItemDifficulties` | 74577 | `() => void` | Set `difficulty` on keys and quest items |
| `getTotalUnique` | 74588 | `() => number` | Total number of item slots across all types |
| `setKeyItemData` | 74593 | `(id, key, value) => void` | Update a field on a key item by ID |
| `getKeyItemData` | 74602 | `(id, key) => any` | Read a field from a key item by ID |
| `setItemData` | 74610 | `(id, key, value) => void` | Update a field on a generic item by ID |
| `getItemData` | 74619 | `(id, key) => any` | Read a field from a generic item by ID |
| `getItem` | 74627 | `(type, id, difficultyMode?) => item\|undefined` | Find item by type+id, respects difficulty filter |
| `hasItem` | 74631 | `(type, id, difficultyMode?) => number` | Returns quantity (0 if absent); gold/currency-1 always returns 0 |
| `hasItems` | 74637 | `(items[]) => number` | Count how many of the given items are owned |
| `hasItemsOfType` | 74645 | `(type) => boolean` | True if any items of that type exist |
| `hasMaxQuantityOfItem` | 74648 | `(type, id) => boolean` | True if quantity >= 99 (never for currency) |
| `addKeyItem` | 74651 | `(id, lvl, opts?) => void` | Add or update a keystone item |
| `add` | 74666 | `(type, id, locked?, qty?, opts?) => void` | Add or increment item; broadcasts `ItemReceived`; respects difficulty mode |
| `consume` | 74699 | `(type, id, qty?) => void` | Remove or decrement item; broadcasts `ItemConsumed` |
| `getBackpackItemsByType` | 74714 | `(type, difficultyMode?) => item[]` | Returns filtered item array for a type (excludes invalid + wrong difficulty) |
| `getItemCount` | 74720 | `(types[]) => number` | Total unique items across multiple types |
| `getBattleItems` | 74725 | `(includeTeamItems) => item[]` | Items usable in battle (potions, food) |
| `canCraft` | 74735 | `(type, id) => boolean` | True if player has all recipe ingredients |
| `craft` | 74744 | `(type, id) => void` | Consume recipe ingredients and add result |

## Exposable Variables

- `_.instance.prodigy.gameContainer.get("3e5-dac1").player.backpack` — full Backpack object
- `_.instance.prodigy.gameContainer.get("3e5-dac1").player.backpack.data` — raw data (read/write)
- `_.instance.prodigy.gameContainer.get("3e5-dac1").player.backpack.data.hat` — hat array (mutate directly + set `updated=true`)

## Hook Points

- `backpack.unlockAllItems()` at line 74532 — called by `player.hasMembership()` unlock flow. Override or call directly to unlock all `L`-flagged items.
- `backpack.add("hat", id)` at line 74666 — inject before/after to intercept item grants.
- `backpack.hasItem(type, id)` at line 74631 — patch return value to fake item ownership.
- `backpack.consume(type, id, qty)` at line 74699 — no-op patch to prevent item consumption.
- `x.invalidItems` static array at line 74755 — modify to allow/deny specific items from appearing in inventory reads.

## Cross-References

- [[player-active-player]] — `backpack` is a property of the `zt` ActivePlayer class; initialized at line 74298
- [[inventory-equipment]] — Equipment slot management (separate from backpack storage)
- [[inventory-secure-inventory]] — Server-authoritative items (costumes, premium gear) use a different store (`b2d-0f23`)
- [[economy]] — Gold (`currency-1`) is NOT in backpack; it lives in `player.data.gold`
