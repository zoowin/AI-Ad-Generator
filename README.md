# Depology Ads Image Workspace

This workspace is used to generate Depology skincare ad images. The current focus is product-scene exploration, prompt iteration, and ad asset generation around the product line.

It is also now being reorganized into a new closed-loop ad creative system with four layers:

1. Input
2. Analysis
3. Output
4. Feedback

See the new blueprint here:

- `ROOT-START-HERE.md`
- `docs/ai-ad-system-blueprint.md`
- `docs/folder-status.md`
- `docs/workspace-organization.md`
- `docs/workspace-catalog.md`
- `WORKSPACE-GUIDE.md`

## Directory Layout

```text
src/                     Main scripts and generation pipeline
data/                    Analysis / feedback / system state
system/templates/        JSON contract templates for the new pipeline
input/
  product-docs/          Product notes and supporting materials
  briefs/                Product brief JSON files
  products/              Product images and product-specific reference images
  references/            Winning ads / ad-library references
output/
  final/ad-sets/         Kept final deliverables
  experiments/           Recent exploration results
  runs/core/             Structured output from run.js
text-test/               Prompt and copy experiments
```

## Current State

There are now two tracks in this repository:

- Legacy generation track: the existing `src/` scripts for image generation experiments
- New system track: the `data/`, `system/`, and `docs/` structure for rebuilding a scalable creative intelligence workflow

Historical duplicate folders such as `ads-image/`, `text-test/`, and old utility scripts have been removed from the active workspace.

Recommended direction:

- keep using `src/` for short-term experiments
- keep all new input material inside `input/`
- use `WORKSPACE-GUIDE.md` and `docs/workspace-catalog.md` as the main navigation layer
- when video is out of scope, prefer `input/references/ad-library-static/static-images/` for analysis inputs

## Main Scripts

- `node src/run.js`
  Main generation entry. Supports normal generation, `--dry-run`, `--brand-only`, and `--mode img2img`.
- `node src/genAd3Sets.js`
  Generates three higher-confidence ad sets into `output/final/ad-sets/`.
- `node src/genFbAdsV2.js`
  Generates exploratory Facebook ad assets into `output/experiments/fb-ads-v2/`.
- `node src/genSceneWithProduct.js`
  Generates scene images using real product references into `output/experiments/fb-ads-v2/scenes/`.
- `node src/runFbAd.js`
  Older Facebook ad exploration flow into `output/experiments/fb-ads/`.
- `node src/localDryRun.js`
  Local-only validation flow that inspects product assets and generates prompts without calling external APIs.

## NPM Scripts

- `npm start`
  Runs `src/run.js`.
- `npm run dry-run`
  Runs `src/run.js --dry-run`.
- `npm run brand`
  Runs `src/run.js --brand-only`.
- `npm run batch`
  Runs `src/run.js --mode img2img`.
- `npm run local-dry-run`
  Runs the local-only validation script.

## Expected Inputs

- `input/products/` should contain product images in `.png`, `.jpg`, `.jpeg`, or `.webp`.
- `input/briefs/` can contain product briefs such as `matrixyl-brief.json`.
- `input/products/` and `input/references/` can hold additional references for older workflows.

## Notes

- `output/final/` should contain only the deliverables worth keeping.
- `output/experiments/` is for temporary exploration results and comparisons.
- If you need a safe local check, prefer `npm run local-dry-run` because it does not call image-generation or Feishu APIs.
