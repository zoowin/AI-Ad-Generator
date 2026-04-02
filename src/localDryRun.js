import { loadProductAssets } from "./productAssets.js";
import { buildImg2ImgPromptV2, getPresets } from "./promptTemplate.js";

function buildPlan() {
  const assets = loadProductAssets(process.cwd());
  const presets = getPresets();
  const scenes = presets.sceneInstructions;

  const plans = [];
  for (const asset of assets.assets) {
    for (const scene of scenes) {
      const { prompt, meta } = buildImg2ImgPromptV2({ scene, lang: "zh" });
      plans.push({
        asset: asset.fileName,
        scene,
        prompt,
        meta
      });
    }
  }

  return {
    assetCount: assets.assets.length,
    sceneCount: scenes.length,
    totalPlans: plans.length,
    assets: assets.assets.map((asset) => ({
      fileName: asset.fileName,
      displayName: asset.displayName,
      sizeBytes: asset.sizeBytes
    })),
    samplePlans: plans.slice(0, 5)
  };
}

const summary = buildPlan();
console.log(JSON.stringify(summary, null, 2));
