# Matrixyl®3000 产品制图提示词模板（Depology）

本文件总结了本项目在 `Matrixyl®3000 / Collagen Serum` 这款产品上验证过的稳定做法，用于你后续快速产出“清晰可读标签 + 真实商业摄影 + 可稳定复现”的图片。

## 一句话原则
- 标签文字属于高风险要素：要“稳定”，就用“明确且不过度”的约束，避免稀有字形与过强的字号微调。
- 小字可读的关键不是“写更长的规则”，而是给标签足够像素（产品占比）、足够对焦（focus lock）、足够均匀照明（no glare）。

## 关键稳定参数（当前稳态）
- 产品占画面：30%–36%
- 标签区域：不放大标签区域，只提高锐度与对比
- 字号层级：
  - line_1 最大（Depology）
  - line_2–line_7 在当前基础上统一缩小一档（约 92%–95%）
  - line_3 与 line_5/6/7 同字号（不要强行让 line_3 再更小，容易导致整块文字崩坏）
- 禁止稀有字形：不要强制 `ē/é` 等字符（会显著降低稳定性）

## 标签文字（固定文本块）
逐行固定为（不要改内容、不要改大小写、不要改符号）：

```
line_1: Depology
line_2: Matrixyl®3000
line_3: Collagen Serum
line_4: -
line_5: Advanced Serum Solution
line_6: Developed to Smooth Skin
line_7: 30ml / 1.01 fl. oz.
```

## 模板（可直接复制）

### 1) 中文模板（推荐）
把 `{SCENE_ZH}` 替换成你要的场景描述（建议从本项目场景库挑一个）。

```
{SCENE_ZH}

标签文字优先级最高：小字必须锐利、可读、笔画分离，不可糊边。
文本逐行固定为 {line_1:'Depology', line_2:'Matrixyl®3000', line_3:'Collagen Serum', line_4:'-', line_5:'Advanced Serum Solution', line_6:'Developed to Smooth Skin', line_7:'30ml / 1.01 fl. oz.'}，不得增删改字符。
字号层级严格为：line_1 最大；line_2 到 line_7 在当前基础上统一缩小一档（约 92%-95%），并保持 line_3 与 line_5、line_6、line_7 同字号。
产品占画面约 30%-36%，保持当前标签区域比例，不放大标签；仅提升文字清晰度和边缘对比。
文字区均匀柔光、无反光遮挡、无重影；对焦锁定标签，轻微收光圈以保证小字清晰。
30ml 精华小瓶比例真实，自然色彩，不过度饱和。

严格使用参考图片里的产品作为唯一产品主体：不得改动瓶型、颜色、标签排版、logo位置、文字内容。不要生成额外的瓶子或包装。背景与产品光影融合自然，真实商业摄影。
```

### 2) 英文模板（可选）
```
{SCENE_EN}

Label text has top priority: micro-text must be crisp, readable, and stroke-separated with no smeared edges.
Enforce exact line-by-line text: {line_1:'Depology', line_2:'Matrixyl®3000', line_3:'Collagen Serum', line_4:'-', line_5:'Advanced Serum Solution', line_6:'Developed to Smooth Skin', line_7:'30ml / 1.01 fl. oz.'}, with zero character changes.
Font hierarchy is strict: line_1 stays largest; line_2 to line_7 should be uniformly reduced by one step from current size (about 92%-95%), and line_3 must still match line_5/line_6/line_7 size.
Keep product scale around 30%-36% of the frame and keep current label-area proportion (do not enlarge label area); only improve text sharpness and edge contrast.
Text zone should have even soft light, no glare occlusion, no ghosting; focus lock on label with slightly deeper depth-of-field for small text clarity.
Keep realistic 30ml bottle scale and natural color grading.

Strictly use the reference product as the only product subject: do not change bottle shape/color/label layout/logo/text. No extra bottles or packaging. Real commercial photography.
```

## 场景选择（建议直接用项目内预设）
本项目已有稳定场景描述（见 `src/promptTemplate.js` 的 `SCENE_INSTRUCTIONS`），常用：
- lab-closeup（最稳，适合验证小字）
- stone-daylight（质感偏杂志内页）
- vanity-warm（生活化晨间）
- dark-elegant（暗调品牌形象）
- ecommerce-studio（电商白底，文字稳定性也高）

## 负面约束（建议保留）
用于减少文字崩坏、重复瓶子、3D感等：
- 禁止：低清、模糊、运动模糊、水印、logo乱飞、额外瓶子、变形瓶、标签糊成一团、文字不可读、反光遮挡文字、3D/CGI。

## 典型失败与修复
- 小字变假字/乱码：优先把产品占比回到 30%–36%，并强调 focus lock + even soft light。
- 反光压字：增加“标签区域无高光反射遮挡文字 / no glare occlusion”。
- 想追求更小文字占比：不要单独压某一行字号（尤其 line_3），用“整组统一缩小一档”的方式更稳。
- 想强制特殊字形（例如 `ē/é`）：会显著降低成功率，建议不要在生成阶段强制。

## 在本项目里怎么跑（示例命令）
生成单张验证图（推荐先用 lab-closeup）：

```bash
npm run batch -- --provider ark --force --limit 1 --scenes lab-closeup --size 2048x2048
```

批量出一组不同场景（每场景 1 张）：

```bash
npm run batch -- --provider ark --force --limit 5 --scenes lab-closeup,stone-daylight,vanity-warm,dark-elegant,ecommerce-studio --size 2048x2048
```

产物默认在：
- `output/images/`（图片文件）
- `output/img2img-results.json`（每张图的 prompt、场景、输出路径）
