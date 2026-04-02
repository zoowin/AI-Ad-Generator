# Micro-dart Workflow

当前这套工作流以 `Micro-dart Eye Patch` 为主，目标是稳定产出 3 组可合成广告素材。

## 输入位置

- 产品 brief: `input/briefs/micro-dart-brief.json`
- 产品主图: `input/products/micro-dart/product.png`
- 手持参考图: `input/products/micro-dart/product-withhand.jpg`
- 压缩参考图: `input/products/micro-dart/ref.jpg`
- 参考广告: `input/references/winning-ads/`

## 推荐命令

生成 3 组成品素材：

```bash
node src/genAd3Sets.js
```

只生成某一组：

```bash
node src/genAd3Sets.js --set 1
```

只生成 scene，并显式指定真实产品图：

```bash
node src/genAd3Sets.js --type scene --ref input/products/micro-dart/product.png
```

生成 V2 探索图：

```bash
node src/genFbAdsV2.js
```

生成带产品参考的场景图：

```bash
node src/genSceneWithProduct.js
```

## 输出位置

- 最终成品：`output/final/ad-sets/`
- 近期实验：`output/experiments/fb-ads-v2/`
- 通用旧流程输出：`output/runs/core/`

## 当前保留的成品

- `set1-anti-botox-bathroom-scene.png`
- `set1-anti-botox-bathroom-ba.png`
- `set2-microneedling-bedroom-scene.png`
- `set2-microneedling-bedroom-ba.png`
- `set2-microneedling-bedroom-ba-v2.png`
- `set3-clinical-desk-scene.png`
- `set3-clinical-desk-ba.png`

## 整理后的使用约定

- 新输入优先放到 `input/products/<product-slug>/`
- brief 优先放到 `input/briefs/`
- 参考广告统一放 `input/references/`
- 想长期保留的结果再放进 `output/final/`
