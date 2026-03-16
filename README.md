# Ars Contexta for Pi

> **Fork of [agenticnotetaking/arscontexta](https://github.com/agenticnotetaking/arscontexta)** — ported from Claude Code plugin to [pi](https://github.com/badlogic/pi-mono) coding agent.

**A second brain for your agent.**

A [pi](https://github.com/badlogic/pi-mono) skill pack that generates complete knowledge systems from conversation. You describe how you think and work. The engine derives a cognitive architecture — folder structure, context files, processing pipeline, hooks, navigation maps, and note templates — tailored to your domain and backed by 249 research claims.

No templates. No configuration. Just conversation.

**v0.1.0** · pi skills + extension · MIT

---

## Installation

### 1. Add skills to pi

Clone this repo, then add its skill path to your pi settings:

```bash
git clone https://github.com/ohlulu/arscontexta-pi.git ~/Developer/arscontexta-pi
```

Edit `~/.pi/agent/settings.json`:

```json
{
  "skills": [
    "~/Developer/arscontexta-pi/skills"
  ]
}
```

### 2. Install extension (global)

Symlink the extension to your global pi extensions:

```bash
ln -s ~/Developer/arscontexta-pi/extensions/arscontexta-hooks \
      ~/.pi/agent/extensions/arscontexta-hooks
```

### 3. Configure vault path (for cross-project access)

Create `~/.config/arscontexta.yaml`:

```yaml
default_vault: ~/Developer/my-vault
```

This lets you operate on your vault from any project directory.

### 4. Run setup

```bash
cd ~/Developer/my-vault  # or any directory
pi
```

Then:

```
/skill:setup
```

Answer 2-4 questions about your domain (~20 minutes). The engine generates your complete knowledge system.

---

## What It Does

Most AI tools start every session blank. Ars Contexta changes that by generating a persistent thinking system derived from how you actually work.

**What you get:**

- **A vault** — plain markdown files connected by wiki links, forming a traversable knowledge graph. No database, no cloud, no lock-in.
- **A processing pipeline** — skills that extract insights, find connections, update old notes with new context, and verify quality.
- **Automation** — an extension that enforces structure on every write, detects maintenance needs, captures session state, and auto-commits.
- **Navigation** — Maps of Content (MOCs) at hub, domain, and topic levels.
- **Templates** — note templates with `_schema` blocks as single source of truth.

---

## Commands

All commands use `/skill:<name>` format in pi.

### Platform Commands (always available)

| Command | What It Does |
|---------|-------------|
| `/skill:setup` | Conversational onboarding — generates your full system |
| `/skill:help` | Contextual guidance and command discovery |
| `/skill:tutorial` | Interactive walkthrough (learn by doing) |
| `/skill:ask` | Query the research graph for methodology answers |
| `/skill:health` | Run diagnostic checks on your vault |
| `/skill:recommend` | Get architecture advice for your use case |
| `/skill:architect` | Research-backed evolution guidance |
| `/skill:add-domain` | Add a new knowledge domain to an existing system |
| `/skill:reseed` | Re-derive from first principles when drift accumulates |
| `/skill:upgrade` | Apply methodology updates to your system |

### Processing Commands (available after setup)

| Command | What It Does |
|---------|-------------|
| `/skill:reduce` | Extract insights from sources |
| `/skill:reflect` | Find connections, update MOCs |
| `/skill:reweave` | Update older notes with new connections |
| `/skill:verify` | Combined quality check |
| `/skill:validate` | Schema compliance checking |
| `/skill:seed` | Create extraction task with duplicate detection |
| `/skill:ralph` | Queue-based orchestration with fresh context per phase |
| `/skill:pipeline` | End-to-end source processing |
| `/skill:tasks` | Queue management |
| `/skill:stats` | Vault metrics |
| `/skill:graph` | Graph analysis |
| `/skill:next` | Next-action recommendation |
| `/skill:learn` | Research and grow |
| `/skill:remember` | Mine session learnings |
| `/skill:rethink` | Challenge system assumptions |
| `/skill:refactor` | Structural improvements |

---

## Processing Pipeline

The vault implements the **6 Rs**, extending Cornell Note-Taking's 5 Rs with a meta-cognitive layer:

| Phase | What Happens | Command |
|-------|-------------|---------|
| **Record** | Zero-friction capture into inbox/ | Manual |
| **Reduce** | Extract insights with domain-native categories | `/skill:reduce` |
| **Reflect** | Find connections, update MOCs | `/skill:reflect` |
| **Reweave** | Update older notes with new context | `/skill:reweave` |
| **Verify** | Description + schema + health checks | `/skill:verify` |
| **Rethink** | Challenge system assumptions | `/skill:rethink` |

---

## Extension (Hooks)

The extension (`arscontexta-hooks`) runs globally and provides three automated behaviors:

| Hook | Event | What It Does |
|------|-------|-------------|
| **Session Orient** | Session start | Injects vault tree, identity, goals, and maintenance signals |
| **Write Validate** | After write | Schema enforcement on notes in notes/ and thinking/ |
| **Auto Commit** | After write | Git auto-commit, non-blocking |

The extension resolves the vault via:
1. `.arscontexta` marker in current directory, OR
2. `~/.config/arscontexta.yaml` → `default_vault` path

This means you can work on your vault from any project directory.

---

## Three-Space Architecture

Every generated system separates content into three spaces:

| Space | Purpose | Growth |
|-------|---------|--------|
| **self/** | Agent persistent mind — identity, methodology, goals | Slow (tens of files) |
| **notes/** | Knowledge graph — the reason the system exists | Steady (10-50/week) |
| **ops/** | Operational coordination — queue state, sessions | Fluctuating |

---

## The Research Graph

The `methodology/` directory contains **249 interconnected research claims** about tools for thought, knowledge management, and agent-native cognitive architecture. These claims back every configuration decision.

### Synthesizes

Zettelkasten · Cornell Note-Taking · Evergreen Notes · PARA · GTD · Memory Palaces · Cognitive Science (extended mind, spreading activation, generation effect) · Network Theory (small-world topology, betweenness centrality) · Agent Architecture (context windows, session boundaries, multi-agent patterns)

---

## Semantic Search (optional)

[qmd](https://github.com/tobi/qmd) adds concept matching across vocabularies. Not required — the system works with ripgrep + MOC traversal.

```bash
bun install -g @tobilu/qmd
cd your-vault/
qmd init
qmd collection add . --name notes --mask "notes/**/*.md"
qmd embed
```

---

## Prerequisites

| Dependency | Required | Purpose |
|-----------|----------|---------|
| [pi](https://github.com/badlogic/pi-mono) | Yes | Agent harness |
| `tree` | Yes | Workspace structure injection |
| `ripgrep` (`rg`) | Yes | YAML queries, schema validation |
| [qmd](https://github.com/tobi/qmd) | Optional | Semantic search |

---

## Philosophy

The name connects to a tradition. **Ars Combinatoria**, **Ars Memoria**, **Ars Contexta**: the art of context.

Llull's rotating wheels generated truth through combination. Bruno's memory wheels created millions of image combinations. They were external thinking systems — tools to think with rather than just store in. The missing piece: they required a human mind to do the traversing. Now LLMs can traverse. The wheels can spin again.

---

## Credits

Forked from [agenticnotetaking/arscontexta](https://github.com/agenticnotetaking/arscontexta) (Claude Code plugin v0.8.0). Original research methodology, kernel specification, and 249 research claims by [agenticnotetaking](https://github.com/agenticnotetaking).

This port adapts the system for the [pi coding agent](https://github.com/badlogic/pi-mono): TypeScript extension replacing bash hooks, cross-project vault access, and pi-native skill format.

## License

MIT — see [LICENSE](LICENSE). Original work © agenticnotetaking, pi port © ohlulu.
