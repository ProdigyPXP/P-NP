---
domain: pets
module_ids: [37465, 39984, 55734, 63834, 25834, 43754, 22023, 9860]
line_range: [75174, 108992]
service_ids: ["31b-2a99", "17c-e966", "a8f-1513", "a5a-3029"]
status: complete
last_updated: 2026-04-13T12:00:00.000Z
---

# Pets — Kennel & Pet System

> Modules 37465 (lines 75800–76105), 39984 (lines 75174–75539), 55734 (lines 76163–76308), 63834 (lines 77226–77255), 25834 (lines 108892–108992), 43754 (lines 84868–85116), 22023 (lines 231161–231536), 9860 (lines 94644–94708).

## Overview

The pet system manages the player's "kennel" (roster of owned pets), the 3-slot battle team, pet evolution, gear equipping, and pet capture. Pets are stored in a secure inventory backed by the network; the local `Kennel` class acts as a high-level cache/manager over raw secure-item data. The `Creature` base class provides shared battle logic for both the player wizard and pets.

## Access Pattern

```js
// Get the kennel (roster manager)
const kennel = _.instance.prodigy.gameContainer.get("f4b-0454").kennel;
// or via player service:
const kennel = _.instance.prodigy.gameContainer.get("3e5-dac1").player.kennel;

// Get raw pet data array (all owned pets)
const pets = kennel.data;         // raw data objects
const pets = kennel.getPets();    // same, as data objects

// Get active battle team (Creature instances, 3 slots)
const team = kennel.petTeam;     // array length 3; slot 0 is always the player wizard
const teamCreatures = kennel.getPetTeam(false); // filter out player wizard

// Get affordable evolutions service
const hardCurrency = _.instance.prodigy.gameContainer.get("31b-2a99");

// Get pet gear (hat/relic) service
const petGear = _.instance.prodigy.gameContainer.get("a8f-1513");

// Get pet inventory slot service
const petInventory = _.instance.prodigy.gameContainer.get("a5a-3029");
```

## Key Classes & Functions

| Minified Name | Inferred Name | Module | Line | Purpose |
|---|---|---|---|---|
| `Y` (exported as `Y`) | `Kennel` | 37465 | 75841 | Main kennel manager — roster & team |
| `z` (exported as `z`) | `initPetTeamPositions` | 37465 | 75834 | Normalize team position data on load |
| `$` (exported as `e`) | `Creature` | 39984 | 75197 | Base class for all battle units (pets + player) |
| `U` (exported as `R`) | `Pet` | 55734 | 76182 | `Creature` subclass for owned pets |
| `I` (extends `Pet`) | `MergePet` | 63834 | 77235 | Pet subclass with merge-rank max-level logic |
| `x` | `KennelBridge` | 25834 | 108907 | Syncs local kennel state ↔ secure inventory |
| `it` / `V` (exported `W`) | `HardCurrencyService` | 43754 | 84923 | Manages Magicoin balance, pet costs, evolution affordability |
| `ht` (exported as `P8`) | `PetFeatureFlags` | 22023 | 231221 | Static utility class — all pet feature logic |
| `n` | `PetInventoryDataProvider` | 9860 | 94660 | Fetches/caches permanent pet slot count from server |

## Properties

### Kennel (`Y`, module 37465, line 75841)

| Property | Type | Default | Modding Notes |
|---|---|---|---|
| `_petData` | `PetData[]` | `[]` | Raw pet data array — writable but use `populateKennel()` |
| `_petTeam` | `Creature[]` (len 3) | `[null,null,null]` | Active battle team; slot 0 = player wizard |
| `updated` | `boolean` | `false` | Set to `true` to trigger save on next character save |
| `onPetRemoved` | `Signal` | — | Dispatched with removed `PetData` when `removePetData()` runs |
| `player` | `Player` | — | Back-reference to owning player |

### PetData object (raw data stored in `kennel.data`)

| Field | Type | Notes |
|---|---|---|
| `ID` | `number` | Pet species ID (matches game data `pet` category) |
| `uniqueID` | `string` | UUID — required for secure inventory operations |
| `level` | `number` | Current level (1–100) |
| `stars` | `number` | Cumulative XP points |
| `hp` | `number` | Current HP |
| `team` | `number \| undefined` | Battle team slot (0, 1, 2); undefined = not on team |
| `nickname` | `string \| null` | Player-set nickname |
| `levelCaught` | `number` | Player level when caught |
| `catchDate` | `number` | Server timestamp (ms) when caught |
| `mergeRank` | `number \| undefined` | Merge rank (0 = MIN, higher = more powerful) |
| `gear` | `{petHat: string\|null, petRelic: string\|null}` | Equipped gear UUIDs |
| `evolutionCount` | `number \| undefined` | Times evolved (used in merge-2 feature flag path) |

### Creature / Pet base class properties

| Property | Type | Notes |
|---|---|---|
| `data` | `PetData` | The raw data object |
| `source` | `object` | Game data from `ItemManager.getItem("pet", ID)` |
| `modifiers` | `object` | Battle modifiers: `{maxHearts, damage, miss, ignoreElement, potion, barrier}` |
| `creatureType` | `"pet" \| "Player"` | Used for XP curve selection |
| `currentMaxLevel` | `number` | Level cap (normally 100; reduced by evolution system) |
| `inPVP` | `boolean` | PvP mode flag — HP tracked separately in `pvpHP` |
| `starsToProcess` | `number` | Queued XP to award after battle |
| `isOpponent` | `boolean` | If `true`, `addStars()` returns false (no XP) |

### Creature static constants

| Name | Value | Notes |
|---|---|---|
| `$.MAX_HEARTS` | `50000` | Absolute HP cap for all creatures |
| `$.HP_BONUS` | `{A+:4, A:3, ... C-:-4}` | Life-stat bonus lookup table |

## Methods

### Kennel

| Method | Line | Signature | Purpose |
|---|---|---|---|
| `populateKennel(data)` | 75854 | `(PetData[]) => void` | Bulk-load all pets and rebuild team |
| `getPets(excludeTeam?)` | 75867 | `(bool=false) => PetData[]` | Get all pets (or bench-only if `true`) |
| `getPetByID(id)` | 75877 | `(number) => PetData\|null` | Find first pet with matching species ID |
| `getAllPetsByID(id)` | 75881 | `(number) => PetData[]` | All pets of a species (for duplicates) |
| `getPetByUniqueID(uid)` | 75884 | `(string) => PetData\|null` | Find by uniqueID |
| `addPet(id, hp, stars, level, nickname)` | 75981 | — | Create and add a new pet (calls bridge `add`) |
| `addPetFromData(data)` | 75994 | `(PetData) => boolean` | Low-level add — validates uniqueID, places on team |
| `removePet(data)` | 76009 | `async (PetData) => void` | Remove pet, calls network bridge `remove` |
| `removePetData(data)` | 76019 | `(PetData) => void` | Remove from local arrays only (no net call) |
| `setTeamPosition(data, slot)` | 75953 | `(PetData, 0\|1\|2) => void` | Place pet into battle team slot |
| `getTeamPosition(slot)` | 75964 | `(0\|1\|2) => Creature\|null` | Get creature at slot |
| `removeAtTeamPosition(slot)` | 75967 | `(0\|1\|2) => void` | Remove creature from slot |
| `swapTeamPositions(a, b)` | 75971 | `(number, number) => void` | Swap two team slots |
| `hasPet(id)` | 76029 | `(number) => boolean` | Check if player owns any pet of species `id` |
| `amountOfPet(id)` | 76033 | `(number) => number` | Count owned pets of species `id` |
| `getNumPets(excludeTeam?)` | 76036 | `(bool=false) => number` | Total pets owned |
| `getMaxKennelSize()` | 76045 | `() => number` | Max roster capacity (based on owned pet count × multiplier) |
| `isFull()` | 76060 | `() => boolean` | Whether roster is at capacity |
| `getPetTeam(includePlayer?)` | 76074 | `(bool) => Creature[]` | Get non-null team members; filter player wizard if `false` |
| `isPetOnTeam(id)` | 76077 | `(number) => boolean` | Check if species is currently on team |
| `equipGearForPet(uniqueID, item)` | 75893 | — | Equip a gear item (hat or relic) to a pet |
| `unequipGearForPet(uniqueID, slot, txId?)` | 75906 | — | Remove gear from a pet's slot |

### Creature (`$`, module 39984)

| Method | Line | Signature | Purpose |
|---|---|---|---|
| `getLevel()` | 75485 | `() => number` | Current level (clamped to `currentMaxLevel`) |
| `getStars()` | 75471 | `() => number` | Current cumulative XP |
| `addStars(n)` | 75412 | `(number) => boolean` | Award XP; triggers level-up if threshold crossed |
| `getCurrentHearts()` | 75381 | `() => number` | Current HP (PvP-aware) |
| `getMaxHearts(level?)` | 75385 | `(number?) => number` | Max HP at given level |
| `setCurrentHearts(n)` | 75404 | `(number) => void` | Set HP directly, dispatches `onHPChange` |
| `isKnockedOut()` | 75346 | `() => boolean` | Returns `true` if HP ≤ 0 |
| `getAttacks(element?)` | 75338 | `(string?) => number[]` | Get spell IDs (base returns `[1]`) |
| `getAvailableEvolutions(level?)` | 75368 | `(number?) => CurveEntry[]` | Evolution entries available at given level |
| `evolve(newId)` | 75341 | `async (number) => void` | Base evolve — logs warning (Pet overrides) |
| `getBattleAssetSpecifier()` | 75521 | `() => {type, id}` | Returns `{type:"pet", id: this.getID()}` |
| `static getAttacksFromCurve(curve, min, max)` | 75241 | — | Extract attack IDs from level curve |
| `static getEvolutionsFromCurve(curve, min, max)` | 75249 | — | Extract evolution entries |
| `static getBattleStats(data, level)` | 75280 | — | Calculate HP/Power/Defence/Speed at level |
| `static starsToLevel(stars, creatureType)` | 75271 | — | Convert cumulative XP to level |

### Pet (`U`, module 55734)

| Method | Line | Signature | Purpose |
|---|---|---|---|
| `getID()` | 76269 | `() => number` | Species ID from `data.ID` |
| `getName()` | 76272 | `() => string` | Nickname if set, else species name |
| `getElement()` | 76278 | `() => string` | Pet's element type |
| `evolve(newId, isMemberUpgrade?)` | 76251 | `async (number, bool) => void` | Trigger evolution via network or locally |
| `getBamSpells(level?)` | 76198 | `(number?) => BamSpell[]` | Get 2 native spell entries for the pet |
| `getLevelingCurve(maxLevel?)` | 76285 | `(number?) => CurveEntry[]` | Get the pet's level/evolution curve data |
| `getDrops()` | 76295 | `() => Drop[]` | Battle loot (100 gold + pet's data drops) |
| `generate(playerLevel, delta)` | 76281 | `(number, number) => void` | Set stars/level for wild encounter |

### PetFeatureFlags (`ht` / `P8`, module 22023)

| Method | Line | Purpose |
|---|---|---|
| `canPetEvolve(pet, level)` | 231415 | Check if pet can evolve: has available evolutions AND level ≥ gift threshold |
| `getEvolutionLVL(petData)` | 231226 | Level at which pet can evolve |
| `getEvolutionID(petData)` | 231232 | Species ID of evolved form |
| `GetEvolutionaryLine(petData)` | 231249 | Full evolutionary chain as `number[]` of IDs |
| `getBattleStats(pet, level, uniqueID?, mergeBonus?)` | 231428 | Get stats with merge rank scaling applied |
| `getPetsEffectiveLevel(petData)` | 231344 | Level + charged-level + merge-rank bonus |
| `getTeamsEffectiveLevels()` | 231350 | Effective levels for all team pets |
| `canPlayerAccessPetMergeFeature(player?)` | 231287 | Check if merge feature is unlocked |
| `canPetMerge(petData)` | 231525 | Check if pet can be merged at current rank |
| `isPetEpic(id)` | 231321 | IDs 125–133 + Ultimates = epic |
| `isUltimate(id)` | 231324 | Checks UltimatesPetLocationConfig |
| `getMaxOwnableLevel(id, mergeRank?)` | 231449 | Level cap considering evolution + merge |
| `filterPrimaryPets(list)` | 231512 | For unique-pets feature: one pet per species |
| `sortPetList(list)` | 231494 | Sort by level, merge rank, rarity, ordinal |
| `isPetACrystalMonster(id)` | 231333 | Crystal monster check |
| `isPetStater(id)` | 231327 | Starter pet check |
| `getAllOwnedEpicPetIDs()` | 231380 | Get all owned epic pet IDs |
| `getUpgradeSuggestion(petData)` | 231467 | Returns ShowEvolve / ShowStaticEvolve / ShowUpgrade / None |

### HardCurrencyService (`it`/`W`, service `31b-2a99`, module 43754)

| Method | Line | Purpose |
|---|---|---|
| `getBalance(currencyId)` | 84948 | Get Magicoin balance for currency ID |
| `canAfford(cost)` | 84959 | `{currency, value}` → boolean |
| `petAcquisitionCost(petId, kind)` | 85003 | Cost to rescue/evolve a pet (returns `{currency:27, value:N}`) |
| `petMergeIngredientCost(petId)` | 85043 | Cost to merge a pet |
| `getAmountOfAffordableEvolutions()` | 85092 | Count how many team pets can be evolved now |
| `refreshAffordableEvolutionsCache()` | 85097 | Force recalculate affordable evolution count |
| `spend(cost, metadata)` | 84966 | `async` — spend hard currency via network |

## Exposable Variables

- `_.instance.prodigy.gameContainer.get("3e5-dac1").player.kennel.data` — raw pet data array (read/write, but `updated` must be set)
- `_.instance.prodigy.gameContainer.get("3e5-dac1").player.kennel.petTeam` — active battle team `[Creature, Creature, Creature]`
- `_.instance.prodigy.gameContainer.get("3e5-dac1").player.kennel.getPets()` — all owned pet data
- `_.instance.prodigy.gameContainer.get("31b-2a99").getBalance(27)` — Magicoin balance
- `_.instance.prodigy.gameContainer.get("31b-2a99").petAcquisitionCost(petId, "evolution")` — evolution cost

## Hook Points

Methods useful for modding:

- **`Kennel.addPet(id, hp, stars, level, nickname)`** at line 75981 — inject a pet into the player's kennel directly. Sets `uniqueID`, calls network bridge `add`. For free pets, call this with desired stats.
- **`Kennel.addPetFromData(data)`** at line 75994 — bypass network entirely if you pre-construct a full `PetData` with a `uniqueID` (e.g. via `crypto.randomUUID()`). Returns `false` on validation failure.
- **`Pet.evolve(newId)`** at line 76251 — override to bypass Magicoin spend check (intercept the `17c-e966` network call).
- **`PetFeatureFlags.canPetEvolve(pet, level)`** at line 231415 — returns `false` if disabled feature flag. Overriding to return `true` shows evolve UI.
- **`Creature.addStars(n)`** at line 75412 — directly grant XP. `this.starsToProcess = n; this.processStars()` triggers the animation.
- **`Creature.setCurrentHearts(n)`** at line 75404 — set HP directly during battle.
- **`HardCurrencyService.canAfford(cost)`** at line 84959 — override to `return true` to bypass Magicoin checks on evolution.
- **`Kennel.getMaxKennelSize()`** at line 76045 — returns `MAX_SAFE_INTEGER` when feature flag `fab-no-pet-inventory-limit` is enabled. This flag can be forced via `_.instance.prodigy.gameContainer.get("35d-3bd9")`.

## Constants

| Name | Value | Location |
|---|---|---|
| `$.MAX_HEARTS` | `50000` | `Creature`, line 75528 |
| `GameConstants.MAX_TEAM_SIZE` | `3` (inferred) | Module `6413` (`$.h.MAX_TEAM_SIZE`) |
| `GameConstants.MAX_KENNEL_SIZE_MULTIPLIER` | — | Module `6413` (`$.h.MAX_KENNEL_SIZE_MULTIPLIER`) |
| `HardCurrencyService.CONSTANTS_DEFAULT.captureTutorialCurrencyAmount` | `5` | Module 43754, line 85106 |
| `HardCurrencyService.CONSTANTS_DEFAULT.evolutionTutorialCurrencyAmount` | `15` | Module 43754, line 85107 |
| Currency ID 27 | Magicoin | Used for evolutions and rescues |

## Network Message Types (Kennel)

From module 48417 (lines 65212–65545), `SocketMessages.Kennel`:

| Key | Value | Meaning |
|---|---|---|
| `UnsecureAdd` | `"kennel.unsecureAdd"` | Legacy: add pet to kennel unsecured |
| `Update` | `"kennel.update"` | Update pet data on server |
| `Remove` | `"kennel.remove"` | Remove pet from kennel |
| `Evolve` | `"kennel.evolve"` | Trigger evolution on server |
| `MemberUpgradeEvolve` | `"kennel.memberUpgradeEvolve"` | Member-only evolution path |
| `Migrate` | `"kennel.migrate"` | Migrate legacy pet data |
| `Claim` | `"kennel.claim"` | Claim a pet (e.g. from token) |

These go through the Kennel network handler at service `17c-e966`.

## Services

| Service ID | Inferred Name | Module | Notes |
|---|---|---|---|
| `31b-2a99` | `HardCurrencyService` | 43754 | Magicoin balance, pet costs, evolution affordability |
| `17c-e966` | Kennel Network Handler | 25834 (bridge), 108991 | `evolve`, `memberUpgradeEvolve`, `add`, `remove`, `update` endpoints |
| `a8f-1513` | `PetGearInventoryService` | ~94000 | `getPetGearByUniqueId`, `allPetGear`, `allEquippedPetGear`, `refreshPetGear` |
| `a5a-3029` | `PetInventoryDataProvider` | 9860 | `petInventoryData.permanentSlots`, `fetchPetInventoryData`, `updateSlots` |

## Ownership Restriction Flags (`H` enum, line 231219)

```
None = 0, NoOwnership = 1, NoMerge = 2, NoPurchase = 4,
NoCapture = 8, NoEvolution = 16, All = 31
```

Controlled by `PetOwnershipRestrictions_json` data file. Epic pets (IDs 125–133) and Ultimates bypass merge by default.

## Evolution System

1. `PetFeatureFlags.canPetEvolve(petCreature, level)` checks:
   - `cachedDisabledEvolutionFeature` flag is not set
   - In merge-2 mode: `evolutionCount` must be 0
   - `pet.getAvailableEvolutions()` returns non-empty list
   - `level >= DEFAULT_PET_EVOLUTION_GIFT_THRESHOLD` (default: `5`)

2. `Pet.evolve(newId, isMemberUpgrade)` routes to:
   - Secure path (`17c-e966.evolve` or `.memberUpgradeEvolve`) — used when `fab-pet-merge-2-evolution-add-new-pet` is OFF
   - Merge-2 path: adds duplicate pet to kennel, increments `evolutionCount`
   - Legacy path: mutates `data.ID` in-place

3. After evolve: `kennel.updated = true`, broadcasts `Evolved` event, calls `kennel.refreshPetTeamData()`.

## Cross-References

- [[player-active-player]] — `player.kennel` is the `Kennel` instance; player wizard is a `Creature` subclass occupying team slot 0
- [[core-bootstrap-di-container]] — service IDs `31b-2a99`, `17c-e966`, `a8f-1513`, `a5a-3029` bound here
- [[data-models-protobuf]] — `PvPTeamProto.pets[]` and `PlayerPetProto` define protobuf pet wire format
- [[battle-system]] — `Creature` methods (`addStars`, `getCurrentHearts`, `isKnockedOut`) used throughout battle
- [[membership]] — `f4b-0454.hasMembership()` checked in `HardCurrencyService.isHardCurrencyMemberLocked()`
