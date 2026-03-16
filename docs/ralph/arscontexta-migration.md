# Ars Contexta → Pi Migration

Migrate `bak/` (Claude Code plugin) to `.pi/` (pi coding agent) per `.pi/MIGRATION-PLAN.md`.

## Goals
- Port all 26 skills with correct frontmatter + relative paths
- Port 4 bash hooks → 1 TypeScript extension with `resolveVaultPath()` logic
- Move all reference material (249 methodology + 25 reference docs + generators + presets)
- Port agent definition
- Update README for pi distribution
- Archive bak/ to separate branch
- Verify all 3 test scenarios (vault cwd / cross-project + config / no vault)

## Checklist

### Phase 1: Scaffold + Reference Material
- [x] Create `.pi/` directory structure (skills/, extensions/, agents/, reference/)
- [x] Copy `bak/reference/*` → `.pi/reference/` (25+ files + templates/ + test-fixtures/)
- [x] Copy `bak/methodology/` → `.pi/reference/methodology/` (249 files)
- [x] Copy `bak/generators/` → `.pi/reference/generators/` (claude-md.md + 17 feature blocks)
- [x] Copy `bak/presets/` → `.pi/reference/presets/` (3 preset dirs)

### Phase 2: Port Skills (26 total)
- [x] Port `help` (standalone, validates basic skill loading)
- [x] Port `stats`, `tasks`, `next`, `graph` (read-only, no deps)
- [x] Port `validate`, `verify`, `health` (quality gates)
- [x] Port `seed`, `reduce`, `reflect`, `reweave` (pipeline core)
- [x] Port `pipeline`, `ralph` (orchestrators)
- [x] Port `learn`, `remember`, `rethink`, `refactor` (meta skills)
- [x] Port `setup`, `tutorial`, `ask`, `recommend`, `architect` (platform skills)
- [x] Port `reseed`, `upgrade`, `add-domain` (advanced lifecycle)
- [x] All skills: replace `${CLAUDE_PLUGIN_ROOT}` → relative paths
- [x] All skills: remove `context: fork`, `model: opus/sonnet` from frontmatter
- [x] All skills: replace `mcp__qmd__*` → qmd CLI calls; update `allowed-tools`
- [x] All skills: add vault path resolution instruction header

### Phase 3: Extension
- [x] Create `.pi/extensions/arscontexta-hooks/index.ts`
- [x] Implement `resolveVaultPath()` (cwd marker OR ~/.config/arscontexta.yaml)
- [x] Implement session-orient handler (tree + identity + goals + maintenance signals)
- [x] Implement write-validate handler (schema check on vault notes)
- [x] Implement auto-commit handler (git -C vaultPath)

### Phase 4: Agent
- [x] Port `knowledge-guide` agent definition

### Phase 5: README
- [x] Rewrite README.md for pi distribution

### Phase 6: Archive + Verify
- [x] Archive bak/ to `archive/claude-code-original` branch
- [x] Verify: skill loading (26 skills in available_skills)
- [x] Verify: extension loads without error

## Notes
- Archive branch: `archive/claude-code-original` preserves full bak/ history
- Reference docs (.pi/reference/) contain historical `mcp__qmd` mentions — these are documentation, not executable code
- Extension file: 365 lines, covers all 3 hooks + resolveVaultPath()
- All 26 skills verified: zero CLAUDE_PLUGIN_ROOT refs, zero mcp__qmd refs, zero context:fork
