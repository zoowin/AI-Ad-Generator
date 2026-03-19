function buildPrompt({ angle, profile, format, variation, assetSummary, assetFocus, campaignBrief }) {
  const palette = profile.visualStyle.palette.join(", ");
  const mood = profile.visualStyle.mood.join(", ");
  const include = profile.visualStyle.doInclude.join(", ");
  const avoid = profile.visualStyle.avoid.join(", ");
  const assetText = assetSummary
    ? `参考产品素材：${assetSummary}。尽量保持包装外观、瓶型、材质和主视觉一致。`
    : "";
  const focusText = assetFocus ? `重点产品：${assetFocus}。` : "";
  const briefText = campaignBrief ? `品牌与投放背景：${campaignBrief}。` : "";

  const zhPrompt =
    `为 ${profile.brand} 生成一张高转化护肤广告图。` +
    `主题是“${angle}”。` +
    focusText +
    briefText +
    `画面风格：${mood}。` +
    `主色调：${palette}。` +
    `必须包含：${include}。` +
    `构图形式：${format.layout}。` +
    `场景说明：${variation.scene}。` +
    `模特要求：${variation.model}。` +
    `产品呈现：${variation.productFocus}。` +
    assetText +
    `避免：${avoid}。` +
    `整体适合电商投放和社媒广告，真实、精致、可信、可商用。`;

  const enPrompt =
    `Create a high-converting skincare ad image for ${profile.brand}. ` +
    `Core angle: "${angle}". ` +
    (assetFocus ? `Hero product: ${assetFocus}. ` : "") +
    (campaignBrief ? `Campaign brief: ${campaignBrief}. ` : "") +
    `Style: ${mood}. ` +
    `Palette: ${palette}. ` +
    `Must include: ${include}. ` +
    `Composition: ${format.layout}. ` +
    `Scene: ${variation.scene}. ` +
    `Model direction: ${variation.model}. ` +
    `Product focus: ${variation.productFocus}. ` +
    (assetSummary
      ? `Reference provided product assets: ${assetSummary}. Preserve the packaging shape, material feel, and overall pack appearance as closely as possible. `
      : "") +
    `Avoid: ${avoid}. ` +
    `Commercial beauty photography, premium, believable, elegant, performance-driven.`;

  return { zhPrompt, enPrompt };
}

export function generateAdConcepts(profile, productAssets = []) {
  const formats = [
    { name: "Square Social", aspectRatio: "1:1", layout: "centered hero product with elegant negative space" },
    { name: "Story Vertical", aspectRatio: "4:5", layout: "vertical editorial skincare composition with model and product" },
    { name: "Landing Banner", aspectRatio: "16:9", layout: "wide luxury skincare banner with product on one side and environmental story on the other" }
  ];

  const variations = [
    {
      scene: "clean vanity counter with luxury skincare atmosphere",
      model: "confident woman with naturally radiant skin, age 35+",
      productFocus: "hero serum or wrinkle filler tube in sharp focus"
    },
    {
      scene: "soft clinical beauty studio with refined lighting",
      model: "mature female model highlighting under-eye area and smooth skin texture",
      productFocus: "premium packshot supported by texture swirls and ingredient-inspired cues"
    },
    {
      scene: "minimal bathroom shelf with subtle sunlight and fresh morning ritual energy",
      model: "optional model, more emphasis on product texture and skincare ritual",
      productFocus: "packaging, serum texture, and anti-aging message visualized through composition"
    }
  ];

  const assetSummary =
    productAssets.length > 0
      ? productAssets
          .map((asset) => asset.displayName)
          .join(", ")
      : "";

  const assetGroups = [
    "Depology Matrixyl 3000 Serum",
    "Depology Peptide Complex Serum",
    "Depology Matrixyl 3000 Serum with hand-holding lifestyle reference",
    "Depology Peptide Complex Serum with hand-holding lifestyle reference",
    "Depology serum duo comparison"
  ];

  const campaignBrief =
    "science-backed anti-aging skincare from Seoul, clinically proven actives, premium but real-skin beauty aesthetic, optimized for Meta static ads, visible wrinkle smoothing, firmer brighter skin, no heavy text overlay";

  const campaignAngles = [
    "Visible wrinkle reduction with Matrixyl 3000 serum",
    "Smooth expression lines with peptide complex serum",
    "Premium hand-held serum shot for real-skin anti-aging ad",
    "Luxury anti-aging routine at home with clinically inspired serum imagery",
    "Before-after inspired premium serum campaign for firmer, brighter skin"
  ];

  const webReferenceSets = [
    [
      "https://cdn.shopify.com/s/files/1/0574/1710/5596/files/Matrixyl-3000-Serum-Packaging-Catalogue.jpg",
      "https://cdn.shopify.com/s/files/1/0574/1710/5596/files/Matrixyl-3000-Serum-Model.jpg"
    ],
    [
      "https://cdn.shopify.com/s/files/1/0574/1710/5596/files/Peptide-Complex-Serum-Model_89f9c74a-9ab7-4316-9edc-bffcc434fd2d.jpg",
      "https://cdn.shopify.com/s/files/1/0574/1710/5596/files/Peptide-Serum-Duo_35acc0a5-7d52-4f8d-a2b4-dc3e443aad34.jpg"
    ],
    [
      "https://cdn.shopify.com/s/files/1/0574/1710/5596/files/Matrixyl-3000-Serum-Model_e9fd0740-f382-4c06-81bb-9de8a6b2aa34.jpg",
      "https://cdn.shopify.com/s/files/1/0574/1710/5596/files/Matrixyl-3000-Serum-Packaging-Catalogue.jpg"
    ],
    [
      "https://cdn.shopify.com/s/files/1/0574/1710/5596/files/Peptide-Complex-Serum-Model_89f9c74a-9ab7-4316-9edc-bffcc434fd2d.jpg",
      "https://cdn.shopify.com/s/files/1/0574/1710/5596/files/mps-fresh-through-LR.jpg"
    ],
    [
      "https://cdn.shopify.com/s/files/1/0574/1710/5596/files/Peptide-Serum-Duo_35acc0a5-7d52-4f8d-a2b4-dc3e443aad34.jpg",
      "https://cdn.shopify.com/s/files/1/0574/1710/5596/files/Matrixyl-3000-Serum-Packaging-Catalogue.jpg"
    ]
  ];

  return campaignAngles.map((angle, index) => {
    const format = formats[index % formats.length];
    const variation = variations[index % variations.length];
    const assetFocus = assetGroups[index % assetGroups.length];
    const prompts = buildPrompt({
      angle,
      profile,
      format,
      variation,
      assetSummary,
      assetFocus,
      campaignBrief
    });

    return {
      id: `concept-${index + 1}`,
      angle,
      format: format.name,
      aspectRatio: format.aspectRatio,
      scene: variation.scene,
      heroProduct: assetFocus,
      referencedAssets: productAssets.map((asset) => asset.fileName),
      referenceImageUrls: webReferenceSets[index % webReferenceSets.length],
      ...prompts
    };
  });
}
