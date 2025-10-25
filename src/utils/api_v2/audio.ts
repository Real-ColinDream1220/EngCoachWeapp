import { request } from './request'
import { Audio, AudioListData, AudioDetailData, EditResponse, DeleteResponse } from './types'

// 音频相关接口
export const audioAPI = {
  // 获取音频列表（支持多条件筛选）
  getAudioList: (params?: {
    student_id?: number
    exercise_id?: number
  }) => {
    return request<AudioListData>({
      url: '/api/oral_eng/audio/list',
      method: 'GET',
      params
    })
  },

  // 获取音频详情
  getAudioDetail: (id: number) => {
    return request<AudioDetailData>({
      url: '/api/oral_eng/audio/detail',
      method: 'GET',
      params: { id }
    })
  },

  // 编辑音频（新增或编辑）
  editAudio: (data: Audio) => {
    return request<EditResponse>({
      url: '/api/oral_eng/audio/edit',
      method: 'POST',
      data
    })
  },

  // 删除音频
  deleteAudio: (id: number) => {
    return request<DeleteResponse>({
      url: '/api/oral_eng/audio/del',
      method: 'DELETE',
      params: { id }
    })
  },

  // 根据 exercise_id 删除所有音频
  deleteAudioByExercise: (exercise_id: number) => {
    return request<DeleteResponse>({
      url: '/api/oral_eng/audio/del_by_exercise',
      method: 'DELETE',
      params: { exercise_id }
    })
  }
}

