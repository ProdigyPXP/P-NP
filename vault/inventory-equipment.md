---
domain: inventory
module_ids: [56463, 37465]
line_range: [74968, 75099]
service_ids: []
status: complete
last_updated: 2026-04-13T12:30:00.000Z
---

# Equipment (Equipped Gear Slots)

> Base class `C` in module `56463` (lines 74968–75099). Tracked subclass `at` in module `37465` / module `129` (lines 76673–76755). Not a DI service — accessed as `player.equipment`.

## Overview

The `Equipment` class represents which items the player currently has equipped in each gear slot (hat, outfit, weapon, boots, follow, spellRelic, mount, costume). It is separate from the Backpack — the Backpack stores owned items while Equipment stores which IDs are currently active. The tracked subclass (`at`) adds an `updated` dirty flag and `unequipLevelLockedItems()` for save serialization and level enforcement.

## Access Pattern

```js
const player = _.instance.prodigy.gameContainer.get("3e5-dac1").player;
const eq = player.equipment;

// Read current gear:
eq.getHat();        // => number | null
eq.getWeapon();     // => number | null
eq.getOutfit();     // => number | null
eq.getBoots();      // => number | null
eq.getFollow();     // => number | null (companion/familiar pet ID)
eq.getMount();      // => number | null
eq.getSpellRelic(); // => number | null
eq.getCostume();    // => number | null

// Set gear (triggers save dirty flag in tracked subclass):
eq.setHat(42);
eq.setWeapon(null);  // unequip

// High-level equip (from player — validates membership, fires analytics):
player.equip(42, "hat");
player.unEquip(42, "hat");
```

## Key Classes & Functions

| Minified Name | Inferred Name | Line | Purpose |
|---------------|---------------|------|---------|
| `C` (module 56463) | `EquipmentBase` | 74975 | Base equipment model with slots + affix calculation |
| `at` (module 129) | `PlayerEquipment` | 76673 | Tracked subclass with `updated` flag + level lock enforcement |

## Properties

| Property | Type | Default | Modding Notes |
|----------|------|---------|---------------|
| `follow` | `number\|null` | `null` | Companion/familiar pet ID |
| `hat` | `number\|null` | `null` | Equipped hat item ID |
| `outfit` | `number\|null` | `null` | Equipped outfit item ID |
| `weapon` | `number\|null` | `null` | Equipped weapon item ID |
| `spellRelic` | `number\|null` | `null` | Equipped spell relic item ID |
| `boots` | `number\|null` | `null` | Equipped boots item ID |
| `mount` | `number\|null` | `null` | Equipped mount item ID |
| `costume` | `number\|null` | `null` | Equipped costume item ID |
| `updated` | `boolean` | `false` | Dirty flag (tracked subclass only) |
| `_lastEquippedMount` | `number` | `0` | Tracked subclass: last mount before unequip |

## Methods (Base class, module 56463)

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `constructor` | 74976 | `()` | Initialize all slots to `null` |
| `init` | 74979 | `(data) => void` | Load equipment from saved data object |
| `getFollow` / `setFollow` | 74982 | `(id) => void` | Companion slot getter/setter |
| `getHat` / `setHat` | 74988 | `(id) => void` | Hat slot getter/setter |
| `getOutfit` / `setOutfit` | 74994 | `(id) => void` | Outfit slot getter/setter |
| `getWeapon` / `setWeapon` | 75000 | `(id) => void` | Weapon slot getter/setter |
| `getSpellRelic` / `setSpellRelic` | 75006 | `(id) => void` | Spell relic slot getter/setter |
| `getBoots` / `setBoots` | 75012 | `(id) => void` | Boots slot getter/setter |
| `setMount` / `getMount` | 75018 | `(id) => void` | Mount slot getter/setter |
| `setCostume` / `getCostume` | 75024 | `(id) => void` | Costume slot getter/setter |
| `getHeartBonuses` | 75030 | `() => number` | Multiplicative HP bonus from affixes |
| `getDamageBonuses` | 75033 | `() => number` | Multiplicative damage bonus from affixes |
| `calculateAffixBonus` | 75036 | `(type) => number` | Sum/multiply affix effects across all gear |
| `getAllAffixes` | 75046 | `() => number[]` | Collect all affix IDs from equipped gear |
| `getAffixes` | 75050 | `(type, id) => number[]` | Get affix IDs from a specific item |
| `getEquipment` | 75058 | `(slotName) => number\|null` | Generic slot lookup by name string |
| `getData` | 75087 | `() => object` | Serialize all slots to a plain object |

## Methods (PlayerEquipment tracked subclass, module 129)

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `setHat(id, dirty?)` | 76683 | `(id, dirty=true) => void` | Sets hat, marks `updated` if dirty |
| `setOutfit(id, dirty?)` | 76686 | Same pattern | Sets outfit, optional dirty |
| `setWeapon(id, dirty?)` | 76689 | Same pattern | Sets weapon, optional dirty |
| `setSpellRelic(id, dirty?)` | 76692 | Same pattern | Sets spell relic |
| `setBoots(id, dirty?)` | 76695 | Same pattern | Sets boots |
| `setMount(id, dirty?)` | 76698 | `(id, dirty=true) => void` | Sets mount; stores previous mount in `_lastEquippedMount` |
| `setCostume(id, dirty?)` | 76702 | Same pattern | Sets costume |
| `setFollow(id)` | 76680 | `(id) => void` | Sets follow; always marks `updated` |
| `getDataAndClear` | 76705 | `() => object` | Returns data and resets `updated=false` |
| `clearData` | 76708 | `() => void` | Set all slots to `null` |
| `randomize` | 76711 | `() => void` | Set random gear from game data |
| `unequipLevelLockedItems` | 76714 | `() => void` | Unequip all gear the player's level doesn't meet |
| `unequipLevelLockedItem` | 76717 | `(type, id) => void` | Unequip a single locked item, fires analytics |
| `hasItemEquipped` | 76752 | `(type, id) => boolean` | True if the given item is in the given slot |

## High-Level equip() on Player (lines 73553–73639)

The `player.equip(itemId, type)` method (in the `zt` ActivePlayer class) is the safe way to equip items:

1. Calls `Mt.t.secureGetItem(type, itemId)` — validates item exists (async)
2. Checks if item requires membership (`data.member === 1`) — shows upsell if not member
3. Calls the appropriate `equipment.set*()` method
4. Fires `item_equipped` analytics event via `fa8-1c91`
5. Fires `item_unequipped` event for the previously equipped item
6. Dispatches `player.onEquipmentChange` signal

`player.unEquip(itemId, type)` does the same in reverse without membership check.

## Exposable Variables

- `player.equipment.hat` — currently equipped hat ID (read/write directly)
- `player.equipment.weapon` — weapon ID
- `player.equipment.getData()` — full serialized equipment object
- `player.onEquipmentChange` — Signal dispatched on equip/unequip; subscribe to detect changes

## Hook Points

- `eq.setHat(id)` at line 76683 — override to intercept/block hat equip
- `eq.unequipLevelLockedItems()` at line 76714 — no-op to prevent level enforcement
- `player.equip(id, type)` at line 73553 — patch membership check at line 73557 (`data.member === 1`) to allow member items for free
- `eq.getHeartBonuses()` / `eq.getDamageBonuses()` at lines 75030/75033 — override affix calculations for custom stat boosts

## Cross-References

- [[player-active-player]] — `equipment` is a property of the `zt` ActivePlayer; `equip()` and `unEquip()` methods are on the player
- [[inventory-backpack]] — Backpack stores item ownership; Equipment tracks which items are currently active
- [[membership]] — `equip()` checks `data.member === 1` flag via service `859-25be`
