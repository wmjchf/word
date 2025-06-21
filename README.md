# WordStory Builder - 微信小程序

一款基于AI的英语学习小程序，通过拍照识别单词并生成包含目标单词的英语故事，让英语学习更有趣。

## 🌟 功能特性

### 核心功能
- **📷 拍照识别单词** - 支持印刷体和手写文字的OCR识别
- **✏️ 单词列表编辑** - 添加、删除、修改识别到的单词
- **⚙️ 个性化设置** - 根据年龄组和英语水平调整故事难度
- **✨ AI故事生成** - 基于单词列表和难度设置生成50-150词的英语故事
- **🎯 单词高亮显示** - 故事中的目标单词会被高亮标记

### 学习辅助功能
- **📖 单词释义查看** - 点击高亮单词查看中文释义
- **🔊 TTS语音朗读** - 支持正常和慢速朗读模式
- **📤 内容导出分享** - 复制文本或生成图片分享
- **🔄 故事重新生成** - 不满意可以重新生成新的故事
- **📚 学习历史记录** - 自动保存生成的故事历史

### 用户体验
- **🎨 现代化UI设计** - 美观的渐变色彩和流畅的交互动画
- **📱 响应式布局** - 适配不同尺寸的手机屏幕
- **🚀 新手引导** - 首次使用时的功能介绍和使用指导
- **💾 本地数据存储** - 支持离线使用，数据本地保存

## 🛠 技术栈

- **前端框架**: React + TypeScript
- **小程序框架**: Taro 4.x
- **样式预处理**: Sass/SCSS
- **状态管理**: 自定义Store (基于Taro Storage)
- **网络请求**: Taro.request 封装
- **开发工具**: ESLint + TypeScript

## 📁 项目结构

```
wordstory-mini/
├── src/
│   ├── app.config.ts          # 应用配置
│   ├── app.ts                 # 应用入口
│   ├── app.scss              # 全局样式
│   ├── services/              # API服务层
│   │   └── api.ts            # 后端接口封装
│   ├── store/                 # 状态管理
│   │   └── index.ts          # 全局状态和数据存储
│   └── pages/                 # 页面组件
│       ├── index/             # 首页
│       │   ├── index.tsx
│       │   └── index.scss
│       ├── onboarding/        # 新手引导页
│       │   ├── index.tsx
│       │   └── index.scss
│       ├── camera/            # 拍照识别页
│       │   ├── index.tsx
│       │   └── index.scss
│       ├── wordList/          # 单词列表编辑页
│       │   ├── index.tsx
│       │   └── index.scss
│       ├── settings/          # 设置页
│       │   ├── index.tsx
│       │   └── index.scss
│       └── story/             # 故事显示页
│           ├── index.tsx
│           └── index.scss
├── config/                    # 构建配置
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm 或 pnpm

### 安装依赖
```bash
cd wordstory-mini
npm install
# 或
pnpm install
```

### 开发调试
```bash
# 微信小程序开发模式
npm run dev:weapp

# H5开发模式
npm run dev:h5
```

### 构建发布
```bash
# 构建微信小程序
npm run build:weapp

# 构建H5版本
npm run build:h5
```

## 🔌 后端接口文档

### 基础配置
- **开发环境**: `http://localhost:3000/api`
- **生产环境**: `https://your-production-api.com/api`
- **认证方式**: Bearer Token (可选)

### 1. OCR识别接口

#### POST `/api/ocr/recognize`
识别图片中的英文单词

**请求参数:**
```json
{
  "image": "base64编码的图片数据"
}
```

**响应格式:**
```json
{
  "success": true,
  "words": ["hello", "world", "story"],
  "accuracy": 0.98,
  "message": "识别成功"
}
```

### 2. AI故事生成接口

#### POST `/api/story/generate`
根据单词列表生成英语故事

**请求参数:**
```json
{
  "words": ["hello", "world", "story"],
  "difficulty": "B1",
  "ageGroup": "teenagers"
}
```

**响应格式:**
```json
{
  "success": true,
  "story": "Once upon a time, there was a magical world where every story came to life...",
  "wordCount": 87,
  "message": "故事生成成功"
}
```

#### POST `/api/story/regenerate`
重新生成故事（排除之前的结果）

**请求参数:**
```json
{
  "words": ["hello", "world", "story"],
  "difficulty": "B1", 
  "ageGroup": "teenagers",
  "excludeIds": ["story_id_1", "story_id_2"]
}
```

### 3. 单词定义接口

#### GET `/api/word/definition`
获取单词的中文释义

**请求参数:**
- `word`: 要查询的单词
- `lang`: 释义语言 (zh/en)，默认zh

**响应格式:**
```json
{
  "success": true,
  "word": "hello",
  "definition": "n. 问候，招呼\nv. 向...问好",
  "pronunciation": "/həˈloʊ/"
}
```

### 4. TTS语音接口

#### POST `/api/tts/generate`
生成文本的语音文件

**请求参数:**
```json
{
  "text": "Once upon a time...",
  "speed": "normal"
}
```

**响应格式:**
```json
{
  "success": true,
  "audioUrl": "https://example.com/audio/story_123.mp3",
  "duration": 45.6
}
```

### 5. 用户设置接口

#### POST `/api/user/settings`
保存用户设置

**请求参数:**
```json
{
  "ageGroup": "teenagers",
  "difficulty": "B1",
  "language": "zh"
}
```

#### GET `/api/user/settings`
获取用户设置

**响应格式:**
```json
{
  "success": true,
  "settings": {
    "ageGroup": "teenagers",
    "difficulty": "B1", 
    "language": "zh"
  }
}
```

### 6. 历史记录接口

#### POST `/api/user/history`
保存生成历史

**请求参数:**
```json
{
  "words": ["hello", "world"],
  "story": "Once upon a time...",
  "difficulty": "B1",
  "ageGroup": "teenagers",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET `/api/user/history`
获取历史记录

**请求参数:**
- `page`: 页码，默认1
- `limit`: 每页数量，默认10

**响应格式:**
```json
{
  "success": true,
  "data": [
    {
      "id": "history_123",
      "words": ["hello", "world"],
      "story": "Once upon a time...",
      "difficulty": "B1",
      "ageGroup": "teenagers", 
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

### 7. 导出功能接口

#### POST `/api/export/image`
导出故事为图片

**请求参数:**
```json
{
  "story": "Once upon a time...",
  "words": ["hello", "world"]
}
```

**响应格式:**
```json
{
  "success": true,
  "imageUrl": "https://example.com/images/story_card_123.png"
}
```

## 📝 开发说明

### 数据流程
1. **拍照识别**: 用户拍照 → OCR识别 → 单词列表
2. **编辑单词**: 添加/删除/修改单词 → 本地存储
3. **设置难度**: 选择年龄组和英语水平 → 本地存储
4. **生成故事**: 单词列表 + 用户设置 → AI生成故事
5. **学习功能**: 高亮显示 + 释义查看 + 语音朗读

### 状态管理
- 使用自定义Store类管理全局状态
- 基于Taro.storage实现数据持久化
- 支持用户设置、单词列表、故事数据、历史记录的管理

### 错误处理
- 网络请求失败时提供友好的错误提示
- OCR识别失败时提供重试和手动输入选项
- 开发阶段提供模拟数据确保功能可测试

### 性能优化
- 图片压缩后再进行OCR识别
- 使用防抖处理用户输入
- 合理的加载状态和错误状态展示

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件至 [your-email@example.com]

---

**WordStory Builder** - 让英语学习更有趣！ 🚀 