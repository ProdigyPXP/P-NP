---
domain: zones
module_ids: [7612, 87820]
line_range: [238249, 252027]
service_ids: []
status: complete
last_updated: 2026-04-13T10:00:00.000Z
---

# Zone Map Data & Teleportation

> Zone map classes and per-map data structures are defined throughout module 7612, lines 238249–251205, alongside the WorldManager.

## Overview

Each zone (e.g. `Vs` = Forest, `Ko` = Shiverchill) is a class that extends the Zone base class (`et`). Each zone instantiates named `MapData` objects in its `maps` dictionary. A map tag is the part after the dash in a map key: `"forest-C8"` → zone `"forest"`, tag `"C8"`.

## Map Data Structure

`MapData` objects store:
- **`tag`** — string identifier (e.g. `"C8"`)
- **`zoneName`** — full map key used for asset loading
- **`x`, `y`** — default player spawn position
- **`connections`** — array of connected map keys (e.g. `["forest-B8", "forest-D8"]`)
- **`assets`** — array of asset names to load
- **`battleBG`** — battle background override for this map
- **`questParams`** — optional: `{ enableChests: bool }` etc.
- **`locations`** — array of spawn location objects
- **`storeManager`** — store data (for shop maps)
- **`getName()`** — returns localized name
- **`isMultiplayerDisabled`** — flag for co-op

## Zone Subclasses

Zone instantiation happens in the `WorldManager` constructor (line 251208):

| Zone ID | Class | Notes |
|---------|-------|-------|
| `forest` | `Vs` | Firefly Forest (Regular) |
| `shiverchill` | `Ko` | Shiverchill Mountains (Regular) |
| `skywatch` | `Vh` | Skywatch (Regular) |
| `lamplight` | `Ba` | Lamplight Lake |
| `dyno` | `Qi.R` | Dyno (external module) |
| `bonfire_spire` | `ei` | Bonfire Spire (Regular) |
| `house` | `An` | Player House |
| `shipwreck_shore` | `Br` | Shipwreck Shore (Regular) |
| `darktower` | `ki` | Dark Tower (dungeon) |
| `academy` | `tt.N` | Academy (external module) |
| `archives` | `vt` | Archives (dungeon) |
| `tower_town` | `j.m` | Tower Town |
| `crystal_caverns` | `Oi` | Crystal Caverns (dungeon) |
| `dragon_isle` | `Yi` | Dragon Isle |
| `moon` | `Ha` | Moon zone |
| `earthtower` | `st.m(E, 1)` | Tower (deprecated) |
| `icetower` | `st.m(E, 3)` | Tower (deprecated) |
| `stormtower` | `st.m(E, 4)` | Tower (deprecated) |
| `firetower` | `st.m(E, 5)` | Tower (deprecated) |
| `watertower` | `st.m(E, 6)` | Tower (deprecated) |
| `astraltower` | `st.m(E, 7)` | Tower (deprecated) |
| `academy_hard` | `it` | Academy Hard |
| `forest_hard` | `sn` | Firefly Forest Hard |
| `shiverchill_hard` | `lh` | Shiverchill Hard |
| `bonfire_spire_hard` | `Ei` | Bonfire Hard |
| `shipwreck_shore_hard` | `oo` | Shipwreck Hard |
| `skywatch_hard` | `hc` | Skywatch Hard |
| Expert variants | `An` (House class) | All expert zones use House class (placeholder) |

## Skywatch Hard Maps Example (lines 251183–251203)

Demonstrates the map structure. Each map subclass extends a base map class and calls `super(zone, tag, locKey, width, height, connections, assets)`:

```
A0: Vh_A0 → "MAP_SKYWATCH_LOWER_BEANOVATOR", 1100×450, connects to ["skywatch-A1", "shiverchill-B1"]
A1: Vh_A1 → "MAP_SKYWATCH_UPPER_BEANOVATOR", 620×350, connects to A0/B1/C1/D1
B1: Vh_B1 → "MAP_SKYWATCH_GARDENERS_HUT_EXTERIOR", connects to A1/B2/B3
...
E5: Vh_E5 → "MAP_SKYWATCH_OUTSKIRTS", 1024×515, connects to E4
```

Zone skywatch_hard has maps: A0, A1, B1, B2, B3, C1, C2, C3, C4, D1, D2, D3, E1, E2, E3, E4, E5.

## Zone States Array

The `states` array maps human-readable keys to integer indices. Example for Skywatch Hard (line 251185):

```js
states = ["chest1", "chest2", "chest3", "chest4", "chest5",
          "wizard1", "wizard2", "daily", "windowBroken",
          "plug-D3", "plug-B3", "plug-C4", "eugene_A1",
          "vines-D1", "vines-D2", "vines-D3", "vines-B3", "vines-C4",
          PIPPET_ENCOUNTER, PIPPET_REMATCH, PIPPET_DEFEATED]
```

`zone.getState("chest1")` translates to `player.state.get("zone-skywatch_hard-0")`.

## Keystone Data (static on Zone base class)

Lines 252004–252026:

```js
// Key item IDs for each zone (backpack "key" type)
Zone.ZONE_KEYSTONES = {
  forest: 3, shiverchill: 4, bonfire_spire: 11,
  shipwreck_shore: 17, skywatch: 10,
  // identical for Hard and Expert variants
}

// Tower IDs for each zone
Zone.ZONE_TOWERS = {
  forest: 1, shiverchill: 3, bonfire_spire: 5,
  shipwreck_shore: 6, skywatch: 4
}
```

Keystones are placed at the Academy. State stored in `player.state.get("keystones-{zoneId}")` → `null` or `"Placed"`.

## Teleportation Flow

1. Caller invokes `world.it("forest-C8")` (line 251383)
2. `it()` resolves zone and map, looks up zone object `this.zones["forest"]`
3. If valid prefab map exists → zone calls `teleportPrefabScene()` → `prodigy.start("PrefabScene")`
4. Otherwise → `zone.teleport("C8", x, y, data, ld)` (line 251562)
5. `zone.teleport()` sets `player.data.zone = "forest-C8"`, calls `world.setCurrentMap("forest-C8")`
6. `TileScreen.initMap(mapData, zone, x, y)` called to prepare TileScreen
7. `prodigy.start("TileScreen", loadingData)` → triggers Phaser state transition
8. `TileScreen.create()` → `screenSetup()` → `zone.init()`, `map.init()`, `zone.setup()`
9. `TileScreen.start()` → `startAsync()` → handles cutscenes, popups, quest setup

## Deprecated Zones

`cc.DEPRECATED_ZONES = ["activity_zone", "toyzone", "elemental_guardian", "earthtower", "icetower", "crystal_caverns"]`

If player data points to a deprecated zone, they are redirected to `cc.DEFAULT_ZONE = "forest-C8"`.

## Cross-References

- [[zones-world-manager]] — WorldManager and Zone base class
- [[zones-academy]] — Academy zone with keystone placement and tower management
- [[player-active-player]] — `player.data.zone` stores current map key
- [[quests-system]] — zone quest progression
