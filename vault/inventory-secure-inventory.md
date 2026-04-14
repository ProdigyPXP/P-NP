---
domain: inventory
module_ids: [108991]
line_range: [109004, 109051]
service_ids: ["b2d-0f23"]
status: complete
last_updated: 2026-04-13T12:30:00.000Z
---

# SecureInventory (Server-Authoritative Item Store)

> Module containing `M` class, lines 109004–109051. Service ID: `b2d-0f23`. Injectable via DI container.

## Overview

`SecureInventory` (minified `M`) is a client-side cache for server-authoritative items — premium gear, costumes, and certain currencies that the server validates. Unlike the regular `Backpack`, SecureInventory is populated from server responses and cannot be written to locally. It provides a read-only query interface by `{type, id}` or UUID. An `onChange` signal fires when the server pushes updates.

## Access Pattern

```js
const secInv = _.instance.prodigy.gameContainer.get("b2d-0f23");

// Get a specific item by type + id:
const item = secInv.get({ type: "costume", id: 42 });

// Get quantity:
const count = secInv.getCount({ type: "currency", id: 5 });

// Get all items of a type:
const costumes = secInv.getAllOfType("costume");

// Listen for server updates:
secInv.onChange.add((newItem, oldItem) => { /* ... */ });
```

## Key Classes & Functions

| Minified Name | Inferred Name | Line | Purpose |
|---------------|---------------|------|---------|
| `M` (exported `U`) | `SecureInventory` | 109005 | Server-authoritative item cache |

## Data Structure

Items are cached in two maps:

- `_cacheByPath` — nested: `{ [type]: { [id]: { "stackable"|uuid: item } } }`
- `_cacheByUuid` — flat: `{ [uuid]: item }` for quick UUID lookup

Each **item** object from the server has shape:
```js
{
  type: string,       // e.g. "costume", "currency"
  id: number,
  quantity: number,
  uuid?: string       // if unique/non-stackable
}
```

## Properties

| Property | Type | Notes |
|----------|------|-------|
| `onChange` | `Signal<(newItem, oldItem)>` | Fired on server push; subscribe to detect changes |
| `_cacheByPath` | `object` | Internal nested cache |
| `_cacheByUuid` | `object` | Internal UUID-indexed cache |

## Methods

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `initialize` | 109009 | `(items[]) => void` | Load initial server data (called on login) |
| `get` | 109013 | `(query: string\|{type,id,uuid?}) => item\|undefined` | Look up by UUID string or type+id path |
| `getAllOfType` | 109017 | `(type) => item[]` | All items of a given type |
| `getCount` | 109024 | `(query: {type,id,uuid?}) => number` | Total quantity (sums across UUIDs if no UUID given) |
| `destroy` | 109039 | `() => void` | Dispose `onChange` signal |
| `replaceItem` | 109042 | `(item) => oldItem` | Update or remove item in cache (quantity 0 = remove) |

## Usage in Game

The `player.getItemCount(type, id)` method (line 73767) checks SecureInventory first for types that are secure (via `j.p(type, id)` predicate):

```js
getItemCount(type, id) {
    if (isSecureType(type, id))
        return this._secureInventory.getCount({ type, id });
    // else fall through to backpack / kennel / gold
}
```

Costumes are exclusively stored in SecureInventory (not in Backpack):
```js
// CostumeManager reads from SecureInventory:
getCostumes() {
    return this._secureInventory.getAllOfType("costume");
}
```

## Exposable Variables

- `_.instance.prodigy.gameContainer.get("b2d-0f23")` — the full SecureInventory instance
- `secInv.getAllOfType("costume")` — all owned costumes
- `secInv.getAllOfType("currency")` — all secure currencies

## Hook Points

- `secInv.getCount({ type, id })` at line 109024 — override to fake ownership of secure items
- `secInv.get({ type, id })` at line 109013 — override to return a fake item object
- `secInv.initialize(items)` at line 109009 — intercept to inject items at login
- `player._secureInventory` at line 74484 — DI-injected reference on the player (`b2d-0f23`); patch the player's copy to redirect queries

## Cross-References

- [[player-active-player]] — `_secureInventory` is injected onto the `zt` class via `@inject("b2d-0f23")`
- [[inventory-backpack]] — Regular items use Backpack; premium/server-side items use SecureInventory
- [[membership]] — Costumes and certain currencies are member-locked and live in SecureInventory
