# Workspace Guide

This repository now has two layers working in parallel:

- Legacy generation layer: existing scripts in `src/` that still use older paths
- New system layer: structured inputs and contracts for the next AI ad system

## If You Are A Human Collaborator

Start here:

- `ROOT-START-HERE.md`
- `README.md`
- `docs/folder-status.md`
- `docs/ai-ad-system-blueprint.md`
- `docs/workspace-organization.md`
- `docs/workspace-catalog.md`

What to open most often:

- Competitor ad images: `input/references/ad-library/raw/`
- Competitor ad records: `input/references/ad-library/normalized/`
- Static-only ad set: `input/references/ad-library-static/static-images/`
- Carousel previews: `input/references/ad-library-static/carousel-previews/`
- Product images: `input/products/`
- Product reference folders: `input/products/`
- Product docs: `input/product-docs/`
- Briefs: `input/briefs/`

## If You Are An AI Agent

Preferred reading order:

1. `ROOT-START-HERE.md`
2. `docs/folder-status.md`
3. `docs/ai-ad-system-blueprint.md`
4. `docs/workspace-organization.md`
5. `docs/workspace-catalog.md`
6. `input/_input-index.json`
7. `input/product-docs/_product-index.json`

Preferred assumptions:

- competitor ad inspiration lives under `input/references/ad-library/`
- if video is out of scope, use `input/references/ad-library-static/static-images/` first
- clean product hero assets and product references live under `input/products/`
- supporting product references live under `input/products/`
- product knowledge lives under `input/product-docs/`

## Current Principle

Do not aggressively move old files unless needed.

Short-term goal:

- make the workspace easier to navigate
- keep old generation scripts working
- let humans and AI share the same mental model

Long-term goal:

- migrate more logic onto the structured `data/` contracts
