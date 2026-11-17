# OmniRoute → OpenCode model auto-sync design

Date: 2026-11-17
Status: design approved in chat; awaiting written-spec review

## Intent

When a provider is added, removed, or changed in OmniRoute, the OpenCode `/models`
picker under the `omniroute` section must automatically reflect the live, free,
chat-capable models from every active provider. No manual regeneration step.

## Success criteria

- New provider added in OmniRoute → its free chat models appear in `/models`
  without the user running a command.
- Removed provider → its models disappear from `/models`.
- Paid models, non-chat models (embedding/image/audio/transcribe), dead prefixes,
  deprecated/degraded names, and duplicate IDs never appear.
- Exactly one `auto` entry; no `auto/*` combos.
- No visible console/`shell.exe` window when sync runs.
- If OmniRoute is down or the API errors, the OpenCode config is left unchanged.

## Constraints

- OmniRoute local API: `http://localhost:20128/v1/models`, authenticated with
  `OMNIROUTE_API_KEY` from the Windows **User** environment.
- OpenCode config: `C:\Users\ivanj\.config\opencode\opencode.jsonc`.
- Only the `provider.omniroute.models` object is mutated. All other config
  (plugin list, default model, provider options, other providers) is preserved.
- The router API key must never be written into logs, state files, or the spec.
- User explicitly does not want extra shell windows.

## Non-goals

- Editing OmniRoute connections or settings.
- Changing OpenCode's default model.
- Live-testing every model on every sync (429 from exhausted OpenRouter credits
  would cause false removals). Liveness = presence in the live catalog.

## Architecture

Single-purpose sync script + hidden Windows scheduled task. Polling, not event
hooks: OmniRoute has no provider-add webhook, and watching its SQLite DB is noisy.

### Files

| Path | Purpose |
| --- | --- |
| `C:\Users\ivanj\.config\opencode\omni-sync\sync.js` | Node script. Fetches catalog, computes desired set, writes config only on change. |
| `C:\Users\ivanj\.config\opencode\omni-sync\run.vbs` | Hidden launcher (`Wscript.Shell.Run`, window style 0). |
| `C:\Users\ivanj\.config\opencode\omni-sync\state.json` | SHA-256 of the desired sorted model-ID set from the last successful write. |
| `C:\Users\ivanj\.config\opencode\omni-sync\sync.log` | Append-only: timestamp, pass/fail, added/removed counts. No secrets. |
| Task Scheduler task `OmniRoute OpenCode Model Sync` | Runs `wscript.exe run.vbs` at logon and every 5 minutes. |

### Data flow

1. Read `OMNIROUTE_API_KEY` from User env via `[Environment]::GetEnvironmentVariable`
   equivalent in Node (`process.env` inherited from the scheduled task's environment
   is unreliable, so the script reads the registry value through a tiny PowerShell
   call, or the task is created with the env var in its launch command). Preferred:
   the VBS launcher calls PowerShell to fetch the User env var and passes it to Node
   as an environment variable for that process only.
2. `GET /v1/models`, parse `data[]`. Each entry has `id`, `input_modalities`,
   `output_modalities`, `capabilities`, `pricing`, `custom`, `type`, `subtype`.
3. Filter to desired model IDs.
4. Compute `sha256(sorted(ids).join("\n"))`.
5. If hash equals `state.json.hash` → log `no-change`, exit 0. No config write.
6. Otherwise:
   - Back up `opencode.jsonc` to `opencode.jsonc.bak-sync-<yyyyMMdd-HHmmss>`.
   - Replace only the `provider.omniroute.models` object with entries for the
     desired IDs. Preserve existing entry bodies where the ID already existed;
     synthesize a minimal entry for new IDs from catalog metadata.
   - Atomic write: write to `.tmp`, then rename over the target.
   - Write `state.json` with the new hash.
   - Log `updated: +N -M`.

### Filter rules (exact)

Include an ID if ALL of the following hold:

- It is `auto` (exactly one, always included) OR it is a catalog model.
- It is not a known dead prefix: `dva/`, `cxa/`, `aug/`, `no-think/dva/`,
  and not the exact dead entry `agy/gemini-pro-agent`.
- It is chat-capable: `output_modalities` contains `text`, or (when the field is
  absent) `supported_endpoints` contains `chat`. Exclude IDs whose name matches
  `embedding|image|transcribe|whisper|safeguard|audio|tts|video`.
- It is free:
  - `openrouter/` IDs: name contains `:free` or equals `openrouter/openrouter/free`.
  - all other providers: `pricing` values are all 0 / missing.
- Its name does not match `deprecat|degrad|legacy|sunset|retire`, nor an
  `old` segment bounded by `-`, `_`, or `/` (avoids false hits like `threshold`).
- Its ID has not already been added (exact-string dedupe, case-insensitive).

Exclude every `auto/*` combo.

### Error handling

| Condition | Behavior |
| --- | --- |
| OmniRoute unreachable / non-200 / bad JSON | Log `error: <short reason>`, exit 1, no write. |
| Empty catalog | Treat as error, no write. Never wipe the config. |
| Config missing / malformed | Log error, exit 1, no write. |
| Backup or rename fails | Abort before replacing target; leave old file intact. |
| Duplicate IDs in generated set | Dedupe before hashing and writing. |

### Security

- Never log the API key. Never write it into `state.json`, `run.vbs`, or the log.
- The scheduled task launches a hidden VBS that resolves the key at run time.
- The script only writes inside `C:\Users\ivanj\.config\opencode\omni-sync\` and
  `opencode.jsonc` (+ its `.bak-sync-*` backups).

## Testing strategy

- Unit-style fixture test: feed a fabricated catalog containing a new provider,
  a paid model, an embedding model, a deprecated name, a dead prefix, and a
  duplicate; assert the desired set is exactly correct.
- Idempotency test: run sync twice against a fixed catalog; second run must log
  `no-change` and must not touch the config.
- Failure test: point script at a dead port; assert no write and nonzero exit.
- Live smoke test: add nothing to OmniRoute; run sync once; assert `/models`
  still shows exactly 38 entries and `auto` works via `opencode run`.

## Risks

- OpenCode may need a restart to pick up config changes; verify with
  `opencode models` in a fresh process. If hot-reload works in the TUI, note it.
- Polling every 5 minutes means up to 5 minutes before a new provider appears.
  Acceptable per user approval.
- If OmniRoute catalog includes a provider with paid-only models, that provider
  contributes zero picker entries (correct: user wants free only).
