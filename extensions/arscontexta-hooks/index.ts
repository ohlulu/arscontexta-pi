/**
 * Ars Contexta — Pi Extension
 *
 * Ports the 4 Claude Code hooks to pi's extension system:
 *   1. Session Orient     — inject vault tree, identity, goals, maintenance signals
 *   2. Write Validate     — schema enforcement on notes in knowledge space
 *   3. Auto Commit        — git auto-commit after writes to vault
 *   4. Transcript Capture — save session conversation to ops/sessions/ on shutdown
 *
 * Vault resolution: supports both "cwd is vault" and "cross-project via config".
 * Config: ~/.config/arscontexta.yaml → default_vault: <path>
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { existsSync, readFileSync, mkdirSync, writeFileSync, readdirSync, statSync, renameSync } from "node:fs";
import { join, resolve, basename, relative } from "node:path";
import { homedir } from "node:os";
import { execFileSync } from "node:child_process";

export default function (pi: ExtensionAPI) {
  // ─── Vault Resolution ────────────────────────────────────────
  // Two sources, first match wins:
  //   1. cwd itself is a vault (.arscontexta marker)
  //   2. ~/.config/arscontexta.yaml → default_vault
  function resolveVaultPath(cwd: string): string | null {
    // Priority 1: cwd is vault
    if (existsSync(join(cwd, ".arscontexta"))) return cwd;

    // Priority 2: global config
    const configPath = join(homedir(), ".config", "arscontexta.yaml");
    if (existsSync(configPath)) {
      try {
        const config = readFileSync(configPath, "utf-8");
        const match = config.match(/^default_vault:\s*(.+)$/m);
        if (match) {
          const raw = match[1].trim().replace(/^['"]|['"]$/g, "");
          const vaultPath = resolve(raw.replace(/^~/, homedir()));
          if (existsSync(join(vaultPath, ".arscontexta"))) return vaultPath;
        }
      } catch {
        // Config unreadable — fall through
      }
    }

    return null;
  }

  // ─── Config Reader ───────────────────────────────────────────
  // Reads key-value from .arscontexta marker (doubles as config)
  function readVaultConfig(vaultPath: string, key: string, defaultVal = "true"): string {
    const configFile = join(vaultPath, ".arscontexta");
    if (!existsSync(configFile)) return defaultVal;
    try {
      const content = readFileSync(configFile, "utf-8");
      const match = content.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
      if (match) {
        return match[1].trim().replace(/^['"]|['"]$/g, "");
      }
    } catch {
      // Fall through
    }
    return defaultVal;
  }

  // ─── Helpers ─────────────────────────────────────────────────
  function countFiles(dir: string, ext: string): number {
    if (!existsSync(dir)) return 0;
    try {
      return readdirSync(dir).filter((f) => f.endsWith(ext)).length;
    } catch {
      return 0;
    }
  }

  function safeReadFile(path: string): string {
    try {
      return existsSync(path) ? readFileSync(path, "utf-8") : "";
    } catch {
      return "";
    }
  }

  function safeExecFile(bin: string, args: string[], cwd: string): string {
    try {
      return execFileSync(bin, args, { cwd, timeout: 5000, encoding: "utf-8" }).trim();
    } catch {
      return "";
    }
  }

  function countUnminedSessions(dir: string): number {
    if (!existsSync(dir)) return 0;
    try {
      return readdirSync(dir)
        .filter((f) => f.endsWith(".md"))
        .filter((f) => {
          const content = safeReadFile(join(dir, f));
          return !content.includes("mined: true");
        })
        .length;
    } catch {
      return 0;
    }
  }

  // Format session entries into a mineable markdown transcript.
  // Keeps user + assistant text + tool call summaries. Skips tool output and thinking.
  function formatTranscript(entries: any[], sessionTimestamp: string): string | null {
    const lines: string[] = [];
    let hasContent = false;

    const date = sessionTimestamp.replace(/T.*/, "").replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
    lines.push("---");
    lines.push(`description: Session transcript ${date}`);
    lines.push(`started: ${sessionTimestamp}`);
    lines.push("---");
    lines.push("");
    lines.push(`# Session ${date}`);
    lines.push("");

    for (const entry of entries) {
      if (entry.type === "compaction") {
        lines.push("## [Compacted Context]");
        lines.push("");
        if (entry.summary) lines.push(entry.summary);
        lines.push("");
        hasContent = true;
        continue;
      }

      if (entry.type !== "message") continue;
      const msg = entry.message;
      if (!msg || !msg.role) continue;

      if (msg.role === "user") {
        lines.push("## User");
        lines.push("");
        const content = msg.content;
        if (typeof content === "string") {
          lines.push(content);
          hasContent = true;
        } else if (Array.isArray(content)) {
          for (const part of content) {
            if (part.type === "text") {
              lines.push(part.text);
              hasContent = true;
            }
          }
        }
        lines.push("");
      } else if (msg.role === "assistant") {
        lines.push("## Assistant");
        lines.push("");
        const content = msg.content;
        if (Array.isArray(content)) {
          for (const part of content) {
            if (part.type === "text") {
              lines.push(part.text);
              hasContent = true;
            } else if (part.type === "toolCall") {
              const args = part.arguments || {};
              let summary = part.name;
              if (args.path) summary += ` \`${args.path}\``;
              else if (args.command) {
                const cmd = String(args.command).split("\n")[0].slice(0, 100);
                summary += ` \`${cmd}\``;
              }
              lines.push(`> 🔧 ${summary}`);
            }
            // Skip thinking content — not useful for friction mining
          }
        }
        lines.push("");
      }
      // Skip toolResult entries — noise for friction mining
    }

    return hasContent ? lines.join("\n") : null;
  }

  // ─── Session State ───────────────────────────────────────────
  // Track entry count at session start to avoid duplicate transcripts on /reload.
  // On shutdown we only capture entries after this index.
  let entryCountAtStart = 0;

  // ─── 1. Session Orient ───────────────────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    // Snapshot current conversation length so shutdown only captures the delta
    try {
      entryCountAtStart = ctx.sessionManager.getBranch().length;
    } catch {
      entryCountAtStart = 0;
    }
    const vaultPath = resolveVaultPath(ctx.cwd);
    if (!vaultPath) return;

    const isLocal = vaultPath === ctx.cwd;
    const lines: string[] = [];

    lines.push(`## Ars Contexta Vault`);
    lines.push(`**Vault:** \`${vaultPath}\`${isLocal ? " (cwd)" : " (remote — via config)"}`);
    lines.push("");

    // Workspace tree (3 levels, .md files only)
    lines.push("### Workspace Structure");
    lines.push("");
    const tree = safeExecFile(
      "tree", ["-L", "3", "--charset", "ascii", "-I", ".git|node_modules|.pi", "-P", "*.md", "."],
      vaultPath
    );
    if (tree) {
      lines.push("```");
      lines.push(tree);
      lines.push("```");
    } else {
      // Fallback without tree command
      const findResult = safeExecFile(
        "find", [".", "-name", "*.md", "-not", "-path", "./.git/*", "-not", "-path", "*/node_modules/*", "-maxdepth", "3"],
        vaultPath
      );
      if (findResult) {
        lines.push("```");
        lines.push(findResult.split("\n").sort().join("\n"));
        lines.push("```");
      }
    }
    lines.push("");

    // Session tracking
    const sessionsDir = join(vaultPath, "ops", "sessions");
    if (existsSync(join(sessionsDir, "current.json"))) {
      lines.push("### Previous Session");
      lines.push("```json");
      lines.push(safeReadFile(join(sessionsDir, "current.json")));
      lines.push("```");
      lines.push("");
    }

    // Goals (self/goals.md or ops/goals.md)
    const selfGoals = join(vaultPath, "self", "goals.md");
    const opsGoals = join(vaultPath, "ops", "goals.md");
    if (existsSync(selfGoals)) {
      lines.push("### Goals");
      lines.push(safeReadFile(selfGoals));
      lines.push("");
    } else if (existsSync(opsGoals)) {
      lines.push("### Goals");
      lines.push(safeReadFile(opsGoals));
      lines.push("");
    }

    // Identity (if self space enabled)
    const identityFile = join(vaultPath, "self", "identity.md");
    if (existsSync(identityFile)) {
      lines.push("### Identity");
      lines.push(safeReadFile(identityFile));
      const methodology = safeReadFile(join(vaultPath, "self", "methodology.md"));
      if (methodology) {
        lines.push(methodology);
      }
      lines.push("");
    }

    // Recent methodology notes (top 5)
    const methDir = join(vaultPath, "ops", "methodology");
    if (existsSync(methDir)) {
      try {
        const methFiles = readdirSync(methDir)
          .filter((f) => f.endsWith(".md"))
          .map((f) => ({
            name: f,
            mtime: statSync(join(methDir, f)).mtimeMs,
          }))
          .sort((a, b) => b.mtime - a.mtime)
          .slice(0, 5);

        if (methFiles.length > 0) {
          lines.push("### Recent Methodology");
          for (const mf of methFiles) {
            const content = safeReadFile(join(methDir, mf.name));
            const firstLines = content.split("\n").slice(0, 3).join("\n");
            lines.push(firstLines);
          }
          lines.push("");
        }
      } catch {
        // Skip if unreadable
      }
    }

    // Condition-based maintenance signals
    const signals: string[] = [];

    const obsCount = countFiles(join(vaultPath, "ops", "observations"), ".md");
    if (obsCount >= 10) signals.push(`⚠️ ${obsCount} pending observations → /skill:rethink`);

    const tensCount = countFiles(join(vaultPath, "ops", "tensions"), ".md");
    if (tensCount >= 5) signals.push(`⚠️ ${tensCount} unresolved tensions → /skill:rethink`);

    const sessCount = countUnminedSessions(join(vaultPath, "ops", "sessions"));
    if (sessCount >= 5) signals.push(`⚠️ ${sessCount} unprocessed sessions → /skill:remember`);

    const inboxCount = countFiles(join(vaultPath, "inbox"), ".md");
    if (inboxCount >= 3) signals.push(`⚠️ ${inboxCount} items in inbox → /skill:reduce`);

    if (signals.length > 0) {
      lines.push("### Maintenance Signals");
      for (const s of signals) lines.push(`- ${s}`);
      lines.push("");
    }

    // Inject into conversation
    pi.sendMessage({
      customType: "arscontexta-orient",
      content: lines.join("\n"),
      display: true,
    });

    // Session tracking: write current session file
    if (readVaultConfig(vaultPath, "session_capture") === "true") {
      const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
      mkdirSync(sessionsDir, { recursive: true });

      // Archive previous session if exists
      const currentFile = join(sessionsDir, "current.json");
      if (existsSync(currentFile)) {
        try {
          const prev = JSON.parse(readFileSync(currentFile, "utf-8"));
          if (prev.started) {
            renameSync(currentFile, join(sessionsDir, `${prev.started}.json`));
          }
        } catch {
          // Corrupt file — overwrite
        }
      }

      writeFileSync(
        currentFile,
        JSON.stringify({ started: timestamp, status: "active" }, null, 2)
      );

      // Git commit session start
      if (readVaultConfig(vaultPath, "git") === "true") {
        safeExecFile("git", ["-C", vaultPath, "add", "ops/sessions/"], vaultPath);
        safeExecFile(
          "git", ["-C", vaultPath, "commit", "-m", `Session start: ${timestamp}`, "--quiet", "--no-verify"],
          vaultPath
        );
      }
    }
  });

  // ─── Helper: is file-modifying tool? ──────────────────────────
  const FILE_TOOLS = new Set(["Write", "write", "Edit", "edit"]);

  // ─── 2. Write Validate ───────────────────────────────────────
  pi.on("tool_result", async (event, _ctx) => {
    if (!FILE_TOOLS.has(event.toolName)) return;

    const vaultPath = resolveVaultPath(_ctx.cwd);
    if (!vaultPath) return;

    // Extract file path from tool input
    const filePath: string = (event.input as { path?: string })?.path ?? "";
    if (!filePath) return;

    // Resolve to absolute path
    const absPath = resolve(filePath);

    // Only validate files inside vault's notes/ or thinking/ directories
    const relToVault = relative(vaultPath, absPath);
    if (relToVault.startsWith("..")) return; // Outside vault
    if (!relToVault.startsWith("notes/") && !relToVault.startsWith("thinking/")) return;

    // Check file exists
    if (!existsSync(absPath)) return;

    // Read first 20 lines for frontmatter check
    const content = safeReadFile(absPath);
    const head = content.split("\n").slice(0, 20).join("\n");

    const warnings: string[] = [];

    if (!content.startsWith("---")) {
      warnings.push("Missing YAML frontmatter");
    }
    if (!/^description:/m.test(head)) {
      warnings.push("Missing description field");
    }
    if (!/^topics:/m.test(head)) {
      warnings.push("Missing topics field");
    }

    if (warnings.length > 0) {
      const fileName = basename(absPath, ".md");
      // Append warnings to tool result content
      const existingContent = event.content ?? [];
      return {
        content: [
          ...existingContent,
          {
            type: "text" as const,
            text: `\n⚠️ Schema warnings for "${fileName}": ${warnings.join(". ")}.`,
          },
        ],
      };
    }
  });

  // ─── 3. Auto Commit (debounced) ──────────────────────────────
  // Debounce: batch rapid writes into a single commit.
  // Eliminates git lock race when agent writes multiple files quickly.
  let commitTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingFiles: Set<string> = new Set();
  let pendingVaultPath: string | null = null;

  const COMMIT_DELAY_MS = 2000;

  function flushCommit() {
    commitTimer = null;
    const vaultPath = pendingVaultPath;
    const files = [...pendingFiles];
    pendingFiles.clear();
    pendingVaultPath = null;

    if (!vaultPath || files.length === 0) return;

    try {
      const isGit = safeExecFile("git", ["-C", vaultPath, "rev-parse", "--is-inside-work-tree"], vaultPath);
      if (isGit !== "true") return;

      // Stage each pending file
      for (const f of files) {
        safeExecFile("git", ["-C", vaultPath, "add", "--", f], vaultPath);
      }

      // Also stage ops/sessions/ if it exists
      const sessionsDir = join(vaultPath, "ops", "sessions");
      if (existsSync(sessionsDir)) {
        safeExecFile("git", ["-C", vaultPath, "add", "--", "ops/sessions/"], vaultPath);
      }

      // Check for staged changes
      try {
        execFileSync("git", ["-C", vaultPath, "diff", "--cached", "--quiet"], {
          cwd: vaultPath, timeout: 5000,
        });
        return; // No staged changes
      } catch {
        // Has staged changes — continue
      }

      // Build commit message
      let msg: string;
      if (files.length === 1) {
        msg = `Auto: ${relative(vaultPath, files[0])}`;
      } else {
        msg = `Auto: ${files.length} files`;
      }

      safeExecFile("git", ["-C", vaultPath, "commit", "-m", msg, "--no-verify"], vaultPath);
    } catch {
      // Silent failure — auto-commit is best-effort
    }
  }

  pi.on("tool_result", async (event, _ctx) => {
    if (!FILE_TOOLS.has(event.toolName)) return;

    const vaultPath = resolveVaultPath(_ctx.cwd);
    if (!vaultPath) return;

    if (readVaultConfig(vaultPath, "git") !== "true") return;

    const filePath: string = (event.input as { path?: string })?.path ?? "";
    if (!filePath) return;

    const absPath = resolve(filePath);
    const relToVault = relative(vaultPath, absPath);
    if (relToVault.startsWith("..")) return;

    // Accumulate file, reset timer
    pendingVaultPath = vaultPath;
    pendingFiles.add(absPath);
    if (commitTimer) clearTimeout(commitTimer);
    commitTimer = setTimeout(flushCommit, COMMIT_DELAY_MS);
  });

  // ─── 4. Session Transcript Capture ─────────────────────────
  // Save conversation transcript to ops/sessions/ on shutdown.
  // Enables /remember --mine to scan for friction patterns.
  pi.on("session_shutdown", async (_event, ctx) => {
    const vaultPath = resolveVaultPath(ctx.cwd);

    if (vaultPath && readVaultConfig(vaultPath, "session_capture") === "true") {
      try {
        const sessionsDir = join(vaultPath, "ops", "sessions");
        const currentFile = join(sessionsDir, "current.json");

        if (existsSync(currentFile)) {
          const current = JSON.parse(readFileSync(currentFile, "utf-8"));
          const timestamp = current.started;

          if (timestamp) {
            const allEntries = ctx.sessionManager.getBranch();
            // Only capture entries added AFTER session_start to avoid duplicates on /reload
            const newEntries = allEntries.slice(entryCountAtStart);

            // Count meaningful user messages in the new portion
            const newUserMessages = newEntries.filter(
              (e: any) => e.type === "message" && e.message?.role === "user"
            ).length;

            // Skip transcript if no meaningful new user interaction (e.g. bare /reload)
            if (newUserMessages < 1) {
              // Still mark session as completed
              writeFileSync(
                currentFile,
                JSON.stringify({ ...current, status: "completed" }, null, 2)
              );
              return;
            }

            const transcript = formatTranscript(newEntries, timestamp);

            if (transcript) {
              writeFileSync(join(sessionsDir, `${timestamp}.md`), transcript);
              writeFileSync(
                currentFile,
                JSON.stringify({ ...current, status: "completed" }, null, 2)
              );

              if (readVaultConfig(vaultPath, "git") === "true") {
                safeExecFile("git", ["-C", vaultPath, "add", "ops/sessions/"], vaultPath);
                safeExecFile(
                  "git",
                  ["-C", vaultPath, "commit", "-m", `Session end: ${timestamp}`, "--quiet", "--no-verify"],
                  vaultPath
                );
              }
            }
          }
        }
      } catch {
        // Silent failure — session capture is best-effort
      }
    }

    // Flush pending auto-commits so last writes aren't lost
    if (commitTimer) {
      clearTimeout(commitTimer);
      flushCommit();
    }
  });
}
