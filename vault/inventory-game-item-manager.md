---
domain: inventory
module_ids: [77938]
line_range: [72705, 72865]
service_ids: []
status: complete
last_updated: 2026-04-13T12:30:00.000Z
---

# GameItemManager (Static Item Data Catalog)

> Module `77938`, lines 72705–72865. Exported as `P` (used as `Mt.t` in the player module, `M.t` in backpack, `A.t` in equipment). Static-only class — no DI service ID. Access via webpack export.

## Overview

`GameItemManager` is the central static catalog for all game item definitions. It holds a flat `itemMap` (`{type}-{id}` keyed) and per-type `data` arrays populated at game startup from the game bundle's data blobs. All item type lookups (`hat`, `weapon`, `outfit`, `boots`, `spellRelic`, `key`, `pet`, `spell`, etc.) go through this class. It also maintains a `drops` array for runtime enemy/chest drops.

## Access Pattern

```js
// The singleton export is referenced as `Mt.t` or `M.t` or `A.t` depending on module
// In mod code, access via game data loading directly:

// Via player module alias (most common in game code):
const item = Mt.t.getItem("hat", 42);
// item = { type: "hat", ID: 42, data: { name: "...", stats: {...}, lockLevel: N, member: 0|1 }, metadata: {...} }

// Check existence:
Mt.t.doesExist("weapon", 5); // boolean

// Get all items of a type:
Mt.t.getCategoryItems("outfit"); // array of item objects

// Get item data directly:
Mt.t.getItemData("spell", 13); // => item.data or null

// Async-safe lookup (loads external data if needed):
await Mt.t.secureGetItem("hat", 300);
```

## Key Classes & Functions

| Minified Name | Inferred Name | Line | Purpose |
|---------------|---------------|------|---------|
| `P` | `GameItemManager` | ~72700 | Static item data catalog |

## Static Properties

| Property | Type | Notes |
|----------|------|-------|
| `P.itemMap` | `object` | `{ "type-id": itemObject }` — flat lookup cache |
| `P.drops` | `array` | Runtime drop pool `[{ type, ID, R (probability) }]` |
| `P.data` | `object` | `{ [type]: itemObject[] }` — arrays by type |

## Item Object Shape

```js
{
  type: string,       // "hat", "weapon", "outfit", "boots", "pet", "spell", etc.
  ID: number,
  data: {
    name: string,
    member: 0 | 1,       // 1 = member-locked
    lockLevel: number,   // minimum player level required
    stats: { power?, hp?, defence?, speed? },
    spellID: number,     // for weapons/relics: the spell this item gives
    effects: number[],   // affix IDs
    recipe: [{ type, ID, N }],  // crafting recipe
    drop: number,        // drop rate weight
    rarity: string,
    quest: boolean,      // if true, item is a quest item
    // ... many more type-specific fields
  },
  metadata: {
    iconAtlas: string,   // atlas name for icon
    icon: { type, ID },  // fallback icon reference
    vIcon: boolean,      // use vector icon
    // ...
  }
}
```

## Methods

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `getItem` | 72760 | `static (type, id) => item\|null` | Main lookup; aliases "gold"→"currency-1", "firework"→"item" |
| `secureGetItem` | 72766 | `static async (type, id) => item\|null` | Same as getItem but falls back to async external load if not in map |
| `doesExist` | 72782 | `static (type, id) => boolean` | True if item is in the catalog |
| `getRandomItem` | 72785 | `static (type) => item\|null` | Random item from a type array |
| `getItemDrops` | 72789 | `static (extra?) => item[]` | Roll random drops from the drops pool |
| `getItemsWithFilter` | 72799 | `static (type, fn) => item[]` | Filter items by predicate |
| `getCategoryItems` | 72802 | `static (type) => item[]` | All items of a type (raw array) |
| `getItemData` | 72805 | `static (type, id) => data\|null` | Just the `.data` field |
| `getItemMetadata` | 72809 | `static (type, id) => metadata\|null` | Just the `.metadata` field |
| `getIconAtlas` | 72813 | `static (item) => string` | Resolve icon atlas for any item reference |
| `getIconFrame` | 72829 | `static (item) => string\|null` | Resolve icon frame name |
| `getItems` | 72832 | `static (type, rarity) => item[]` | Items of a type + rarity that have a drop rate |
| `getRawItems` | 72835 | `static (type, rarity?) => item[]` | Raw items optionally filtered by rarity |
| `getRandomizedDropsFromCreatures` | 72838 | `static (creatureDrops, creature, isBoss) => drops[]` | Build drop array for a battle result |
| `getRangeByAmount` | 72852 | `static (type, start, count) => item[]` | Slice of items by array index range |
| `getItemCount` | 72860 | `static (type) => number` | Count of items in a type |

## Exposable Variables

- `P.itemMap` — full flat item map (read-only in practice; modifying can add fake items)
- `P.data` — full typed arrays (push to inject items into game catalog)
- Accessed in mod code via any module that imports `77938`, e.g. via the backpack or player module references

## Hook Points

- `P.getItem(type, id)` at line 72760 — patch to return custom item definitions
- `P.doesExist(type, id)` at line 72782 — patch to enable equipping items not in catalog
- `P.data["hat"].push({ type:"hat", ID:9999, data:{...}, metadata:{...} })` — inject a new item at runtime
- `P.itemMap["hat-9999"] = {...}` — must also update itemMap for `getItem` to work

## Cross-References

- [[inventory-backpack]] — Backpack calls `M.t.getItem()` to populate stats on `add()`
- [[inventory-equipment]] — Equipment calls `A.t.getItem()` for affix data
- [[player-active-player]] — Player calls `Mt.t.secureGetItem()` in `equip()` / `unEquip()`
- [[data-models-protobuf]] — Item IDs are referenced in proto messages for network transfer
