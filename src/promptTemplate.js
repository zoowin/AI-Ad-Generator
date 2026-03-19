/**
 * Structured prompt builder for Depology product-in-scene generation.
 *
 * Prompt structure:
 *   [产品锚点] + [场景/背景] + [光线氛围] + [风格限定]
 *
 * 产品锚点和风格限定是固定的（保证产品一致性），场景部分可变。
 */

// ---------------------------------------------------------------------------
// 固定锚点：产品描述（保证AI不改动产品本体）
// ---------------------------------------------------------------------------
const PRODUCT_ANCHORS = {
  "matrixyl-3000": {
    en: "Depology Matrixyl 3000 Peptide Serum in a cobalt blue glass dropper bottle with white cap, gold/white label text",
    zh: "Depology Matrixyl 3000 多肽精华液，钴蓝色玻璃滴管瓶，白色瓶盖，金白色标签文字"
  },
  "peptide-complex": {
    en: "Depology Peptide Complex Serum in a cobalt blue glass dropper bottle with white cap, gold/white label text",
    zh: "Depology 多肽复合精华液，钴蓝色玻璃滴管瓶，白色瓶盖，金白色标签文字"
  }
};

// ---------------------------------------------------------------------------
// V2 精简指令式 Prompt（用于 jimeng_t2i_v40 图编辑模式）
// 核心思路：不重复描述产品（参考图已包含），只告诉AI"做什么"
// ---------------------------------------------------------------------------
const SCENE_INSTRUCTIONS = {
  "lab-tech": {
    zh: "将这瓶护肤品放在专业实验室白色台面上，周围摆放玻璃试管和培养皿，背景有虚化的显微镜。自然的实验室顶部冷白灯光，产品瓶身有真实的高光和环境反射。台面上有产品的自然投影。专业商业产品摄影，高清细腻。",
    en: "Place this skincare product on a professional laboratory white countertop, with glass test tubes and petri dishes around it, a blurred microscope in the background. Natural overhead cool-white lab lighting with realistic highlights and environmental reflections on the bottle. Natural shadow cast on the surface. Professional commercial product photography, high detail."
  },
  "lab-minimal": {
    zh: "将这瓶护肤品放在纯白实验台上，旁边只有一支玻璃滴管滴着金色精华液。极简构图，柔和的临床照明，背景有一个虚化的玻璃烧杯。瓶身有自然的光泽和反射，台面上有柔和的投影。",
    en: "Place this skincare product on a pure white lab surface with only a glass pipette dripping golden serum beside it. Minimal composition, soft clinical lighting, one blurred beaker in background. Natural shine and reflections on the bottle, soft shadow on surface."
  },
  "tech-glow": {
    zh: "将这瓶护肤品放在深色反光台面上，产品底部有淡蓝色科技光晕。背景有抽象的全息分子结构图案。未来感美容科技风格，产品在反光表面有清晰的倒影。冷色调灯光，高端广告质感。",
    en: "Place this skincare product on a dark reflective surface with a subtle blue tech glow underneath. Abstract holographic molecular structures in background. Futuristic beauty-tech style, product has a clear reflection on the surface. Cool-toned lighting, premium ad quality."
  },
  "marble-nature": {
    zh: "将这瓶护肤品放在白色大理石台面上，周围有新鲜绿叶和水珠。左侧有柔和的自然日光透入，营造奢华水疗氛围。产品在大理石表面有自然投影和微妙反射。",
    en: "Place this skincare product on white marble with fresh green leaves and water droplets. Soft natural daylight from the left, luxury spa atmosphere. Product has natural shadow and subtle reflection on marble."
  },
  "bathroom-morning": {
    zh: "将这瓶护肤品放在现代浴室梳妆台上，温暖的晨光从磨砂窗户透入。简约奢华的室内风格，产品在台面上有自然的投影。画面温馨、真实、高端。",
    en: "Place this skincare product on a modern bathroom vanity, warm morning sunlight through frosted window. Minimalist luxury interior, product has natural shadow on counter. Warm, authentic, premium feel."
  }
};

// ---------------------------------------------------------------------------
// 场景预设
// ---------------------------------------------------------------------------
const SCENES = {
  "lab-tech": {
    en: "placed on a sleek white laboratory countertop, surrounded by glass test tubes, petri dishes with serum droplets, and a microscope slightly out of focus in the background. Clean scientific environment with subtle molecular structure graphics floating nearby.",
    zh: "放置在光滑的白色实验室台面上，周围有玻璃试管、装有精华液滴的培养皿，背景中有微微虚化的显微镜。干净的科学环境，旁边飘浮着微妙的分子结构图形。"
  },
  "lab-minimal": {
    en: "on a pure white surface with a single glass pipette dripping golden serum beside it, soft clinical lighting, minimal composition with one blurred beaker in the background.",
    zh: "纯白台面上，旁边有一支玻璃移液管滴着金色精华液，柔和的临床照明，极简构图，背景中有一个虚化的烧杯。"
  },
  "tech-glow": {
    en: "floating above a reflective dark surface with a subtle blue-white glow underneath, surrounded by abstract holographic molecular bond visualizations, futuristic beauty-tech aesthetic.",
    zh: "悬浮在反光暗色表面上方，底部有微妙的蓝白光晕，周围环绕着抽象全息分子键可视化效果，未来感美容科技美学。"
  },
  "marble-nature": {
    en: "on a white marble surface with fresh green tea leaves and water droplets, soft natural daylight from the left, luxury spa atmosphere.",
    zh: "白色大理石台面上，配新鲜绿茶叶和水珠，左侧柔和自然日光，奢华水疗氛围。"
  },
  "bathroom-morning": {
    en: "on a modern bathroom vanity counter with warm morning sunlight streaming through a frosted window, minimalist luxury interior.",
    zh: "现代浴室梳妆台上，温暖的晨光透过磨砂窗户洒入，极简奢华室内风格。"
  }
};

// ---------------------------------------------------------------------------
// 光线预设
// ---------------------------------------------------------------------------
const LIGHTING = {
  "clinical-soft": {
    en: "Even, diffused clinical lighting with subtle cool-white highlights on the bottle surface, no harsh shadows.",
    zh: "均匀、漫射的临床照明，瓶身表面有微妙的冷白高光，无硬阴影。"
  },
  "natural-warm": {
    en: "Soft natural side lighting with gentle warm tone, creating a luminous glow on the glass bottle.",
    zh: "柔和的自然侧光带温暖色调，在玻璃瓶上形成通透光感。"
  },
  "dramatic-rim": {
    en: "Dramatic rim lighting from behind with a soft fill from the front, creating depth and premium feel on the product.",
    zh: "背后的轮廓光配正面柔和补光，在产品上创造纵深感和高端质感。"
  }
};

// ---------------------------------------------------------------------------
// 风格限定（固定不变，保证产品保真）
// ---------------------------------------------------------------------------
const STYLE_CONSTRAINT = {
  en: "Product-focused commercial photography. The product bottle must remain the exact same shape, proportions, color, and label as the reference image. Do NOT alter, distort, or redesign the product in any way. Sharp focus on the product, shallow depth of field on the background. 1:1 square composition. Photorealistic, high-end beauty campaign quality.",
  zh: "以产品为核心的商业摄影。产品瓶必须保持与参考图完全相同的形状、比例、颜色和标签。不得以任何方式改变、扭曲或重新设计产品。产品锐利对焦，背景浅景深。1:1正方构图。真实感，高端美妆广告质感。"
};

// ---------------------------------------------------------------------------
// 组装最终 Prompt
// ---------------------------------------------------------------------------

/**
 * Build a structured prompt for img2img generation (V1 — verbose).
 *
 * @param {object} opts
 * @param {string} opts.product   - Key from PRODUCT_ANCHORS (e.g. "matrixyl-3000")
 * @param {string} opts.scene     - Key from SCENES (e.g. "lab-tech")
 * @param {string} opts.lighting  - Key from LIGHTING (e.g. "clinical-soft")
 * @param {"en"|"zh"} [opts.lang="en"] - Language
 * @returns {{ prompt: string, meta: object }}
 */
export function buildImg2ImgPrompt({ product, scene, lighting, lang = "en" }) {
  const anchor = PRODUCT_ANCHORS[product]?.[lang];
  const sceneDesc = SCENES[scene]?.[lang];
  const light = LIGHTING[lighting]?.[lang];
  const style = STYLE_CONSTRAINT[lang];

  if (!anchor) throw new Error(`Unknown product key: ${product}`);
  if (!sceneDesc) throw new Error(`Unknown scene key: ${scene}`);
  if (!light) throw new Error(`Unknown lighting key: ${lighting}`);

  const prompt = `${anchor}, ${sceneDesc} ${light} ${style}`;

  return {
    prompt,
    meta: { product, scene, lighting, lang, version: "v1" }
  };
}

/**
 * V2 — 精简指令式 Prompt（推荐用于 jimeng_t2i_v40）。
 *
 * 不重复描述产品（参考图已包含），只写场景指令。
 * 强调光影融合、投影、环境反射。
 *
 * @param {object} opts
 * @param {string} opts.scene   - Key from SCENE_INSTRUCTIONS
 * @param {"en"|"zh"} [opts.lang="zh"] - 中文效果更好
 * @returns {{ prompt: string, meta: object }}
 */
export function buildImg2ImgPromptV2({ scene, lang = "zh" }) {
  const instruction = SCENE_INSTRUCTIONS[scene]?.[lang];
  if (!instruction) throw new Error(`Unknown scene: ${scene}. Available: ${Object.keys(SCENE_INSTRUCTIONS).join(", ")}`);

  return {
    prompt: instruction,
    meta: { scene, lang, version: "v2" }
  };
}

/**
 * Build a background-only prompt (for composite approach: generate BG, overlay product PNG).
 */
export function buildBackgroundPrompt({ scene, lighting, lang = "en" }) {
  const sceneDesc = SCENES[scene]?.[lang];
  const light = LIGHTING[lighting]?.[lang];

  if (!sceneDesc) throw new Error(`Unknown scene key: ${scene}`);
  if (!light) throw new Error(`Unknown lighting key: ${lighting}`);

  const bgStyle = lang === "en"
    ? "Empty product photography scene with no product present. Leave a clear central area for product placement. Photorealistic commercial photography background. 1:1 square composition."
    : "空的产品摄影场景，无产品。中央留出清晰的产品放置区域。真实感商业摄影背景。1:1正方构图。";

  return {
    prompt: `${sceneDesc} ${light} ${bgStyle}`,
    meta: { scene, lighting, lang, mode: "background-only" }
  };
}

/**
 * Get all available keys for UI/CLI selection.
 */
export function getPresets() {
  return {
    products: Object.keys(PRODUCT_ANCHORS),
    scenes: Object.keys(SCENES),
    sceneInstructions: Object.keys(SCENE_INSTRUCTIONS),
    lighting: Object.keys(LIGHTING)
  };
}

/**
 * Generate a batch plan (all combinations or selected ones) without calling API.
 */
export function generateBatchPlan({ products, scenes, lightings, lang = "en" }) {
  const plans = [];
  for (const product of products) {
    for (const scene of scenes) {
      for (const lighting of lightings) {
        const { prompt, meta } = buildImg2ImgPrompt({ product, scene, lighting, lang });
        plans.push({ id: `${product}_${scene}_${lighting}`, prompt, meta });
      }
    }
  }
  return plans;
}
