# Depology Ads Image Workspace

这个项目用于生成 Depology 护肤广告图，当前重点围绕 `Micro-dart Eye Patch` 的素材探索、场景生成和成品广告套图。

## 现在的目录结构

```text
src/                     主脚本
assets/products/         通用产品素材库
products/                产品知识文档
input/
  briefs/                产品 brief JSON
  products/              按产品归档的参考图
  references/            winning ads / before-after 参考素材
output/
  final/ad-sets/         当前保留的最终成品
  experiments/           近期探索图与实验结果
  runs/core/             run.js 的结构化输出
text-test/               文本测试与 prompt 研究
```

## 主要脚本

- `node src/genAd3Sets.js`
  生成当前最接近可投放状态的 3 组成品，输出到 `output/final/ad-sets/`
- `node src/genFbAdsV2.js`
  生成 Facebook 广告探索素材，输出到 `output/experiments/fb-ads-v2/`
- `node src/genSceneWithProduct.js`
  用真实产品图做参考，生成场景图，输出到 `output/experiments/fb-ads-v2/scenes/`
- `node src/runFbAd.js`
  生成早期 Facebook 广告草图，输出到 `output/experiments/fb-ads/`
- `node src/run.js`
  旧的通用主流程，输出集中到 `output/runs/core/`

## 输入素材约定

- `input/briefs/micro-dart-brief.json`
- `input/products/micro-dart/product.png`
- `input/products/micro-dart/product-withhand.jpg`
- `input/products/micro-dart/ref.jpg`
- `input/references/winning-ads/`

## 当前整理原则

- `output/final/` 只放想保留的最终结果
- `output/experiments/` 放近期仍有参考价值的探索
- 旧实验图、中间态 JSON、系统垃圾文件默认清理
- 新脚本尽量走 `src/paths.js`，避免路径再次分散
