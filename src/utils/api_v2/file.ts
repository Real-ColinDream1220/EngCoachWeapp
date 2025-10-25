import Taro from '@tarojs/taro'
import { ApiResponse } from './request'
import { FileUploadResponse } from './types'

const BASE_URL = 'https://t.aix101.com'

/**
 * 文件上传API
 */
export const fileAPI = {
  /**
   * 上传文件
   * @param filePath 文件本地路径
   * @returns Promise<ApiResponse<FileUploadResponse>>
   */
  uploadFile: async (filePath: string): Promise<ApiResponse<FileUploadResponse>> => {
    console.log('开始上传文件:', filePath)
    
    // 获取token - 硬编码的静态token作为备用
    const staticToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBZG1MdiI6MCwiQXBwaWQiOiIiLCJBdXRob3JpdHlJZCI6IiIsIkJpZCI6MSwiSUQiOjY5MCwiTWFwQ2xhaW1zIjpudWxsLCJSb2xlIjoiUCIsIlN0YWZmSWQiOjAsIlN1YiI6IiIsIlRlc3RlciI6MCwiVVVJRCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsIlVpZEhhc2giOiIxMDA2OTAiLCJleHAiOjE3NjI5MzY5MTQsIm9yaWdfaWF0IjoxNzYwMzQ0OTE0fQ._FNQzq1UxuK8H6G38FmBI-BJjwK-Qr0I14MQUEGwyHM'
    const storageToken = Taro.getStorageSync('token')
    const token = storageToken || staticToken
    
    try {
      const response = await Taro.uploadFile({
        url: `${BASE_URL}/api/file/upload`,
        filePath: filePath,
        name: 'file', // 后端接收的字段名
        header: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('文件上传响应:', response)
      
      // 解析返回的JSON字符串
      const data = JSON.parse(response.data) as ApiResponse<FileUploadResponse>
      
      console.log('文件上传成功:', data)
      
      return data
    } catch (error) {
      console.error('文件上传失败:', error)
      throw error
    }
  }
}

