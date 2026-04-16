# Folder Status

This file explains which top-level folders are active, which are legacy, and which are reference-only.

## Active Working Folders

These are the primary folders for the current workspace:

- `src/`
  Active codebase and current scripts.
- `input/`
  Main unified input location for product images, product docs, briefs, and ad references.
- `data/`
  New structured input / analysis / output / feedback system.
- `docs/`
  Human-readable project navigation and system design docs.
- `output/`
  Current generated results and experiment outputs.
- `system/`
  Templates and data contracts for the rebuilt system.

## Removed Historical Folders

The old duplicate or reference-only folders were removed from the active workspace:

- `ads-image/`
- `archive/`
- `text-test/`
- `scripts/`

## Tooling / Environment Folders

- `.agents/`
- `.claude/`
- `.trae/`
- `.git/`

These support tooling, agent workflows, or version control.

## Practical Rule

When in doubt:

1. Read from `src/`, `input/`, `output/`, `data/`, `docs/`
2. Put all new input material into `input/`
3. Avoid recreating old duplicate folders such as `ads-image/`, `archive/`, `text-test/`, `scripts/`, or the old `assets/` path
