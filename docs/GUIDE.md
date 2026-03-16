# Ars Contexta Pi — 完整功能指南

Ars Contexta 是一個 **知識系統生成器**。你跟它對話，描述你的領域和工作方式，它會根據 249 條研究方法論，推導出一套量身定制的知識架構。

產出是一個 **vault**——一個用 markdown + wiki links 構成的知識圖譜，搭配自動化處理 pipeline。

---

## 系統組成

整個系統由四個部分組成：

### 1. Skills（26 個指令）
SKILL.md 檔案，agent 讀了之後知道怎麼做。用 `/skill:<name>` 觸發。

### 2. Extension（1 個）
TypeScript 檔案，pi 啟動時自動載入。在背景自動做三件事：session 開始時注入 context、寫檔時檢查 schema、寫檔後自動 git commit。

### 3. Agent（1 個）
knowledge-guide，一個可以被呼叫的 subagent，提供方法論建議。

### 4. Reference（321 個檔案）
研究方法論、kernel 規格、生成器模板、預設配置。Skills 在執行時會讀取這些檔案。

---

## 所有 Skills 完整介紹

### 一次性設定類（用一次就好）

#### `/skill:setup` — 建立知識系統
跟你對話 2-4 輪，了解你的領域（研究、個人生活管理、實驗性...），然後自動生成：
- 資料夾結構（notes/, ops/, self/ 等）
- 筆記模板（含 schema 定義）
- 16 個客製化 skills（用你的領域詞彙）
- Context file（CLAUDE.md）
- vault marker（.arscontexta）
- 配置紀錄（ops/derivation.md）

這是整個系統的起點。跑完之後你的 vault 就可以用了。

#### `/skill:tutorial` — 互動教學
手把手帶你走一遍系統。三個路線（研究者、管理者、個人），每一步都會在你的 vault 裡建立真實內容。邊做邊學。

---

### 日常處理 Pipeline（最常用的 6 個）

這是 vault 的核心工作流程，叫做 **6 Rs**：

#### `/skill:reduce` — 萃取知識（Record → Reduce）
讀一份原始資料（文章、研究、筆記），從裡面萃取出原子化的知識筆記。
- 每個萃取出來的 insight 變成一個獨立的 markdown 檔案
- 標題是一個完整的命題句（可以被同意或反對的）
- 會跑語意搜尋檢查重複
- 對領域相關來源，萃取率要 > 90%

這是最重的 skill，約 700 行指令。

#### `/skill:reflect` — 找連結（Reflect）
新筆記建好後，找它跟既有筆記的關係。
- 更新 MOC（Maps of Content，主題導航頁）
- 加 wiki links 連到相關筆記
- 需要語意判斷，不是機械式操作

#### `/skill:reweave` — 反向更新（Reweave）
reflect 是「新筆記找舊連結」，reweave 是反過來：「回去更新舊筆記，加上新筆記帶來的 context」。
- 重新檢視早於新內容的舊筆記
- 加連結、磨利論點、考慮是否該拆分

#### `/skill:verify` — 品質檢查（Verify）
三合一檢查：
1. **recite** — 只看 description，猜筆記內容。猜不到就代表 description 寫得不好
2. **validate** — schema 合規檢查（必填欄位、enum 值）
3. **review** — 健康度檢查（link 是否斷掉、是否孤兒筆記）

#### `/skill:rethink` — 挑戰假設（Rethink）
回顧系統累積的觀察（ops/observations/）和張力（ops/tensions/），找規律，提出改進提案。
- 「我們一直在做 X，但觀察顯示 Y 效果更好」
- 科學方法應用在知識系統本身

#### `/skill:pipeline` — 一條龍處理
把一個來源從頭到尾跑完：seed → reduce → 每個 claim 跑 reflect → reweave → verify → archive。
一個指令做完全部。

---

### 排程與佇列

#### `/skill:seed` — 加入處理佇列
把一個檔案（inbox 裡的文章、研究報告）加入處理佇列。
- 檢查重複
- 建立 archive 資料夾
- 把來源從 inbox 移出
- 在 ops/queue/ 建立 extract task

#### `/skill:ralph` — 佇列處理器
讀取 ops/queue/，一次處理 N 個任務。每個任務會指示 agent spawn subagent 來執行（拿 fresh context），避免 context 被佔滿。
- `/skill:ralph 5` — 處理 5 個佇列任務
- 支援序列、平行、批次過濾、dry run

**注意：** 這個 ralph 跟你裝的 ralph-wiggum skill 是完全不同的東西。這個是 vault 的 queue processor。

#### `/skill:tasks` — 看佇列狀態
看目前有哪些待處理、進行中、已完成的任務。

#### `/skill:next` — 下一步建議
綜合佇列狀態、inbox 壓力、健康度、目標，推薦一個最有價值的下一步動作。

---

### 分析與查詢

#### `/skill:stats` — vault 統計
筆記數量、連結密度、MOC 覆蓋率、成長趨勢。一份可分享的 vault 健康快照。

#### `/skill:graph` — 圖譜分析
用自然語言問問題，路由到圖譜分析腳本，解讀結果，建議行動。
- 「哪些筆記是橋樑？」
- 「有哪些 synthesis 機會？」
- 「哪些區域最稀疏？」

#### `/skill:health` — 健康診斷
8 大類檢查：schema 合規、孤兒偵測、link 健康、description 品質、三空間邊界、處理吞吐量、過期筆記、MOC 連貫性。
- quick 模式（3 類）/ full 模式（8 類）/ three-space 模式（只查邊界違規）
- 輸出 FAIL / WARN / PASS 報告，附修復建議

#### `/skill:validate` — schema 驗證
單獨跑 schema 檢查。對照模板驗證必填欄位、enum 值、description 品質、link 健康。
非阻塞——只警告不阻止。

---

### 成長與研究

#### `/skill:learn` — 研究主題
給一個主題，用 web search 或 deep researcher 去調查，結果存入 inbox 並附完整來源。然後可以接 pipeline 處理。

#### `/skill:remember` — 捕捉摩擦
三種模式：
1. 明確描述——你告訴它「剛才那個流程有問題」
2. 上下文回顧——回顧最近的修正和方向調整
3. Session mining——掃描 transcript 找規律

產出寫入 ops/methodology/，變成系統的自我知識。

---

### 系統演化（進階）

#### `/skill:ask` — 問方法論
查詢內建的 249 條研究方法論。三層知識庫：
- WHY（研究主張）
- HOW（操作指南）
- WHAT IT LOOKS LIKE（領域實例）

例：「為什麼我的系統用原子筆記？」→ 回傳有根據的研究答案。

#### `/skill:recommend` — 架構建議
描述你的使用情境、限制、目標，拿到有研究依據的具體建議。

#### `/skill:architect` — 演化建議
分析健康報告、摩擦模式、推導歷史，提出有研究佐證的具體改動建議。
**不會自動執行**——提案需要你批准。

#### `/skill:refactor` — 結構重組
當你改了 config.yaml 的設定，這個 skill 比對舊設定，找出需要重組的地方，顯示計劃，經批准後執行。

#### `/skill:upgrade` — 升級方法論
當 Ars Contexta 的研究知識庫更新時，這個 skill 比對你的系統跟新版差異，提出升級建議。

#### `/skill:reseed` — 從頭推導
當結構性漂移累積太多（詞彙不一致、邊界模糊、模板偏離），從第一原理重新推導整個系統。保留所有內容，只重組架構。

#### `/skill:add-domain` — 新增領域
在既有系統上加一個新的知識領域。透過對話推導領域配置，生成專屬資料夾、模板、詞彙，同時保持跟既有架構的連接。

---

## Extension（自動背景行為）

安裝在 `~/.pi/agent/extensions/arscontexta-hooks/`，pi 啟動時自動載入。

**做三件事：**

### Session Orient — 開場注入
每次 pi 啟動時，如果偵測到 vault（cwd 有 `.arscontexta` 或 `~/.config/arscontexta.yaml` 指定了 vault 路徑），自動注入：
- Vault 路徑
- 目錄結構 tree
- 上次 session 狀態
- Goals（self/goals.md 或 ops/goals.md）
- Identity（self/identity.md）
- 最近 5 條方法論筆記
- 維護信號（observations ≥ 10？tensions ≥ 5？inbox ≥ 3？）

### Write Validate — 寫入時 schema 檢查
Agent 寫入或編輯 vault 的 notes/ 或 thinking/ 目錄下的檔案時，自動檢查：
- 有沒有 YAML frontmatter
- 有沒有 description 欄位
- 有沒有 topics 欄位

不通過會在 tool result 裡附上警告，agent 會看到。

### Auto Commit — 自動 git commit
Agent 寫入 vault 檔案後，自動 git add + commit。
- 2 秒 debounce：連續寫 3 個檔案只產生 1 次 commit
- 只 stage 寫入的檔案（不是 git add -A）
- pi 關閉時會 flush 未完成的 commit

---

## Agent（subagent）

### knowledge-guide
方法論導師。可以被其他 skill 或使用者手動呼叫。
- 檢查筆記品質（標題是不是命題句？description 有沒有附加值？）
- 建議連結機會
- 建議 MOC 更新
- 校正 schema 合規
- 解釋為什麼某個建議重要

---

## Vault 結構（setup 生成後）

```
my-vault/
├── .arscontexta           # vault marker + config（git: true, session_capture: true）
├── CLAUDE.md              # context file（agent 的操作手冊）
├── skills/            # 16 個客製化 skills（用你的領域詞彙）
├── self/                  # agent 的持久記憶（可選）
│   ├── identity.md        # 我是誰
│   ├── methodology.md     # 我怎麼工作
│   └── goals.md           # 目前在做什麼
├── notes/                 # 知識圖譜（主要內容）
│   └── index.md           # Hub MOC（入口）
├── ops/                   # 運營層
│   ├── queue/             # 處理佇列
│   ├── sessions/          # session 紀錄
│   ├── observations/      # 摩擦觀察
│   ├── tensions/          # 矛盾張力
│   ├── methodology/       # 系統自我知識
│   ├── config.yaml        # 維度設定
│   ├── derivation.md      # 推導紀錄
│   └── goals.md           # 目標（self/ 關閉時）
└── inbox/                 # 待處理來源
```

三空間分離：**self/**（agent 記憶）、**notes/**（知識）、**ops/**（運營）。

---

## 典型工作流程

```
1. 丟一篇文章到 inbox/
2. /skill:seed inbox/article.md          → 加入佇列
3. /skill:reduce ops/queue/article.md    → 萃取 15 個 insights
4. /skill:reflect notes/new-claim.md     → 找連結、更新 MOC
5. /skill:reweave                        → 更新受影響的舊筆記
6. /skill:verify notes/new-claim.md      → 品質檢查

或者一步到位：
/skill:pipeline inbox/article.md

或者批次處理：
/skill:ralph 5                           → 處理佇列裡 5 個任務
```

---

## 安裝方式

```bash
# 1. Clone repo
git clone <repo> ~/Developer/arscontexta-pi

# 2. 加 skills 路徑
# ~/.pi/agent/settings.json
{ "skills": ["~/Developer/arscontexta-pi/.pi/skills"] }

# 3. Symlink extension
ln -s ~/Developer/arscontexta-pi/extensions/arscontexta-hooks \
      ~/.pi/agent/extensions/arscontexta-hooks

# 4. 設定 vault 路徑（跨專案存取用）
# ~/.config/arscontexta.yaml
default_vault: ~/Developer/my-vault

# 5. 建立 vault
pi
/skill:setup
```
