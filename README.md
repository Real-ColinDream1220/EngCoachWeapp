# EngCoach - 英语口语训练助手

<div align="center">
  <img src="https://img.shields.io/badge/Taro-4.1.7-blue.svg" alt="Taro Version">
  <img src="https://img.shields.io/badge/React-18.0.0-blue.svg" alt="React Version">
  <img src="https://img.shields.io/badge/TypeScript-4.1.0-blue.svg" alt="TypeScript Version">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
</div>

一个基于 Taro 框架开发的智能英语口语训练应用，支持多端运行（微信小程序、H5、App等）。通过AI对话练习，帮助学生提高英语口语表达能力。

## ✨ 项目特性

- 🎯 **智能对话练习**: AI驱动的英语对话练习系统
- 📚 **丰富学习内容**: 涵盖日常问候、家庭朋友、学校生活、兴趣爱好、购物消费等场景
- 📈 **学习进度跟踪**: 实时记录学习进度和完成情况
- 🎨 **现代化UI**: 基于Taro UI的美观界面设计
- 📱 **多端支持**: 支持微信小程序、H5、App等多平台
- 🔄 **响应式设计**: 适配不同屏幕尺寸的设备

## 🛠️ 技术栈

- **框架**: Taro 4.1.7
- **前端**: React 18 + TypeScript
- **样式**: SCSS + Taro UI
- **构建工具**: Vite
- **包管理**: pnpm
- **图标**: Lucide React (转换为Unicode符号)

## 📱 功能模块

### 1. 首页 - 课程筛选
- 年级、教材版本、章节筛选
- 学习进度可视化
- 章节列表展示
- 课程推荐

### 2. 练习详情页
- 章节信息展示
- 练习列表和进度
- 学习建议
- 练习状态管理

### 3. AI对话练习
- 模拟真实对话场景
- 录音功能（模拟）
- AI智能回复
- 对话历史记录

## 🚀 快速开始

### 环境要求

- Node.js >= 14.0.0
- pnpm >= 6.0.0
- 微信开发者工具（小程序开发）

### 安装依赖

```bash
# 使用 pnpm 安装依赖
pnpm install

# 或使用 npm
npm install
```

### 开发模式

```bash
# 微信小程序开发
pnpm run dev:weapp

# H5 开发
pnpm run dev:h5

# 支付宝小程序开发
pnpm run dev:alipay
```

### 构建生产版本

```bash
# 构建微信小程序
pnpm run build:weapp

# 构建 H5
pnpm run build:h5
```

## 📁 项目结构

```
EngCoach/
├── src/                          # 源代码目录
│   ├── app.tsx                   # 应用入口组件
│   ├── app.config.ts             # 应用配置文件
│   ├── app.scss                  # 全局样式
│   ├── pages/                    # 页面目录
│   │   ├── index/                # 首页
│   │   │   ├── index.tsx         # 首页组件
│   │   │   ├── index.scss        # 首页样式
│   │   │   └── index.config.ts   # 首页配置
│   │   ├── exercise-detail/      # 练习详情页
│   │   │   ├── index.tsx
│   │   │   └── index.scss
│   │   └── conversation/         # 对话练习页
│   │       ├── index.tsx
│   │       └── index.scss
│   ├── components/               # 公共组件
│   │   └── Icon.tsx              # 图标组件
│   ├── styles/                   # 样式文件
│   │   ├── variables.scss        # 样式变量
│   │   └── mixins.scss           # 样式混合
│   ├── utils/                    # 工具函数
│   └── types/                    # TypeScript 类型定义
├── dist/                         # 构建输出目录
├── config/                       # 配置文件
│   └── index.js                  # Taro 配置
├── package.json                  # 项目依赖配置
├── tsconfig.json                 # TypeScript 配置
├── project.config.json           # 微信小程序配置
└── README.md                     # 项目说明文档
```

## 🎯 学习内容

### 第一章：日常问候与介绍
- 基础问候
- 自我介绍
- 介绍他人
- 道别用语
- 情景对话练习

### 第二章：谈论家庭与朋友
- 介绍家庭
- 描述家人
- 谈论朋友
- 家庭活动

### 第三章：学校生活
- 学校设施
- 课程描述
- 学习习惯
- 师生交流
- 校园活动
- 考试与评价

### 第四章：兴趣与爱好
- 兴趣爱好表达
- 体育活动
- 音乐与艺术
- 阅读与电影
- 业余时间

### 第五章：购物与消费
- 购物需求
- 询问价格
- 讨价还价
- 退换商品

## 🔧 开发指南

### 添加新页面

1. 在 `src/pages/` 目录下创建新的页面文件夹
2. 创建 `index.tsx`、`index.scss` 和 `index.config.ts` 文件
3. 在 `src/app.config.ts` 中添加页面路径

### 添加新组件

1. 在 `src/components/` 目录下创建组件文件
2. 使用 TypeScript 定义组件类型
3. 在需要的地方导入并使用

### 样式开发

- 使用 SCSS 编写样式
- 利用 `src/styles/variables.scss` 中的变量
- 使用 `src/styles/mixins.scss` 中的混合器

## 📦 构建说明

### 微信小程序

构建后的文件位于 `dist/` 目录，可以直接使用微信开发者工具打开。

### H5

构建后的文件位于 `dist/` 目录，可以部署到任何静态文件服务器。

## 🐛 调试

### 常见问题

1. **构建失败**: 检查 Node.js 版本和依赖安装
2. **样式问题**: 确认 SCSS 语法正确
3. **类型错误**: 检查 TypeScript 类型定义

### 调试工具

- 微信开发者工具
- Chrome DevTools (H5)
- VS Code 调试器

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- 项目链接: [https://github.com/your-username/EngCoach](https://github.com/your-username/EngCoach)
- 问题反馈: [Issues](https://github.com/your-username/EngCoach/issues)

## 🙏 致谢

- [Taro](https://taro.zone/) - 多端统一开发框架
- [Taro UI](https://taro-ui.jd.com/) - 多端 UI 组件库
- [React](https://reactjs.org/) - 用户界面库
- [Lucide](https://lucide.dev/) - 图标库

---

<div align="center">
  Made with ❤️ by EngCoach Team
</div>