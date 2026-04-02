import path from "node:path";

const rootDir = process.cwd();

export const INPUT_ROOT = path.join(rootDir, "input");
export const OUTPUT_ROOT = path.join(rootDir, "output");

export const INPUT_PATHS = {
  briefs: path.join(INPUT_ROOT, "briefs"),
  products: path.join(INPUT_ROOT, "products"),
  references: path.join(INPUT_ROOT, "references"),
  microDart: {
    dir: path.join(INPUT_ROOT, "products", "micro-dart"),
    brief: path.join(INPUT_ROOT, "briefs", "micro-dart-brief.json"),
    hero: path.join(INPUT_ROOT, "products", "micro-dart", "product.png"),
    heroSmall: path.join(INPUT_ROOT, "products", "micro-dart", "product-small.jpg"),
    inHand: path.join(INPUT_ROOT, "products", "micro-dart", "product-withhand.jpg"),
    ref: path.join(INPUT_ROOT, "products", "micro-dart", "ref.jpg")
  },
  matrixyl: {
    brief: path.join(INPUT_ROOT, "briefs", "matrixyl-brief.json")
  },
  beforeAfter: {
    dir: path.join(INPUT_ROOT, "references", "before-after"),
    before: path.join(INPUT_ROOT, "references", "before-after", "before.png"),
    after: path.join(INPUT_ROOT, "references", "before-after", "after.png")
  },
  winningAds: path.join(INPUT_ROOT, "references", "winning-ads")
};

export const OUTPUT_PATHS = {
  finalAdSets: path.join(OUTPUT_ROOT, "final", "ad-sets"),
  experiments: path.join(OUTPUT_ROOT, "experiments"),
  fbAds: path.join(OUTPUT_ROOT, "experiments", "fb-ads"),
  fbAdsV2: path.join(OUTPUT_ROOT, "experiments", "fb-ads-v2"),
  fbAdsV2Images: path.join(OUTPUT_ROOT, "experiments", "fb-ads-v2", "images"),
  fbAdsV2Scenes: path.join(OUTPUT_ROOT, "experiments", "fb-ads-v2", "scenes"),
  adGeneration: path.join(OUTPUT_ROOT, "experiments", "ad-generation"),
  runsCore: path.join(OUTPUT_ROOT, "runs", "core")
};
