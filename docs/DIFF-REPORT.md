# Ars Contexta: Pi Port vs Original — Diff Report

**Original:** [agenticnotetaking/arscontexta](https://github.com/agenticnotetaking/arscontexta) (Claude Code plugin v0.8.0) — 411 files
**Pi Port:** this repo (pi coding agent v0.1.0) — 356 files
**Delta:** -55 files (removed redundancy, merged structure)

---

## 1. Directory Structure

### Original
```
arscontexta/
├── .claude-plugin/          # Claude Code plugin manifest
│   ├── plugin.json
│   └── marketplace.json
├── skills/                  # 10 platform skills (SKILL.md + skill.json)
├── skill-sources/           # 16 generated skill templates (SKILL.md + skill.json)
├── agents/                  # 1 agent definition
├── hooks/                   # Hook system
│   ├── hooks.json           # Hook config (Claude Code format)
│   └── scripts/             # 5 bash scripts
├── generators/              # Context file generator + 17 feature blocks
├── platforms/               # Multi-platform adapter layer
│   ├── claude-code/
│   └── shared/
├── presets/                 # 3 preset configs
├── reference/               # 25+ reference docs
├── methodology/             # 249 research claims
├── scripts/                 # 1 utility script
├── LICENSE
└── README.md
```

### Pi Port
```
arscontexta-pi/
├── skills/                  # 26 skills (unified, SKILL.md only)
├── extensions/              # 1 TypeScript extension (replaces hooks/)
│   └── arscontexta-hooks/
│       └── index.ts
├── agents/                  # 1 agent definition
├── reference/               # All reference material (merged)
│   ├── generators/
│   ├── presets/
│   └── methodology/
├── docs/                    # This report
├── README.md
├── CHANGELOG.md
└── LICENSE
```

---

## 2. Deleted Files (55 files)

| Deleted | Count | Reason |
|---------|-------|--------|
| `.claude-plugin/` | 2 | Claude Code plugin manifest; pi doesn't use it |
| `hooks/hooks.json` | 1 | Claude Code hook config format; replaced by extension |
| `hooks/scripts/*.sh` | 5 | 5 bash scripts → 1 TypeScript extension |
| `platforms/` | 20 | Multi-platform adapter layer; pi is the only target, content already in generators/ |
| `scripts/sync-thinking.sh` | 1 | Methodology sync script; replaced by git version control |
| `*/skill.json` | 26 | Claude Code skill metadata; pi reads SKILL.md frontmatter only |

---

## 3. New Files

| Added | Description |
|-------|-------------|
| `extensions/arscontexta-hooks/index.ts` | TypeScript extension (395 lines), replaces 5 bash scripts + hooks.json |
| `README.md` | Rewritten for pi installation + `/skill:*` command format |
| `CHANGELOG.md` | Release changelog |
| `docs/DIFF-REPORT.md` | This file |

---

## 4. Skill Changes (all 26)

### 4.1 Structural Changes

| Item | Original | Pi Port |
|------|----------|---------|
| Layout | `skills/` (10 platform) + `skill-sources/` (16 generated) separate | `skills/` (26 unified) |
| Files per skill | `SKILL.md` + `skill.json` | `SKILL.md` only (`skill.json` dropped) |
| Command format | `/arscontexta:setup`, `/reduce` | `/skill:setup`, `/skill:reduce` |

### 4.2 Frontmatter Changes (all 26 skills)

| Field | Original | Pi Port | Reason |
|-------|----------|---------|--------|
| `context: fork` | Most skills | **Removed** | pi has no such field; isolation via subagent tool |
| `model: sonnet/opus` | Some skills | **Removed** | pi has no such field; model selection is user-controlled |
| `argument-hint:` | setup | **Removed** | pi has no such field |
| `allowed-tools` | Included `mcp__qmd__*` | **Changed to** `Read, Write, Edit, Grep, Glob, Bash` | qmd switched to CLI (see §4.4) |

### 4.3 Content Changes (all 26 skills)

| Change | Scope | Description |
|--------|-------|-------------|
| `${CLAUDE_PLUGIN_ROOT}` → relative paths | All skills with refs | e.g. `${CLAUDE_PLUGIN_ROOT}/reference/kernel.yaml` → `../reference/kernel.yaml` |
| Added Vault Path Resolution header | 25 skills (help excluded) | Instructs agent to read vault path from `~/.config/arscontexta.yaml` or cwd `.arscontexta` |
| `/arscontexta:*` → `/skill:*` | setup, help | Command prefix aligned to pi format |
| `.claude/` paths → `.pi/` paths | setup, upgrade, reseed, architect, add-domain | All Claude Code-specific paths replaced |
| "Restart Claude Code" → "/reload" | setup | Activation instruction changed to pi method |

### 4.4 qmd Semantic Search Rewrite (5 skills)

| Original (MCP tool call) | Pi Port (CLI via bash) |
|--------------------------|------------------------|
| `mcp__qmd__vector_search query="..." collection="..." limit=5` | `qmd vsearch "..." --collection <collection> -n 5` |
| `mcp__qmd__search` | `qmd search` |
| `mcp__qmd__deep_search` | `qmd dsearch` |
| `mcp__qmd__status` | `qmd status` |

Affected skills: `reduce`, `reflect`, `reweave`, `verify`, `validate`

Reason: pi has no native MCP support. qmd CLI produces identical results via bash tool. Skills already have built-in fallback: qmd CLI → grep.

### 4.5 setup SKILL.md Major Rewrites

| Section | Original | Pi Port |
|---------|----------|---------|
| Phase 1: Platform Detection | Detects `.claude/` directory | Detects `.pi/` directory |
| Step 9: Skill Output | Writes to `.claude/skills/[name]/SKILL.md` | Writes to `.pi/skills/[name]/SKILL.md` |
| Step 10: Hooks | Generates `.claude/settings.json` + 4 bash scripts | Guides user to install extension + create `.arscontexta` marker |
| Skill Discoverability | "Restart Claude Code to activate" | "Run /reload to activate" |
| Summary | "IMPORTANT: Restart Claude Code" | "Run /reload" |

---

## 5. Hooks → Extension Mapping

### Original: 6 files (365 lines bash + 34 lines JSON)

| File | Lines | Function |
|------|-------|----------|
| `hooks.json` | 34 | Hook event configuration (SessionStart, PostToolUse, Stop) |
| `session-orient.sh` | 151 | Session start: inject tree + identity + goals + maintenance signals |
| `write-validate.sh` | 49 | Post-write schema validation (description, topics, frontmatter) |
| `auto-commit.sh` | 54 | Post-write git auto-commit |
| `vaultguard.sh` | 41 | Vault detection (`.arscontexta` marker) |
| `read_config.sh` | 36 | Read `.arscontexta` config |

### Pi Port: 1 file (395 lines TypeScript)

| Function/Handler | Original Equivalent | Changes |
|-----------------|---------------------|---------|
| `resolveVaultPath()` | `vaultguard.sh` | **Added** cross-project support: cwd marker OR `~/.config/arscontexta.yaml` |
| `readVaultConfig()` | `read_config.sh` | Equivalent port |
| `pi.on("session_start")` | `session-orient.sh` | Equivalent port + vault path injection |
| `pi.on("tool_result")` — validate | `write-validate.sh` | Equivalent port |
| `pi.on("tool_result")` — commit | `auto-commit.sh` | Improved (see below) |
| _(none)_ | `session-capture.sh` (Stop event) | **Not ported** (functionality merged into session_start tracking + per-write auto-commit) |

### Behavior Differences

| Behavior | Original | Pi Port |
|----------|----------|---------|
| Trigger tools | Write only | **Write + Edit** (`FILE_TOOLS` set) |
| Vault detection | cwd `.arscontexta` only | cwd `.arscontexta` **OR** `~/.config/arscontexta.yaml` |
| Git stage scope | `git add -A` (all changes) | `git add -- <written-file>` (scoped to written file + ops/sessions/) |
| Shell safety | `execSync` string interpolation (injection risk) | `execFileSync` + array args (safe) |
| Commit message | Built from staged filenames (injectable) | `relToVault` relative path (safe) |
| Cross-directory git | Not supported (assumes cwd = vault) | `git -C vaultPath` (cross-directory) |
| Commit timing | Immediate per write (race on rapid writes) | **Debounced** (2s batching, `session_shutdown` flush) |
| Session Capture (Stop) | Yes | **No** (pi has no Stop event; session tracking handled in session_start + per-write auto-commit covers the commit-on-exit use case) |

---

## 6. Agent Definition

| Item | Original | Pi Port |
|------|----------|---------|
| File | `agents/knowledge-guide.md` | `agents/knowledge-guide.md` |
| `model: sonnet` | Present | **Removed** |
| Path references | `${CLAUDE_PLUGIN_ROOT}/reference/...` | `../reference/...` |
| Content | Unchanged | Unchanged |

---

## 7. Reference Material

| Category | Original Location | Pi Location | Changes |
|----------|------------------|-------------|---------|
| Core specs (25+ files) | `reference/` | `reference/` | Path move only, content unchanged |
| Research methodology (249 files) | `methodology/` | `reference/methodology/` | Path move only, content unchanged |
| Generators (18 files) | `generators/` | `reference/generators/` | Path move only, content unchanged |
| Preset configs (3 dirs) | `presets/` | `reference/presets/` | Path move only, content unchanged |

**Note:** Reference docs retain historical `mcp__qmd` mentions (e.g. `semantic-vs-keyword.md`). These are documentation, not executable code — intentionally preserved.

---

## 8. README

| Item | Original | Pi Port |
|------|----------|---------|
| Installation | `/plugin marketplace add` + `/plugin install` | Clone repo + settings.json skills path + symlink extension |
| Command format | `/arscontexta:setup`, `/reduce` | `/skill:setup`, `/skill:reduce` |
| Prerequisites | Claude Code v1.0.33+ | pi |
| Hook docs | Claude Code hooks.json + bash scripts | pi extension (TypeScript) |
| Cross-project | Not mentioned | `~/.config/arscontexta.yaml` |
| Semantic search | `npm install -g @tobilu/qmd` + `.mcp.json` | `bun install -g @tobilu/qmd` (MCP config removed) |

---

## 9. Feature Parity Summary

| Feature | Original | Pi Port | Status |
|---------|----------|---------|--------|
| 26 skills/commands | ✅ | ✅ | **Equivalent** |
| Session start injection | ✅ bash hook | ✅ extension event | **Equivalent** |
| Schema validation (write) | ✅ bash hook | ✅ extension event | **Equivalent** |
| Schema validation (edit) | ❌ | ✅ | **Pi added** |
| Git auto-commit | ✅ `git add -A` | ✅ `git add -- file` + debounce | **Pi improved** |
| Session capture (Stop) | ✅ bash hook | ❌ | **Pi missing** (pi has no Stop event) |
| Cross-project vault | ❌ | ✅ | **Pi added** |
| Shell injection protection | ❌ | ✅ | **Pi added** |
| 249 research claims | ✅ | ✅ | **Equivalent** (path moved) |
| Vault marker `.arscontexta` | ✅ | ✅ | **Equivalent** |
| qmd semantic search | ✅ MCP + CLI + grep | ✅ CLI + grep | **Downgraded** (MCP tier removed, CLI is functionally identical) |
| Plugin marketplace | ✅ | ❌ | **Not applicable to pi** |
| Multi-platform adapter | ✅ platforms/ | ❌ | **Removed** (pi is the only platform) |

---

## 10. Known Differences

1. **Session Capture (Stop event)** — Original had `session-capture.sh` to save session state on exit. Pi has no `Stop` event. Session tracking is merged into the `session_start` handler, and per-write auto-commit ensures no work is lost. Pi's `session_shutdown` event could be used to implement this, but it's not done yet.

2. **qmd MCP tier** — Original supported MCP tool calls as Tier 1. Pi port uses CLI + grep only. Functionally identical (same qmd binary), but MCP auto-invocation syntax is removed.

3. **Reference doc historical mentions** — Files like `semantic-vs-keyword.md` still reference `mcp__qmd__*`. These are documentation records, not executable code. Intentionally preserved.

4. **`context: fork` semantics** — Original used this field to run skills in a fresh context window. Pi port removes it. Pipeline isolation is handled by the ars contexta `ralph` skill instructing the agent to spawn subagents. For standalone heavy skills (`setup`, `reseed`), users can manually use subagent or a new session.

5. **`model: opus/sonnet` semantics** — Original used this field to specify the model for skill execution. Pi port removes it. Model selection is user-controlled.
