# AI API 余额检查器

一个用于 Scripting App 的多 AI API 余额检查器组件，支持 DeepSeek、OpenRouter 与阿里云 API，包含 API 密钥设置表单和余额显示桌面小组件。

## 功能特性

- 🔐 **安全存储**：API 密钥使用 iOS Keychain 安全存储，支持多 API 密钥管理
- 📱 **桌面小组件**：在主屏幕显示多个 AI API 账户余额，支持一键切换
- ⚙️ **统一设置页面**：内置多 API 密钥设置和管理界面，直观易用
- 🔄 **自动刷新**：小组件定期自动更新余额信息，支持自定义刷新间隔
- 🌐 **多语言支持**：完整的中文界面，符合国内用户使用习惯
- 🔮 **多 API 支持**：已支持 DeepSeek、OpenRouter、阿里云三大平台
- 🎨 **品牌标识**：每个 API 提供专属品牌图标和颜色主题
- 📊 **智能显示**：自动识别货币类型，智能格式化余额显示

## 界面截图

### 多API设置页面
<img src="img/图1.png" alt="多API设置页面截图，支持DeepSeek、OpenRouter、阿里云" width="70%">

### 桌面小组件（小型）
<img src="img/图2.png" alt="AI API余额桌面小组件截图（小型）" width="70%">

### 桌面小组件（中型）
<img src="img/图3.png" alt="AI API余额桌面小组件截图（中型）" width="70%">

## 项目结构

```
AIApiBalanceChecker/
├── script.json                 # 项目配置文件
├── index.tsx                   # 多 API 密钥设置表单（主入口）
├── widget.tsx                  # 桌面小组件组件，支持多 API 切换
├── constants.ts                # 共享常量配置，包含多 API 定义
├── app_intents.tsx             # AppIntent 定义
├── icons/                      # API 品牌图标目录
│   ├── DeepSeek.svg           # DeepSeek 品牌图标
│   ├── OpenRouter.svg         # OpenRouter 品牌图标
│   └── Aliyun.svg             # 阿里云品牌图标
└── AIApi余额.scripting         # 打包后的脚本文件
```

## 安装和使用

### 方法一：一键安装（推荐）

点击下方链接即可在 Scripting App 中直接安装此组件：

[🔗 一键安装 AI API 余额检查器](https://scripting.fun/import_scripts?urls=%5B%22https%3A%2F%2Fraw.githubusercontent.com%2Flilpard-mk%2FScripting-scripts%2Frefs%2Fheads%2Fmain%2FAIApiBalanceChecker%2FAIApi%E4%BD%99%E9%A2%9D.scripting%22%5D)

或者，你也可以手动导入：
1. 在 Scripting App 中点击 "导入脚本"
2. 选择 `AIApi余额.scripting` 文件
3. 脚本将自动导入并显示在脚本列表中

### 方法二：源码导入

1. 将整个 `AIApiBalanceChecker` 文件夹复制到 Scripting App 项目目录
2. 在 Scripting App 中刷新脚本列表
3. 运行 `index.tsx` 打开设置页面

## 使用说明

### 1. 设置 API 密钥

本组件支持三种 AI API 服务，您可以根据需要设置一个或多个 API 密钥：

#### DeepSeek API
1. 运行脚本，打开 AI API 设置页面
2. 切换到 "DeepSeek" 标签页
3. 访问 [DeepSeek 控制台](https://platform.deepseek.com) 获取 API 密钥
4. 复制以 "sk-" 开头的 API 密钥（长度至少 20 位）
5. 在设置页面粘贴并保存密钥

#### OpenRouter API
1. 切换到 "OpenRouter" 标签页
2. 访问 [OpenRouter 密钥管理](https://openrouter.ai/keys) 获取 API 密钥
3. 复制以 "sk-or-" 开头的 API 密钥
4. 在设置页面粘贴并保存密钥

#### 阿里云余额查询
1. 切换到 "阿里云" 标签页
2. 访问 [阿里云 RAM 控制台](https://ram.console.aliyun.com/users) 获取 AccessKey
3. 输入 AccessKey ID 和 AccessKey Secret
4. 选择服务器地区（默认为杭州）
5. 保存凭据

### 2. 添加桌面小组件

1. 长按 iOS 主屏幕进入编辑模式
2. 点击左上角 "+" 添加小组件
3. 搜索并选择 "Scripting"
4. 选择 "AIApi余额" 小组件
5. 调整大小并添加到桌面

### 3. 配置小组件显示

添加小组件后，需要配置显示哪个 API 的余额：

1. 长按已添加的小组件，选择 "编辑小组件"
2. 在参数设置中，输入数字选择要显示的 API：
   - `1`: 显示 DeepSeek 余额
   - `2`: 显示 OpenRouter 余额
   - `3`: 显示阿里云余额
3. 点击完成保存设置

### 4. 查看余额

- 小组件将自动显示所选 API 的账户余额
- 余额信息每 5 分钟自动刷新
- 点击小组件可快速打开设置页面切换 API
- 不同 API 使用不同的品牌颜色和图标，便于区分

## 技术说明

### 存储机制

- 所有 API 密钥使用 `Storage` API 存储在共享存储域，支持小组件访问
- 存储选项：`{ shared: true }`（允许小组件访问）
- 多 API 存储键名：
  - DeepSeek: `deepseek_api_key`
  - OpenRouter: `openrouter_api_key`
  - 阿里云: `aliyun_api_credentials`（存储 JSON 格式的凭据）
- 阿里云凭据包含 AccessKey ID、AccessKey Secret 和地区信息

### 数据安全

- 所有 API 调用在设备本地完成，不经过第三方服务器
- 密钥仅用于向对应的 API 服务商发送余额查询请求
- 应用不会收集、存储或传输任何用户数据
- 阿里云 AccessKey 仅用于查询余额，权限最小化
- 所有存储操作均使用 iOS 安全存储机制

### 错误处理

- 网络错误：显示具体错误信息
- API 错误：显示状态码和错误内容
- 存储错误：提示重新设置密钥

## 开发说明

### 文件说明

- **index.tsx**：多 API 设置表单组件，使用 React Hooks 管理状态，支持标签页切换
- **widget.tsx**：桌面小组件，支持多 API 切换显示，采用一次性渲染模式
- **constants.ts**：配置常量，包含多 API 定义、端点、存储键名和地区配置
- **app_intents.tsx**：定义 AppIntent 用于小组件刷新
- **icons/**: 品牌图标目录，包含 DeepSeek、OpenRouter、阿里云的 SVG 图标

### 修改和定制

1. **修改样式**：编辑 widget.tsx 中的 JSX 代码
2. **更改刷新间隔**：修改 widget.tsx 中的 `policy` 参数
3. **添加新功能**：参考 Scripting App 官方文档

## 扩展计划

当前版本已支持 DeepSeek、OpenRouter 和阿里云三大平台。基于模块化架构，未来版本计划支持更多 AI API 提供商，包括但不限于：

- **OpenAI**：ChatGPT、GPT-4 等模型余额查询
- **Anthropic**：Claude 系列模型余额查询
- **Google AI**：Gemini 系列模型余额查询
- **Azure OpenAI**：企业级 OpenAI 服务余额查询
- **其他主流 AI 服务**：如 Cohere、Midjourney、Stability AI 等

### 已实现的扩展架构

1. **模块化 API 适配器**：每个 API 有独立配置，便于添加新服务
2. **统一密钥管理**：标签页式界面，支持多密钥安全存储
3. **可配置的 API 端点**：支持自定义端点和地区选择（阿里云）
4. **智能余额显示**：自动货币识别和格式化，品牌图标集成
5. **参数化小组件**：通过数字参数快速切换显示不同 API 余额

### 开发者扩展指南

要添加新的 AI API 支持，请参考以下步骤：
1. 在 `constants.ts` 中添加新的 `AIApiConfig` 配置
2. 在 `SUPPORTED_APIS` 数组中注册新 API
3. 添加对应的品牌图标到 `icons/` 目录
4. 在 `index.tsx` 的标签页列表中添加新标签
5. 在 `widget.tsx` 中添加对应的显示逻辑

## 注意事项

- 确保网络连接正常，以便调用各个 AI API 服务
- API 密钥和 AccessKey 有安全风险，请勿泄露
- 小组件可能需要重新加载才能使用新保存的密钥
- 所有界面文本均使用中文，方便国内用户使用
- 阿里云余额查询需要正确的 AccessKey 和地区配置
- OpenRouter API 密钥以 "sk-or-" 开头，请注意格式验证
- 不同 API 的余额刷新频率可能受服务商限制影响

## 版本信息

- 版本：1.0.0（多 API 支持版）
- 更新日期：2026-01-03
- 适用于：Scripting App 框架
- 支持平台：DeepSeek、OpenRouter、阿里云


## 支持与反馈

如有问题或建议，请通过 GitHub Issues 提交反馈。

---

**免责声明**：此项目为第三方开发，与 DeepSeek、OpenRouter、阿里云等 API 服务商官方无关。使用 API 密钥需遵守各服务商的相关条款和政策。