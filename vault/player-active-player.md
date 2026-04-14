---
domain: player
module_ids: [96535, 129, 71543]
line_range: [72911, 77212]
service_ids: ["3e5-dac1", "f4b-0454"]
status: complete
last_updated: 2026-04-13T10:00:00.000Z
---

# Player — ActivePlayer & Base Player Classes

> Module 96535 (ActivePlayer `zt`), lines 72911–74485. Module 129 (base `ct`/RemotePlayer), lines 76355–77212.
> Service IDs: `"f4b-0454"` = ActivePlayer (`zt`), `"3e5-dac1"` = LoggedInPlayer wrapper (outer service with `.player` property pointing to `zt`).

## Overview

The player domain has two main classes in a clear inheritance chain. `ct` (module 129, lines 76894+) is the **base Player / RemotePlayer** class used for both the local player and remote players (co-op). `zt` (module 96535, line 73227) **extends `ct`** and is the **ActivePlayer** — the logged-in player's full state with saving, membership, migration, currency, equipment, etc.

The outer DI service `"3e5-dac1"` wraps `zt` and is what most of the codebase calls. Its `.player` property gives the `zt` instance. Service `"f4b-0454"` is injected in some subsystems to get `zt` directly.

## Access Pattern

```js
// Primary access — used everywhere in game code:
const loggedIn = _.instance.prodigy.gameContainer.get("3e5-dac1");
const player   = loggedIn.player;   // zt instance (ActivePlayer)

// Direct ActivePlayer access (less common):
const player = _.instance.prodigy.gameContainer.get("f4b-0454");

// Shorthand gold example:
const gold = _.instance.prodigy.gameContainer.get("3e5-dac1").player.getGold();
```

## Class Hierarchy

```
ct  (module 129, base Player / RemotePlayer)
└── zt  (module 96535, ActivePlayer — the logged-in player)
```

---

## Module 129 — Base Player Class (`ct`)

Lines 76894–77212. Exports `a` (referenced as `$t.a` inside module 96535).

### Sub-objects instantiated in constructor (line 76916)

| Property | Class | Purpose |
|----------|-------|---------|
| `appearance` | `st` (injectable, module 96535 ln 76609) | WizardAppearance: hair, skin, eye, face, name |
| `equipment` | `at` (ln 76673) | Equipment slots: hat, outfit, weapon, boots, follow, mount, spellRelic, costume |
| `backpack` | `$.H` (module 51894) | Inventory/backpack — items, currency, keys |
| `achievements` | `j.l` (module 5898) | Achievement tracker |
| `encounters` | `K` (ln 76383) | Pet encounter history: timesBattled, timesRescued, rescueAttempts |
| `kennel` | `X.o` (module 37465) | Pet kennel — owned pets, pet team |
| `quests` | `rt` (ln 76756) | Legacy quest progress (monster defeats, boss flags) |
| `state` | `ot` (ln 76790) | Game state tree: tutorial, world, zone, breadcrumbs, dungeon states |
| `house` | `Q` (ln 76485) | Dorm/house items, backgrounds, active items |
| `tutorial` | `ht` (ln 76866) | Tutorial menu/zone completion flags |

### Key Properties

| Property | Type | Notes |
|----------|------|-------|
| `userID` | number | Player's numeric user ID |
| `data` | object | Raw player data blob (level, stars, gold, zone, spellbook, settings, …) |
| `et` | boolean | Legacy membership flag (set from `isMember` on init) |
| `coOpTeam` | object | Co-op team data |
| `transformID` | number\|null | Current morph/transform ID |

### Key Methods (module 129)

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `init(E)` | 76932 | `(charData) => boolean` | Deserializes full character from server response |
| `initFromProtobuf(E)` | 76939 | `(protoObj) => void` | Init from protobuf (co-op/multiplayer) |
| `hasMembership()` | 76981 | `() => boolean` | Returns `this.et` (local flag, not from service). **Used only for RemotePlayer/co-op opponents** — NOT the logged-in player. |
| `setMembership(E)` | 76984 | `(obj?) => void` | Sets `et` flag from `E.isMember`. Called on protobuf init for remote players. |
| `transformPlayer(E,w,T,S)` | 76987 | `(type, id, maxTime, timeRemaining)` | Sets playerTransformation data |
| `isPlayerTransformed()` | 77000 | `() => boolean` | True if transformation active |
| `getAttacks(E?)` | 77003 | `(type?) => number[]` | Returns spellbook (up to 6 spells) |
| `getAllAttacks()` | 77006 | `() => number[]` | All available spells from level curve |
| `getGold()` | 77066 | `() => number` | Gold amount (floored at 0) |
| `getCurrencyAmount(E,w?)` | 77071 | `(id, type?) => number` | Multi-currency getter |
| `getTowerProgress()` | 77080 | `() => number` | Dark Tower floor progress |
| `getBattles()` | 77084 | `() => number` | Total battles played |
| `getWins()` | 77087 | `() => number` | Total wins |
| `getLosses()` | 77090 | `() => number` | Total losses |
| `getChargedLevel()` | 77033 | `() => number` | Charged level (post-max content) |
| `getChargedLevelCumulative()` | 77043 | `() => number` | `level + chargedLevel` |
| `getPlayerData()` | 77060 | `() => object` | Returns raw `this.data` |
| `getGearBattleStats()` | 77162 | `() => {boots,hat,…,total}` | Stat bonuses from equipment |
| `getLevelingCurve(E?)` | 77025 | `(lvl?) => array` | Returns spell unlock curve entries |
| `getBaseMaxHearts(E)` | 77018 | `(level) => number` | Max HP = base + 200 |
| `hasFoundKeystone(E)` | 77106 | `(zoneName) => boolean` | Whether zone keystone collected |

### Static Data (line 77193)

```js
ct.LEVEL_CURVE = [
  { lvl: 1, a: 31 }, { lvl: 5, a: 32 }, { lvl: 12, a: 33 },
  { lvl: 22, a: 34 }, { lvl: 38, a: 35 }, { lvl: 52, a: 36 }
]
```

---

## Module 96535 — ActivePlayer Class (`zt`)

Lines 72911–74485. Extends `ct`. Exports `W`.

Registered as service `"f4b-0454"`. The outer `"3e5-dac1"` wraps it with a `.player` accessor.

### Additional Properties (on top of `ct`)

| Property | Type | Notes |
|----------|------|-------|
| `_saveEnabled` | boolean | Must be true for saves to go through |
| `updated` | boolean | Dirty flag — triggers auto-save |
| `daily` | `Vt` (ln 73097) | Daily battle/festival tracker |
| `dailyQuestions` | `Ft.V` | Daily math questions state |
| `newPetRescueData` | `jt` (ln 73053) | New rescued pets tracker |
| `curriculumTreeID` | string\|null | Education curriculum |
| `parentEmail` | string\|null | Parent email |
| `memberPrompt` | boolean | Whether to show member prompt |
| `onEquipmentChange` | Signal | Fires when equipment slot changes |
| `onSessionStatusChange` | Signal | Fires on ultimate quest session change |
| `battleResumeData` | object\|undefined | Saved battle state for resume |
| `_locationSelectionType` | `"home"\|"school"\|"none"` | Session login location |
| `answerStreak` | number | Consecutive correct answers |
| `coOpTeamHandler` | object\|null | Co-op team handler |

### Static Constants

```js
zt.ACCOUNT_RESET_ZONE_KEEPERS = ["towertown"]
zt.PLAYER_BATTLE_STREAK_CAP = 3
zt.CHARGED_LEVELS_CONVERSION_MILESTONES = [2, 10, 20]
```

### Key Methods (module 96535 additions)

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `hasMembership()` | 73310 | `() => boolean` | Delegates to service `"859-25be".isMember` |
| `hasLegacyMembership()` | 73313 | `() => boolean` | Member AND not meeting newer tier req |
| `hasMembershipFeatureAccess(E)` | 73318 | `(feature) => boolean` | Via `"859-25be".hasFeatureAccess` |
| `getMemberTier()` | 74418 | `() => string` | Tier from `"859-25be".memberTier` |
| `changeGold(E)` | 73540 | `(amount: number) => void` | Add/remove gold, fires broadcaster events, caps at 1e9 |
| `equip(E,w)` | 73553 | `async (itemId, type, showUpsell?) => boolean` | Equip item; checks member lock |
| `unEquip(E,w)` | 73602 | `async (itemId, type) => boolean` | Unequip an item slot |
| `unlockMemberItems()` | 73524 | `() => void` | Unlocks all backpack items if member |
| `addBattle()` | 73676 | `() => void` | Increments battle counter |
| `addWin()` | 73679 | `() => void` | Increments win count + streak |
| `addLoss()` | 73682 | `() => void` | Increments loss count + streak |
| `heal()` | 73499 | `() => void` | Full HP restore for player & all pets |
| `getAnswerStreak()` | 73496 | `() => number` | Current answer streak |
| `onQuestionAnswered(E)` | 73505 | `(result) => void` | Handles correct/wrong answer events |
| `forceSaveCharacter(cb?, wait?)` | 74284 | `(callback?, waitForPrev?) => void` | Force immediate save via `"e2e-9e38"` |
| `resetAccount()` | 74294 | `() => void` | Full account reset (tutorial clear, starter pets only) |
| `validateLevel()` | 74310 | `() => void` | Corrects invalid level data; sets currentMaxLevel |
| `setZone(E,w)` | 73527 | `(zone, map) => void` | Updates zone & difficulty on zone change |
| `addSpell(E)` | 73521 | `(spellId) => void` | Adds spell to data.spells + spellbook |
| `swapSpells(E,w)` | 73702 | `(a, b) => void` | Swap two slots in spellbook |
| `completeTower(E)` | 73695 | `(floor) => void` | Update tower progress if higher |
| `isBlockedByDarkTowerMemberGate()` | 73698 | `() => boolean` | Floor 100 gate for non-members |
| `setLocation(E)` | 74369 | `(type) => void` | Set "home"\|"school" |
| `setChargedLevelsData(E)` | 74319 | `(data) => void` | Update charged level data from server |
| `getUpdatedData(force?,clear?)` | 73366 | `() => object` | Collect all dirty sub-object data for save |
| `getDataAndClear()` | 73417 | `() => object` | Returns save payload; clears dirty flags |
| `init(E)` | 73420 | `(charData) => boolean` | Extended init: class IDs, education, version checks |
| `checkVersion()` | 73799 | `() => void` | Runs data migrations versionID 1–65+ |
| `addStars(E,w?,T?)` | 74277 | `(amount, deferred?, noMemberBonus?) => boolean` | XP gain (deferred if `w=true`) |
| `rewardMembershipPrizes(cb?)` | 73735 | `async (onDone?) => boolean` | Award cloud mount & segmented offers to members |
| `getMembershipUpsellData(force?)` | 73340 | `async () => upsell` | Fetch membership upsell/upgrade options |
| `getActiveMembershipId()` | 73321 | `async () => string\|undefined` | GraphQL query for active membership ID |
| `isItemOwned(E)` | 73758 | `(item) => boolean` | Checks ownership across all item types |
| `getItemCount(E,w)` | 73767 | `(type, id) => number` | Unified item count getter |

### Daily Battle System (`Vt`, line 73097)

Tracks daily festival battle counts per battle type. Key properties:
- `dailyBattleCount`, `dailyBattleLimit` — how many fights allowed today
- `isDailyBattleComplete(type)` — check completion
- `playedBattle(type)` — increment; marks complete if limit reached
- `isExpired(festivalType)` — whether daily window has elapsed
- `init(data)` / `getData()` / `reset()` — hydrate from/to server

### Equipment Class (`at`, line 76673)

Extends base `EquipmentData`. Adds dirty tracking and level-lock enforcement.

| Method | Line | Purpose |
|--------|------|---------|
| `setHat(id, dirty?)` | 76683 | Set hat slot |
| `setOutfit(id, dirty?)` | 76686 | Set outfit slot |
| `setWeapon(id, dirty?)` | 76689 | Set weapon slot |
| `setBoots(id, dirty?)` | 76695 | Set boots slot |
| `setMount(id, dirty?)` | 76698 | Set mount; tracks lastEquippedMount |
| `setSpellRelic(id, dirty?)` | 76692 | Set relic slot |
| `setCostume(id, dirty?)` | 76702 | Set costume |
| `setFollow(id)` | 76680 | Set follow pet |
| `unequipLevelLockedItems()` | 76714 | Auto-unequip items above player's level |
| `hasItemEquipped(type, id)` | 76752 | Check if specific item is in a slot |
| `clearData()` | 76708 | Wipe all slots to null |

### Appearance Class (`st`, line 76609)

Injectable. Wraps base WizardAppearance. Adds `name` (Name object), dirty flag, and `updated` tracking.

| Method | Line | Purpose |
|--------|------|---------|
| `setHair(style, color)` | 76624 | Set hair |
| `setFace(id)` | 76627 | Set face |
| `setEyeColor(id)` | 76630 | Set eye color |
| `setSkinColor(id)` | 76633 | Set skin color |
| `setName(nameObj)` | 76660 | Set name object |
| `randomize()` | 76662 | Full random appearance |
| `getData()` | 76636 | Returns `{name, hair, skinColor, eyeColor, face}` |

### Encounters Class (`K`, module 129, line 76383)

Tracks each pet the player has encountered.

| Method | Line | Purpose |
|--------|------|---------|
| `hasPetBeenEncountered(id)` | 76418 | Owned or seen |
| `addToPetTimesBattled(id, n?)` | 76435 | Increment battle count |
| `addToPetTimesRescued(id, n?)` | 76441 | Increment rescue count |
| `getPetTimesRescued(id)` | 76464 | Get rescue count (1 if owned) |
| `getAllTotalPetsRescued()` | 76479 | Count all pets with timesRescued > 0 |

---

## Exposable Variables

```js
const p = _.instance.prodigy.gameContainer.get("3e5-dac1").player;

// Gold (read/write via changeGold)
p.getGold()
p.changeGold(1000)           // add 1000 gold
p.getPlayerData().gold = 999 // direct write (bypasses broadcaster)

// Level / XP
p.getLevel()                 // current level
p.getStars()                 // current XP (stars)
p.data.level = 100           // direct write
p.data.stars = 999999        // direct write

// Membership bypass
p.hasMembership()            // reads from 859-25be service

// Equipment
p.equipment.setHat(42)
p.equipment.setOutfit(10)
p.equipment.setWeapon(5)

// Inventory
p.backpack.add("currency", 2, false, 99)  // add item

// Pet kennel
p.kennel.getPets()
p.kennel.hasPet(id)

// Save
p.forceSaveCharacter()

// Full heal
p.heal()
```

## Hook Points

| Hook | Line | How to Use |
|------|------|-----------|
| `hasMembership()` at 73310 | ActivePlayer | Override to always return `true` for membership bypass |
| `hasMembership()` at 76981 | Base Player | Override for RemotePlayer membership |
| `changeGold(E)` at 73540 | ActivePlayer | Intercept to log or cap gold changes |
| `forceSaveCharacter()` at 74284 | ActivePlayer | Override to suppress auto-saves |
| `addStars(E,w,T)` at 74277 | ActivePlayer | Intercept XP gain |
| `equip(E,w)` at 73553 | ActivePlayer | Override to bypass member-locked item check |
| `validateLevel()` at 74310 | ActivePlayer | Override to set custom level cap |
| `checkVersion()` at 73799 | ActivePlayer | Runs migrations versionID 1–65; hook to inspect data state |

## Cross-References

- [[membership]] — `hasMembership()` delegates to service `"859-25be"` (isMember, memberTier, hasFeatureAccess)
- [[inventory]] — `p.backpack` is `$.H` from module 51894; `p.house` is House items
- [[pets]] — `p.kennel` (module 37465), `p.encounters` (module 129 class `K`)
- [[quests]] — `p.quests` (legacy), `p.state` (zone quest state), `p.tutorial` state
- [[network]] — saving via `"e2e-9e38"` in `forceSaveCharacter`; `"de1-d8e8"` for membership GraphQL
- [[battle-system]] — `p.daily` tracks festival battle limits; `p.battleResumeData`
- [[economy]] — `changeGold`, `canSpin`, `spinWheel`; currency via `"31b-2a99"`
