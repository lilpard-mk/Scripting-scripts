// DeepSeek 余额桌面小组件
// 从共享存储读取 API 密钥并显示余额信息
// 注意：小组件是一次性渲染的，不支持 React Hooks 和交互状态

import {
    Image,
    Button,
    VStack,
    HStack,
    Text,
    fetch,
    Widget
} from "scripting"

import {STORAGE_KEY, STORAGE_OPTIONS, DEEPSEEK_API_URL, LOGO_IMG_BASE64} from "./constants"
import { MyIntent } from "./app_intents";

// 获取主要余额（简化显示）
function getMainBalance(balanceInfos: any[]): { amount: number; currency: string } | null {
    if (!balanceInfos || !Array.isArray(balanceInfos) || balanceInfos.length === 0) return null

    // 获取第一个余额信息
    const mainBalance = balanceInfos[0]
    if (!mainBalance || typeof mainBalance.total_balance === 'undefined') return null

    // 确保金额是数字类型
    const amount = typeof mainBalance.total_balance === 'number'
        ? mainBalance.total_balance
        : parseFloat(mainBalance.total_balance) || 0

    return {
        amount,
        currency: mainBalance.currency || 'USD'
    }
}

// 获取货币符号
function getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
        'USD': '$',
        'CNY': '¥',
        'RMB': '¥',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥'
    }
    return symbols[currency] || currency
}

// 格式化时间（简洁显示）
function formatTime(date: Date): string {
    return date.toLocaleString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit"
    })
}

// 余额显示桌面小组件（无状态版本）
// 所有数据都在渲染前获取，组件只负责显示
function DeepSeekBalanceWidget({
                                   apiKey,
                                   balanceData,
                                   error,
                                   lastUpdated
                               }: {
    apiKey?: string | null
    balanceData?: any
    error?: string | null
    lastUpdated?: Date | null
}) {
    // 计算主要余额信息
    const mainBalance = balanceData?.balance_infos ? getMainBalance(balanceData.balance_infos) : null
    const currencySymbol = mainBalance ? getCurrencySymbol(mainBalance.currency) : "$"
    const imageData = UIImage.fromBase64String(LOGO_IMG_BASE64)
    const thumb = imageData?.renderedIn({ width: 78, height: 16.5 })

    return (
        <VStack spacing={16} padding={0}>
            {/* 顶部栏：品牌logo */}
            <HStack alignment="center" distribution="center">
                {/* 品牌logo */}
                <HStack spacing={16} alignment="center">
                    <HStack alignment="center">
                        <Image image={thumb} />
                    </HStack>
                    <Button
                        buttonStyle="plain"
                        intent={MyIntent(5)}
                    >
                        <Image systemName="arrow.clockwise" />
                    </Button>
                </HStack>
            </HStack>

            {/* 主要内容区域 */}
            <VStack spacing={12} alignment="leading">
                {/* 错误状态 */}
                {error ? (
                    <VStack spacing={8} alignment="leading">
                        <Text systemImage="exclamationmark.triangle" font="largeTitle" foregroundStyle="systemRed"/>
                        <Text font="body" foregroundStyle="systemRed" multilineTextAlignment="leading">
                            {error.length > 30 ? `${error.substring(0, 30)}...` : error}
                        </Text>
                    </VStack>
                ) : !apiKey ? (
                    /* 未设置API密钥状态 */
                    <VStack spacing={12} alignment="leading">
                        <Text systemImage="key.slash" font="largeTitle" foregroundStyle="systemOrange"/>
                        <Text font="body" foregroundStyle="systemGray" multilineTextAlignment="leading">
                            请先设置API密钥
                        </Text>
                    </VStack>
                ) : mainBalance ? (
                    /* 余额显示状态 */
                    <VStack spacing={16} alignment="leading">
                        {/* 余额数字 */}
                        <VStack spacing={4} alignment="leading">
                            <Text font="caption" foregroundStyle="systemGray" multilineTextAlignment="leading">
                                可用余额
                            </Text>
                            <HStack spacing={4} alignment="firstTextBaseline">
                                <Text font="largeTitle">
                                    {mainBalance.amount.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </Text>
                                <Text font="body" foregroundStyle="systemGray">
                                    {currencySymbol}
                                </Text>
                            </HStack>
                        </VStack>

                        {/* 更新时间 */}
                        {lastUpdated && (
                            <Text font="caption2" foregroundStyle="systemGray2">
                                更新于 {formatTime(lastUpdated)}
                            </Text>
                        )}
                    </VStack>
                ) : (
                    /* 无数据状态 */
                    <VStack spacing={12} alignment="leading">
                        <Text systemImage="dollarsign.circle" font="largeTitle" foregroundStyle="systemGray"/>
                        <Text font="body" foregroundStyle="systemGray" multilineTextAlignment="leading">
                            暂无余额数据
                        </Text>
                    </VStack>
                )}
            </VStack>
        </VStack>
    )
}

// 查询余额（同步包装异步操作）
async function fetchBalanceData(apiKey: string): Promise<{
    balanceData: any,
    error: string | null,
    lastUpdated: Date | null
}> {
    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            timeout: 30 // 30 秒超时
        })

        if (response.ok) {
            const data = await response.json()
            return {
                balanceData: data,
                error: null,
                lastUpdated: new Date()
            }
        } else {
            const errorText = await response.text()
            return {
                balanceData: null,
                error: `API 错误: ${response.status} - ${errorText}`,
                lastUpdated: null
            }
        }
    } catch (err) {
        return {
            balanceData: null,
            error: err instanceof Error ? `网络错误: ${err.message}` : "未知网络错误",
            lastUpdated: null
        }
    }
}

// 小组件入口
// 在渲染前同步获取所有数据，只渲染一次
async function main() {
    let apiKey: string | null = null
    let balanceData: any = null
    let error: string | null = null
    let lastUpdated: Date | null = null

    try {
        // 1. 读取 API 密钥
        apiKey = Storage.get<string>(STORAGE_KEY, STORAGE_OPTIONS)
        console.log("小组件读取到API密钥:", apiKey ? `长度: ${apiKey.length}` : "未找到")
    } catch (storageError) {
        console.error("读取API密钥失败:", storageError)
        error = "读取存储失败"
    }

    // 2. 如果有 API 密钥，获取余额数据
    if (apiKey && !error) {
        const result = await fetchBalanceData(apiKey)
        balanceData = result.balanceData
        error = result.error
        lastUpdated = result.lastUpdated
    }

    // 3. 渲染最终结果（只渲染一次）
    Widget.present(<DeepSeekBalanceWidget
        apiKey={apiKey}
        balanceData={balanceData}
        error={error}
        lastUpdated={lastUpdated}
    />, {
        policy: "after",
        date: new Date(Date.now() + 5 * 60 * 1000) // 5分钟后刷新
    })
}

// 启动主函数
main()

// 导出视图组件供其他用途使用
export default DeepSeekBalanceWidget