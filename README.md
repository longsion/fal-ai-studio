# Fal.ai Studio

🎨 **专业级AI图像生成工作室** - 基于Electron构建的桌面应用

一个功能强大的AI图像生成和编辑工具，集成Fal.ai多种先进模型，支持文生图和图片编辑功能。

## 功能特性

- 🎨 **智能对话界面** - 通过自然语言描述生成图像
- 🤖 **多模型支持** - 支持多家 AI 服务提供商（当前支持 Fal.ai）
- 💬 **多轮对话** - 可以通过多轮对话完善图像描述
- ⚙️ **参数调节** - 支持调整图像尺寸、推理步数、生成数量等参数
- 🔒 **安全配置** - 本地存储 API Key，支持安全检查
- 🖼️ **图像预览** - 支持图像预览和全屏查看

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm run dev
```

### 生产模式运行

```bash
npm start
```

### 打包应用

```bash
npm run build
```

## 配置说明

### Fal.ai API Key 配置

1. 访问 [Fal.ai Dashboard](https://fal.ai/dashboard)
2. 注册账号并获取 API Key
3. 在应用中点击"设置"按钮
4. 输入您的 API Key 并保存

### 支持的模型

- **Fal.ai Nano Banana** - 快速文生图模型，支持多种尺寸和参数调节

### 参数说明

- **图像尺寸** - 支持正方形、横版、竖版等多种比例
- **推理步数** - 1-8步，步数越多质量越高但速度越慢
- **生成数量** - 1-4张图片
- **安全检查** - 启用内容安全过滤

## 项目结构

```
src/
├── main.js              # Electron 主进程
├── preload.js           # 预加载脚本
├── renderer/            # 渲染进程文件
│   ├── index.html       # 主界面
│   ├── styles.css       # 样式文件
│   └── script.js        # 前端逻辑
└── services/            # 服务层
    └── imageGenerator.js # 图像生成服务
```

## 开发说明

### 技术栈

- **Electron** - 跨平台桌面应用框架
- **Node.js** - 后端运行时
- **Vanilla JavaScript** - 前端逻辑
- **CSS3** - 现代化 UI 样式
- **electron-store** - 配置存储

### 添加新的 AI 模型

1. 在 `src/services/imageGenerator.js` 中添加新模型配置
2. 实现对应的生成方法
3. 在前端界面添加模型选项

### API 接口说明

应用使用 IPC 通信机制：

- `get-config` / `set-config` - 配置管理
- `generate-image` - 图像生成
- `show-error` - 错误提示

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
