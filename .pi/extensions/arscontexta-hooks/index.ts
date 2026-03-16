/**
 * Ars Contexta — Pi Extension
 *
 * Ports the 4 Claude Code hooks to pi's extension system:
 *   1. Session Orient  — inject vault tree, identity, goals, maintenance signals
 *   2. Write Validate  — schema enforcement on notes in knowledge space
 *   3. Auto Commit     — git auto-commit after writes to vault
 *
 * Vault resolution: supports both "cwd is vault" and "cross-project via config".
 * Config: ~/.config/arscontexta.yaml → default_vault: <path>
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { existsSync, readFileSync, mkdirSync, writeFileSync, readdirSync, statSync, renameSync } from "node:fs";
import { join, resolve, basename, relative } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";

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

  function safeExec(cmd: string, cwd: string): string {
    try {
      return execSync(cmd, { cwd, timeout: 5000, encoding: "utf-8" }).trim();
    } catch {
      return "";
    }
  }

  // ─── 1. Session Orient ───────────────────────────────────────
  pi.on("session_start", async (_event, ctx) => {
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
    const tree = safeExec(
      `tree -L 3 --charset ascii -I '.git|node_modules|.pi' -P '*.md' .`,
      vaultPath
    );
    if (tree) {
      lines.push("```");
      lines.push(tree);
      lines.push("```");
    } else {
      // Fallback without tree command
      const findResult = safeExec(
        `find . -name "*.md" -not -path "./.git/*" -not -path "*/node_modules/*" -maxdepth 3 | sort`,
        vaultPath
      );
      if (findResult) {
        lines.push("```");
        lines.push(findResult);
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

    const sessCount = countFiles(join(vaultPath, "ops", "sessions"), ".json") - 1; // exclude current.json
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
        safeExec(`git -C "${vaultPath}" add ops/sessions/ 2>/dev/null`, vaultPath);
        safeExec(
          `git -C "${vaultPath}" commit -m "Session start: ${timestamp}" --quiet --no-verify 2>/dev/null`,
          vaultPath
        );
      }
    }
  });

  // ─── 2. Write Validate ───────────────────────────────────────
  pi.on("tool_result", async (event, _ctx) => {
    if (event.toolName !== "Write" && event.toolName !== "write") return;

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

  // ─── 3. Auto Commit ─────────────────────────────────────────
  pi.on("tool_result", async (event, _ctx) => {
    if (event.toolName !== "Write" && event.toolName !== "write") return;

    const vaultPath = resolveVaultPath(_ctx.cwd);
    if (!vaultPath) return;

    // Check config
    if (readVaultConfig(vaultPath, "git") !== "true") return;

    // Extract file path
    const filePath: string = (event.input as { path?: string })?.path ?? "";
    if (!filePath) return;

    // Only auto-commit files inside the vault
    const absPath = resolve(filePath);
    const relToVault = relative(vaultPath, absPath);
    if (relToVault.startsWith("..")) return;

    // Non-blocking async commit
    (async () => {
      try {
        // Check if vault is a git repo
        const isGit = safeExec(`git -C "${vaultPath}" rev-parse --is-inside-work-tree`, vaultPath);
        if (isGit !== "true") return;

        // Stage all vault changes
        safeExec(`git -C "${vaultPath}" add -A`, vaultPath);

        // Check for staged changes
        const hasChanges = safeExec(
          `git -C "${vaultPath}" diff --cached --quiet 2>/dev/null; echo $?`,
          vaultPath
        );
        if (hasChanges === "0") return; // No changes

        // Build commit message
        const changedFiles = safeExec(
          `git -C "${vaultPath}" diff --cached --name-only`,
          vaultPath
        );
        const fileList = changedFiles.split("\n").filter(Boolean);
        const fileCount = fileList.length;

        let msg: string;
        if (fileCount === 1) {
          msg = `Auto: ${fileList[0]}`;
        } else {
          msg = `Auto: ${fileCount} files`;
        }

        safeExec(
          `git -C "${vaultPath}" commit -m "${msg}" --no-verify`,
          vaultPath
        );
      } catch {
        // Silent failure — auto-commit is best-effort
      }
    })();
  });
}
