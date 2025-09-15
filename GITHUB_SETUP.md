# GitHub 仓库设置指南

## 🚀 快速设置步骤

### 1. 在GitHub上创建新仓库

1. 访问 [GitHub.com](https://github.com)
2. 点击右上角的 `+` 号，选择 `New repository`
3. 填写仓库信息：
   - **Repository name**: `fal-ai-studio`
   - **Description**: `🎨 Professional AI Image Generation Studio with Fal.ai Integration - Text-to-Image & Image-to-Image Editing`
   - **Visibility**: Public (推荐) 或 Private
   - **不要**勾选 "Add a README file"、"Add .gitignore"、"Choose a license"（因为我们已经有了这些文件）

4. 点击 `Create repository`

### 2. 连接本地仓库到GitHub

创建仓库后，GitHub会显示设置指令。复制并执行以下命令：

```bash
# 添加远程仓库（替换 YOUR_USERNAME 为你的GitHub用户名）
git remote add origin https://github.com/YOUR_USERNAME/fal-ai-studio.git

# 推送到远程仓库
git branch -M main
git push -u origin main
```

### 3. 验证推送成功

推送完成后，刷新GitHub页面，你应该能看到所有的项目文件。

## 📋 项目特性说明

这个项目包含以下完整功能：

### ✅ 核心功能
- **文生图功能**: 支持多种Fal.ai模型（nano-banana, flux-dev等）
- **图片编辑功能**: Image-to-Image编辑，支持本地图片上传
- **智能对话界面**: 多轮对话，自然语言描述
- **会话管理**: 新建会话、历史会话查看
- **参数配置**: 图像尺寸、推理步数、安全检查等

### ✅ 用户体验
- **现代化UI**: 美观的渐变背景和卡片设计
- **响应式布局**: 可调整的分割视图（类似VSCode）
- **快捷键支持**: Cmd+Enter快速生成
- **通知系统**: 优雅的弹窗提示
- **图片操作**: 下载、全屏查看、编辑功能

### ✅ 技术特性
- **Electron框架**: 跨平台桌面应用
- **模块化设计**: 清晰的代码结构
- **错误处理**: 完善的异常处理机制
- **本地存储**: 会话和设置持久化
- **API集成**: 完整的Fal.ai API对接

## 🛠 开发说明

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

### 打包应用
```bash
npm run pack
```

## 📝 API配置

1. 访问 [Fal.ai Dashboard](https://fal.ai/dashboard)
2. 获取API Key
3. 在应用设置中配置API Key

## 🎯 使用流程

1. **配置API Key**: 首次使用需要在设置中配置Fal.ai API Key
2. **选择模型**: 从下拉菜单选择所需的AI模型
3. **文生图**: 输入描述文字，点击生成或使用Cmd+Enter
4. **图片编辑**: 点击生成图片的"编辑"按钮，或手动上传图片进入编辑模式
5. **会话管理**: 使用新建会话和历史记录功能管理对话

---

**项目作者**: [Your Name]
**许可证**: MIT
**技术栈**: Electron + JavaScript + Fal.ai API
