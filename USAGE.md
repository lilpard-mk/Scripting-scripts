# Scripting Developer Tools - 使用说明

我已经为你创建了一套完整的Scripting App脚本开发工具，包含四个skills和多个实用脚本。

## 插件安装

插件已安装在: `/Users/lilpard/.claude/plugins/local/scripting-developer-tools/`

结构:
```
/Users/lilpard/.claude/plugins/local/scripting-developer-tools/
├── plugin.json                    # 插件配置
└── skills -> (符号链接到本项目的skills目录)
```

## 可用的Skills

### 1. Create Scripting Template
**触发短语**:
- "create a new Scripting component"
- "start a new scripting project"
- "generate script template"
- "create scripting app template"

**功能**: 创建新的Scripting组件模板，包括完整的文件结构和配置。

### 2. Modify Scripting Script
**触发短语**:
- "modify scripting component"
- "refactor script code"
- "update script structure"
- "add features to script"

**功能**: 修改现有Scripting组件，包括重构、添加功能、修复bug等。

### 3. Generate README Docs
**触发短语**:
- "generate readme for scripting component"
- "create documentation"
- "add one-click install link"
- "write component docs"

**功能**: 为Scripting组件生成完整的README文档，包括一键安装链接。

### 4. Manage Script Config
**触发短语**:
- "manage script configuration"
- "update script.json"
- "configure component settings"
- "set up script metadata"

**功能**: 管理Scripting组件的配置文件，包括script.json、依赖管理等。

## 命令行工具

### 脚本位置
所有脚本都在 `scripts/` 目录中：

```
scripts/
├── create-component.sh          # 创建新组件
├── generate-install-link.sh     # 生成一键安装链接
├── generate-readme.sh           # 生成README文档
├── manage-config.sh             # 管理配置文件
```

### 使用方法

#### 1. 创建新组件
```bash
# 交互式创建
./scripts/create-component.sh --interactive MyWidget

# 命令行参数
./scripts/create-component.sh \
  --type widget \
  --name "MyWidget" \
  --author "Your Name" \
  --desc "A cool widget" \
  --output ./components
```

#### 2. 生成一键安装链接
```bash
# 基本用法
./scripts/generate-install-link.sh \
  --repo "username/repo" \
  --file "Component/component.scripting"

# 详细输出
./scripts/generate-install-link.sh \
  --repo "lilpard-mk/Scripting-scripts" \
  --file "DeepSeekBalenceChecker/DeepSeek余额.scripting" \
  --verbose \
  --output install-link.txt
```

#### 3. 生成README文档
```bash
# 为现有组件生成README
./scripts/generate-readme.sh ./MyComponent

# 使用自定义模板
./scripts/generate-readme.sh \
  --template docs/template.md \
  --repo "https://github.com/user/repo" \
  --output README_GEN.md
```

#### 4. 管理配置文件
```bash
# 显示当前配置
./scripts/manage-config.sh show

# 获取特定值
./scripts/manage-config.sh get version

# 设置值
./scripts/manage-config.sh set author.name "John Doe"

# 更新版本号
./scripts/manage-config.sh update-version minor

# 初始化新配置
./scripts/manage-config.sh init
```

## 模板系统

### 模板位置
```
templates/
└── widget/
    └── script.json.template    # Widget组件模板
```

### 创建自定义模板
```bash
# 创建新的模板类型
mkdir -p templates/api-client
cp templates/widget/script.json.template templates/api-client/
# 修改模板文件
```

## 在Claude Code中使用

### 方法1: 直接触发Skill
在Claude Code对话中，使用skill描述中的触发短语，例如:
- "我想创建一个新的Scripting组件"
- "帮我把这个脚本的README文档完善一下"
- "我需要修改这个Scripting组件的配置"

### 方法2: 使用脚本工具
在Claude Code中运行脚本:
```bash
./scripts/create-component.sh --interactive
```

### 方法3: 组合使用
1. 使用skill创建组件模板
2. 修改组件代码
3. 生成README和安装链接
4. 管理配置和版本

## 示例工作流

### 创建并发布新组件
```bash
# 1. 创建组件
./scripts/create-component.sh --type widget --name "WeatherWidget"

# 2. 开发组件代码
cd WeatherWidget
# 编辑 index.tsx, widget.tsx 等文件

# 3. 生成README（假设已推送到GitHub）
./scripts/generate-readme.sh \
  --repo "https://github.com/username/repo" \
  --branch main

# 4. 生成安装链接
./scripts/generate-install-link.sh \
  --repo "username/repo" \
  --file "WeatherWidget/WeatherWidget.scripting" \
  --output install-link.txt

# 5. 更新版本
./scripts/manage-config.sh update-version minor
```

## 配置说明

### script.json 结构
组件的主要配置文件，包含:
- 组件元数据（名称、版本、描述）
- 作者信息
- 仓库链接
- 依赖关系
- 系统要求
- 权限设置

### 环境要求
- **jq**: 用于JSON处理 (`brew install jq`)
- **Python 3**: 用于URL编码
- **Git**: 版本控制

## 故障排除

### Skill未触发
1. 确保插件已正确安装
2. 使用准确的触发短语
3. 重启Claude Code

### 脚本权限问题
```bash
chmod +x scripts/*.sh
```

### JSON处理错误
```bash
# 安装jq
brew install jq
# 或
apt-get install jq
```

### 模板找不到
```bash
# 创建模板目录
mkdir -p templates/widget
# 复制示例模板
cp templates/widget/script.json.template templates/widget/
```

## 扩展开发

### 添加新Skill
1. 在 `skills/` 目录中创建新目录
2. 创建 `SKILL.md` 文件
3. 添加 `references/`, `examples/`, `scripts/` 子目录（可选）
4. 更新插件配置（如果需要）

### 添加新脚本
1. 在 `scripts/` 目录中创建脚本
2. 确保脚本可执行 (`chmod +x`)
3. 更新相关skill的文档
4. 测试脚本功能

## 联系与支持

如有问题或建议:
1. 检查现有文档
2. 查看skill的详细说明
3. 运行脚本时使用 `--verbose` 参数
4. 联系开发者

---

**版本**: 1.0.0
**更新日期**: 2026-01-02
**位置**: `/Users/lilpard/Code.localized/Scripting-scripts/`