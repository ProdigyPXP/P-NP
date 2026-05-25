# P-NP

P-NP is the static patch pipeline that powers **Play Origin** (the browser-extension mod loader, formerly "Prodigy Origin"). It's maintained by ProdigyPXP. The repo name `P-NP` is kept as-is — the rebrand is to the extension/loader, not this patcher.

The repository no longer runs an HTTP server. Instead, a GitHub Action fetches current Prodigy assets, applies the patcher logic, and pushes the patched files to a dedicated `patched` branch so they can be served from `raw.githubusercontent.com`.

## Architecture (v4.4.0+)

The patcher's primary artifact is `dist/manifest.json` — a small JSON file containing:

- `schemaVersion` — manifest schema version for compatibility checks.
- `patcherVersion` — version of this patcher that produced the manifest.
- `rules` — ordered list of regex find/replace rules applied to `game.min.js`.
- `prefix` — pre-rendered JS string prepended to the patched game.
- `suffix` — pre-rendered JS string appended after the patched game.
- `defaultMenuUrl` — default menu/loader URL used by consumers when patching.
- `hash` — content hash of `{rules, prefix, suffix, defaultMenuUrl}` for cache invalidation.

The Play Origin extension fetches this manifest, fetches the original `game.min.js`
from `code.prodigygame.com`, applies the rules locally in its background service
worker, wraps with prefix/suffix, and caches the result in `chrome.storage.local`.

`dist/game.min.js` is still produced as a verification copy so this repo's history
stays auditable, but the extension no longer fetches it.

## How It Works

1. `.github/workflows/patch.yml` runs every 2 hours (cron) and on manual dispatch.
2. The workflow builds this project with `pnpm` + `esbuild`.
3. `src/patch.ts` fetches:
   - loader HTML from `https://math.prodigygame.com/load`
   - `game.min.js` from `https://code.prodigygame.com`
   - the matching `public-game.min.js`
4. The patcher writes static output files:
   - `game.min.js`
   - `public-game.min.js`
   - `metadata.json` (includes `patchDegraded` flag if patches failed)
5. The workflow commits those files to the `patched` branch.
6. If the workflow fails, a GitHub issue is automatically created.

## Features

- **30-second fetch timeout** on all network requests
- **JavaScript validation** before patching to catch unexpected responses
- **Degraded patch detection** - if core regex patterns fail, `patchDegraded: true` is set in metadata.json
- **Error handling** throughout the build and patch pipeline

## Local Usage

Requirements:
- Node.js 20+
- pnpm

Install and build:

```sh
pnpm install
pnpm build
```

Run patch locally:

```sh
pnpm run patch
```

Optional custom output directory:

```sh
node dist/patch.js ./patched-output
```

## Static File URLs

After the Action publishes to the `patched` branch, files are available at:

- `https://raw.githubusercontent.com/ProdigyPXP/P-NP/patched/game.min.js`
- `https://raw.githubusercontent.com/ProdigyPXP/P-NP/patched/public-game.min.js`
- `https://raw.githubusercontent.com/ProdigyPXP/P-NP/patched/metadata.json`

## License

MPL-2.0
