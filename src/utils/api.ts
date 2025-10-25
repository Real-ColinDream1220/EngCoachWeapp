import Taro from '@tarojs/taro'

// API基础配置
const BASE_URL = 'https://t.aix101.com'
const API_BASE_URL = 'https://api.aix101.com'

// 通用请求接口
interface ApiResponse<T = any> {
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
const request = async <T = any>(config: RequestConfig): Promise<ApiResponse<T>> => {
  const { url, method = 'GET', data, params, headers = {} } = config
  
  console.log('API请求开始:', {
    url,
    method,
    params,
    data,
    baseUrl: BASE_URL
  })
  
  // 获取token - 直接使用静态token
  const staticToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBZG1MdiI6MCwiQXBwaWQiOiIiLCJBdXRob3JpdHlJZCI6IiIsIkJpZCI6MSwiSUQiOjY5MCwiTWFwQ2xhaW1zIjpudWxsLCJSb2xlIjoiUCIsIlN0YWZmSWQiOjAsIlN1YiI6IiIsIlRlc3RlciI6MCwiVVVJRCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsIlVpZEhhc2giOiIxMDA2OTAiLCJleHAiOjE3NjMwMjkxMzAsIm9yaWdfaWF0IjoxNzYwNDM3MTMwfQ.Qzo74V7KHk1KfRre3RFPVW1QvSuqYaCa5WlALvpVCnw'
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

// 流式请求配置接口
interface StreamRequestConfig {
  url: string
  method?: 'POST'
  data?: any
  headers?: Record<string, string>
  onMessage?: (chunk: string) => void
  onComplete?: () => void
  onError?: (error: any) => void
}

// 流式请求函数（用于 SSE 或流式响应）
const streamRequest = async (config: StreamRequestConfig): Promise<void> => {
  const { url, method = 'POST', data, headers = {}, onMessage, onComplete, onError } = config
  
  console.log('流式请求开始:', {
    url,
    method,
    data,
    baseUrl: BASE_URL
  })
  
  // 获取token
  const staticToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBZG1MdiI6MCwiQXBwaWQiOiIiLCJBdXRob3JpdHlJZCI6IiIsIkJpZCI6MSwiSUQiOjY5MCwiTWFwQ2xhaW1zIjpudWxsLCJSb2xlIjoiUCIsIlN0YWZmSWQiOjAsIlN1YiI6IiIsIlRlc3RlciI6MCwiVVVJRCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsIlVpZEhhc2giOiIxMDA2OTAiLCJleHAiOjE3NjMwMjkxMzAsIm9yaWdfaWF0IjoxNzYwNDM3MTMwfQ.Qzo74V7KHk1KfRre3RFPVW1QvSuqYaCa5WlALvpVCnw'
  const storageToken = Taro.getStorageSync('token')
  const token = storageToken || staticToken
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  // 构建完整URL
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
  
  try {
    // 注意：Taro 的 request API 不直接支持流式响应
    // 这里使用普通请求，服务端应该返回完整的流式数据或分块数据
    const response = await Taro.request({
      url: fullUrl,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...headers
      },
      responseType: 'text' // 获取文本响应以便处理流式数据
    })
    
    console.log('流式响应:', response)
    
    // 处理响应数据
    if (response.statusCode === 200 && response.data) {
      const text = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
      
      // 按行分割处理 SSE 格式数据
      const lines = text.split('\n')
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        
        // 处理 data: 行
        if (trimmedLine.startsWith('data:')) {
          const jsonStr = trimmedLine.substring(5).trim() // 去掉 "data:" 前缀
          
          // 检查是否是结束标记
          if (jsonStr === '[DONE]') {
            continue
          }
          
          // 尝试解析 JSON
          try {
            const jsonData = JSON.parse(jsonStr)
            
            // 提取 content 字段
            if (jsonData.content && onMessage) {
              onMessage(jsonData.content)
            }
          } catch (e) {
            console.warn('解析 JSON 失败:', jsonStr, e)
          }
        }
      }
      
      if (onComplete) {
        onComplete()
      }
    } else {
      throw new Error(`请求失败: ${response.statusCode}`)
    }
  } catch (error) {
    console.error('流式请求失败:', error)
    if (onError) {
      onError(error)
    }
    throw error
  }
}

// 年级相关接口
export const gradeAPI = {
  // 获取年级列表
  getGrades: (params?: { stage_id?: number; division?: string }) => {
    return request({
      url: '/api/xkw/grades',
      method: 'GET',
      params
    })
  }
}

// 课程相关接口
export const courseAPI = {
  // 获取所有课程（英语学科固定为3）
  getAllCourses: (grade_id?: number) => {
    return request({
      url: '/api/xkw/course_all',
      method: 'GET',
      params: { grade_id }
    })
  }
}

// 难度相关接口
export const difficultyAPI = {
  // 获取难度等级列表
  getDifficulties: () => {
    return request({
      url: '/api/xkw/difficulties',
      method: 'GET',
      params: {}
    })
  }
}

// 教材版本相关接口
export const textbookVersionAPI = {
  // 获取教材版本列表（英语学科固定为3）
  getTextbookVersions: (course_id: number = 3) => {
    return request({
      url: '/api/xkw/textbook_versions',
      method: 'GET',
      params: { course_id }
    })
  }
}

// 教材相关接口
export const textbookAPI = {
  // 获取教材列表（英语学科固定为3）
  getTextbooks: (grade_id: number, version_id: number, page_index: number = 1, page_size: number = 100) => {
    return request({
      url: '/api/xkw/textbooks',
      method: 'GET',
      params: { 
        course_id: 3, // 英语学科固定为3
        grade_id,
        page_index,
        page_size,
        version_id
      }
    })
  }
}

// 章节相关接口
export const catalogAPI = {
  // 获取课程目录
  getCatalog: (textbook_id: string) => {
    return request({
      url: '/api/xkw/catalog',
      method: 'GET',
      params: { textbook_id }
    })
  },
  
  // 获取课程目录与知识点映射
  getCatalogKpointMap: (catalog_ids: number[], textbook_id: number, version_id: number) => {
    return request({
      url: '/api/xkw/catalog_kpoint_map',
      method: 'GET',
      params: { 
        ...(catalog_ids.length > 0 && { catalog_ids: catalog_ids.join(',') }),
        textbook_id,
        version_id
      }
    })
  }
}

// 题型相关接口
export const questionTypeAPI = {
  // 获取题目类型列表（英语学科固定为3）
  getQuestionTypes: (course_id: number = 3) => {
    return request({
      url: '/api/xkw/question_types',
      method: 'GET',
      params: { course_id }
    })
  }
}

// 智能出题相关接口
export const smartQuestionAPI = {
  // 生成智能试卷
  generatePaper: (params: {
    grade_id: number
    class_id: number
    course_id: number
    difficulty_id: number
    question_count: number
    knowledge_points: number[]
    question_types?: string[]
    mode: 'auto' | 'manual'
  }) => {
    return request({
      url: '/api/xkw/generate_paper',
      method: 'POST',
      data: params
    })
  }
}

// AI 聊天相关接口
export const aiChatAPI = {
  // 创建或编辑会话主题
  topicEdit: () => {
    return request({
      url: '/api/ai/chat/topic_edit',
      method: 'POST',
      data: {
        agent_id: 5778,
        title: '英语口语教练'
      }
    })
  },
  
  // 流式聊天补全
  completions: (params: {
    tid: number
    text: string
    onMessage?: (chunk: string) => void
    onComplete?: () => void
    onError?: (error: any) => void
  }) => {
    const { tid, text, onMessage, onComplete, onError } = params
    
    return streamRequest({
      url: '/api/ai/chat/completions',
      method: 'POST',
      data: {
        tid,
        text,
        files: [],
        agent_id: 5778,
        ai_config: {
          agent_id: 5778
        },
        knowledge_id: 284,
        reset_id: 0,
        device_id: '107b41',
        dh_config_id: 1006
      },
      onMessage,
      onComplete,
      onError
    })
  }
}

export default {
  gradeAPI,
  courseAPI,
  difficultyAPI,
  textbookVersionAPI,
  textbookAPI,
  catalogAPI,
  questionTypeAPI,
  smartQuestionAPI,
  aiChatAPI
}
