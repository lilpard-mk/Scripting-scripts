// AI API 余额桌面小组件
// 支持多个AI API的余额查询
// 从共享存储读取API密钥并显示余额信息
// 注意：小组件是一次性渲染的，不支持 React Hooks 和交互状态

import { Image, Button, VStack, HStack, Text, fetch, Widget, SVG, Path, Script } from "scripting";

import {
  STORAGE_OPTIONS,
  getApiConfig,
  DEEPSEEK_API_CONFIG,
  AIApiConfig,
  ALIYUN_API_CONFIG,
  ALIYUN_API_VERSION,
  ALIYUN_API_ACTION,
  ALIYUN_SIGNATURE_METHOD,
  ALIYUN_SIGNATURE_VERSION,
  AliyunCredentials,
  getAliyunEndpointForRegion,
  CURRENCY_SYMBOLS
} from "./constants";
import { MyIntent } from "./app_intents";

// 阿里云签名辅助函数
function percentEncode(value: string): string {
  // 对字符串进行百分比编码，遵循RFC 3986
  // 注意：这里简化实现，实际应更严格
  return encodeURIComponent(value)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

// 生成阿里云API签名
async function generateAliyunSignature(
  accessKeyId: string,
  accessKeySecret: string,
  regionId: string,
  action: string = ALIYUN_API_ACTION
): Promise<{
  url: string;
  headers: Record<string, string>;
}> {
  // 构建公共参数
  const params: Record<string, string> = {
    AccessKeyId: accessKeyId,
    Action: action,
    Format: 'JSON',
    RegionId: regionId,
    SignatureMethod: ALIYUN_SIGNATURE_METHOD,
    SignatureNonce: Date.now().toString() + Math.random().toString().substring(2, 8),
    SignatureVersion: ALIYUN_SIGNATURE_VERSION,
    Timestamp: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), // ISO8601格式
    Version: ALIYUN_API_VERSION,
  };

  // 按参数名排序
  const sortedKeys = Object.keys(params).sort();

  // 构建规范化的查询字符串
  const canonicalizedQueryString = sortedKeys
    .map(key => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join('&');

  // 构建待签名字符串
  const stringToSign = `GET&${percentEncode('/')}&${percentEncode(canonicalizedQueryString)}`;

  // 计算HMAC-SHA1签名
  const keyData = Data.fromString(accessKeySecret + '&');
  const stringToSignData = Data.fromString(stringToSign);
  const hmacResult = Crypto.hmacSHA1(stringToSignData, keyData);
  const signature = hmacResult.toBase64String();

  // 将签名添加到参数中
  const signedParams = { ...params, Signature: signature };

  // 构建最终URL
  const endpoint = getAliyunEndpointForRegion(regionId);
  const queryString = Object.keys(signedParams)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(signedParams[key])}`)
    .join('&');
  const url = `${endpoint}/?${queryString}`;

  return {
    url,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };
}

// API余额数据接口
interface BalanceInfo {
  apiId: string;
  apiName: string;
  amount: number;
  currency: string;
  limit?: number;
  usage?: number;
  limitRemaining?: number;
  isFreeTier?: boolean;
  error?: string;
  lastUpdated: Date | null;
}

// DeepSeek余额解析
function parseDeepSeekBalance(data: any): BalanceInfo | null {
  if (
    !data?.balance_infos ||
    !Array.isArray(data.balance_infos) ||
    data.balance_infos.length === 0
  ) {
    return null;
  }

  const mainBalance = data.balance_infos[0];
  if (!mainBalance || typeof mainBalance.total_balance === "undefined") {
    return null;
  }

  const amount =
    typeof mainBalance.total_balance === "number"
      ? mainBalance.total_balance
      : parseFloat(mainBalance.total_balance) || 0;

  return {
    apiId: DEEPSEEK_API_CONFIG.id,
    apiName: DEEPSEEK_API_CONFIG.displayName,
    amount,
    currency: getCurrencySymbol(mainBalance.currency || "USD"),
    lastUpdated: new Date(),
  };
}

// OpenRouter余额解析（根据搜索到的API文档）
function parseOpenRouterBalance(data: any): BalanceInfo | null {
  if (!data?.data) {
    return null;
  }

  const apiData = data.data;
  const limit = apiData.total_credits || 0;
  const usage = apiData.total_usage || 0;
  const limitRemaining = apiData.limit_remaining || limit - usage;
  const isFreeTier = apiData.is_free_tier || false;

  return {
    apiId: "openrouter",
    apiName: "OpenRouter",
    amount: limitRemaining,
    currency: getCurrencySymbol("USD"), // OpenRouter使用美元
    limit,
    usage,
    limitRemaining,
    isFreeTier,
    lastUpdated: new Date(),
  };
}

// 阿里云余额解析
function parseAliyunBalance(data: any): BalanceInfo | null {
  if (!data?.Success) {
    // API返回错误，返回带错误信息的BalanceInfo
    return {
      apiId: ALIYUN_API_CONFIG.id,
      apiName: ALIYUN_API_CONFIG.displayName,
      amount: 0,
      currency: "CNY",
      error: data?.Message || "阿里云API返回失败",
      lastUpdated: new Date(),
    };
  }

  // 检查响应码，非200也视为错误
  if (data?.Code !== "200") {
    return {
      apiId: ALIYUN_API_CONFIG.id,
      apiName: ALIYUN_API_CONFIG.displayName,
      amount: 0,
      currency: "CNY",
      error: data?.Message || `阿里云API错误: ${data?.Code}`,
      lastUpdated: new Date(),
    };
  }

  const balanceData = data.Data;
  if (!balanceData) {
    return {
      apiId: ALIYUN_API_CONFIG.id,
      apiName: ALIYUN_API_CONFIG.displayName,
      amount: 0,
      currency: "CNY",
      error: "阿里云API返回数据为空",
      lastUpdated: new Date(),
    };
  }

  // 根据阿里云API文档，返回字段包括：
  // AvailableAmount: 可用余额
  // CreditAmount: 信用额度
  // MybankCreditAmount: 网商银行信用额度
  // Currency: 货币类型
  // AvailableCashAmount: 可用现金余额
  // QuotaLimit: 配额限制
  const availableAmount = parseFloat(balanceData.AvailableAmount || "0");
  const currency = balanceData.Currency || "CNY";
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  return {
    apiId: ALIYUN_API_CONFIG.id,
    apiName: ALIYUN_API_CONFIG.displayName,
    amount: availableAmount,
    currency: currencySymbol,
    lastUpdated: new Date(),
  };
}

// 查询API余额
async function fetchApiBalance(apiConfig: any, apiKey: string): Promise<BalanceInfo | null> {
  try {
    if (apiConfig.id === "aliyun") {
      // 阿里云：解析JSON凭据
      let credentials: AliyunCredentials;
      try {
        credentials = JSON.parse(apiKey);
      } catch (parseError) {
        return {
          apiId: apiConfig.id,
          apiName: apiConfig.displayName,
          amount: 0,
          currency: "CNY",
          error: "无效的阿里云凭据格式",
          lastUpdated: null,
        };
      }

      // 生成签名请求
      const { url, headers } = await generateAliyunSignature(
        credentials.accessKeyId,
        credentials.accessKeySecret,
        credentials.regionId
      );

      const response = await fetch(url, {
        method: "GET",
        headers,
        timeout: 30,
      });

      if (response.ok) {
        const data = await response.json();
        return parseAliyunBalance(data);
      } else {
        const errorText = await response.text();
        return {
          apiId: apiConfig.id,
          apiName: apiConfig.displayName,
          amount: 0,
          currency: "CNY",
          error: `阿里云API错误: ${response.status} - ${errorText.substring(0, 50)}`,
          lastUpdated: null,
        };
      }
    } else {
      // 其他API：使用Bearer Token认证
      const response = await fetch(apiConfig.apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30, // 30秒超时
      });

      if (response.ok) {
        const data = await response.json();

        // 根据API类型解析数据
        switch (apiConfig.id) {
          case "deepseek":
            return parseDeepSeekBalance(data);
          case "openrouter":
            return parseOpenRouterBalance(data);
          default:
            console.error(`未知API类型: ${apiConfig.id}`);
            return {
              apiId: apiConfig.id,
              apiName: apiConfig.displayName,
              amount: 0,
              currency: "USD",
              error: `不支持的API类型: ${apiConfig.id}`,
              lastUpdated: new Date(),
            };
        }
      } else {
        const errorText = await response.text();
        return {
          apiId: apiConfig.id,
          apiName: apiConfig.displayName,
          amount: 0,
          currency: "USD",
          error: `API错误: ${response.status} - ${errorText.substring(0, 50)}`,
          lastUpdated: null,
        };
      }
    }
  } catch (err) {
    return {
      apiId: apiConfig.id,
      apiName: apiConfig.displayName,
      amount: 0,
      currency: getCurrencySymbol("USD"),
      error: err instanceof Error ? `网络错误: ${err.message}` : "未知网络错误",
      lastUpdated: null,
    };
  }
}

// 获取货币符号
function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    CNY: "¥",
    RMB: "¥",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
  };
  return symbols[currency] || currency;
}

// 格式化时间
function formatTime(date: Date | null): string {
  if (!date) return "从未更新";
  return date.toLocaleString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 简洁的小组件组件
function AIApiBalanceWidget({
  balance,
  lastRefresh = null,
}: {
  balance: BalanceInfo;
  lastRefresh?: Date | null;
}) {
  // 如果没有数据
  if (!balance) {
    return (
      <VStack spacing={8} padding={0} alignment="center">
        <Text font="body" foregroundStyle="systemGray">
          未找到API数据
        </Text>
      </VStack>
    );
  }

  // 获取logo（如果有）
  const apiConfig = getApiConfig(balance.apiId);
  // const logoBase64 = apiConfig?.logoBase64;
  // const imageData = logoBase64 ? UIImage.fromBase64String(logoBase64) : undefined;
  // const thumb = imageData?.renderedIn({ width: 78, height: 16.5 }) || undefined;
  const svgPath = apiConfig?.logoSvgPath;
  const logoHeight = apiConfig?.logoHeight || 18
  const logoPadding = apiConfig?.logoPadding ?? 6
  const overrideColor = apiConfig?.overrideColor ?? false
  const colorType = typeof overrideColor

  return (
    <VStack spacing={12} padding={0} alignment="center">
      {/* API名称和logo */}
      <HStack spacing={8} alignment="center">
        {svgPath ? (
          <SVG
            filePath={Path.join(Script.directory, svgPath)}
            scaleToFit
            resizable
            frame={{ height: logoHeight }}
            renderingMode={overrideColor ? "template" : 'original'}
            antialiased={true}
            padding={{ top: logoPadding }}
            foregroundStyle={colorType === 'string' ? overrideColor : undefined}
          />
        ) : null}
        <Button buttonStyle="plain" intent={MyIntent(5)}>
          <Image systemName="arrow.clockwise" />
        </Button>
      </HStack>

      {/* 主要内容区域 */}
      <VStack spacing={12} alignment="leading">
        {/* 错误状态 */}
        {balance.error ? (
          <VStack spacing={8} alignment="leading">
            <Text font="body" foregroundStyle="systemRed" multilineTextAlignment="leading">
              {balance.error.length > 30 ? `${balance.error.substring(0, 30)}...` : balance.error}
            </Text>
          </VStack>
        ) : balance.error === "未设置API密钥" ? (
          /* 未设置API密钥状态 */
          <VStack spacing={12} alignment="leading">
            <Text font="body" foregroundStyle="systemGray" multilineTextAlignment="leading">
              请先设置API密钥
            </Text>
          </VStack>
        ) : balance.amount ? (
          /* 余额显示状态 */
          <VStack spacing={16} alignment="leading">
            {/* 余额数字 */}
            <VStack spacing={4} alignment="leading">
              <Text font="caption" foregroundStyle="systemGray" multilineTextAlignment="leading">
                可用余额
              </Text>
              <HStack spacing={4} alignment="firstTextBaseline">
                <Text font="largeTitle">
                  {balance.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
                <Text font="body" foregroundStyle="systemGray">
                  {balance.currency}
                </Text>
              </HStack>
            </VStack>

            {/* 更新时间 */}
            {balance.lastUpdated && (
              <Text font="caption2" foregroundStyle="systemGray2">
                更新于 {formatTime(balance.lastUpdated)}
              </Text>
            )}
          </VStack>
        ) : (
          /* 无数据状态 */
          <VStack spacing={12} alignment="leading">
            <Text font="body" foregroundStyle="systemGray" multilineTextAlignment="leading">
              暂无余额数据
            </Text>
          </VStack>
        )}
      </VStack>
    </VStack>
  );
}

// 根据参数获取指定的API配置
function getTargetApiConfig(): AIApiConfig | undefined {
  const param = Widget.parameter;
  console.log("Widget参数值:", param);

  // 参数1: DeepSeek, 参数2: OpenRouter, 参数3: 阿里云
  if (param === "1") {
    console.log("选择DeepSeek API");
    return getApiConfig("deepseek");
  } else if (param === "2") {
    console.log("选择OpenRouter API");
    return getApiConfig("openrouter");
  } else if (param === "3") {
    console.log("选择阿里云 API");
    return getApiConfig("aliyun");
  } else {
    // 默认使用DeepSeek
    console.log("参数无效或未设置，默认使用DeepSeek API");
    return getApiConfig("deepseek");
  }
}

// 小组件入口
// 在渲染前同步获取指定API的数据，只渲染一次

(async () => {
  const lastRefresh = new Date();

  // 根据Widget.parameter获取目标API配置
  const targetApiConfig = getTargetApiConfig();

  if (!targetApiConfig) {
    console.error("未找到指定的API配置");
    Widget.present(
      <VStack spacing={8} padding={0} alignment="center">
        <Image
          systemName="exclamationmark.triangle"
          font="largeTitle"
          foregroundStyle="systemRed"
        />
        <Text font="body" foregroundStyle="systemGray" multilineTextAlignment="center">
          未找到API配置
        </Text>
        <Text font="caption2" foregroundStyle="systemGray2">
          请检查Widget参数设置
        </Text>
      </VStack>,
      {
        policy: "after",
        date: new Date(Date.now() + 5 * 60 * 1000),
      }
    );
    return;
  }

  let balanceInfo: BalanceInfo | null = null;

  try {
    // 尝试读取API密钥
    const apiKey = Storage.get<string>(targetApiConfig.storageKey, STORAGE_OPTIONS);

    if (apiKey) {
      // 有密钥，查询余额
      balanceInfo = await fetchApiBalance(targetApiConfig, apiKey);
    } else {
      // 未设置密钥
      balanceInfo = {
        apiId: targetApiConfig.id,
        apiName: targetApiConfig.displayName,
        amount: 0,
        currency: "USD",
        error: "未设置API密钥",
        lastUpdated: null,
      };
    }
  } catch (error) {
    // 读取密钥失败
    balanceInfo = {
      apiId: targetApiConfig.id,
      apiName: targetApiConfig.displayName,
      amount: 0,
      currency: "USD",
      error: "读取密钥失败",
      lastUpdated: null,
    };
  }

  // 渲染最终结果（只渲染一次）
  if (balanceInfo) {
    return Widget.present(<AIApiBalanceWidget balance={balanceInfo} lastRefresh={lastRefresh} />);
  }

  throw new Error("未找到API配置");
})().catch((e) => {
  Widget.present(<Text>{String(e)}</Text>);
});

// 导出视图组件供其他用途使用
export default AIApiBalanceWidget;
