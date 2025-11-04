import Taro from '@tarojs/taro'
import { ApiResponse } from './request'

const BASE_URL = 'https://t.aix101.com'

/**
 * 语音转文字接口响应
 */
export interface Audio2TextResponse {
  text: string  // 识别出的文本
  [key: string]: any  // 其他可能的字段
}

/**
 * 数字人语音转文字API
 */
export const audio2TextAPI = {
  /**
   * 将音频文件转换为文字
   * @param filePath 音频文件路径（本地路径）
   * @returns Promise<string> 返回识别出的文本内容
   */
  recognize: async (filePath: string): Promise<string> => {
    console.log('🎤 开始语音识别，文件路径:', filePath)
    
    // 获取token
    const staticToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBZG1MdiI6MCwiQXBwaWQiOiIiLCJBdXRob3JpdHlJZCI6IiIsIkJpZCI6MSwiSUQiOjY5MCwiTWFwQ2xhaW1zIjpudWxsLCJSb2xlIjoiUCIsIlN0YWZmSWQiOjAsIlN1YiI6IiIsIlRlc3RlciI6MCwiVVVJRCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsIlVpZEhhc2giOiIxMDA2OTAiLCJleHAiOjE3NjI5MzY5MTQsIm9yaWdfaWF0IjoxNzYwMzQ0OTE0fQ._FNQzq1UxuK8H6G38FmBI-BJjwK-Qr0I14MQUEGwyHM'
    const storageToken = Taro.getStorageSync('token')
    const token = storageToken || staticToken
    
    try {
      // 使用 Taro.uploadFile 上传文件（formdata格式）
      const response = await Taro.uploadFile({
        url: `${BASE_URL}/api/digital_human/audio2text`,
        filePath: filePath,
        name: 'file', // formdata字段名
        header: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('语音识别响应:', response)
      
      // 解析返回的JSON字符串
      let data: any
      try {
        data = JSON.parse(response.data)
      } catch (e) {
        // 如果解析失败，尝试直接使用response.data
        data = response.data
      }
      
      // 从响应中提取 text 字段
      let text = ''
      
      // 处理不同的响应结构
      if (typeof data === 'string') {
        // 如果 data 是字符串，尝试再次解析
        try {
          data = JSON.parse(data)
        } catch (e) {
          // 如果仍然是字符串，直接使用
          text = data
        }
      }
      
      // 从嵌套的响应中提取 text
      if (data && typeof data === 'object') {
        // 如果响应在 data.data 或 data.result 中
        if (data.data && data.data.text) {
          text = data.data.text
        } else if (data.result && data.result.text) {
          text = data.result.text
        } else if (data.text) {
          text = data.text
        } else if (typeof data.data === 'string') {
          // 如果 data.data 是字符串，尝试解析
          try {
            const parsed = JSON.parse(data.data)
            text = parsed.text || parsed
          } catch (e) {
            text = data.data
          }
        }
      }
      
      console.log('语音识别成功，提取的文本:', text)
      
      if (!text) {
        throw new Error('响应中未找到 text 字段')
      }
      
      return text
    } catch (error: any) {
      console.error('❌ 语音识别失败:', error)
      throw error
    }
  }
}

