// AI API 余额检查器 - 设置界面
// 支持多个AI API的密钥管理和余额查询

import {
  Button,
  Form,
  Image,
  Navigation,
  NavigationStack,
  Picker,
  SecureField,
  Section,
  Text,
  TextField,
  useState,
  useEffect,
  List,
  HStack,
  VStack,
  Spacer,
} from "scripting";

import {
  SUPPORTED_APIS,
  STORAGE_OPTIONS,
  OLD_STORAGE_OPTIONS,
  getApiConfig,
  ALIYUN_SUPPORTED_REGIONS,
  ALIYUN_DEFAULT_REGION,
  AliyunCredentials,
  getAliyunRegionName
} from "./constants";

// 主页面：API列表
function AIApiList() {
  const dismiss = Navigation.useDismiss?.();

  // 状态：每个API的密钥状态
  const [apiStatuses, setApiStatuses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [selectedApiId, setSelectedApiId] = useState<string | null>(null);

  // 自动迁移逻辑：从公共存储转移到私有存储
  const migrateStorage = async () => {
    console.log("开始检查存储迁移...");
    let migratedCount = 0;

    for (const api of SUPPORTED_APIS) {
      try {
        // 检查公共存储中是否有数据
        const oldData = Storage.get<string>(api.storageKey, OLD_STORAGE_OPTIONS);
        
        if (oldData) {
          console.log(`检测到 ${api.name} 的旧存储数据，正在迁移...`);
          
          // 写入私有存储
          Storage.set(api.storageKey, oldData, STORAGE_OPTIONS);
          
          // 从公共存储删除
          Storage.remove(api.storageKey, OLD_STORAGE_OPTIONS);
          
          migratedCount++;
          console.log(`${api.name} 迁移完成`);
        }
      } catch (error) {
        console.error(`迁移 ${api.name} 失败:`, error);
      }
    }

    if (migratedCount > 0) {
      console.log(`共完成 ${migratedCount} 个 API 的存储迁移`);
    } else {
      console.log("未发现需要迁移的数据");
    }
  };

  const loadApiStatuses = async () => {
    // 先执行迁移
    await migrateStorage();

    const statuses: Record<string, boolean> = {};

    for (const api of SUPPORTED_APIS) {
      try {
        const savedKey = Storage.get<string>(api.storageKey, STORAGE_OPTIONS);
        statuses[api.id] = !!savedKey;
      } catch (error) {
        console.error(`读取${api.name}密钥失败:`, error);
        statuses[api.id] = false;
      }
    }

    setApiStatuses(statuses);
    setLoading(false);
  };

  // 加载所有API的密钥状态
  useEffect(() => {
    loadApiStatuses();
  }, []);

  return (
    <NavigationStack>
      <Form
        navigationTitle="AI API 设置"
        toolbar={{
          cancellationAction: <Button title="完成" action={dismiss} />,
        }}>
        {/* 说明部分 */}
        <Section header={<Text font="headline">支持的AI API</Text>}>
          <Text foregroundStyle="systemGray" font="body">
            在此管理您的AI API密钥。密钥将安全保存并可在桌面小组件中查询余额。
          </Text>
        </Section>

        {/* API列表 */}
        <Section header={<Text>选择API进行设置</Text>}>
          {loading ? (
            <Text foregroundStyle="systemGray" font="body">
              加载中...
            </Text>
          ) : (
            <List
              navigationDestination={{
                isPresented: selectedApiId != null,
                onChanged: (value) => {
                  if (!value) {
                    setSelectedApiId(null);
                  }
                },
                content:
                  selectedApiId != null ? (
                    <ApiSettings apiId={selectedApiId} onSaved={loadApiStatuses} />
                  ) : (
                    <Text>选择API</Text>
                  ),
              }}>
              {SUPPORTED_APIS.map((api) => {
                const hasKey = apiStatuses[api.id] || false;

                return (
                  <HStack
                    key={api.id}
                    onTapGesture={() => setSelectedApiId(api.id)}
                    listRowInsets={{ leading: 16, trailing: 16, top: 12, bottom: 12 }}
                    alignment="center"
                    spacing={8}>
                    <VStack spacing={4} alignment="leading">
                      <Text font="body">{api.displayName}</Text>
                      <Text foregroundStyle="systemGray2" font="caption">
                        {api.description}
                      </Text>
                    </VStack>
                    <Spacer />
                    <HStack spacing={8} alignment="center">
                      <Text foregroundStyle={hasKey ? "systemGreen" : "systemRed"} font="caption">
                        {hasKey ? "✓ 已设置" : "✗ 未设置"}
                      </Text>
                      <Image systemName="chevron.right" foregroundStyle="systemGray2" />
                    </HStack>
                  </HStack>
                );
              })}
            </List>
          )}
        </Section>

        {/* 使用说明 */}
        <Section header={<Text>使用说明</Text>}>
          <Text foregroundStyle="systemGray" font="body">
            1. 选择要设置的AI API
          </Text>
          <Text foregroundStyle="systemGray" font="body">
            2. 输入您的API密钥
          </Text>
          <Text foregroundStyle="systemGray" font="body">
            3. 密钥将安全保存
          </Text>
          <Text foregroundStyle="systemGray" font="body">
            4. 在桌面小组件中查看余额
          </Text>
        </Section>

        {/* 状态信息 */}
        <Section header={<Text>当前状态</Text>}>
          <Text foregroundStyle="systemGray" font="body">
            已配置API数量: {SUPPORTED_APIS.length} 个
          </Text>
          <Text foregroundStyle="systemGray" font="body">
            已设置密钥: {Object.values(apiStatuses).filter(Boolean).length} 个
          </Text>
          <Text foregroundStyle="systemGray" font="body">
            未设置密钥: {Object.values(apiStatuses).filter((v) => !v).length} 个
          </Text>
        </Section>
      </Form>
    </NavigationStack>
  );
}

// 单个API的设置页面
function ApiSettings({ apiId, onSaved }: { apiId: string, onSaved?: () => void }) {
  const apiConfig = getApiConfig(apiId);

  if (!apiConfig) {
    return (
      <Form navigationTitle="错误">
        <Section>
          <Text>未找到API配置: {apiId}</Text>
        </Section>
      </Form>
    );
  }

  const [apiKey, setApiKey] = useState("");
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 阿里云特定状态
  const [accessKeyId, setAccessKeyId] = useState("");
  const [accessKeySecret, setAccessKeySecret] = useState("");
  const [regionId, setRegionId] = useState(ALIYUN_DEFAULT_REGION);

  // 组件加载时检查是否有已保存的API密钥
  useEffect(() => {
    try {
      if (apiConfig.id === 'aliyun') {
        // 阿里云：读取JSON格式的凭据
        const savedCredentialsJson = Storage.get<string>(apiConfig.storageKey, STORAGE_OPTIONS);
        if (savedCredentialsJson) {
          try {
            const credentials: AliyunCredentials = JSON.parse(savedCredentialsJson);
            setAccessKeyId(credentials.accessKeyId || '');
            setAccessKeySecret(credentials.accessKeySecret || '');
            setRegionId(credentials.regionId || ALIYUN_DEFAULT_REGION);
            setHasSavedKey(true);
            setSavedMessage(`已检测到已保存的 ${apiConfig.name} 凭据`);
          } catch (parseError) {
            console.error("解析阿里云凭据失败:", parseError);
            setHasSavedKey(false);
          }
        } else {
          setHasSavedKey(false);
        }
      } else {
        // 其他API：读取普通密钥
        const savedKey = Storage.get<string>(apiConfig.storageKey, STORAGE_OPTIONS);
        if (savedKey) {
          setApiKey(savedKey);
          setHasSavedKey(true);
          setSavedMessage(`已检测到已保存的 ${apiConfig.name} API 密钥`);
        } else {
          setHasSavedKey(false);
        }
      }
    } catch (error) {
      console.error("读取存储失败:", error);
      setHasSavedKey(false);
    }
  }, [apiConfig.storageKey, apiConfig.id, apiConfig.name]);

  // 验证API密钥
  const validateApiKey = (key: string): string | null => {
    const trimmedKey = key.trim();

    if (!trimmedKey) {
      return "请输入有效的 API 密钥";
    }

    // 检查密钥前缀
    if (apiConfig.keyPrefix && !trimmedKey.startsWith(apiConfig.keyPrefix)) {
      return `API 密钥应以 "${apiConfig.keyPrefix}" 开头`;
    }

    // 检查密钥最小长度
    if (apiConfig.keyMinLength && trimmedKey.length < apiConfig.keyMinLength) {
      return `API 密钥长度过短，至少需要 ${apiConfig.keyMinLength} 个字符`;
    }

    return null;
  };

  // 验证阿里云凭据
  const validateAliyunCredentials = (): string | null => {
    const trimmedAccessKeyId = accessKeyId.trim();
    const trimmedAccessKeySecret = accessKeySecret.trim();
    const trimmedRegionId = regionId.trim();

    if (!trimmedAccessKeyId) {
      return "请输入有效的 AccessKey ID";
    }
    if (!trimmedAccessKeySecret) {
      return "请输入有效的 AccessKey Secret";
    }
    if (!trimmedRegionId) {
      return "请选择地区";
    }
    // AccessKey ID 通常以 "LTAI" 开头，长度20-32字符
    if (!trimmedAccessKeyId.startsWith('LTAI')) {
      return "AccessKey ID 应以 'LTAI' 开头";
    }
    if (trimmedAccessKeyId.length < 16 || trimmedAccessKeyId.length > 32) {
      return "AccessKey ID 长度应为16-32个字符";
    }
    if (trimmedAccessKeySecret.length < 30 || trimmedAccessKeySecret.length > 40) {
      return "AccessKey Secret 长度应为30-40个字符";
    }
    return null;
  };

  // 保存 API 密钥
  const handleSave = () => {
    if (apiConfig.id === 'aliyun') {
      // 阿里云：保存凭据JSON
      const validationError = validateAliyunCredentials();
      if (validationError) {
        setErrorMessage(validationError);
        setSavedMessage(null);
        return;
      }

      const credentials: AliyunCredentials = {
        accessKeyId: accessKeyId.trim(),
        accessKeySecret: accessKeySecret.trim(),
        regionId: regionId.trim(),
      };

      try {
        const credentialsJson = JSON.stringify(credentials);
        Storage.set(apiConfig.storageKey, credentialsJson, STORAGE_OPTIONS);
        setSavedMessage(`${apiConfig.name} 凭据保存成功！`);
        setErrorMessage(null);

        // 确认保存成功
        try {
          const confirmedJson = Storage.get<string>(apiConfig.storageKey, STORAGE_OPTIONS);
          const confirmed = JSON.parse(confirmedJson || '{}');
          setAccessKeyId(confirmed.accessKeyId || '');
          setAccessKeySecret(confirmed.accessKeySecret || '');
          setRegionId(confirmed.regionId || ALIYUN_DEFAULT_REGION);
          setHasSavedKey(true);
          onSaved?.();
        } catch (error) {
          // 如果读取失败，保留原始值
          setHasSavedKey(true);
        }
      } catch (error) {
        setErrorMessage(`保存失败：${error instanceof Error ? error.message : "未知错误"}`);
        setSavedMessage(null);
      }
    } else {
      // 其他API：保存普通密钥
      const key = apiKey.trim();

      // 验证输入
      const validationError = validateApiKey(key);
      if (validationError) {
        setErrorMessage(validationError);
        setSavedMessage(null);
        return;
      }

      try {
        // 保存到私有存储
        Storage.set(apiConfig.storageKey, key, STORAGE_OPTIONS);
        setSavedMessage(`${apiConfig.name} API 密钥保存成功！`);
        setErrorMessage(null);

        // 保存成功后重新从存储读取以确认保存成功
        try {
          const confirmedKey = Storage.get<string>(apiConfig.storageKey, STORAGE_OPTIONS);
          setApiKey(confirmedKey || key);
          setHasSavedKey(true);
          onSaved?.();
        } catch (error) {
          // 如果读取失败，保留原始密钥在输入框中
          setApiKey(key);
          setHasSavedKey(true);
        }
      } catch (error) {
        setErrorMessage(`保存失败：${error instanceof Error ? error.message : "未知错误"}`);
        setSavedMessage(null);
      }
    }
  };

  // 清除 API 密钥
  const handleClear = () => {
    try {
      Storage.remove(apiConfig.storageKey, STORAGE_OPTIONS);
      if (apiConfig.id === 'aliyun') {
        setAccessKeyId("");
        setAccessKeySecret("");
        setRegionId(ALIYUN_DEFAULT_REGION);
      } else {
        setApiKey("");
      }
      setHasSavedKey(false);
      setSavedMessage(`${apiConfig.name} API 密钥已清除`);
      setErrorMessage(null);
      onSaved?.();
    } catch (error) {
      setErrorMessage(`清除失败：${error instanceof Error ? error.message : "未知错误"}`);
      setSavedMessage(null);
    }
  };

  // 打开API控制台
  const openConsole = async () => {
    const success = await Safari.openURL(apiConfig.consoleUrl);
    if (!success) {
      setErrorMessage("无法打开浏览器");
    }
  };

  // 渲染阿里云设置界面
  const renderAliyunSettings = () => (
    <Form navigationTitle={`${apiConfig.displayName} 设置`}>
      {/* 说明部分 */}
      <Section header={<Text font="headline">API 密钥设置</Text>}>
        <Text foregroundStyle="systemGray" font="body">
          在此设置您的阿里云 AccessKey ID 和 Secret。凭据将安全保存并可在桌面小组件中查询余额。
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

      {/* AccessKey ID 输入部分 */}
      <Section header={<Text>AccessKey ID</Text>}>
        <TextField
          title="AccessKey ID"
          value={accessKeyId}
          onChanged={setAccessKeyId}
          prompt="LTAIxxxxxxxxxxxxxxxxxxxx"
        />
        <Text foregroundStyle="systemGray2" font="caption">
          请输入您的阿里云 AccessKey ID。通常以 "LTAI" 开头，长度为16-32个字符。
        </Text>
      </Section>

      {/* AccessKey Secret 输入部分 */}
      <Section header={<Text>AccessKey Secret</Text>}>
        <SecureField
          title="AccessKey Secret"
          value={accessKeySecret}
          onChanged={setAccessKeySecret}
          prompt="输入您的 AccessKey Secret"
        />
        <Text foregroundStyle="systemGray2" font="caption">
          请输入您的阿里云 AccessKey Secret。长度为30-40个字符。
        </Text>
      </Section>

      {/* 地区选择部分 */}
      <Section header={<Text>地区选择</Text>}>
        <Text foregroundStyle="systemGray" font="body">
          当前地区: {getAliyunRegionName(regionId)}
        </Text>
        <Text foregroundStyle="systemGray2" font="caption">
          选择您的阿里云账户所在地区：
        </Text>
        <Picker
          value={regionId}
          onChanged={setRegionId}
          pickerStyle="automatic"
          title="选择地区"
        >
          {ALIYUN_SUPPORTED_REGIONS.map((region) => (
            <Text key={region.id} tag={region.id}>
              {region.name}
            </Text>
          ))}
        </Picker>
      </Section>

      {/* 操作按钮部分 */}
      <Section>
        <Button
          title={`保存 ${apiConfig.name} 凭据`}
          systemImage="checkmark.circle.fill"
          action={handleSave}
        />

        <Button
          title={`清除 ${apiConfig.name} 凭据`}
          systemImage="trash"
          buttonStyle="plain"
          foregroundStyle="systemRed"
          action={handleClear}
        />
      </Section>

      {/* 使用说明部分 */}
      <Section header={<Text>使用说明</Text>}>
        <Text foregroundStyle="systemGray" font="body">
          1. 访问阿里云控制台: {apiConfig.consoleUrl}
        </Text>
        <Text foregroundStyle="systemGray" font="body">
          2. 登录您的阿里云账户
        </Text>
        <Text foregroundStyle="systemGray" font="body">
          3. 进入 RAM 访问控制 > 用户
        </Text>
        <Text foregroundStyle="systemGray" font="body">
          4. 创建 AccessKey 或使用现有密钥
        </Text>
        <Text foregroundStyle="systemGray" font="body">
          5. 复制 AccessKey ID 和 Secret 并在此保存
        </Text>

        <Button title="打开阿里云控制台" systemImage="safari" action={openConsole} />
      </Section>

      {/* 状态信息部分 */}
      <Section header={<Text>当前状态</Text>}>
        <Text foregroundStyle="systemGray" font="body">
          存储状态:{" "}
          {hasSavedKey
            ? `✓ 已保存 ${apiConfig.name} 凭据`
            : `✗ 未保存 ${apiConfig.name} 凭据`}
        </Text>
        <Text foregroundStyle="systemGray" font="body">
          AccessKey ID 长度: {accessKeyId.length} 个字符
        </Text>
        <Text foregroundStyle="systemGray" font="body">
          AccessKey Secret 长度: {accessKeySecret.length} 个字符
        </Text>
        <Text foregroundStyle="systemGray" font="body">
          当前地区: {getAliyunRegionName(regionId)}
        </Text>
      </Section>
    </Form>
  );

  // 渲染其他API设置界面
  const renderOtherApiSettings = () => (
    <Form navigationTitle={`${apiConfig.displayName} 设置`}>
      {/* 说明部分 */}
      <Section header={<Text font="headline">API 密钥设置</Text>}>
        <Text foregroundStyle="systemGray" font="body">
          在此设置您的 {apiConfig.name} API 密钥。密钥将安全保存并可在桌面小组件中使用。
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
          title={`${apiConfig.displayName} API 密钥`}
          value={apiKey}
          onChanged={setApiKey}
          prompt={
            apiConfig.keyPrefix
              ? `${apiConfig.keyPrefix}xxxxxxxxxxxxxxxxxxxxxxxx`
              : "输入您的API密钥"
          }
        />

        <Text foregroundStyle="systemGray2" font="caption">
          {apiConfig.keyPrefix
            ? `请输入您的 ${apiConfig.name} API 密钥。密钥以 "${apiConfig.keyPrefix}" 开头。`
            : `请输入您的 ${apiConfig.name} API 密钥。`}
        </Text>
      </Section>

      {/* 操作按钮部分 */}
      <Section>
        <Button
          title={`保存 ${apiConfig.name} API 密钥`}
          systemImage="checkmark.circle.fill"
          action={handleSave}
        />

        <Button
          title={`清除 ${apiConfig.name} API 密钥`}
          systemImage="trash"
          buttonStyle="plain"
          foregroundStyle="systemRed"
          action={handleClear}
        />
      </Section>

      {/* 使用说明部分 */}
      <Section header={<Text>使用说明</Text>}>
        <Text foregroundStyle="systemGray" font="body">
          1. 访问 {apiConfig.name} 控制台: {apiConfig.consoleUrl}
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
          5. 复制密钥并在此保存
        </Text>

        <Button title={`打开 ${apiConfig.name} 控制台`} systemImage="safari" action={openConsole} />
      </Section>

      {/* 状态信息部分 */}
      <Section header={<Text>当前状态</Text>}>
        <Text foregroundStyle="systemGray" font="body">
          存储状态:{" "}
          {hasSavedKey
            ? `✓ 已保存 ${apiConfig.name} API 密钥`
            : `✗ 未保存 ${apiConfig.name} API 密钥`}
        </Text>
        <Text foregroundStyle="systemGray" font="body">
          输入框密钥长度: {apiKey.length} 个字符
        </Text>
        {apiConfig.keyPrefix && (
          <Text foregroundStyle="systemGray" font="body">
            输入框格式验证:{" "}
            {apiKey.startsWith(apiConfig.keyPrefix)
              ? "✓ 格式正确"
              : `⚠ 需要以 "${apiConfig.keyPrefix}" 开头`}
          </Text>
        )}
      </Section>
    </Form>
  );

  return apiConfig.id === 'aliyun' ? renderAliyunSettings() : renderOtherApiSettings();
}

// 导出展示函数
export function showAIApiSettings() {
  // 在显示设置页面之前，验证存储访问是否正常
  try {
    Storage.get<string>(SUPPORTED_APIS[0]?.storageKey || "", STORAGE_OPTIONS);
    console.log("存储访问正常");
  } catch (error) {
    console.error("存储访问失败:", error);
  }

  Navigation.present(<AIApiList />);
}

// 默认显示主页面
showAIApiSettings();

// 导出组件
export default AIApiList;