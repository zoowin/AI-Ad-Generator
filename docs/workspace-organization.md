# Workspace Organization

## Recommended Input Locations

### Ad Inputs

- Imported competitor ad images: `input/references/ad-library/raw/`
- Imported competitor ad records: `input/references/ad-library/normalized/`
- Static-only working set: `input/references/ad-library-static/static-images/`
- Carousel previews held separately: `input/references/ad-library-static/carousel-previews/`
- Older manually collected winning ads: `input/references/winning-ads/`

### Product Inputs

There are still product-image inputs in this project.

Use these by role:

- Product images for generation and reference: `input/products/`
- Product / SKU knowledge docs: `input/product-docs/`
- Briefs: `input/briefs/`

## Practical Rule

For the new system:

- `input/references/ad-library/` is the main entry for competitor ad inputs
- `input/references/ad-library-static/static-images/` should be the preferred analysis set when video is out of scope
- `input/products/` is the main entry for product images and product-specific extra references
- `input/product-docs/` remains the source of product knowledge and claims

## Current Recommendation

The workspace has been reorganized so all active inputs live under `input/`.

## Quick Open

- Ad images: `F:\\Work_Space\\AI-ad-Generator\\input\\references\\ad-library\\raw`
- Ad records: `F:\\Work_Space\\AI-ad-Generator\\input\\references\\ad-library\\normalized`
- Static-only ad records: `F:\\Work_Space\\AI-ad-Generator\\input\\references\\ad-library-static\\static-images`
- Carousel preview records: `F:\\Work_Space\\AI-ad-Generator\\input\\references\\ad-library-static\\carousel-previews`
- Product images: `F:\\Work_Space\\AI-ad-Generator\\input\\products`
- Product docs: `F:\\Work_Space\\AI-ad-Generator\\input\\product-docs`
- Briefs: `F:\\Work_Space\\AI-ad-Generator\\input\\briefs`
