# OmniRoute OpenCode Auto-Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically mirror every live, free, chat-capable OmniRoute model into the OpenCode `/models` picker via a hidden scheduled sync.

**Architecture:** Three small CommonJS modules in `C:\Users\ivanj\.config\opencode\omni-sync\` — pure filter, config writer, and orchestrator — driven by Node's built-in test runner. A hidden VBS launcher invoked by Task Scheduler runs the orchestrator at logon and every 5 minutes. The script hashes the desired model set and skips writes when nothing changed.

**Tech Stack:** Node.js (CommonJS, `fetch`, `node:test`, `node:assert`, `node:crypto`, `node:fs`), Windows Task Scheduler, VBScript launcher, PowerShell for env lookup.

**Spec:** `F:\Figma Project\docs\superpowers\specs\2026-11-17-omniroute-opencode-autosync-design.md`

## Global Constraints

- OmniRoute endpoint: `http://localhost:20128/v1/models`; auth header `Bearer <OMNIROUTE_API_KEY>`.
- Key source: Windows **User** environment variable `OMNIROUTE_API_KEY`, resolved at run time only.
- Config target: `C:\Users\ivanj\.config\opencode\opencode.jsonc`; mutate only `provider.omniroute.models`.
- Exactly one `auto`; zero `auto/*` combos.
- Free = `openrouter/` IDs containing `:free` or exactly `openrouter/openrouter/free`; all other providers require all `pricing` values 0/missing.
- Exclude non-chat names matching `embedding|image|transcribe|whisper|safeguard|audio|tts|video`.
- Exclude deprecated names matching `deprecat|degrad|legacy|sunset|retire`, plus `old` only as a `-`, `_`, or `/` bounded segment.
- Exclude dead prefixes `dva/`, `cxa/`, `aug/`, `no-think/dva/`, exact `agy/gemini-pro-agent`.
- Dedupe exact IDs case-insensitively; output sorted.
- Backup `opencode.jsonc.bak-sync-<yyyyMMdd-HHmmss>` before each write; write `.tmp` then rename.
- Empty catalog, HTTP error, bad JSON, missing/malformed config → nonzero exit, no write.
- Never log or persist the API key.
- Task runs hidden (VBS `Wscript.Shell.Run`, window style `0`), at logon + repeat every 5 minutes.
- Implementation files live outside the git repo; no git commit steps apply to them. Doc changes are committed in the repo.

## Review Focus

- **New provider appears automatically** → filter test with a fabricated `newprov/chat-model` row asserts inclusion.
- **Paid / non-chat / deprecated / dead / duplicate IDs never leak** → filter test asserts each is excluded.
- **Only the OmniRoute models object changes** → writer test asserts all other config text is byte-identical.
- **OmniRoute down or empty catalog must not wipe config** → orchestrator test with a dead port and empty fixture asserts no write + nonzero exit.
- **Second identical run must not touch config** → orchestrator test asserts `no-change` and unchanged mtime.

---

### Task 1: Pure filter module

**Files:**
- Create: `C:\Users\ivanj\.config\opencode\omni-sync\filter.js`
- Create: `C:\Users\ivanj\.config\opencode\omni-sync\test\filter.test.js`

**Interfaces:**
- Produces: `selectModelIds(rows) -> string[]` (sorted, deduped, always includes bare `auto`).
- Produces: `desiredHash(ids) -> string` (sha256 hex of `ids.join("\n")`).

- [ ] **Step 1: Write the failing test**

Create `test/filter.test.js` using `node:test` and `node:assert/strict`. Cover:
- input containing a new provider free chat row (`newprov/chat-model`) → included.
- `openrouter/foo:free` and `openrouter/openrouter/free` → included.
- `openrouter/foo` (paid) → excluded.
- `gemini/gemini-embedding-2` → excluded by name.
- `groq/whisper-large-v3` → excluded by name.
- `groq/model-old` and `groq/model-oldie` → `old` bounded segment excluded, `oldie` kept.
- `dva/anything` and `agy/gemini-pro-agent` → excluded.
- two identical IDs → one in output.
- output contains `auto` exactly once and no `auto/*`.
- `desiredHash(['a','b']) === desiredHash(['b','a'])` and differs for `['a']`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test "C:\Users\ivanj\.config\opencode\omni-sync\test\filter.test.js"`
Expected: FAIL with "Cannot find module ... filter.js"

- [ ] **Step 3: Implement `filter.js`**

Export exactly `selectModelIds` and `desiredHash`. Use `node:crypto`. Apply the Global Constraints rules in order: dead prefix → non-chat name → deprecated name → free check → dedupe. Chat capability: include when `output_modalities` contains `text`, or when it is absent and `supported_endpoints` contains `chat`. Keep `auto` as a literal prepended before dedupe.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test "C:\Users\ivanj\.config\opencode\omni-sync\test\filter.test.js"`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

No commit applies (implementation lives outside the repo).

---

### Task 2: Config writer module

**Files:**
- Create: `C:\Users\ivanj\.config\opencode\omni-sync\writer.js`
- Create: `C:\Users\ivanj\.config\opencode\omni-sync\test\writer.test.js`

**Interfaces:**
- Consumes: `selectModelIds(rows)` from Task 1.
- Produces: `rewriteModels(configText, desiredIds, rows) -> string` — full config text with only the OmniRoute models object replaced.
- Produces: `findModelsObject(text) -> {start, end} | null` — offsets of the models object inside `provider.omniroute`.

- [ ] **Step 1: Write the failing test**

Create `test/writer.test.js`. Fixture: a minimal config string with comments, `"plugin"`, `"provider": { "omniroute": { "options": {...}, "models": { "old-model": {...} } }, "other": {...} }`.
Assertions:
- `findModelsObject(fixture)` returns non-null offsets; text outside those offsets is unchanged after `rewriteModels`.
- rewritten text contains `"auto"` and `"newprov/chat-model"` and does NOT contain `"old-model"`.
- rewritten text still contains the plugin line and the `other` provider text verbatim.
- a second call with the same inputs returns byte-identical output.
- `findModelsObject('{}')` returns `null`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test "C:\Users\ivanj\.config\opencode\omni-sync\test\writer.test.js"`
Expected: FAIL with "Cannot find module ... writer.js"

- [ ] **Step 3: Implement `writer.js`**

Export exactly `findModelsObject` and `rewriteModels`. Locate `provider.omniroute.models` by scanning with a brace-depth counter that ignores braces inside strings and comments. Preserve the existing entry body verbatim when an ID already exists; for new IDs emit a minimal entry: `{ "name": "<id>", "reasoning": false, "temperature": true, "tool_call": true }` with `limit.context` from catalog `context_length` when present. Use 8-space indentation to match the current file.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test "C:\Users\ivanj\.config\opencode\omni-sync\test\writer.test.js"`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

No commit applies.

---

### Task 3: Orchestrator with idempotency and failure safety

**Files:**
- Create: `C:\Users\ivanj\.config\opencode\omni-sync\sync.js`
- Create: `C:\Users\ivanj\.config\opencode\omni-sync\test\sync.test.js`

**Interfaces:**
- Consumes: `selectModelIds`, `desiredHash` from Task 1; `rewriteModels` from Task 2.
- Produces: `run({ configPath, statePath, logPath, baseUrl, key }) -> Promise<{status: 'no-change'|'updated'|'error', added:number, removed:number}>`.
- Module must not execute `run()` when required by tests (`require.main === module` guard).

- [ ] **Step 1: Write the failing test**

Create `test/sync.test.js` with a tiny local HTTP fixture server (`node:http`) serving `{data:[...]}`. Use temp dirs for config/state/log. Assertions:
- first run → `status:'updated'`, config models replaced, backup file exists, log line contains `updated`.
- second run with same fixture → `status:'no-change'`, config read-modify-write count unchanged (track with a monkeypatched fs write counter or mtime).
- server returns `{data:[]}` → `status:'error'`, config byte-identical.
- server refused (dead port) → `status:'error'`, config byte-identical.
- log content never contains the key passed in `options.key`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test "C:\Users\ivanj\.config\opencode\omni-sync\test\sync.test.js"`
Expected: FAIL with "Cannot find module ... sync.js"

- [ ] **Step 3: Implement `sync.js`**

Export `run` only. Steps inside `run`: fetch with `Authorization: Bearer ${key}`; parse JSON; reject non-200/empty; call `selectModelIds`; compute hash; compare with `state.json`; on equal return `no-change`; else back up config, call `rewriteModels`, write `.tmp`, rename, write state, append one log line. Catch all errors → log `error: <short message>` (never the key), return `status:'error'`. Exit nonzero when `require.main === module` and status is `error`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test "C:\Users\ivanj\.config\opencode\omni-sync\test\sync.test.js"`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

No commit applies.

---

### Task 4: Hidden launcher, scheduled task, and live smoke test

**Files:**
- Create: `C:\Users\ivanj\.config\opencode\omni-sync\run.vbs`

**Interfaces:**
- Consumes: `sync.js` from Task 3.

- [ ] **Step 1: Write the launcher**

`run.vbs` must: resolve User env `OMNIROUTE_API_KEY` via a hidden PowerShell call, set it in the child environment, then run `node "<path>\sync.js"` with `Wscript.Shell.Run(cmd, 0, False)`. Never echo the key. Use absolute paths.

- [ ] **Step 2: Verify hidden behavior**

Run: `wscript.exe "C:\Users\ivanj\.config\opencode\omni-sync\run.vbs"`
Expected: command returns immediately; no new visible `conhost.exe`/`cmd.exe`/`powershell.exe` window; `sync.log` gains a line.

- [ ] **Step 3: Register the scheduled task**

PowerShell (elevated if needed):
```powershell
$a = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument '"C:\Users\ivanj\.config\opencode\omni-sync\run.vbs"'
$t = New-ScheduledTaskTrigger -AtLogOn
$r = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
Register-ScheduledTask -TaskName 'OmniRoute OpenCode Model Sync' -Action $a -Trigger @($t,$r) -Force
```
Expected: `Get-ScheduledTask -TaskName 'OmniRoute OpenCode Model Sync'` shows `Ready`.

- [ ] **Step 4: Live smoke test**

Run sync once, then:
```powershell
(opencode models 2>&1 | Where-Object { $_ -match '^omniroute/' }).Count
opencode run -m omniroute/auto "Reply exactly: SYNC-OK"
```
Expected: 38 models, `auto` present once, output `SYNC-OK`.

- [ ] **Step 5: Commit**

Commit any changed docs in the repo with message `docs: add OmniRoute auto-sync implementation plan`.

---

## Self-Review

- Spec coverage: every spec section maps to Task 1 (filter), Task 2 (writer), Task 3 (safety/idempotency), Task 4 (hidden trigger + smoke). No gaps.
- Step scan: each step has one checkable result; no placeholder lines.
- Type consistency: `selectModelIds`, `desiredHash`, `rewriteModels`, `findModelsObject`, `run` used consistently.
- Review Focus: all five conditions have a pinned test or verification step.
- Proportion: plan is compact relative to the spec; no full program bodies included.
