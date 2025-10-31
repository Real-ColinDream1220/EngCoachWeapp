import Taro from '@tarojs/taro'
import { ApiResponse, request } from './request'
import { SoeParams, SoeResponse } from './types'

const BASE_URL = 'https://t.aix101.com'

/**
 * SOE（语音评测）API
 */
export const soeAPI = {
  /**
   * 语音评测（通过FormData上传音频文件）
   * @param localFilePaths 本地音频文件路径数组
   * @param refTexts 参考文本数组（所有用户录音对应的消息文字）
   * @returns Promise<ApiResponse<SoeResponse>>
   */
  evaluate: async (localFilePaths: string[], refTexts: string[]): Promise<ApiResponse<SoeResponse>> => {
    console.log('开始语音评测:', { localFilePaths, refTexts })
    
    // 将refTexts数组合并成一个字符串
    const refText = refTexts.join(' ')
    console.log('合并后的参考文本:', refText)
    
    try {
      // 获取token
      const staticToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBZG1MdiI6MCwiQXBwaWQiOiIiLCJBdXRob3JpdHlJZCI6IiIsIkJpZCI6MSwiSUQiOjIsIk1hcENsYWltcyI6bnVsbCwiUm9sZSI6IlgiLCJTdGFmZklkIjowLCJTdWIiOiIiLCJUZXN0ZXIiOjAsIlVVSUQiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAiLCJVaWRIYXNoIjoiMTAwMDAyIiwiZXhwIjoxNzYzOTk5NTk3LCJvcmlnX2lhdCI6MTc2MTQwNzU5N30.0jrur8RvQwV80ablGjJcCTa_X0nJTi77R2ccTiTywaQ'
      const storageToken = Taro.getStorageSync('token')
      const token = storageToken || staticToken
      
      // 构造FormData参数
      const formData: Record<string, any> = {
        refText: refText,           // 参考文本
        engineType: '16k_en',       // 固定值：16k_en
        scoreCoeff: '1.0',          // 固定值：1.0
        evalMode: '1',              // 固定值：1
        recMode: '1',               // 固定值：1
        voiceFormat: 'pcm'          // 固定值：pcm（与picbook一致）
      }
      
      console.log('SOE 请求参数:', formData)
      console.log('音频文件数量:', localFilePaths.length)
      
      // 使用 Taro.uploadFile 上传文件
      const uploadPromises = localFilePaths.map((filePath, index) => {
        return new Promise((resolve, reject) => {
          console.log(`准备上传第 ${index + 1} 个音频文件:`, filePath)
          
          Taro.uploadFile({
            url: `${BASE_URL}/api/ai/soe`,
            filePath: filePath,
            name: 'file',
            formData: formData,
            header: {
              'Authorization': `Bearer ${token}`
            },
            success: (res) => {
              console.log(`第 ${index + 1} 个音频上传成功:`, res)
              try {
                const data = JSON.parse(res.data)
                resolve(data)
              } catch (e) {
                console.error('解析响应失败:', e)
                reject(e)
              }
            },
            fail: (err) => {
              console.error(`第 ${index + 1} 个音频上传失败:`, err)
              reject(err)
            }
          })
        })
      })
      
      // 等待所有文件上传完成
      const results = await Promise.all(uploadPromises)
      console.log('所有音频文件评测完成:', results)
      
      // 返回所有评测结果
      const response = {
        success: true,
        data: results,  // 返回所有评测结果的数组
        status: 200,
        message: '评测成功'
      }
      
      console.log('SOE 评测响应:', response)
      console.log('评测结果数量:', results.length)
      
      return response as ApiResponse<any>
    } catch (error) {
      console.error('SOE 评测失败:', error)
      throw error
    }
  }
}

