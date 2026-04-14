---
domain: data-models
module_ids: [51151]
line_range: [20, 3902]
service_ids: []
status: complete
last_updated: 2026-04-13T04:00:00.000Z
---

# Data Models — Protobuf Message Schemas

> Module 51151, lines 20–3902. No DI service ID — this module is a pure protobuf-generated data layer accessed by reference (`E.roots.default`).

## Overview

Module 51151 is the game's protobuf schema layer, generated from `.proto` files and compiled into the webpack bundle via protobufjs. It defines all wire-format message types used for battle state serialization, network communication (socket.io), co-op multiplayer, bounty runs, player save data, mail, PvP, and in-game surveys. Every message class exposes `encode`, `decode`, `verify`, `fromObject`, `toObject`, and `toJSON` methods following the protobufjs API.

## Access Pattern

```js
// The root namespace is stored globally as:
const proto = E.roots.default; // E = protobufjs module (module 26946)

// Example: decode a battle wire message
const battle = proto.Battle.decode(buffer);

// Example: create a spell object from plain JS
const spell = proto.Spell.fromObject({ id: 1, element: "fire", tier: 1, energyCost: 2 });

// Example: access membership data embedded in Character
const char = proto.Character.decode(buffer);
console.log(char.membership.active); // true/false
```

## Key Classes & Functions

| Class | Line | Purpose |
|-------|------|---------|
| `Spell` | 28 | Battle spell: id, element, tier, energyCost, target, type, locked, unlockLevel |
| `Name` | 84 | Wizard name tuple: last, first, middle (all integer IDs into name table) |
| `Hair` | 125 | Hair appearance: color (int), style (int) |
| `WizardAppearance` | 163 | Full wizard appearance: name (Name), hair (Hair), face, gender, eyeColor, skinColor |
| `Affix` | 222 | Stat modifier: type (string), amount (float) |
| `Appearance` | 260 | OneOf: either an integer ID or a WizardAppearance |
| `Equipment` | 315 | Player equipment slot IDs: key, follow, hat, outfit, weapon, spellRelic, boots, mount (all optional ints) |
| `Unit` | 398 | Battle combatant: level, health, affixes[], type, appearance, accuracy, criticalHitChance, criticalHitBonusDamage, spells[], powerStat, healthStat, element, nickname?, equipment?, maxHealth, name? |
| `TeamState` | 542 | Battle team state: energy, units[] |
| `UnitLevel` | 603 | Level range: min, max |
| `TeamLimit` | 641 | Team constraints: Limit (min/max), Units (min/max) nested classes |
| `Battle` | 764 | Battle record: id, userId, status, homeState (TeamState), awayState (TeamState) |
| `TargetData` | 820 | Single target outcome: deltaHealth, finalHealth, effect?, targetUnit?, deltaEnergy?, finalEnergy?, index?, nFactor |
| `Action` | 894 | Battle action: team, type, id, targetData[], epicID |
| `LootItem` | 966 | Loot drop: ID?, type?, quantity? (all optional) |
| `BattleAction` | 1019 | Complete battle result: id, userId, status, actionID, actions[], lootSecure[], lootUnSecure[] |
| `BountyRun` | 1130 | Bounty run container: userId, runs[] |
| `Run` | 1191 | Single run: bounties[], pets[] (int IDs), bountyIdx, loadoutIdx, status, tsExpireDelta |
| `Bounty` | 1280 | Bounty definition: name, statBonus, isMember?, petID?, bountyLoot[], randomLootItemTableIds[], affixID |
| `BountyRunLoot` | 1388 | Loot for a bounty run: ID, quantity?, weight?, type? |
| `StatBonus` | 1444 | Stat bonus: type (string), amount (float) |
| `Character` | 1482 | Full character save: userId, gameVersion, dataVersion, inventory, loadouts[], membership, egInfo |
| `Inventory` | 1573 | Player inventory: orb[] (Item array) |
| `Item` | 1630 | Inventory item: ID, quantity? |
| `Loadout` | 1674 | Spell loadout: orbs[] (packed int array of item IDs) |
| `Membership` | 1731 | Membership status: active (bool), memberStartDate, memberEndDate, membershipStartTs, membershipEndTs, features[] |
| `EgInfo` | 1803 | Epic Games info: tier (int) |
| `CoOpTeamProto` | 1838 | Co-op team: hostID (double), teamMembers[], battleStreak |
| `CoOpTeamDisbandedProto` | 1902 | Co-op disbanded: hostID |
| `CoOpTeamJoinRequestProto` | 1937 | Co-op join request: userID |
| `CoOpTeamErrorProto` | 1972 | Co-op error: reason (string) |
| `CoOpTeamJoinSuccessProto` | 2007 | Co-op join success: socketRoomID, team (CoOpTeamProto) |
| `CoOpTeamMatchDetailsProto` | 2055 | Match details: hostID, type, teammates[] (PlayerProto) |
| `CoOpTeamMemberProto` | 2120 | Team member: userID, ready (bool) |
| `CoOpTeamReadyUpProto` | 2158 | Ready-up: userID |
| `PlayerProto` | 2193 | Player in multiplayer: userID, appearance (PlayerAppearanceProto), equipment (PlayerEquipmentProto), name (PlayerNameProto), level, member, team |
| `PlayerAppearanceProto` | 2259 | Player appearance for multiplayer: faceID, hair (PlayerHairProto), skinColorID, eyeColorID, gender, morph (MorphProto) |
| `MorphProto` | 2318 | Morph/transformation: type (string), ID (double) |
| `PlayerEquipmentProto` | 2356 | Multiplayer equipment: hatID, outfitID, weaponID, bootsID |
| `PlayerHairProto` | 2400 | Multiplayer hair: styleID, colorID |
| `PlayerNameProto` | 2438 | Multiplayer player name: first, middle, last, nick (all double) |
| `PlayerPetProto` | 2482 | Multiplayer pet data: ID, stars, team, level, levelCaught, foreignSpells[] |
| `StartCoOpTitanMatchProto` | 2559 | Titan match start: matchDetails, titanNetworkID, titanAssetID, titanHP, crystalHP, titanXPBounty |
| `CoOpTitanHostReadyCheckProto` | 2618 | Titan host ready check: userID |
| `CoOpTitanHostReadyResponseProto` | 2653 | Titan host ready response: currentTitanHP, currentCrystalHP |
| `CoOpTitanPlayerAttackedProto` | 2691 | Titan attack: userID, missed, titanHealth, damage, spellID |
| `CoOpTitanTitanAttackedProto` | 2738 | Titan counter-attack data |
| `CoOpTitanQuestionAnsweredProto` | 2782 | Question answered in titan battle |
| `Mail` | 2820 | Mail message: id, from, to, subject, body, attachments[] |
| `OpenMailData` | 2877 | Open mail action data |
| `MailData` | 2928 | Mail inbox data |
| `Attachment` | 3040 | Mail attachment |
| `GameMethod` | 3081 | RPC method descriptor |
| `ExtensionData` | 3141 | Extension/plugin data |
| `DuelInviteProto` | 3213 | PvP duel invite |
| `DuelRejectionProto` | 3282 | PvP duel rejection |
| `DuelCancellationProto` | 3317 | PvP duel cancellation |
| `PvPReadyProto` | 3352 | PvP ready signal |
| `PvPTeamProto` | 3387 | PvP team data |
| `SurveyQuestionData` | 3448 | Survey question |
| `SurveySettings` | 3549 | Survey configuration |
| `SurveyReward` | 3584 | Survey reward |
| `SurveyData` | 3625 | Full survey data |
| `SurveyAnswerData` | 3723 | Survey answer |
| `SurveyObjectData` | 3805 | Survey object |
| `SurveyAnswerImage` | 3865 | Survey answer with image label |

## Properties (Critical for Modding)

### Spell (line 28)
| Property | Type | Modding Notes |
|----------|------|---------------|
| `id` | int32 | Spell ID |
| `element` | string | e.g. "fire", "water", "earth", "storm" |
| `tier` | int32 | Spell tier level |
| `energyCost` | int32 | Energy consumed per cast — writable |
| `target` | int32 | Targeting mode |
| `type` | string | Spell type |
| `locked` | bool | Whether spell is locked — set to false to unlock |
| `unlockLevel` | int32 | Level required |

### Unit (line 398)
| Property | Type | Modding Notes |
|----------|------|---------------|
| `level` | int32 | Unit level — writable |
| `health` | int32 | Current HP — writable |
| `maxHealth` | int32 | Max HP — writable |
| `affixes` | Affix[] | Stat modifiers |
| `type` | string | "wizard" or pet type |
| `appearance` | Appearance | Visual |
| `accuracy` | float | Hit chance |
| `criticalHitChance` | float | Crit % — writable |
| `criticalHitBonusDamage` | float | Crit damage multiplier — writable |
| `spells` | Spell[] | Active spells — writable array |
| `powerStat` | int32 | Damage stat |
| `healthStat` | int32 | HP stat |
| `element` | string | Unit element |
| `nickname` | string? | Optional custom name |
| `equipment` | Equipment? | Equipped items |

### Membership (line 1731)
| Property | Type | Modding Notes |
|----------|------|---------------|
| `active` | bool | **Key hook** — set to `true` to bypass member checks |
| `memberStartDate` | int32 | Start date (integer format) |
| `memberEndDate` | int32 | End date |
| `membershipStartTs` | double | Unix timestamp start |
| `membershipEndTs` | double | Unix timestamp end |
| `features` | string[] | Enabled feature flags |

### Character (line 1482)
| Property | Type | Modding Notes |
|----------|------|---------------|
| `userId` | int32 | Player user ID |
| `gameVersion` | string | Game version string |
| `dataVersion` | int32 | Save data version |
| `inventory` | Inventory | Player inventory (orbs) |
| `loadouts` | Loadout[] | Spell loadouts |
| `membership` | Membership | Membership status |
| `egInfo` | EgInfo | Epic Games tier |

## Exposable Variables

The proto namespace is accessible through the protobufjs module:
```js
// Access via webpack require if you have the module reference:
const proto = require(26946).roots.default;
// Or intercept when the Character is decoded during login:
// proto.Character.decode(buffer)
```

Key fields for modding:
- `proto.Membership` — intercept `decode` to patch `active = true`
- `proto.Unit` — intercept to boost stats before battle
- `proto.Spell` — intercept to unlock all spells (`locked = false`)
- `proto.Character.membership.active` — the single bool controlling member access at wire level
- `proto.BattleAction.lootSecure` — items awarded after secure (server-validated) battle
- `proto.BattleAction.lootUnSecure` — items awarded after client-side battle (potentially writable)

## Hook Points

| Target | Line | How to Hook |
|--------|------|-------------|
| `Membership.decode` | 1742 | Override to always return `active: true` |
| `Character.decode` | 1493 | Intercept full character load — patch membership, inventory, stats |
| `BattleAction.decode` | 1034 | Intercept battle results — could modify loot |
| `Spell.fromObject` | 73 | Intercept to unlock/modify spells before they're applied |
| `Unit.decode` | 421 | Intercept unit creation to boost stats |
| `Bounty.decode` | 1302 | Intercept bounty to override `isMember` requirement |

### Example: Membership bypass at proto level
```js
const origDecode = proto.Membership.decode.bind(proto.Membership);
proto.Membership.decode = function(reader, length) {
  const msg = origDecode(reader, length);
  msg.active = true;
  msg.membershipEndTs = Date.now() + 1e10;
  return msg;
};
```

### Example: Unlock all spells
```js
const origSpellDecode = proto.Spell.decode.bind(proto.Spell);
proto.Spell.decode = function(reader, length) {
  const spell = origSpellDecode(reader, length);
  spell.locked = false;
  return spell;
};
```

## Cross-References

- [[membership]] — `Membership` proto is the wire format for membership status checked by the membership service (`859-25be`)
- [[battle-system]] — `Battle`, `BattleAction`, `Action`, `TargetData`, `Unit`, `TeamState` are the core battle wire types
- [[player]] — `Character` is the full player save format; decoded on login
- [[social]] — `CoOpTeam*Proto`, `PlayerProto`, `PvP*Proto` are the multiplayer wire types
- [[pets]] — `PlayerPetProto`, `Run.pets` encode pet team data
- [[festivals]] — `BountyRun`, `Run`, `Bounty` are the bounty/festival run wire types
- [[inventory]] — `Inventory`, `Item`, `Loadout` encode the player's inventory at the wire level
- [[education]] — `SurveyQuestionData`, `SurveyAnswerData` may relate to math question delivery
