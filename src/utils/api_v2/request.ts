import Taro from '@tarojs/taro'

// API基础配置
const BASE_URL = 'https://t.aix101.com'

// 通用请求响应接口
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  result?: T
  message?: string
  status?: string
}

// 请求配置接口
interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  params?: any
  headers?: Record<string, string>
}

// 通用请求函数
export const request = async <T = any>(config: RequestConfig): Promise<ApiResponse<T>> => {
  const { url, method = 'GET', data, params, headers = {} } = config
  
  console.log('API请求开始:', {
    url,
    method,
    params,
    data,
    baseUrl: BASE_URL
  })
  
  // 获取token - 直接使用静态token（口语英语接口专用）
  const staticToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBZG1MdiI6MCwiQXBwaWQiOiIiLCJBdXRob3JpdHlJZCI6IiIsIkJpZCI6MSwiSUQiOjY5MCwiTWFwQ2xhaW1zIjpudWxsLCJSb2xlIjoiUCIsIlN0YWZmSWQiOjAsIlN1YiI6IiIsIlRlc3RlciI6MCwiVVVJRCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsIlVpZEhhc2giOiIxMDA2OTAiLCJleHAiOjE3NjI5MzY5MTQsIm9yaWdfaWF0IjoxNzYwMzQ0OTE0fQ._FNQzq1UxuK8H6G38FmBI-BJjwK-Qr0I14MQUEGwyHM'
  const storageToken = Taro.getStorageSync('token')
  const token = storageToken || staticToken
  
  console.log('存储中的token:', storageToken ? storageToken.substring(0, 20) + '...' : '空')
  console.log('使用的token:', token.substring(0, 20) + '...')
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
    console.log('设置Authorization头:', `Bearer ${token.substring(0, 20)}...`)
  } else {
    console.log('未找到token')
  }
  
  // 构建完整URL
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
  console.log('完整URL:', fullUrl)
  
  try {
    const response = await Taro.request({
      url: fullUrl,
      method,
      data: method === 'GET' ? params : data,
      header: {
        'Content-Type': 'application/json',
        ...headers
      }
    })
    
    console.log('API响应:', {
      status: response.statusCode,
      data: response.data
    })
    
    return response.data as ApiResponse<T>
  } catch (error) {
    console.error('API请求失败:', error)
    throw error
  }
}

