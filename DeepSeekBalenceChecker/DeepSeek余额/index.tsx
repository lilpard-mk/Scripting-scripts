// DeepSeek API 密钥设置表单
// 使用 <Form> 构建的内部页面，用于设置 API 密钥

import {
  Button,
  Form,
  Navigation,
  NavigationStack,
  SecureField,
  Section,
  Text,
  useState,
  useEffect
} from "scripting"

import { STORAGE_KEY, STORAGE_OPTIONS, DEEPSEEK_CONSOLE_URL } from "./constants"

// API 设置表单组件
function DeepSeekApiSettings() {
  const dismiss = Navigation.useDismiss?.()
  const [apiKey, setApiKey] = useState("")
  const [hasSavedKey, setHasSavedKey] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 组件加载时检查是否有已保存的 API 密钥
  useEffect(() => {
    try {
      const savedKey = Storage.get<string>(STORAGE_KEY, STORAGE_OPTIONS)
      if (savedKey) {
        setApiKey(savedKey)
        setHasSavedKey(true)
        setSavedMessage("已检测到已保存的 API 密钥")
      } else {
        setHasSavedKey(false)
      }
    } catch (error) {
      console.error("读取存储失败:", error)
      setHasSavedKey(false)
    }
  }, [])

  // 保存 API 密钥
  const handleSave = () => {
    const key = apiKey.trim()

    // 验证输入
    if (!key) {
      setErrorMessage("请输入有效的 API 密钥")
      setSavedMessage(null)
      return
    }

    if (!key.startsWith("sk-")) {
      setErrorMessage("API 密钥应以 'sk-' 开头")
      setSavedMessage(null)
      return
    }

    if (key.length < 20) {
      setErrorMessage("API 密钥长度过短")
      setSavedMessage(null)
      return
    }

    try {
      // 保存到共享存储
      Storage.set(STORAGE_KEY, key, STORAGE_OPTIONS)
      setSavedMessage("API 密钥保存成功！")
      setErrorMessage(null)
      // 保存成功后重新从存储读取以确认保存成功
      try {
        const confirmedKey = Storage.get<string>(STORAGE_KEY, STORAGE_OPTIONS)
        setApiKey(confirmedKey || key)
        setHasSavedKey(true)
      } catch (error) {
        // 如果读取失败，保留原始密钥在输入框中
        setApiKey(key)
        setHasSavedKey(true) // 假设保存成功，即使读取失败
      }
    } catch (error) {
      setErrorMessage("保存失败：" + (error instanceof Error ? error.message : "未知错误"))
      setSavedMessage(null)
    }
  }

  // 清除 API 密钥
  const handleClear = () => {
    try {
      Storage.remove(STORAGE_KEY, STORAGE_OPTIONS)
      setApiKey("")
      setHasSavedKey(false)
      setSavedMessage("API 密钥已清除")
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage("清除失败：" + (error instanceof Error ? error.message : "未知错误"))
      setSavedMessage(null)
    }
  }

  // 打开 DeepSeek 控制台
  const openConsole = async () => {
    const success = await Safari.openURL(DEEPSEEK_CONSOLE_URL)
    if (!success) {
      setErrorMessage("无法打开浏览器")
    }
  }

  return (
    <NavigationStack>
      <Form
        navigationTitle="DeepSeek API 设置"
        toolbar={{
          cancellationAction: (
            <Button title="完成" action={dismiss} />
          )
        }}
      >
        {/* 说明部分 */}
        <Section header={<Text font="headline">API 密钥设置</Text>}>
          <Text foregroundStyle="systemGray" font="body">
            在此设置您的 DeepSeek API 密钥。密钥将安全保存并可在桌面小组件中使用。
          </Text>

          {/* 成功消息 */}
          {savedMessage && (
            <Text foregroundStyle="systemGreen" font="caption">
              ✓ {savedMessage}
            </Text>
          )}

          {/* 错误消息 */}
          {errorMessage && (
            <Text foregroundStyle="systemRed" font="caption">
              ⚠ {errorMessage}
            </Text>
          )}
        </Section>

        {/* API 密钥输入部分 */}
        <Section header={<Text>API 密钥</Text>}>
          <SecureField
            title="DeepSeek API 密钥"
            value={apiKey}
            onChanged={setApiKey}
            prompt="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
          />

          <Text foregroundStyle="systemGray2" font="caption">
            请输入您的 DeepSeek API 密钥。密钥以 "sk-" 开头。
          </Text>
        </Section>

        {/* 操作按钮部分 */}
        <Section>
          <Button
            title="保存 API 密钥"
            systemImage="checkmark.circle.fill"
            action={handleSave}
          />

          <Button
            title="清除 API 密钥"
            systemImage="trash"
            buttonStyle="plain"
            foregroundStyle="systemRed"
            action={handleClear}
          />
        </Section>

        {/* 使用说明部分 */}
        <Section header={<Text>使用说明</Text>}>
          <Text foregroundStyle="systemGray" font="body">
            1. 访问 DeepSeek 控制台：https://platform.deepseek.com
          </Text>
          <Text foregroundStyle="systemGray" font="body">
            2. 登录您的账户
          </Text>
          <Text foregroundStyle="systemGray" font="body">
            3. 进入 API Keys 部分
          </Text>
          <Text foregroundStyle="systemGray" font="body">
            4. 创建新的 API 密钥或使用现有密钥
          </Text>
          <Text foregroundStyle="systemGray" font="body">
            5. 复制以 "sk-" 开头的密钥并在此保存
          </Text>

          <Button
            title="打开 DeepSeek 控制台"
            systemImage="safari"
            action={openConsole}
          />
        </Section>

        {/* 状态信息部分 */}
        <Section header={<Text>当前状态</Text>}>
          <Text foregroundStyle="systemGray" font="body">
            存储状态：{hasSavedKey ? "✓ 已保存 API 密钥" : "✗ 未保存 API 密钥"}
          </Text>
          <Text foregroundStyle="systemGray" font="body">
            输入框密钥长度：{apiKey.length} 个字符
          </Text>
          <Text foregroundStyle="systemGray" font="body">
            输入框格式验证：{apiKey.startsWith("sk-") ? "✓ 格式正确" : "⚠ 需要以 'sk-' 开头"}
          </Text>
        </Section>
      </Form>
    </NavigationStack>
  )
}

// 导出展示函数，可以通过 Navigation.present(<DeepSeekApiSettings />) 显示
export function showDeepSeekApiSettings() {
  // 在显示设置页面之前，先尝试获取缓存的API密钥，验证存储访问是否正常
  try {
    Storage.get<string>(STORAGE_KEY, STORAGE_OPTIONS)
    console.log("存储访问正常")
  } catch (error) {
    console.error("存储访问失败:", error)
  }

  Navigation.present(<DeepSeekApiSettings />);
}

showDeepSeekApiSettings();
// 默认导出组件
export default DeepSeekApiSettings
