# P-NP

P-NP is a static patch pipeline for Prodigy game files maintained by ProdigyPXP.

The repository no longer runs an HTTP server. Instead, a GitHub Action fetches current Prodigy assets, applies the patcher logic, and pushes the patched files to a dedicated `patched` branch so they can be served from `raw.githubusercontent.com`.

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
