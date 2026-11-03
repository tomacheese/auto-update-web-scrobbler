# AGENTS.md

## Language

- Write all deliverables in English: commit messages, PR/Issue text, review comments, code comments and JSDoc, and documentation.
- Exceptions: user-facing strings that are intentionally localized, quotations, technical identifiers, external text, and generated files.
- Error messages are in English.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/); branches follow [Conventional Branch](https://conventional-branch.github.io) with short types (`feat`, `fix`, ...).

## Overview

A TypeScript CLI that two-way syncs the track information (title/artist/album) in the Web Scrobbler browser extension's LevelDB with a [fetch-youtube-bgm](https://github.com/tomacheese/fetch-youtube-bgm) server. Server tracks take precedence on merge; browser-only tracks are added to the server. Usage and configuration are documented in `README.md`.

## Commands

Package manager: pnpm (Node.js version in `.node-version`).

```bash
pnpm install        # install dependencies
pnpm dev            # run with watch mode (tsx)
pnpm start          # run once (tsx ./src/main.ts)
pnpm lint           # prettier --check, eslint, tsc
pnpm fix            # prettier --write and eslint --fix
pnpm test           # jest
pnpm compile        # tsc -p . (outputs to dist/)
pnpm package        # clean, compile, and bundle with ncc into output/
```

CI (`.github/workflows/nodejs-ci-pnpm.yml`) uses the shared `book000/templates` Node.js pnpm workflow. See `.github/workflows/release.yml` for the release build.

## Architecture

- `src/main.ts`: entry point. Loads config, reads server and browser tracks, merges them, writes browser then server.
- `src/config.ts`: `Configuration` (extends `ConfigFramework` from `@book000/node-utils`) reading `data/config.json`, with validation rules.
- `src/fyb.ts`: fetch-youtube-bgm API client (native `fetch`; `GET /api/tracks/`, `PATCH /api/tracks/{vid}`).
- `src/web-scrobber.ts`: Web Scrobbler LevelDB access via `level`. Reads from a temporary copy; writes to the original.

## Conventions

- Prettier (`.prettierrc.yml`: no semicolons, single quotes) and `@book000/eslint-config`.
- Do not enable TypeScript `skipLibCheck`.
- Document functions and interfaces with JSDoc.
- Logging uses `Logger` from `@book000/node-utils`. Log messages keep the existing emoji style; add emoji to new messages the same way.
- Tests: Jest, `**/*.test.ts`. Add tests for breaking changes and new features.
- When configuration options change, update the `IConfiguration` interface in `src/config.ts` and `README.md`.

## Safety and security

- Never commit API keys, passwords, tokens or other credentials, and never log sensitive data (personal information, tokens).
- `data/config.json` depends on the user's environment; keep load-time validation thorough.
- This tool writes Web Scrobbler's LevelDB directly. Take great care not to corrupt data.
- A locked LevelDB (browser running) cannot be written; the write is skipped. Do not break this behavior.
- Do not push additional commits to Renovate-created PRs.
