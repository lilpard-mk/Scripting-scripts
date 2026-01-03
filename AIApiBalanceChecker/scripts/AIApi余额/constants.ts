// AI API 余额检查器 - 多API支持配置
// 支持DeepSeek、OpenRouter等AI API的余额查询

import { Color } from "scripting"

// 存储选项 - 迁移到私有存储
export const STORAGE_OPTIONS = { shared: false }
// 旧的存储选项 - 用于从公共存储迁移数据
export const OLD_STORAGE_OPTIONS = { shared: true }

// AI API 类型定义
export interface AIApiConfig {
  id: string
  name: string
  displayName: string
  storageKey: string
  apiUrl: string
  consoleUrl: string
  keyPrefix?: string  // 密钥前缀验证，如"sk-" for DeepSeek
  keyMinLength?: number // 密钥最小长度
  logoBase64?: string // 品牌logo base64
  logoSvgPath?: string
  logoHeight?: number
  logoPadding?: number
  overrideColor?: boolean | Color
  description: string // API描述
}

// DeepSeek API配置
export const DEEPSEEK_API_CONFIG: AIApiConfig = {
  id: 'deepseek',
  name: 'DeepSeek',
  displayName: 'DeepSeek API',
  storageKey: 'deepseek_api_key',
  apiUrl: 'https://api.deepseek.com/user/balance',
  consoleUrl: 'https://platform.deepseek.com',
  keyPrefix: 'sk-',
  keyMinLength: 20,
  logoSvgPath: 'icons/DeepSeek.svg',
  overrideColor: '#4D6BFE',
  description: 'DeepSeek AI API密钥，用于查询余额和调用AI服务。在桌面小组件中设置参数值为1显示此API余额。',
}

// OpenRouter API配置（根据搜索到的信息）
export const OPENROUTER_API_CONFIG: AIApiConfig = {
  id: 'openrouter',
  name: 'OpenRouter',
  displayName: 'OpenRouter API',
  storageKey: 'openrouter_api_key',
  apiUrl: 'https://openrouter.ai/api/v1/credits',
  consoleUrl: 'https://openrouter.ai/keys',
  keyPrefix: 'sk-or-',
  logoSvgPath: 'icons/OpenRouter.svg',
  overrideColor: true,
  description: 'OpenRouter API密钥，用于查询余额和访问多个AI模型。在桌面小组件中设置参数值为2显示此API余额。',
  // keyMinLength: 20, // 留空表示没有最小长度要求
}

// 阿里云配置
export const ALIYUN_API_CONFIG: AIApiConfig = {
  id: 'aliyun',
  name: '阿里云',
  displayName: '阿里云余额',
  storageKey: 'aliyun_api_credentials', // 存储JSON格式的凭据
  apiUrl: 'https://business.aliyuncs.com', // BSS OpenAPI端点
  consoleUrl: 'https://ram.console.aliyun.com/users',
  logoSvgPath: 'icons/Aliyun.svg',
  logoHeight: 20,
  logoPadding: 3,
  description: '阿里云AccessKey ID和Secret，用于查询账户余额。在桌面小组件中设置参数值为3显示此API余额。',
}

// 支持的AI API列表
export const SUPPORTED_APIS: AIApiConfig[] = [
  DEEPSEEK_API_CONFIG,
  OPENROUTER_API_CONFIG,
  ALIYUN_API_CONFIG,
]

// 根据API ID获取配置
export function getApiConfig(apiId: string): AIApiConfig | undefined {
  return SUPPORTED_APIS.find(api => api.id === apiId)
}

// 获取所有API的存储键名
export function getAllStorageKeys(): string[] {
  return SUPPORTED_APIS.map(api => api.storageKey)
}

// 设置页面URL方案
export const SETTINGS_URL_SCHEME = "scripting://run?script=AIApiSettings"

// 默认导出DeepSeek配置（向后兼容）
export const STORAGE_KEY = DEEPSEEK_API_CONFIG.storageKey
export const DEEPSEEK_API_URL = DEEPSEEK_API_CONFIG.apiUrl
export const DEEPSEEK_CONSOLE_URL = DEEPSEEK_API_CONFIG.consoleUrl
export const LOGO_IMG_BASE64 = DEEPSEEK_API_CONFIG.logoBase64

// 阿里云特定配置
export const ALIYUN_API_VERSION = '2017-12-14'
export const ALIYUN_API_ACTION = 'QueryAccountBalance'
export const ALIYUN_SIGNATURE_METHOD = 'HMAC-SHA1'
export const ALIYUN_SIGNATURE_VERSION = '1.0'

// 支持的地区列表
export const ALIYUN_SUPPORTED_REGIONS = [
  { id: 'cn-hangzhou', name: '华东1（杭州）', endpoint: 'business.aliyuncs.com' },
  { id: 'cn-beijing', name: '华北2（北京）', endpoint: 'business.aliyuncs.com' },
  { id: 'cn-shanghai', name: '华东2（上海）', endpoint: 'business.aliyuncs.com' },
  { id: 'cn-shenzhen', name: '华南1（深圳）', endpoint: 'business.aliyuncs.com' },
  { id: 'cn-qingdao', name: '华北1（青岛）', endpoint: 'business.aliyuncs.com' },
  { id: 'cn-zhangjiakou', name: '华北3（张家口）', endpoint: 'business.aliyuncs.com' },
  { id: 'cn-huhehaote', name: '华北5（呼和浩特）', endpoint: 'business.aliyuncs.com' },
  { id: 'cn-wulanchabu', name: '华北6（乌兰察布）', endpoint: 'business.aliyuncs.com' },
  { id: 'cn-chengdu', name: '西南1（成都）', endpoint: 'business.aliyuncs.com' },
  { id: 'cn-hongkong', name: '中国（香港）', endpoint: 'business.aliyuncs.com' },
  { id: 'ap-southeast-1', name: '新加坡', endpoint: 'business.ap-southeast-1.aliyuncs.com' },
  { id: 'ap-northeast-1', name: '日本（东京）', endpoint: 'business.ap-southeast-1.aliyuncs.com' },
  { id: 'ap-southeast-2', name: '澳大利亚（悉尼）', endpoint: 'business.ap-southeast-1.aliyuncs.com' },
  { id: 'ap-southeast-3', name: '马来西亚（吉隆坡）', endpoint: 'business.ap-southeast-1.aliyuncs.com' },
  { id: 'ap-southeast-5', name: '印度尼西亚（雅加达）', endpoint: 'business.ap-southeast-1.aliyuncs.com' },
  { id: 'ap-south-1', name: '印度（孟买）', endpoint: 'business.ap-southeast-1.aliyuncs.com' },
  { id: 'us-west-1', name: '美国（硅谷）', endpoint: 'business.ap-southeast-1.aliyuncs.com' },
  { id: 'us-east-1', name: '美国（弗吉尼亚）', endpoint: 'business.ap-southeast-1.aliyuncs.com' },
  { id: 'eu-west-1', name: '英国（伦敦）', endpoint: 'business.ap-southeast-1.aliyuncs.com' },
  { id: 'eu-central-1', name: '德国（法兰克福）', endpoint: 'business.ap-southeast-1.aliyuncs.com' },
  { id: 'me-east-1', name: '阿联酋（迪拜）', endpoint: 'business.ap-southeast-1.aliyuncs.com' },
]

// 默认地区
export const ALIYUN_DEFAULT_REGION = 'cn-hangzhou'

// 阿里云凭据接口
export interface AliyunCredentials {
  accessKeyId: string
  accessKeySecret: string
  regionId: string
}

// 货币符号映射
export const CURRENCY_SYMBOLS: Record<string, string> = {
  'CNY': '¥',
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'HKD': 'HK$',
  'SGD': 'S$',
  'AUD': 'A$',
  'CAD': 'C$',
  'KRW': '₩',
  'RUB': '₽',
  'INR': '₹',
}

// 获取地区对应的端点
export function getAliyunEndpointForRegion(regionId: string): string {
  const region = ALIYUN_SUPPORTED_REGIONS.find(r => r.id === regionId)
  if (region) {
    return `https://${region.endpoint}`
  }
  return 'https://business.aliyuncs.com'
}

// 获取地区名称
export function getAliyunRegionName(regionId: string): string {
  const region = ALIYUN_SUPPORTED_REGIONS.find(r => r.id === regionId)
  return region ? region.name : regionId
}