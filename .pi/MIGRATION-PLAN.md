# Ars Contexta → Pi Migration Plan

**Source:** `bak/` (Claude Code plugin, v0.8.0)
**Target:** `.pi/` (pi coding agent)
**Date:** 2026-03-16

---

## 1. Architecture Delta

| Concept | Claude Code (bak/) | Pi | Migration Approach |
|---------|-------------------|----|-------------------|
| Skills (commands) | `.claude/skills/` + `SKILL.md` + `skill.json` | `.pi/skills/<name>/SKILL.md` | 1:1 — pi uses same Agent Skills spec; drop `skill.json` (pi reads frontmatter only) |
| Hooks | `.claude/hooks/hooks.json` → bash scripts | Extensions (`.pi/extensions/*.ts`) | Rewrite 4 hooks as 1 extension with event handlers |
| Context file | `CLAUDE.md` (generated per-vault) | stays `CLAUDE.md` or custom prompt template | Generator template remains; adapt output path references |
| Agents (subagents) | `agents/knowledge-guide.md` | `.pi/agents/` or pi `subagent` tool | Convert to pi subagent definition |
| Generators | `generators/claude-md.md` + `features/*.md` | Reference docs for the setup skill | Keep as reference; setup skill reads them |
| Presets | `presets/{research,personal,experimental}/` | Reference data for setup skill | Keep as reference data |
| Reference docs | `reference/` (kernel.yaml, specs) | `.pi/reference/` or skill-local refs | Move under `.pi/reference/` |
| Methodology | `methodology/` (249 research claims) | `.pi/reference/methodology/` | Move as-is; skills reference via relative paths |
| Scripts | `scripts/sync-thinking.sh` | Extension or skill script | Evaluate necessity; port if needed |
| Vault marker | `.arscontexta` file | `.arscontexta` (unchanged) | Vault-side marker stays the same |

---

## 2. Component Inventory

### 2.1 Skills — Plugin-Level (10) → `.pi/skills/`

These are the "platform" skills. Always available, not vault-generated.

| Skill | Purpose | Migration Notes |
|-------|---------|-----------------|
| `setup` | Conversational onboarding + derivation engine | Port as-is; update `${CLAUDE_PLUGIN_ROOT}` refs → relative paths |
| `help` | Contextual guidance + command discovery | Port as-is |
| `ask` | Query research graph | Port; needs access to `methodology/` |
| `health` | Vault diagnostics | Port as-is |
| `tutorial` | Interactive walkthrough | Port as-is |
| `recommend` | Architecture advice | Port as-is |
| `architect` | Evolution guidance | Port as-is |
| `reseed` | Re-derive from first principles | Port as-is |
| `upgrade` | Apply methodology updates | Port as-is |
| `add-domain` | Multi-domain extension | Port as-is |

### 2.2 Skill Sources — Generated (16) → `.pi/skills/`

These are template skills that get customized during `/setup`. In the pi version they live alongside platform skills but are generated into the user's vault `.pi/skills/` during setup.

| Skill | Purpose | Notes |
|-------|---------|-------|
| `reduce` | Extract insights from sources | Largest skill (~700 lines); port carefully |
| `reflect` | Find connections, update MOCs | Uses qmd MCP; keep allowed-tools |
| `reweave` | Backward pass — update old notes | Uses qmd MCP |
| `verify` | Combined quality gate | Uses qmd MCP |
| `validate` | Schema compliance check | Lightweight |
| `seed` | Create extraction task | Queue management |
| `ralph` | Queue-based orchestration | Spawns subagents per phase |
| `pipeline` | End-to-end processing | Orchestrates seed→reduce→reflect→reweave→verify |
| `tasks` | Queue management | Read/write `ops/queue/` |
| `stats` | Vault metrics | Read-only analysis |
| `graph` | Graph analysis | Scripts + interpretation |
| `next` | Next-action recommendation | Reads queue + goals |
| `learn` | Research + grow knowledge | Uses Exa/web search |
| `remember` | Capture session friction | Mining mode |
| `rethink` | Challenge assumptions | Reviews observations/tensions |
| `refactor` | Structural improvements | Config-based restructuring |

### 2.3 Hooks (4) → 1 Extension

| Hook | Event | Pi Equivalent |
|------|-------|---------------|
| `session-orient.sh` | `SessionStart` | `pi.on("session_start")` → inject tree + identity + maintenance signals |
| `write-validate.sh` | `PostToolUse(Write)` | `pi.on("tool_result")` → validate note schema on write |
| `auto-commit.sh` | `PostToolUse(Write, async)` | `pi.on("tool_result")` → async git add/commit |
| `vaultguard.sh` | (guard check) | Guard logic inside extension; check `.arscontexta` marker |

### 2.4 Agent Definition (1)

| Agent | Role | Pi Equivalent |
|-------|------|---------------|
| `knowledge-guide` | Proactive methodology guidance | `pi subagent` definition or `.pi/agents/knowledge-guide.md` |

### 2.5 Generators (context file + 17 feature blocks)

| Component | Files | Migration |
|-----------|-------|-----------|
| CLAUDE.md generator | `generators/claude-md.md` | Reference doc for `setup` skill; output path adapts per vault |
| Feature blocks | `generators/features/*.md` (17 files) | Reference docs; `setup` reads and composes them |

### 2.6 Reference Documents (25+)

| Category | Files | Size |
|----------|-------|------|
| Core spec | `kernel.yaml`, `three-spaces.md`, `methodology.md` | ~60 KB |
| Derivation | `derivation-validation.md`, `conversation-patterns.md` | ~80 KB |
| Architecture | `components.md`, `session-lifecycle.md`, `self-space.md` | ~80 KB |
| Analysis | `semantic-vs-keyword.md`, `personality-layer.md` | ~55 KB |
| Quality | `testing-milestones.md`, `AUDIT-REPORT.md` | ~35 KB |
| Other | `claim-map.md`, `dimension-claim-map.md`, etc. | ~60 KB |
| Templates | `reference/templates/` (10 files) | ~varies |

### 2.7 Methodology (249 research claims)

All files in `methodology/` — prose-titled markdown files containing research claims backing every architectural decision. **Move as-is.**

---

## 3. Target Directory Structure

```
arscontexta-pi/
├── .pi/
│   ├── skills/                        # All skills (platform + generated templates)
│   │   ├── setup/
│   │   │   └── SKILL.md
│   │   ├── help/
│   │   │   └── SKILL.md
│   │   ├── ask/
│   │   │   └── SKILL.md
│   │   ├── health/
│   │   │   └── SKILL.md
│   │   ├── tutorial/
│   │   │   └── SKILL.md
│   │   ├── recommend/
│   │   │   └── SKILL.md
│   │   ├── architect/
│   │   │   └── SKILL.md
│   │   ├── reseed/
│   │   │   └── SKILL.md
│   │   ├── upgrade/
│   │   │   └── SKILL.md
│   │   ├── add-domain/
│   │   │   └── SKILL.md
│   │   ├── reduce/
│   │   │   └── SKILL.md
│   │   ├── reflect/
│   │   │   └── SKILL.md
│   │   ├── reweave/
│   │   │   └── SKILL.md
│   │   ├── verify/
│   │   │   └── SKILL.md
│   │   ├── validate/
│   │   │   └── SKILL.md
│   │   ├── seed/
│   │   │   └── SKILL.md
│   │   ├── ralph/
│   │   │   └── SKILL.md
│   │   ├── pipeline/
│   │   │   └── SKILL.md
│   │   ├── tasks/
│   │   │   └── SKILL.md
│   │   ├── stats/
│   │   │   └── SKILL.md
│   │   ├── graph/
│   │   │   └── SKILL.md
│   │   ├── next/
│   │   │   └── SKILL.md
│   │   ├── learn/
│   │   │   └── SKILL.md
│   │   ├── remember/
│   │   │   └── SKILL.md
│   │   ├── rethink/
│   │   │   └── SKILL.md
│   │   └── refactor/
│   │       └── SKILL.md
│   │
│   ├── extensions/
│   │   └── arscontexta-hooks/         # 開發用；安裝時 symlink 到 ~/.pi/agent/extensions/
│   │       └── index.ts               # session-orient + write-validate + auto-commit
│   │
│   ├── agents/
│   │   └── knowledge-guide.md         # subagent definition
│   │
│   └── reference/                     # All reference material
│       ├── kernel.yaml
│       ├── three-spaces.md
│       ├── methodology.md
│       ├── components.md
│       ├── conversation-patterns.md
│       ├── derivation-validation.md
│       ├── interaction-constraints.md
│       ├── failure-modes.md
│       ├── vocabulary-transforms.md
│       ├── personality-layer.md
│       ├── self-space.md
│       ├── session-lifecycle.md
│       ├── semantic-vs-keyword.md
│       ├── claim-map.md
│       ├── dimension-claim-map.md
│       ├── evolution-lifecycle.md
│       ├── open-questions.md
│       ├── tradition-presets.md
│       ├── use-case-presets.md
│       ├── testing-milestones.md
│       ├── AUDIT-REPORT.md
│       ├── validate-kernel.sh
│       ├── templates/                 # Note type templates
│       ├── test-fixtures/
│       ├── generators/                # Context file generator + feature blocks
│       │   ├── claude-md.md
│       │   └── features/
│       │       ├── atomic-notes.md
│       │       ├── ethical-guardrails.md
│       │       ├── graph-analysis.md
│       │       ├── helper-functions.md
│       │       ├── maintenance.md
│       │       ├── methodology-knowledge.md
│       │       ├── mocs.md
│       │       ├── multi-domain.md
│       │       ├── personality.md
│       │       ├── processing-pipeline.md
│       │       ├── schema.md
│       │       ├── self-evolution.md
│       │       ├── self-space.md
│       │       ├── semantic-search.md
│       │       ├── session-rhythm.md
│       │       ├── templates.md
│       │       └── wiki-links.md
│       ├── presets/                    # Pre-validated configurations
│       │   ├── research/
│       │   ├── personal/
│       │   └── experimental/
│       └── methodology/               # 249 research claims
│           ├── structure enables navigation without reading everything.md
│           ├── ... (249 files)
│           └── build automatic memory through cognitive offloading.md
│
├── bak/                               # Original source (keep until migration verified)
├── LICENSE
├── README.md                          # Updated for pi distribution
└── .gitignore
```

---

## 4. Migration Steps

### Phase 1: Scaffold + Reference Material (low risk)

1. **Create `.pi/` directory structure**
   - `skills/`, `extensions/`, `agents/`, `reference/`

2. **Copy reference material as-is**
   - `bak/reference/*` → `.pi/reference/`
   - `bak/methodology/` → `.pi/reference/methodology/`
   - `bak/generators/` → `.pi/reference/generators/`
   - `bak/presets/` → `.pi/reference/presets/`

3. **Copy LICENSE** to root (already there)

### Phase 2: Port Skills (medium risk)

For each skill (26 total), the transformation is:

1. **Copy `SKILL.md`** from source to `.pi/skills/<name>/SKILL.md`
2. **Drop `skill.json`** — pi only reads SKILL.md frontmatter
3. **Replace `${CLAUDE_PLUGIN_ROOT}`** references with pi-compatible relative paths
   - Pattern: `${CLAUDE_PLUGIN_ROOT}/reference/kernel.yaml`
   - Becomes: a relative path from the skill dir, e.g. `../../reference/kernel.yaml`
   - Or: absolute path resolved at runtime from skill location
4. **Verify frontmatter** meets Agent Skills spec:
   - `name` must match directory name
   - `description` ≤ 1024 chars
   - Remove Claude Code-specific fields (`context: fork`, `model: opus/sonnet`)
   - Keep `allowed-tools` (pi supports this, experimental)

**Key transformations per skill category:**

| Category | `${CLAUDE_PLUGIN_ROOT}` refs | Platform-specific code | Subagent spawning |
|----------|-----|------|------|
| Platform skills (setup, help, etc.) | Many refs to reference/ | `context: fork` → remove | setup uses conversation |
| Processing skills (reduce, reflect, etc.) | Few refs | `context: fork` → remove | ralph spawns subagents |
| Analysis skills (stats, graph, etc.) | None | None | None |

**Order of porting** (dependency-driven):
1. `help` (standalone, validates basic skill loading)
2. `stats`, `tasks`, `next`, `graph` (read-only, no deps)
3. `validate`, `verify`, `health` (quality gates)
4. `seed`, `reduce`, `reflect`, `reweave` (pipeline core)
5. `pipeline`, `ralph` (orchestrators, depend on above)
6. `learn`, `remember`, `rethink`, `refactor` (meta skills)
7. `setup`, `tutorial`, `ask`, `recommend`, `architect` (platform skills, heavy ref deps)
8. `reseed`, `upgrade`, `add-domain` (advanced lifecycle)

### Phase 3: Port Hooks → Extension (medium-high risk)

開發位置：`.pi/extensions/arscontexta-hooks/index.ts`
安裝位置：`~/.pi/agent/extensions/arscontexta-hooks/`（symlink 或複製）

```typescript
// Pseudocode structure
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

export default function (pi: ExtensionAPI) {

  // ─── Vault Resolution ────────────────────────
  // 兩種來源，任一成功即可：
  //   1. cwd 本身是 vault（有 .arscontexta marker）
  //   2. ~/.config/arscontexta.yaml 指定 default_vault
  function resolveVaultPath(cwd: string): string | null {
    // 優先：cwd 是 vault
    if (existsSync(join(cwd, ".arscontexta"))) return cwd;

    // 其次：全域 config
    const configPath = join(homedir(), ".config", "arscontexta.yaml");
    if (existsSync(configPath)) {
      const config = readFileSync(configPath, "utf-8");
      const match = config.match(/^default_vault:\s*(.+)$/m);
      if (match) {
        const vaultPath = resolve(match[1].trim().replace(/^~/, homedir()));
        if (existsSync(join(vaultPath, ".arscontexta"))) return vaultPath;
      }
    }

    return null; // 非 vault 環境，也沒有全域 config
  }

  // ─── Session Orient (was: session-orient.sh) ─
  pi.on("session_start", async (_event, ctx) => {
    const vaultPath = resolveVaultPath(ctx.cwd);
    if (!vaultPath) return;

    // 1. Inject vault path + workspace tree
    // 2. Load identity + goals (from vaultPath)
    // 3. Surface maintenance signals (observations, tensions, inbox)
    // 4. Session tracking
    pi.sendMessage({
      customType: "arscontexta-orient",
      content: `Vault: ${vaultPath}\n\n${orientationText}`,
      display: true,
    });
  });

  // ─── Write Validate (was: write-validate.sh) ─
  pi.on("tool_result", async (event, ctx) => {
    const vaultPath = resolveVaultPath(ctx.cwd);
    if (!vaultPath) return;
    if (event.toolName !== "write") return;

    // Check if written file is inside vault's notes/ or thinking/
    // Validate: description field, topics field, YAML frontmatter
    // Return modified result with warnings if needed
  });

  // ─── Auto Commit (was: auto-commit.sh) ────────
  pi.on("tool_result", async (event, ctx) => {
    const vaultPath = resolveVaultPath(ctx.cwd);
    if (!vaultPath) return;
    if (event.toolName !== "write") return;

    // Async git commit — in vault directory, not cwd
    pi.exec("git", ["-C", vaultPath, "add", "-A"]).then(() => {
      pi.exec("git", ["-C", vaultPath, "commit", "-m", `Auto: ${filename}`, "--no-verify"]);
    });
  });
}
```

**與原版 bash hooks 差異：**
- TypeScript — 更豐富的邏輯與錯誤處理
- 單檔取代 5 個 script
- `resolveVaultPath()` 取代 `vaultguard.sh` — 支援 cwd 或全域 config 兩種來源
- `git -C vaultPath` — 跨目錄操作 vault git repo
- `pi.sendMessage()` 注入 context（含 vault path）而非 stdout

### Phase 4: Port Agent → Subagent Definition

Convert `bak/agents/knowledge-guide.md` to pi subagent format:

```typescript
// Via subagent tool:
subagent({
  action: "create",
  config: {
    name: "knowledge-guide",
    description: "Proactive methodology guidance agent...",
    systemPrompt: "...", // from knowledge-guide.md
    model: "anthropic/claude-sonnet-4",
    scope: "project",
  }
});
```

Or keep as markdown file in `.pi/agents/knowledge-guide.md` if pi supports that format.

### Phase 5: Update README

Rewrite `README.md` for pi distribution:
- Installation via pi skills path or `pi --skill` flag
- Remove Claude Code plugin-specific instructions
- Update command examples to use `/skill:setup` etc.
- Keep philosophy, methodology, research graph docs

### Phase 6: Verify + Clean Up

**6a. Skill loading**
- `pi` in repo dir → 26 skills appear in `<available_skills>`

**6b. Extension — 三種場景全覆蓋**

| 場景 | cwd | Config | 預期行為 |
|------|-----|--------|----------|
| A. 在 vault 內 | vault dir | 有或無 | ✅ orient 注入、write validate、auto-commit |
| B. 在其他專案 + 全域 config | project dir | `default_vault` 指向 vault | ✅ orient 注入（含 vault path）、write validate（偵測寫入 vault 路徑）、auto-commit（`git -C vault`） |
| C. 無 vault 無 config | project dir | 無 | ✅ 全部靜默跳過，零影響 |

**6c. Key workflows**
- 場景 A：`/skill:setup` runs onboarding
- 場景 A：`/skill:reduce` processes a source
- 場景 B：`/skill:reduce` 從其他專案目錄操作 vault
- 場景 A：`/skill:health` runs diagnostics

**6d. Archive**
- `bak/` → `archive/claude-code-original` branch

---

## 5. Decisions — RESOLVED

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| Q1 | Skill 安裝方式 | **Project-local** | Repo 即 distribution；用戶 clone + 加路徑到 settings。Vault 生成的 skills 放各 vault `.pi/skills/` |
| Q2 | `${CLAUDE_PLUGIN_ROOT}` 替換 | **Relative paths** | `../../reference/...` — pi 原生支援 skill dir 基準解析 |
| Q3 | Vault 生成 Skills 位置 | **vault/.pi/skills/** | Pi 自動探索，零設定 |
| Q4 | Hook Extension 位置 | **全域 `~/.pi/agent/extensions/`** | 任何專案都載入；`resolveVaultPath()` 判斷 cwd 或全域 config 可解析 vault 才執行 |
| Q5 | platforms/ 目錄 | **丟掉** | 有用內容已搬到其他位置 |
| Q6 | Vault 使用模式 | **模式 B — 任何專案都能操作 vault** | 跨目錄讀寫 vault |
| Q7 | Vault 路徑解析 | **`~/.config/arscontexta.yaml`** | 全域 config 存 vault path(s)；Extension session_start 讀取注入 context |

### Q6-Q7 架構影響：跨專案 Vault 存取

使用模式 B 意味著 skills 操作的目標（notes/, ops/, self/）不一定在 cwd。
需要一個 vault 路徑解析機制：

**Config 格式** (`~/.config/arscontexta.yaml`):
```yaml
# Ars Contexta global config
default_vault: ~/Developer/my-vault
vaults:
  - path: ~/Developer/my-vault
    name: main
```

**Extension 行為**:
1. `session_start` → 讀 `~/.config/arscontexta.yaml`
2. 判斷 cwd 是否本身就是 vault（有 `.arscontexta` marker）
3. 無論在哪，注入 vault path 到 context（`pi.sendMessage()`）
4. Skills 引用 vault 內容時用 config 提供的路徑

**Skill 路徑引用變化**:
```
# 原版（假設 cwd 就是 vault）
notes/*.md
ops/queue/queue.json

# 新版（支援跨目錄）
${VAULT_PATH}/notes/*.md
${VAULT_PATH}/ops/queue/queue.json
```

Skills 中 `${VAULT_PATH}` 不是 literal 變數，而是在 SKILL.md 裡寫明：
> "Read vault path from `~/.config/arscontexta.yaml` (key: `default_vault`). All vault content paths below are relative to this vault root."

Extension 在 session context 裡注入 vault path，agent 遵循 skill 指示使用它。

---

## 6. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| `${CLAUDE_PLUGIN_ROOT}` refs break | High | Batch find-replace + verify each skill loads |
| Extension event model differs from hooks | Medium | Test each hook behavior in isolation |
| `context: fork` removal affects quality | Medium | Pi uses subagent tool for isolation; ralph already handles this |
| skill.json fields lost | Low | All relevant fields are in SKILL.md frontmatter |
| 249 methodology files path resolution | Low | Absolute paths work; relative paths from reference/ |
| qmd MCP tools availability | Low | Skills already have tier fallbacks (qmd CLI, grep) |

---

## 7. Estimated Effort

| Phase | Tasks | Complexity |
|-------|-------|------------|
| Phase 1: Scaffold | Copy + mkdir | ~10 min |
| Phase 2: Port 26 skills | Find-replace + frontmatter cleanup | ~2-3 hours |
| Phase 3: Extension | Rewrite 4 hooks as TypeScript | ~1-2 hours |
| Phase 4: Agent | Convert 1 agent definition | ~15 min |
| Phase 5: README | Rewrite for pi | ~30 min |
| Phase 6: Verify | Test workflows | ~1 hour |
| **Total** | | **~5-7 hours** |

---

## 8. Additional Decisions — RESOLVED

| # | Question | Decision |
|---|----------|----------|
| Q8a | bak/ 遷移後處理 | 移到獨立 branch `archive/claude-code-original`，主線刪除 |
| Q8b | Skills 優先級 | 一次全移 26 個（機械式替換為主） |
| Q8c | qmd 語意搜尋 | **qmd CLI 升 Tier 1，刪除所有 MCP 引用**。Fallback: qmd CLI → grep |
| Q8d | sync-thinking.sh | 丟掉，功能已被 git 版控取代 |

### Q8c 影響：Skills 內 qmd 調用改寫

所有 skills 中的 `mcp__qmd__*` 引用改為 qmd CLI：

```
# 刪除
mcp__qmd__vector_search  query="..."  collection="..."  limit=5

# 改為
qmd vsearch "..." --collection <collection> -n 5
```

同步更新 `allowed-tools` frontmatter：移除 `mcp__qmd__*`，不需額外宣告 bash（pi 預設工具）。

受影響 skills：`reduce`、`reflect`、`reweave`、`verify`、`validate`。
