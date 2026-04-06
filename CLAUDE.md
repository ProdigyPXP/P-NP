# P-NP — Claude Configuration

## Project Overview

P-NP is a static patch pipeline for Prodigy Math Game. It runs as a GitHub Action every 2 hours, fetches the latest Prodigy game files, applies patches (hack injection points, auto-answer, lodash preservation, membership bypass), and commits the patched files to `dist/` on master.

The Prodigy Origin extension (in ProdigyPXP/ProdigyMathGameHacking) fetches the patched `game.min.js` from this repo's `dist/` directory on master.

### Architecture

- **src/patch.ts** — Core patcher. Fetches game files, applies regex-based patches, writes output.
- **src/constants.ts** — URLs, version, GUI link.
- **src/displayImages.ts** — Console splash images.
- **build.mjs** — esbuild build script.
- **.github/workflows/patch.yml** — GitHub Action: runs every 2 hours, builds and runs patcher, commits patched files to `dist/` on master.

### Key Technical Details

- **Build tool:** esbuild (NOT webpack)
- **Package manager:** pnpm
- **Runtime:** Node.js with ESM (`"type": "module"`)
- **Fetch timeout:** 30 seconds via AbortController
- **JavaScript validation:** `isJavaScript()` check before patching
- **Degraded mode:** If app/game variable detection fails, `patchDegraded: true` is set in metadata.json
- **Failure handling:** GitHub Action creates an issue on failure via `gh issue create`

## Critical Rules

1. **ZERO references to old organization.** Never use "ProdigyPNP", "afkvido", or "infinitezero.net". Always use "ProdigyPXP" and "alexey-max-fedorov".
2. **Keep git history** — no force pushes to master.
3. **Use pnpm**, never npm.
4. **Graceful degradation** — never crash silently. Set `patchDegraded` flag and create GitHub issues.
5. **30-second fetch timeout** on all network requests.

## Build Commands

```bash
pnpm install
pnpm build        # Builds with esbuild
node dist/patch.js  # Run patcher locally
```

## Output

The patcher writes to the output directory:
- `game.min.js` — Patched game with injected hack entry points
- `metadata.json` — Build metadata (version, hash, degraded status)
- `public-game.min.js` — Patched public game file (if available)
