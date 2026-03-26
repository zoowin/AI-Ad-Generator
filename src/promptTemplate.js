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
// ---------------------------------------------------------------------------
// 通用后缀：标签 + 尺寸 + 摄影真实感
// ---------------------------------------------------------------------------
const QUALITY_SUFFIX = {
  zh:
    "标签文字优先级最高：小字必须锐利、可读、笔画分离，不可糊边。文本逐行固定为 {line_1:'Depology', line_2:'Matrixyl®3000', line_3:'Collagen Serum', line_4:'-', line_5:'Advanced Serum Solution', line_6:'Developed to Smooth Skin', line_7:'30ml / 1.01 fl. oz.'}，不得增删改字符。字号层级严格为：line_1 最大；line_2 到 line_7 在当前基础上统一缩小一档（约 92%-95%），并保持 line_3 与 line_5、line_6、line_7 同字号。产品占画面约 30%-36%，保持当前标签区域比例，不放大标签；仅提升文字清晰度和边缘对比。文字区均匀柔光、无反光遮挡、无重影；对焦锁定标签，轻微收光圈以保证小字清晰。30ml 精华小瓶比例真实，自然色彩，不过度饱和。",
  en:
    "Label text has top priority: micro-text must be crisp, readable, and stroke-separated with no smeared edges. Enforce exact line-by-line text: {line_1:'Depology', line_2:'Matrixyl®3000', line_3:'Collagen Serum', line_4:'-', line_5:'Advanced Serum Solution', line_6:'Developed to Smooth Skin', line_7:'30ml / 1.01 fl. oz.'}, with zero character changes. Font hierarchy is strict: line_1 stays largest; line_2 to line_7 should be uniformly reduced by one step from current size (about 92%-95%), and line_3 must still match line_5/line_6/line_7 size. Keep product scale around 30%-36% of the frame and keep current label-area proportion (do not enlarge label area); only improve text sharpness and edge contrast. Text zone should have even soft light, no glare occlusion, no ghosting; focus lock on label with slightly deeper depth-of-field for small text clarity. Keep realistic 30ml bottle scale and natural color grading."
};

const SCENE_INSTRUCTIONS = {
  "lab-editorial": {
    zh: "这瓶精华放在实验室工作台偏左位置，右侧背景有一台虚化的显微镜。台面上随意摆着一只玻璃培养皿。顶部日光灯管提供均匀冷白照明，瓶身能看到灯管的细长高光条。台面是真实的浅灰色防腐蚀台面，有细微使用痕迹。真实的产品摄影，不是3D渲染。",
    en: "Serum bottle placed left-of-center on a lab workbench, a blurred microscope in the right background. One glass petri dish casually placed on the surface. Overhead fluorescent tubes provide even cool-white lighting, with a thin highlight streak visible on the bottle. Surface is real light-gray acid-resistant countertop with subtle wear. Real product photography, not 3D render."
  },
  "lab-closeup": {
    zh: "微距视角，这瓶精华在白色实验台前景偏右，焦点锐利在瓶身标签上。左侧有一支玻璃移液管斜靠着一个小烧杯，微微虚化。背景完全虚化成柔和的白色和浅蓝色。自然的窗户侧光从左上方打入，瓶身左侧有明亮高光，右侧有柔和阴影过渡。安静、专注、高级感。",
    en: "Close-up angle, serum bottle right-of-center in foreground on white lab surface, sharp focus on the label. A glass pipette leaning against a small beaker on the left, slightly out of focus. Background completely blurred into soft white and pale blue. Natural window sidelight from upper left, bright highlight on left side of bottle, soft shadow transition on right. Quiet, focused, premium feel."
  },
  "stone-daylight": {
    zh: "这瓶精华放在一块天然灰色石板上，偏右构图。石板纹理粗糙真实，上面有几滴散落的水珠。背景是虚化的亚麻布和一小截绿色植物枝条。早晨的自然窗光从右侧斜射入，在石板上投下产品的柔和长影。色调克制，偏冷灰和蓝。像杂志内页的产品静物摄影。",
    en: "Serum bottle on a natural gray stone slab, right-of-center composition. Stone has rough authentic texture with a few scattered water droplets. Background is blurred linen fabric and a small green plant stem. Morning window light angled from the right, casting a soft long shadow on the stone. Restrained color palette, cool gray and blue tones. Magazine editorial product still-life."
  },
  "vanity-warm": {
    zh: "这瓶精华放在女性梳妆台上偏左，旁边有一面圆形黄铜边小镜子和一条随意叠放的棉质毛巾。温暖的台灯光从右后方打来，瓶身有暖色高光。背景虚化，隐约能看到墙面和一点绿植。台面是浅色木质，有自然木纹。氛围是真实的晨间护肤场景，不刻意摆拍。",
    en: "Serum bottle left-of-center on a woman's vanity, a small round brass-framed mirror and a casually folded cotton towel beside it. Warm table lamp light from the right-rear, warm highlights on the bottle. Blurred background showing a wall and a hint of greenery. Surface is light wood with natural grain. Atmosphere of a real morning skincare moment, not overly staged."
  },
  "dark-elegant": {
    zh: "这瓶精华放在深色哑光表面上，居中偏左。整体画面是暗调低饱和风格，只有产品被一束精准的侧光照亮。背景是纯黑到深灰的渐变，没有多余的道具。瓶身上能看到精准的高光线条和微妙的环境反射。产品在暗色台面上有一小段清晰的倒影。高端、克制、有力量感的品牌形象照。",
    en: "Serum bottle on a dark matte surface, slightly left of center. Overall low-key desaturated mood, only the product is lit by a precise sidelight beam. Background is pure black to dark gray gradient, no extra props. Precise highlight lines and subtle environmental reflections on the bottle. Short clear reflection on the dark surface beneath. Premium, restrained, powerful brand image shot."
  },
  "water-splash": {
    zh: "这瓶精华站在浅水面上，水面刚刚被一滴水激起涟漪，水花还没完全散开。背景是干净的浅灰蓝色。产品周围的水面有真实的光影反射。整体是高速摄影冻结瞬间的感觉，水滴清晰锐利。灯光从正上方偏后打下来，瓶顶有明亮高光。清爽、活力、精准。",
    en: "Serum bottle standing on shallow water surface, ripples from a water drop still spreading outward. Clean pale gray-blue background. Realistic light and reflections on the water around the product. High-speed photography frozen-moment feel, water droplets sharp and crisp. Light from above and slightly behind, bright highlight on bottle top. Fresh, vibrant, precise."
  },
  "ecommerce-studio": {
    zh: "电商白底摄影棚风格。这瓶精华位于纯白色背景的中心，底下是白色倒影板。完美的商业布光，两侧配有大型柔光箱打光（Octobox lighting），正面有适度的补光，在玻璃瓶身两侧形成完美对称的柔和长条高光。无多余道具，展现极致的产品质感，8k分辨率。",
    en: "E-commerce studio white background style. Serum bottle centered on pure white seamless background with a white reflective acrylic base. Perfect commercial studio lighting with large octoboxes on both sides, moderate front fill, creating perfect symmetrical soft highlight strips along the glass bottle. No extra props, showing ultimate product texture, 8k resolution."
  },
  "botanical-shadows": {
    zh: "产品放在一块浅米色纹理石材上。强烈的午后阳光透过热带棕榈叶，在产品和背景墙上投射出清晰锐利的斑驳树影（光斑效果）。画面充满夏日和天然植物的氛围。产品瓶身折射出漂亮的光斑，色彩温暖自然，极具艺术感的产品静物大片。",
    en: "Product placed on a light beige textured stone. Strong afternoon sunlight shines through tropical palm leaves, casting crisp dappled shadows (gobo lighting effect) on the product and background wall. Summer and natural botanical vibe. The glass bottle refracts beautiful light spots, warm natural colors, highly artistic editorial still life."
  },
  "city-penthouse-sunset": {
    zh: "黄昏时分的高层公寓客厅大场景，落地窗外是城市天际线与霓虹。产品放在前景的大理石边几上，仅占画面约20%，其余空间展示温暖橙紫色夕阳与室内灯光氛围。背景可见艺术摆件、沙发与远处灯带，整体色彩丰富、有电影感、生活化但高级。",
    en: "Large-scene penthouse living room at sunset, city skyline and neon lights visible through floor-to-ceiling windows. Product on a marble side table in foreground, occupying only about 20% of the frame, with most space showing warm orange-purple dusk tones and ambient interior lighting. Background includes art objects, sofa, and distant light strips, colorful, cinematic, lifestyle yet premium."
  },
  "seaside-breakfast-color": {
    zh: "海边酒店露台的清晨生活场景，远处可见蓝色海面与天空。产品放在餐桌一角，旁边有彩色水果、玻璃水杯、亚麻餐巾和晨光阴影，画面中产品占比约15%-20%。整体以明亮蓝、橙、绿色为主，色彩饱满，真实自然，像高级生活方式杂志大片。",
    en: "Morning lifestyle scene on a seaside hotel terrace with blue ocean and sky in the distance. Product placed on one corner of a breakfast table, with colorful fruits, glass cup, linen napkin, and sunlight shadows nearby, product taking about 15%-20% of the frame. Dominant bright blue, orange, and green palette, saturated yet natural, like a premium lifestyle magazine spread."
  },
  "art-museum-lobby": {
    zh: "现代艺术馆大厅大场景，挑高空间、彩色装置艺术和大面积自然采光。产品放在前景展台边缘，占画面约20%，背景保留大量空间与层次，能看到行走的人物虚化轮廓。画面色彩大胆（红、蓝、金点缀），时尚、都市、生活化，强调品牌国际感。",
    en: "Large-scene modern art museum lobby with high ceiling, colorful installation art, and abundant natural daylight. Product on the edge of a foreground pedestal, around 20% of the frame, leaving broad layered space in the background with blurred silhouettes of people walking. Bold color accents (red, blue, gold), fashionable, urban, lifestyle-oriented, emphasizing global brand vibe."
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

  const suffix = QUALITY_SUFFIX[lang];
  return {
    prompt: `${instruction}${suffix}`,
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
