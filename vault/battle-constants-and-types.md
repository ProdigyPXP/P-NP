---
domain: battle
module_ids: [34829, 28628, 88541, 52551, 48417, 6452, 13302]
line_range: [62482, 62889, 63230, 63309, 65212, 65545, 71426, 71730]
service_ids: []
status: complete
last_updated: 2026-04-13T12:30:00.000Z
---

# Battle Constants, Types, and Configuration

> Modules: 34829 (lines 71426–71730), 28628 (lines 62844–62889), 88541 (lines 62482–62669), 52551 (lines 63290–63309), 48417 (lines 65212–65545), 6452 (lines 63230–63289), 13302 (lines 102902–102915).

## Overview

This note covers the static configuration layer of the battle system: GameConstants (all battle-related debug knobs), battle type enums, duel stadium room definitions, XP reward calculation, and the CloudScript message routing enum.

## GameConstants (class `A`, module 34829, lines 71426–71730)

Globally accessible via `GameConstants.s` or `GameConstants.A`. Writable at runtime for modding.

### Access Pattern
```js
const GC = _.instance.prodigy.gameContainer.get("35d-3bd9");
// or directly:
import { s as GameConstants } from 'module-34829';
GameConstants.set("GameConstants.Battle.ESCAPE_CHANCE", 1.0);
GameConstants.get("GameConstants.Battle.FORCE_CAST"); // -1 = disabled
```

### Battle Constants (lines 71652–71672)
| Constant Key | Default | Type | Purpose |
|-------------|---------|------|---------|
| `GameConstants.Battle.VALID_PARENT_EMAIL_STARS_PERCENTAGE` | `0.05` | number | XP multiplier without parent email |
| `GameConstants.Battle.MEMBER_STARS_PERCENTAGE` | `0.5` | number | XP bonus for members |
| `GameConstants.Battle.MAX_NUM_PETS` | `1` | number | Max pets per team |
| `GameConstants.Battle.ATTACK_DAMAGE_OVERRIDE` | `null` | number/null | Override all damage values |
| `GameConstants.Battle.ESCAPE_CHANCE` | `0.75` | float | Probability of escaping (0–1) |
| `GameConstants.Battle.CATCH_COST` | `50` | number | Cost in coins to catch pet |
| `GameConstants.Battle.CATCH_COST_GOLD` | `500` | number | Cost in gold to catch pet |
| `GameConstants.Battle.ALWAYS_SWITCH` | `false` | bool | Force switch after each answer |
| `GameConstants.Battle.FORCE_CAST` | `-1` | int | Force player to cast spell at this index (-1 = disabled) |
| `GameConstants.Battle.FORCE_OPPONENT_CAST` | `-1` | int | Force enemy to cast specific spell |
| `GameConstants.Battle.ENEMY_ACCURACY_OVERRIDE` | `-1` | int | Override enemy accuracy |
| `GameConstants.Battle.SET_BENCH` | `null` | null/array | Force bench configuration |
| `GameConstants.Battle.FORCE_TARGETING_ENABLED` | `false` | bool | Force show targeting UI |
| `GameConstants.Battle.AUTOMATION_ACTIONS` | `[]` | array | Automated action sequence |
| `GameConstants.Battle.AUTO_ATTACK_ENABLED` | `false` | bool | Auto-cast spells |
| `GameConstants.Battle.AUTO_ATTACK_PAUSE` | `false` | bool | Pause between auto attacks |
| `GameConstants.Battle.AUTO_ATTACK_TARGET` | `0` | int | Auto attack target index |
| `GameConstants.Battle.SKIP_ENEMY_TURN` | `false` | bool | Enemy never acts |
| `GameConstants.Battle.SKIP_PLAYER_TURN` | `false` | bool | Player never acts |
| `GameConstants.Battle.HIDE_TEMP_HEALTHBAR` | `false` | bool | Hide damage preview bar |
| `GameConstants.Battle.SHOW_HITBOXES` | `false` | bool | Debug hitbox overlay |

### Boss HP/Difficulty Constants (lines 71673–71698)
| Constant | Default | Meaning |
|----------|---------|---------|
| `GameConstants.Mira.MAX_HP` | `100000` | Mira titan HP |
| `GameConstants.Mira.DIFFICULTY` | `10` | Mira difficulty |
| `GameConstants.Pippet.MAX_HP` | `null` | Pippet max HP (from server) |
| `GameConstants.Pippet.DIFFICULTY` | `3` | |
| `GameConstants.IceWyrm1.MAX_HP` | `null` | |
| `GameConstants.TITAN.HP_MULTIPLIER` | `1.5` | Co-op titan HP scale |
| `GameConstants.CO_OP_TITAN.TITAN_HP` | `10` | Co-op titan HP segments |
| `GameConstants.CO_OP_TITAN.TITAN_DIFFICULTY` | `5` | |

### Debug Constants (lines 71598–71634)
| Constant | Default | Purpose |
|----------|---------|---------|
| `GameConstants.Debug.AUTO_ANSWER_CORRECT_PERCENT` | `1` | Math auto-answer ratio (1 = always correct) |
| `GameConstants.Debug.AUTO_RESOLVE_BATTLES_ENABLED` | `false` | Skip battle animations |
| `GameConstants.Debug.AUTO_RESOLVE_TOWER_BATTLES_ENABLED` | `false` | |
| `GameConstants.Debug.WINNER_EVERY_TIME` | `false` | Always win |
| `GameConstants.Debug.CLOSE_BATTLE_RESULTS_SCREEN` | `false` | Auto-close results |
| `GameConstants.Debug.EASY_MODE` | `false` | Enable easy mode |
| `GameConstants.Debug.EDUCATION_ENABLED` | `true` | Show math questions |

### Static Methods on GameConstants (lines 71433–71570)
| Method | Line | Purpose |
|--------|------|---------|
| `get(key)` | 71434 | Read a constant |
| `set(key, value)` | 71437 | Write a constant |
| `setLogLevel(level)` | 71440 | Set logger verbosity |
| `setForceCast(spellIndex)` | 71537 | Shorthand for FORCE_CAST |
| `setFreeBattleRewards(E)` | 71558 | Override free battle XP config |
| `setMemberBattleRewards(E)` | 71561 | Override member battle XP config |
| `getFreeBattleRewards()` | 71564 | Get override (null if not set) |
| `getMemberBattleRewards()` | 71567 | Get override (null if not set) |

## EBattleType enum (module 28628, lines 62861–62863)

Full list of all battle types (minified: `S` / exported as `gu`):

```
Basic, QuestPippet, QuestPippetDefeatable, Ultimates,
Tutorial1, Tutorial2, Tutorial3, Tutorial1Revised, Tutorial2Revised, StatusEffectsTutorial,
FireflyQ2Miniboss, FireflyQ3Miniboss, FireflyQ8TriptropTrio, FireflyQ12Gerald,
SkywatchCloudMiniboss, SkywatchCloudBoss, SkywatchQ11Bitbots, SkywatchQ6Swarm,
ShiverchillQ6Ghosts, ShiverchillQ7IceWyrm, ShiverchillQ13IceWyrm,
BonfireQ12Guardian, BonfireQ13Cebollini,
ShipwreckQ11OldOne,
Duel, MatchmakingDuel, MatchmakingBotDuel,
Titan, CrystalCavernsGrumpyYeti, CrystalCavernsCrystalThief, CrystalCavernsGlacias,
CrystalCavernsMakalu, CrystalCavernsCrystalGolem,
DarkTower, EndgamePippet,
EndGameGuardianFirefly, EndGameGuardianShiverchill, EndGameGuardianSkywatch,
EndGameGuardianBonfire, EndGameGuardianShipwreck, EndGamePuppetMaster,
ZoneMiniboss, PumpkinfestBoss,
NormalRiftRun, BossRiftRun, LootDash,
FestivalDailyBoss, FestivalDailyBattle, FeaturedSpawn
```

**Special values:**
- `RESUMABLE_BATTLE_TYPES` (line 62864): `[NormalRiftRun]` — only rift runs auto-resume
- `BattleResult.Victory = "victory"`, `Defeat = "defeat"`, `Escape = "escape"` (line 62867)

### Unit Type / Category / Position (module 28628)
```
UnitType (uj): Wizard, Pet, Boss, Titan, Object, Miniboss
UnitCategory (GJ): DungeonBoss, TowerBoss, ZoneBoss, EventBoss, FinalBoss, Wizard, Mythic, Enemy
HealthbarPosition (Ie): FrontTop, FrontMiddle, FrontBottom, BackMiddle, Middle, HugeUnit
MAX_WIZARD_LEVEL (OT) = 59
MAX_PIPPET_LEVEL (JT) = 37
```

## Duel Stadium Rooms (module 88541, lines 62482–62669)

Static default config for the PvP Duel Stadium. Exported as `GM` (the config object) and `Ct` (disabled room style).

### Rooms
| ID | Name | Level Lock | Free Battles | Member Battles | Entry Cost | Prize |
|----|------|-----------|--------------|----------------|-----------|-------|
| `free-play` | Free Play | None | 1 | 1 | None | 50 gold |
| `moonlit-clash` | Moonlit Clash | 15 | 2 | 1 | 100 gold | 250 gold |
| `spell-masters` | Spell Masters | 40 | 1 | 2 | 250 gold | 500 gold |
| `boss-hunters` | Boss Hunters | 90 | 0 | 1 | 400 gold | 1000 gold |

**Cooldown:** 240 minutes between rounds.
**Config shape:** `enabled`, `cooldownTimeUtcMinutes`, `rooms[]` (each has `matchmakingBucket`, `usesElementalBoosts`, `forceBots`, `minBotDifficulty`, `maxBotDifficulty`)

### Ticket Type enum (module 88541, line 62491)
`Free, FreeUsed, Member, MemberUsed`

## Battle Config per Mode (module 52551, lines 63290–63309)

Two battle config modes indexed by `EBattleMode` (from module 78746):
- **`Home`** — Standard campaign/PvP (up to 8 players, 30s matchmaking, 5 stages/zone)
- **`QuickQuiz`** — Quick Quiz mode (up to 100 players, instant matchmaking)

### Home Battle Config highlights:
```json
{
  "xpPerOpponentDefeatedMultiplier": 0.5,
  "revive": { "initialRevives": { "NonMember": "Level0", "MemberCore": "Level1", "MemberPlus": "Level2" } },
  "matchSetup": { "maximumPlayers": 8, "matchmakingTimeMs": 30000 },
  "battleSetup": { "stagesPerZone": 5, "minEnemyLevel": 2, "enemyLevelVariance": 3 }
}
```

## CloudScript Message Routes (module 48417, lines 65212–65545)

Exported as `D` (an object of all `cloudscript function name` strings).

### Battle-specific routes (lines 65223–65265)
| Route Key | CloudScript Name | Purpose |
|-----------|-----------------|---------|
| `Battle.Start` | `battle.start` | Create battle on server |
| `Battle.Action` | `battle.action` | Send player action |
| `Battle.Resume` | `battle.resume` | Resume interrupted battle |
| `Battle.Escape` | `battle.escape` | Flee from battle |
| `Battle.ClearBattleState` | `battle.clearBattleState` | Clear stuck state |
| `Battle.Debug.KillGore` | `battle.debug.killGore` | Debug kill |
| `Battle.Debug.PreventDefeat` | `battle.debug.preventDefeat` | Debug god mode |
| `Battle.Debug.ForceBattleResult` | `battle.debug.forceBattleResult` | Force win/lose |
| `Battle.Debug.SimulateBattle` | `battle.debug.simulateBattle.start` | Server simulation |
| `Battle.Duel.SendInvite` | `battle.duel.sendInvite` | PvP invite |
| `Battle.Duel.Join` | `battle.duel.join` | Accept PvP invite |
| `Battle.Duel.CancelInvite` | `battle.duel.cancelInvite` | Cancel invite |
| `BattleStats.RecordEnd` | `battleStats.recordEnd` | Submit match stats |
| `BattleStats.GetBattleStats` | `battleStats.getBattleStats` | Fetch stats |

## XP Reward Calculator (class `I`, module 6452, lines 63230–63288)

Static class for XP calculations. Uses a 200-level cumulative XP curve baked into JSON.

### Methods
| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `getXpRewardForBattleUnit(unit, enemy, rewardConfig)` | 63240 | `(unit, enemy, config) => number` | Get XP based on enemy type |
| `getLevelCurve()` | 63259 | `() => { cumulativeXp: number[] }` | Full XP table |
| `getLevelFromCumulativeXp(xp, curve, minLevel)` | 63262 | `() => number` | Level from total stars |
| `getCurrentLevelProgressPercent(level, xp, curve, min)` | 63276 | `() => float 0-1` | Progress within current level |
| `getXpFromNextLevelProgressPercent(level, pct, curve, min)` | 63284 | `() => number` | XP at given progress |

### XP reward by unit type (line 63241–63254):
- Pet vs Summon → `mythic` config value; else → `base`
- Titan → `titan`
- Boss (repeatable dungeon/tower) → `repeatableBoss`; singular zone boss → `singularBoss`; Final boss Pippet → `finalBoss`; Final boss illusion → `illusionBoss`; Wizard → `cloakedWizard`
- Wizard type → `cloakedWizard`
- Miniboss → `miniBoss`

## Hook Points

- **`GameConstants.Battle.FORCE_CAST`** (line 71660) — Set to 0–N to force a spell index to always be cast (great for auto-battling)
- **`GameConstants.Battle.AUTO_ANSWER_CORRECT_PERCENT`** (line 71622) — Set to `1` to always answer correctly without showing questions
- **`GameConstants.Battle.ESCAPE_CHANCE`** (line 71656) — Set to `1` for guaranteed escape
- **`GameConstants.Battle.SKIP_ENEMY_TURN`** (line 71669) — Set to `true` for enemies to never act
- **`GameConstants.Debug.AUTO_RESOLVE_BATTLES_ENABLED`** (line 71613) — Auto-skip battle entirely
- **`GameConstants.Debug.WINNER_EVERY_TIME`** (line 71630) — Always win battles

## Cross-References

- [[battle-system]] — Uses these constants and enums throughout
- [[player-active-player]] — `f4b-0454` stores `dailyBattleTracker` which uses `dailyBattleLimit`
- [[membership]] — `859-25be` checked against `MEMBER_STARS_PERCENTAGE`
- [[education]] — `AUTO_ANSWER_CORRECT_PERCENT` controls math question outcome
