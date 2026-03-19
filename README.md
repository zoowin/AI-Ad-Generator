# Depology Ad Agent

这是一个为 `Depology` 自动生成广告图片的本地 agent 骨架。它会：

1. 抓取 `https://www.depology.com` 的网站内容
2. 结合预置的品牌认知生成品牌画像
3. 自动生成多组广告图片提示词
4. 可读取本地产品图作为素材参考
5. 调用火山引擎即梦 AI 图片生成接口出图
5. 将结果保存到本地 `output/` 目录

## 文件结构

```text
src/
  config.js              读取 .env 配置
  seedProfile.js         Depology 初始品牌画像
  siteProfile.js         网站抓取与信号提炼
  productAssets.js       本地产品图扫描
  adPromptGenerator.js   广告提示词与创意方向生成
  volcengineClient.js    即梦/veImageX API 签名与请求
  output.js              输出与下载工具
  run.js                 主执行入口

assets/
  products/              放你的产品图
```

## 先准备什么

1. 复制 `.env.example` 为 `.env`
2. 填入火山引擎 Access Key / Secret Key
3. 根据你在控制台开通的模型，确认 `JIMENG_REQ_KEY`

## 运行方式

只生成品牌画像：

```bash
node src/run.js --brand-only
```

只生成广告方案，不调用即梦：

```bash
node src/run.js --dry-run
```

先测试能不能真的出一张图：

```bash
node src/run.js --test-image
```

完整执行：

```bash
node src/run.js
```

## 怎么使用你的产品图

把产品图放到下面这个目录：

```text
assets/products/
```

支持格式：

- `.png`
- `.jpg`
- `.jpeg`
- `.webp`

脚本会自动扫描这些图片，并把文件名作为素材线索写进 prompt，同时输出：

- `output/product-assets.json`

注意：当前这条即梦接口文档里返回的是异步任务结果，我们已经能稳定出图。  
但“把本地产品图原样喂给模型”是否能做到完全一致，要看接口是否支持直接传本地图片或可访问 URL。当前项目先做的是“读取你的产品素材并把它作为明确参考写入 prompt”。如果你后面有产品图的公网 URL，我们可以再接 `image_urls` 做更强的图生图控制。

## 输出内容

- `output/brand-profile.json`
- `output/ad-concepts.json`
- `output/generation-results.json`
- `output/images/`

## 关于即梦 API

这个项目按你当前即梦图片生成 4.0 文档的直接 OpenAPI 接口去调用。当前脚本默认使用：

- Host: `visual.volcengineapi.com`
- Action: `CVSync2AsyncSubmitTask`
- Version: `2022-08-31`
- Region: `cn-north-1`
- Service: `cv`
- req_key: `jimeng_t2i_v40`

如果你控制台里的具体模型或接口参数不同，只需要调整 `.env` 里的模型字段，或者在 `src/volcengineClient.js` 里补充文档要求的字段即可。

## 适合接自动化的方式

最简单的是在 Codex 自动化里每天运行一次，让它：

1. 读取这个项目
2. 检查网站是否有新产品或新卖点
3. 运行 `node src/run.js`
4. 审核生成结果并整理出投放建议

如果你要，我下一步可以继续帮你加：

- 多尺寸批量出图
- 不同广告渠道模板（Meta / TikTok / Pinterest）
- 自动把图片和文案整理成 CSV
- 加入“产品页抓取 + 新品优先”逻辑
