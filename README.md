# 🖼️ Image Background Remover

在线图片去背景工具 - Next.js + TailwindCSS MVP 版本

## 功能特性

- 📤 图片上传（拖拽或点击）
- ✨ 一键去除背景
- 🖥️ 实时预览对比
- ⬇️ 下载 PNG（保留透明通道）

## 技术栈

- **前端**: Next.js 15 + TailwindCSS 4
- **后端**: Cloudflare Workers
- **AI API**: Remove.bg

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/zhh5665884232-del/image-background-remover.git
cd image-background-remover
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
# 编辑 .env.local，填写 NEXT_PUBLIC_API_URL
```

### 4. 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看。

## 部署

### 前端部署（任选）

**Vercel（推荐）**
```bash
npm i -g vercel
vercel
```

**Cloudflare Pages**
```bash
npm run build
# 将 .next/static 上传到 Cloudflare Pages
```

### 后端部署（Cloudflare Workers）

```bash
# 登录 Cloudflare
wrangler login

# 设置 API Key
wrangler secret put REMOVE_BG_API_KEY
# 输入你的 Remove.bg API Key

# 部署
wrangler deploy
```

然后将 Workers URL 填入 `.env.local` 的 `NEXT_PUBLIC_API_URL`。

## 项目结构

```
image-background-remover/
├── src/
│   └── app/
│       ├── page.tsx       # 主页面组件
│       ├── layout.tsx     # 布局
│       └── globals.css    # 全局样式
├── public/                # 静态资源
├── .env.example           # 环境变量示例
├── package.json
└── README.md
```

## 注意事项

- 文件大小限制: ≤ 10MB
- 支持格式: JPG, PNG
- 免费 API 额度: 50张/月（Remove.bg）

## License

MIT
