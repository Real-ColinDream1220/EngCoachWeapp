import { request } from './request'
import { SpeechAudio, ApiResponse, ListResponse, DetailResponse, EditResponse, DeleteResponse } from './types'

/**
 * 自由练习音频接口
 */
export const speechAudioAPI = {
  /**
   * 获取音频列表
   * @param unit_id 单元ID（可选）
   * @param student_id 学生ID（可选）
   */
  getAudioList: (unit_id?: number, student_id?: number) => {
    const params: any = {}
    if (unit_id !== undefined) params.unit_id = unit_id
    if (student_id !== undefined) params.student_id = student_id
    
    return request<ListResponse<SpeechAudio>>({
      url: '/api/speech/audio/list',
      method: 'GET',
      params
    })
  },

  /**
   * 获取音频详情
   * @param id 音频ID
   */
  getAudioDetail: (id: number) => {
    return request<DetailResponse<SpeechAudio>>({
      url: '/api/speech/audio/detail',
      method: 'GET',
      params: { id }
    })
  },

  /**
   * 新增/编辑音频
   * @param data 音频数据
   */
  editAudio: (data: SpeechAudio) => {
    return request<EditResponse>({
      url: '/api/speech/audio/edit',
      method: 'POST',
      data
    })
  },

  /**
   * 删除音频
   * @param id 音频ID
   */
  deleteAudio: (id: number) => {
    return request<DeleteResponse>({
      url: '/api/speech/audio/del',
      method: 'DELETE',
      params: { id }
    })
  }
}

