---
domain: economy
module_ids: [137171, 23283, 41674]
line_range: [137171, 137317, 201194, 202713]
service_ids: ["fa8-1c91", "3e5-dac1", "0b9-1977"]
status: complete
last_updated: 2026-04-13T16:30:00.000Z
---

# Economy — Prize Wheel System

> RouletteRespinComponent module (around line 137171). Wheel analytics in the Segment analytics module (lines 201194–202713).

## Overview

The Prize Wheel is the primary economy sink/source event in the open world. Players spin wheels to win items; members get extra spins. The system has multiple wheel types (Wonder Wheel, Twilight Wheel, Lucky Loot, Prize Wheel, Festival Prize Wheel). Each spin is tracked via Segment analytics with transaction IDs for audit. Respins can be purchased with Magicoin or other currencies. The `PrizeWheel` UI component (EVk registered as `"PrizeWheel"`) opens the classic wheel; festival wheels are separate components.

## Wheel Types (module 23283, line 201201)

```js
WheelType = {
  WheelOfWonder: "Wheel of Wonder",  // wheelId = 1, daytime open-world wheel
  TwilightWheel: "Twilight Wheel",   // wheelId = 2, night-only open-world wheel
  LuckyLoot: "Lucky Loot",           // dungeon/rift reward spin
  PrizeWheel: "Prize Wheel"          // generic zone prize wheel
}
```

## Access Pattern

```js
// Spin the wonder wheel from code:
const pw = _.instance.prodigy.gameContainer.get("824-bd4f")
  .get("PrizeWheel"); // prefab component
// or via zone:
zone.openWheel(screen, zone.prizeWheelId);

// Check if player can spin wheel 1 (Wonder Wheel):
const player = _.instance.prodigy.gameContainer.get("f4b-0454");
player.canSpin(1);

// Force-allow unlimited spins:
// Override canSpin to always return true
const origCanSpin = player.canSpin.bind(player);
player.canSpin = () => true;
```

## Key Classes & Functions

| Minified Name | Inferred Name | Line | Purpose |
|---|---|---|---|
| `OA` | `ResetBossRewardsComponent` / ResPin component | 137171 | Roulette respin UI handling |
| `xA` / `MA` | `PrizeWheelComponent` | 137299 | Open-world prize wheel opener (EVk "PrizeWheel") |
| `dt` (in analytics module) | `EconomySegment` | 202629 | Analytics for prize wheel and minigame events |

## PrizeWheelComponent (line 137299)

Registered as EVk `"PrizeWheel"` in `C.YH6.ui` category.

Constants:
- `WONDER_WHEEL_ID = 1`
- `TWILIGHT_WHEEL_ID = 2`

| Method | Line | Notes |
|---|---|---|
| `openWheel(wheelId?)` | 137306 | Opens Wonder Wheel or Twilight Wheel popup. Twilight Wheel only opens if `isNightTime()` returns true |

Injected:
- `_loggedInPlayer` via `3e5-dac1`

## ResetBossRewardsComponent / Respin (lines 137171–137222)

Handles currency respins on the Roulette (Lucky Loot). Reads `CurrencyId` and `RespinCost` from injected values, configures `MakePaymentComponent`, calls `PaymentManager.spend()` on button click.

- Respin cost is paid via `PaymentManager` (`0b9-1977`)
- Analytics: `_segment.economy.sendPrizeWheelSpinFailedEvent()` or `_segment.rifts.sendRiftsPrizeWheelSpinFailedEvent()` on failure

## Player Spin Tracking (lines 73648–73665)

Spin state is persisted per wheel ID in `player.data`:
- `spinDate{wheelId}` — date string of last spin
- `numSpins{wheelId}` — spin count today

Reset logic: If `spinDate{wheelId}` differs from today, reset counter to 0.

Members get 2 spins/day (1 free + 1 member), non-members get 1. Wheel ID 3 uses different logic — only one spin total, plus member gets a second.

## Economy Analytics Segment (lines 202629–202713)

Class `dt` extends `B.v` (base analytics provider).

| Method | Line | Signature | Analytics Event |
|---|---|---|---|
| `sendMinigameEvent(name, started, extra?)` | 202663 | `(string, boolean, object?) => void` | "Minigame Started" / "Minigame Completed" |
| `sendPrizeWheelSpunEvent(type, instanceType?, extra?)` | 202676 | `(WheelType, InstanceType, object) => void` | "Prize Wheel Spun" |
| `sendPrizeWheelSpinFailedEvent(type, reason, instanceType?, extra?)` | 202690 | `(WheelType, FailReason, InstanceType, object) => void` | "Prize Wheel Spin Failed" |
| `sendGoalAchievedEvent(name, id, type, system, repeatable?, extra?)` | 202698 | multi-param | "Goal Achieved" |
| `getCurrentMinigameInstanceID()` | 202630 | `() => string` | UUID for analytics correlation |
| `getCurrentPrizeWheelInstanceID()` | 202636 | `() => string` | UUID for analytics correlation |
| `getCurrentPrizeWheelTransactionID()` | 202639 | `() => string` | Transaction UUID for item receipt correlation |
| `getCurrentPrizeWheelSpinID()` | 202642 | `() => string` | Spin UUID |

Access:
```js
const segment = _.instance.prodigy.gameContainer.get("fa8-1c91");
segment.economy.sendPrizeWheelSpunEvent("Prize Wheel");
```

## Minigame Economy Integration

The economy analytics segment also covers in-game minigames that award gold:
- `floatling-fling` — referenced at line 89147
- `dance-dance` — referenced at line 188051
- `dino-dig` — referenced at line 188583

These call `segment.economy.sendMinigameEvent(name, success)` on completion.

## Hook Points

- **`player.canSpin(wheelId)`** at line 73654 — override to return `true` for unlimited spins
- **`player.spinWheel(wheelId)`** at line 73651 — incrementing counter; intercept to not consume spins
- **`PrizeWheelComponent.openWheel()`** at line 137306 — patch Twilight Wheel time check by overriding `isNightTime()`
- **`PaymentManager.spend()`** (`0b9-1977`) — intercept to allow free respins

## Cross-References

- [[economy-currency-and-payment]] — all spins go through PaymentManager; gold changeGold used for coin cost
- [[player-active-player]] — spin date/count stored on player data; `canSpin` / `spinWheel` methods on Player class
- [[membership-service]] — member status determines extra spin eligibility
- [[zones-world-manager]] — `zone.openWheel()` opens the wheel from the map screen
