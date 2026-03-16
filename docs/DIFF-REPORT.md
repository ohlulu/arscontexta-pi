# Ars Contexta: Pi Version vs Original Version — 完整差異報告

**Original:** `bak/` (Claude Code plugin v0.8.0) — 411 files
**Pi Version:** `.pi/` (pi coding agent v0.9.0) — 356 files
**差異:** -55 files (刪除冗餘，合併結構)

---

## 1. 目錄結構變化

### 原版結構
```
bak/
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
│   ├── claude-code/         # Claude Code specific
│   └── shared/              # Cross-platform shared
├── presets/                 # 3 preset configs
├── reference/               # 25+ reference docs
├── methodology/             # 249 research claims
├── scripts/                 # 1 utility script
├── LICENSE
└── README.md
```

### Pi 版結構
```
.pi/
├── skills/                  # 26 skills (統一放置，SKILL.md only)
├── extensions/              # 1 TypeScript extension (取代 hooks/)
│   └── arscontexta-hooks/
│       └── index.ts
├── agents/                  # 1 agent definition
└── reference/               # 所有參考資料（合併 reference + methodology + generators + presets）
    ├── generators/
    ├── presets/
    └── methodology/
README.md
```

---

## 2. 刪除的檔案/目錄（55 files）

| 刪除項 | 檔案數 | 原因 |
|--------|--------|------|
| `.claude-plugin/` | 2 | Claude Code plugin manifest；pi 不需要 |
| `hooks/hooks.json` | 1 | Claude Code hook config 格式；被 extension 取代 |
| `hooks/scripts/*.sh` | 5 | 5 個 bash scripts；被 1 個 TypeScript extension 取代 |
| `platforms/` | 20 | 多平台 adapter 層；pi 是唯一平台，內容已在 generators/ 裡 |
| `scripts/sync-thinking.sh` | 1 | methodology 同步腳本；功能被 git 版控取代 |
| `*/skill.json` | 26 | Claude Code skill metadata；pi 只讀 SKILL.md frontmatter |

---

## 3. 新增的檔案

| 新增項 | 說明 |
|--------|------|
| `.pi/extensions/arscontexta-hooks/index.ts` | TypeScript extension（361 行），取代 5 個 bash scripts + hooks.json |
| `README.md` | 全新撰寫，pi 安裝指南 + `/skill:*` 命令格式 |
| `.pi/MIGRATION-PLAN.md` | 遷移計劃文件（含所有決策記錄） |
| `.pi/DIFF-REPORT.md` | 本文件 |
| `.pi/ralph/` | Ralph loop 執行紀錄 |

---

## 4. Skills 變化（26 個）

### 4.1 結構變化

| 項目 | 原版 | Pi 版 |
|------|------|-------|
| 分類 | `skills/`（10 platform）+ `skill-sources/`（16 generated）分開放 | `.pi/skills/`（26 個統一放置） |
| 每個 skill 的檔案 | `SKILL.md` + `skill.json` | 只有 `SKILL.md`（`skill.json` 刪除） |
| 命令格式 | `/arscontexta:setup`、`/reduce` | `/skill:setup`、`/skill:reduce` |

### 4.2 Frontmatter 變化（所有 26 skills）

| 欄位 | 原版 | Pi 版 | 原因 |
|------|------|-------|------|
| `context: fork` | 大多數 skills 有 | **刪除** | pi 無此欄位；隔離由 subagent 工具處理 |
| `model: sonnet/opus` | 部分 skills 有 | **刪除** | pi 無此欄位；模型選擇由使用者/orchestrator 決定 |
| `argument-hint:` | setup 有 | **刪除** | pi 無此欄位 |
| `allowed-tools` | 含 `mcp__qmd__*` | **改為** `Read, Write, Edit, Grep, Glob, Bash` | qmd 改走 CLI（見 §4.4） |

### 4.3 內容變化（所有 26 skills）

| 變更 | 範圍 | 說明 |
|------|------|------|
| `${CLAUDE_PLUGIN_ROOT}` → 相對路徑 | 所有有引用的 skills | 例：`${CLAUDE_PLUGIN_ROOT}/reference/kernel.yaml` → `../../reference/kernel.yaml` |
| 新增 Vault Path Resolution header | 25 skills（help 除外） | 指示 agent 從 `~/.config/arscontexta.yaml` 或 cwd `.arscontexta` 取得 vault 路徑 |
| `/arscontexta:*` → `/skill:*` | setup, help | 命令前綴統一為 pi 格式 |
| `.claude/` 路徑 → `.pi/` 路徑 | setup, upgrade, reseed, architect, add-domain | 所有 Claude Code 專屬路徑替換 |
| "Restart Claude Code" → "/reload" | setup | 啟動指示改為 pi 方式 |

### 4.4 qmd 語意搜尋改寫（5 skills）

| 原版 (MCP tool call) | Pi 版 (CLI via bash) |
|----------------------|----------------------|
| `mcp__qmd__vector_search query="..." collection="..." limit=5` | `qmd vsearch "..." --collection <collection> -n 5` |
| `mcp__qmd__search` | `qmd search` |
| `mcp__qmd__deep_search` | `qmd dsearch` |
| `mcp__qmd__status` | `qmd status` |

受影響 skills：`reduce`、`reflect`、`reweave`、`verify`、`validate`

原因：pi 無原生 MCP 支援。qmd CLI 效果相同，直接透過 bash tool 執行。Skills 已內建 fallback：qmd CLI → grep。

### 4.5 setup SKILL.md 重大改寫

| 段落 | 原版 | Pi 版 |
|------|------|-------|
| Phase 1: Platform Detection | 偵測 `.claude/` 目錄 | 偵測 `.pi/` 目錄 |
| Step 9: Skill Output | 寫入 `.claude/skills/[name]/SKILL.md` | 寫入 `.pi/skills/[name]/SKILL.md` |
| Step 10: Hooks | 生成 `.claude/settings.json` + 4 個 bash scripts | 指示使用者安裝 extension + 建立 `.arscontexta` marker |
| Skill Discoverability | "Restart Claude Code to activate" | "Run /reload to activate" |
| Summary | 列 "IMPORTANT: Restart Claude Code" | 列 "Run /reload" |

---

## 5. Hooks → Extension 對照

### 原版：6 個檔案（365 行 bash + 34 行 JSON）

| 檔案 | 行數 | 功能 |
|------|------|------|
| `hooks.json` | 34 | Hook event 配置（SessionStart, PostToolUse, Stop） |
| `session-orient.sh` | 151 | Session 啟動：注入 tree + identity + goals + maintenance signals |
| `write-validate.sh` | 49 | 寫入後 schema 驗證（description, topics, frontmatter） |
| `auto-commit.sh` | 54 | 寫入後自動 git commit |
| `vaultguard.sh` | 41 | Vault 偵測（`.arscontexta` marker） |
| `read_config.sh` | 36 | 讀取 `.arscontexta` 配置 |

### Pi 版：1 個檔案（361 行 TypeScript）

| 函式/handler | 對應原版 | 變化 |
|-------------|---------|------|
| `resolveVaultPath()` | `vaultguard.sh` | **新增**跨專案支援：cwd marker OR `~/.config/arscontexta.yaml` |
| `readVaultConfig()` | `read_config.sh` | 等價移植 |
| `pi.on("session_start")` | `session-orient.sh` | 等價移植 + vault path 注入 |
| `pi.on("tool_result")` — validate | `write-validate.sh` | 等價移植 |
| `pi.on("tool_result")` — commit | `auto-commit.sh` | 改善版（見下） |
| _(無)_ | `session-capture.sh` (Stop event) | **未移植**（功能合併到 session_start 的 session tracking） |

### 行為差異

| 行為 | 原版 | Pi 版 |
|------|------|-------|
| 觸發工具 | 只有 Write | **Write + Edit** (`FILE_TOOLS` set) |
| Vault 偵測 | 只看 cwd `.arscontexta` | cwd `.arscontexta` **OR** `~/.config/arscontexta.yaml` |
| Git stage 範圍 | `git add -A`（全量） | `git add -- <written-file>`（僅寫入的檔案 + ops/sessions/） |
| Shell 安全 | `execSync` 字串拼接（有注入風險） | `execFileSync` + array args（安全） |
| Commit message | 從 staged 檔名拼接（可被注入） | `relToVault` 相對路徑（安全） |
| 跨目錄 git | 不支援（假設 cwd = vault） | `git -C vaultPath`（支援跨目錄） |
| Session Capture (Stop) | 有 | **無**（pi 無 Stop event；session tracking 在 session_start 處理） |

---

## 6. Agent 定義

| 項目 | 原版 | Pi 版 |
|------|------|-------|
| 檔案 | `bak/agents/knowledge-guide.md` | `.pi/agents/knowledge-guide.md` |
| `model: sonnet` | 有 | **刪除** |
| 路徑引用 | `${CLAUDE_PLUGIN_ROOT}/reference/...` | `../../reference/...` |
| 其餘內容 | 不變 | 不變 |

---

## 7. Reference 材料

| 類別 | 原版位置 | Pi 版位置 | 變化 |
|------|---------|---------|------|
| 核心規格 (25+ files) | `bak/reference/` | `.pi/reference/` | 路徑搬移，內容不變 |
| 研究方法論 (249 files) | `bak/methodology/` | `.pi/reference/methodology/` | 路徑搬移，內容不變 |
| 生成器 (18 files) | `bak/generators/` | `.pi/reference/generators/` | 路徑搬移，內容不變 |
| 預設配置 (3 dirs) | `bak/presets/` | `.pi/reference/presets/` | 路徑搬移，內容不變 |

**注意：** reference 文件中仍有歷史性的 `mcp__qmd` 提及（如 `semantic-vs-keyword.md`），這些是文件描述，非可執行程式碼，未修改。

---

## 8. README

| 項目 | 原版 | Pi 版 |
|------|------|-------|
| 安裝方式 | `/plugin marketplace add` + `/plugin install` | Clone repo + settings.json skills path + symlink extension |
| 命令格式 | `/arscontexta:setup`、`/reduce` | `/skill:setup`、`/skill:reduce` |
| 前置需求 | Claude Code v1.0.33+ | pi |
| Hook 說明 | Claude Code hooks.json + bash scripts | pi extension (TypeScript) |
| 跨專案 | 未提及 | `~/.config/arscontexta.yaml` |
| 語意搜尋 | `npm install -g @tobilu/qmd` + `.mcp.json` | `bun install -g @tobilu/qmd`（MCP 配置刪除） |

---

## 9. 功能對等性總結

| 功能 | 原版 | Pi 版 | 狀態 |
|------|------|-------|------|
| 26 個 skills/commands | ✅ | ✅ | **等價** |
| Session 啟動注入 | ✅ bash hook | ✅ extension event | **等價** |
| Schema 驗證 (write) | ✅ bash hook | ✅ extension event | **等價** |
| Schema 驗證 (edit) | ❌ | ✅ | **Pi 新增** |
| Git auto-commit | ✅ `git add -A` | ✅ `git add -- file` | **Pi 改善** |
| Session capture (Stop) | ✅ bash hook | ❌ | **Pi 缺失**（pi 無 Stop event） |
| 跨專案 vault 操作 | ❌ | ✅ | **Pi 新增** |
| Shell injection 防護 | ❌ | ✅ | **Pi 新增** |
| 249 研究方法論 | ✅ | ✅ | **等價**（路徑搬移） |
| Vault marker `.arscontexta` | ✅ | ✅ | **等價** |
| qmd 語意搜尋 | ✅ MCP + CLI + grep | ✅ CLI + grep | **降級**（刪除 MCP tier，CLI 效果相同） |
| Plugin marketplace | ✅ | ❌ | **Pi 不適用** |
| Multi-platform adapter | ✅ platforms/ | ❌ | **刪除**（pi 為唯一平台） |

---

## 10. 已知差異/遺漏

1. **Session Capture (Stop event)** — 原版有 `session-capture.sh` 在 session 結束時儲存 transcript。Pi 無 `Stop` event，此功能的部分邏輯（session tracking）已合併到 `session_start` handler，但 transcript 儲存未移植。Pi 有 `session_shutdown` event 可用來實作，但目前未做。

2. **qmd MCP 層** — 原版支援 MCP tool call 作為 Tier 1，Pi 版只有 CLI + grep。效果相同（同一個 qmd），但 MCP 的自動工具呼叫語法被移除。

3. **Reference 文件歷史引用** — `semantic-vs-keyword.md` 等 reference 文件中仍有 `mcp__qmd__*` 的歷史描述。這些是文件紀錄，非可執行碼，刻意保留。

4. **`context: fork` 語意** — 原版用此欄位指示 Claude Code 在新 context window 執行 skill。Pi 版刪除此欄位，隔離行為改由 `ralph` skill 的 subagent 機制處理。對於 `setup`、`reseed` 等原本需要 fork 的重量級 skill，pi 使用者可手動用 subagent 或新 session 執行。

5. **`model: opus/sonnet` 語意** — 原版用此欄位指定 skill 執行時的模型。Pi 版刪除，模型選擇由使用者自行決定。
