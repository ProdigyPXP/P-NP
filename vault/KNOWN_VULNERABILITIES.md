# Known Vulnerabilities — Prodigy 2026.18.1

## Client-Side Trust Issues

**1. DI container is globally accessible at runtime**
`M.q.instance.prodigy.gameContainer` is reachable from the browser console. `get(id)` returns live singleton instances — every service can be patched post-boot with no auth required.

**2. `GameConstants` is a plain mutable object**
`GameConstants.Battle.AUTO_RESOLVE_BATTLES_ENABLED`, `WINNER_EVERY_TIME`, `SKIP_ENEMY_TURN`, `FORCE_CAST`, `AUTO_ANSWER_CORRECT_PERCENT` — all writable at runtime. No integrity check.

**3. Membership is a getter on a singleton with no tamper detection**
```js
Object.defineProperty(gameContainer.get("859-25be"), 'isMember', { get: () => true })
```
No server re-validation of membership state mid-session. The protobuf `Membership.active` field is also decoded client-side with no signature.

**4. `PaymentManager.spend()` is not server-authoritative for gold**
Gold lives on `player.data.gold` (client object). `changeGold(delta)` writes locally and queues a save. Patching `spend()` to no-op prevents deduction; the next `updateCharacter()` save will persist the unmodified balance.

**5. Education answers are interceptable before network**
`EducationService.answerQuestion()` is a single override point to force `wasCorrect: true` into every submission. The network call (`e2e-9e38.answerQuestion`) carries the already-processed result — the server trusts the client's correctness flag.

**6. Battle is server-authoritative — but the client controls entry config**
`SecureBattleRevamp.startBattleRequest(config, mods)` passes `mods` to the server. The server applies them. Mods like `skipEnemyTurn` or `forceCorrect` are client-supplied.

**7. Daily limits are tracked on the client-side player object**
`player.daily._isDailyBattleComplete` is a plain map. Clearing it bypasses the daily battle cap. No server-side enforcement on limit state.

**8. Zone locks are purely client-side UI**
`WorldMap.isZoneLocked()` controls the lock UI only. `world.it(mapKey)` teleports without any lock check — you can teleport to any zone string directly.

**9. Dark Tower member gate is a single method on the player**
`player.isBlockedByDarkTowerMemberGate()` — returns a bool. One override bypasses floors 1–100 member requirements.

**10. Quest completion is injectable**
`processQuestProgressResponse()` accepts a fabricated response object. Passing a fake "task complete" triggers full reward flow (items, teleport, dialogue) locally.

**11. SecureInventory ownership is faked via `getCount()`**
`secInv.getCount({ type, id })` is the sole check for "do you own this premium item." It reads from a local cache populated at login — override the method or poison the cache at `initialize()`.

**12. Festival activation is a writable property**
`WeekendEvents._activeFestival` — write any festival object to activate it regardless of date. Store IDs are hardcoded constants in the bundle.

**13. `debugSetMembership()` stub exists in production**
Line 75758 — empty function body, callable via the in-game debug command `SetMembership`. Inject an implementation to set `_data` directly without touching getters.

---

## Structural Weaknesses

- **No JS integrity verification** — the patcher injects arbitrary code and the game runs it
- **No runtime anti-tamper** on DI container bindings post-boot (only a T2C/C2T message monitor in `Boot.update()` for cheat engine detection, not JS patching)
- **Protobuf layer is pure client decode** — `Membership.decode`, `Character.decode`, `Spell.decode` all run locally; intercepting these gives full save data access at login
- **All 120+ service IDs are string literals** embedded in the bundle — enumerable, greppable, and stable across sessions
