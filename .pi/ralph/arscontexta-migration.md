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
- [ ] Port `help` (standalone, validates basic skill loading)
- [ ] Port `stats`, `tasks`, `next`, `graph` (read-only, no deps)
- [ ] Port `validate`, `verify`, `health` (quality gates)
- [ ] Port `seed`, `reduce`, `reflect`, `reweave` (pipeline core)
- [ ] Port `pipeline`, `ralph` (orchestrators)
- [ ] Port `learn`, `remember`, `rethink`, `refactor` (meta skills)
- [ ] Port `setup`, `tutorial`, `ask`, `recommend`, `architect` (platform skills)
- [ ] Port `reseed`, `upgrade`, `add-domain` (advanced lifecycle)
- [ ] All skills: replace `${CLAUDE_PLUGIN_ROOT}` → relative paths
- [ ] All skills: remove `context: fork`, `model: opus/sonnet` from frontmatter
- [ ] All skills: replace `mcp__qmd__*` → qmd CLI calls; update `allowed-tools`
- [ ] All skills: add vault path resolution instruction header

### Phase 3: Extension
- [ ] Create `.pi/extensions/arscontexta-hooks/index.ts`
- [ ] Implement `resolveVaultPath()` (cwd marker OR ~/.config/arscontexta.yaml)
- [ ] Implement session-orient handler (tree + identity + goals + maintenance signals)
- [ ] Implement write-validate handler (schema check on vault notes)
- [ ] Implement auto-commit handler (git -C vaultPath)

### Phase 4: Agent
- [ ] Port `knowledge-guide` agent definition

### Phase 5: README
- [ ] Rewrite README.md for pi distribution

### Phase 6: Archive + Verify
- [ ] Archive bak/ to `archive/claude-code-original` branch
- [ ] Verify: skill loading (26 skills in available_skills)
- [ ] Verify: extension loads without error
