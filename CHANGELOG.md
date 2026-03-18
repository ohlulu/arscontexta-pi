# Changelog

All notable changes to this project will be documented in this file.

Based on [Keep a Changelog](https://keepachangelog.com/).

## Unreleased

### Added
- Session transcript capture on shutdown — saves conversation to `ops/sessions/<timestamp>.md` with user/assistant text and tool call summaries, enabling `/remember --mine` to scan for friction patterns.

### Fixed
- Maintenance signal for unprocessed sessions no longer fires false positives — now counts unmined `.md` transcripts instead of `.json` timestamp files.
- Restored `../../reference/` paths in skills (one level was missing after repo flatten).
- Use `npm` instead of `bun` for qmd install (`bun` lacks SQLite vec support).

### Changed
- Setup skill skips vault `.pi/skills/` generation when plugin skills are already mounted via `settings.json`, preventing name collisions on startup.
- README documents the skill collision scenario and how to resolve it.

### Docs
- Added English diff report (`docs/DIFF-REPORT.md`) comparing pi port to original Claude Code plugin.
- Added fork attribution in LICENSE and README.

## [0.1.0] — 2026-03-16

First release as a pi coding agent skill pack. Ported from [arscontexta](https://github.com/agenticnotetaking/arscontexta) Claude Code plugin v0.8.0.

### Added
- Ported all 26 skills to `skills/` with pi-compatible frontmatter and relative paths.
- TypeScript extension (`extensions/arscontexta-hooks/`) replacing 5 bash scripts + hooks.json:
  - Session orient: injects vault tree, identity, goals, maintenance signals on session start.
  - Write validate: schema enforcement on notes (description, topics, frontmatter) — covers both write and edit tools.
  - Auto commit: debounced git auto-commit (2s batching, scoped staging, `session_shutdown` flush).
- Cross-project vault access via `~/.config/arscontexta.yaml` (`default_vault` key).
- `resolveVaultPath()`: detects vault from cwd `.arscontexta` marker OR global config.
- Vault path resolution header in 25 skills (help excluded) for cross-project operation.
- `knowledge-guide` agent definition in `agents/`.
- 321 reference files: kernel spec, 249 methodology claims, generators, presets, templates.
- `README.md` with pi installation guide.
- `LICENSE` (MIT).

### Changed
- Skills: `${CLAUDE_PLUGIN_ROOT}` → relative paths (`../reference/`).
- Skills: removed `context: fork`, `model: opus/sonnet`, `argument-hint` from frontmatter.
- Skills: `mcp__qmd__*` MCP tool calls → `qmd` CLI (via bash tool). Fallback: qmd CLI → grep.
- Skills: `allowed-tools` cleaned — removed MCP entries, standardized to `Read, Write, Edit, Grep, Glob, Bash`.
- Skills: `/arscontexta:*` command prefix → `/skill:*`.
- Skills: all `.claude/` path references → `.pi/` (setup, upgrade, reseed, architect, add-domain).
- Setup skill: hooks generation section rewritten — bash scripts → extension install guidance.
- Setup skill: "Restart Claude Code" → "Run `/reload`".
- Extension: `execSync` string interpolation → `execFileSync` array args (shell injection fix).
- Extension: `git add -A` → scoped `git add -- <file>` (prevents unrelated changes from being committed).
- Extension: auto-commit debounced to 2s to eliminate git lock race on rapid writes.

### Removed
- `.claude-plugin/` (plugin.json, marketplace.json) — pi doesn't use plugin manifests.
- `hooks/` (hooks.json + 5 bash scripts) — replaced by TypeScript extension.
- `platforms/` (20 files) — multi-platform adapter layer; pi is the only target.
- `scripts/sync-thinking.sh` — replaced by git version control.
- `skill.json` files (26) — pi reads SKILL.md frontmatter only.
- ~~Session capture Stop hook~~ — restored in Unreleased as transcript capture on `session_shutdown`.

### Known Differences from Original
- `context: fork` not available in pi — pipeline isolation handled by ars contexta ralph skill's subagent instructions; standalone heavy skills (setup, reseed) run in current context.
- `model: opus/sonnet` not available in pi — model selection is user-controlled.
- qmd MCP tier removed — CLI tier is functionally equivalent.
- Reference docs retain historical `mcp__qmd` mentions (documentation, not executable code).
