# Copilot code review instructions

See `AGENTS.md` for project overview, commands, conventions and safety rules. Review in English.

## Review points

- Error handling: no swallowed exceptions in LevelDB operations or API calls; failures are logged and skipped appropriately.
- Data corruption: merge and write logic must not destroy existing LevelDB data, and the skip-when-locked behavior must be preserved.
- Config validation: `data/config.json` loading is validated sufficiently.
- Tests are added or updated for breaking changes and new features.
- `src/config.ts` and `README.md` are updated when configuration options change.
- No hard-coded credentials, and no sensitive data in logs.

## Do not flag

- Emoji in log or error messages (intentional existing style).
- Code without semicolons (Prettier configuration).
