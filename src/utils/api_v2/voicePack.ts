import { request } from './request'
import { VoicePackParams, VoicePackResponse } from './types'

/**
 * 数字人语音生成API
 */
export const voicePackAPI = {
  /**
   * 生成语音包
   * @param textList 需要转语音的文本列表（去掉QA前缀）
   * @returns Promise<VoicePackResponse>
   */
  generate: async (textList: string[]): Promise<VoicePackResponse> => {
    console.log('开始生成语音包:', textList)
    
    // 构造请求参数
    const params: VoicePackParams = {
      text_list: textList,
      voice: 'longxiaochun_v2',   // 固定值
      speech_rate: 5,              // 固定值
      pitch_rate: 5                // 固定值
    }
    
    console.log('语音生成请求参数:', params)
    
    try {
      const response = await request<VoicePackResponse>({
        url: '/api/digital_human/voice_pack/generate',
        method: 'POST',
        data: params
      })
      
      console.log('语音生成响应:', response)
      
      return response
    } catch (error) {
      console.error('语音生成失败:', error)
      throw error
    }
  }
}

