import { request } from './request'
import { Exercise, ExerciseListData, ExerciseDetailData, EditResponse, DeleteResponse } from './types'

// 练习相关接口
export const exerciseAPI = {
  // 获取练习列表
  getExerciseList: (unit_id?: number) => {
    return request<ExerciseListData>({
      url: '/api/oral_eng/exercise/list',
      method: 'GET',
      params: unit_id ? { unit_id } : undefined
    })
  },

  // 获取练习详情
  getExerciseDetail: (id: number) => {
    return request<ExerciseDetailData>({
      url: '/api/oral_eng/exercise/detail',
      method: 'GET',
      params: { id }
    })
  },

  // 编辑练习（新增或编辑）
  editExercise: (data: Exercise) => {
    return request<EditResponse>({
      url: '/api/oral_eng/exercise/edit',
      method: 'POST',
      data
    })
  },

  // 删除练习
  deleteExercise: (id: number) => {
    return request<DeleteResponse>({
      url: '/api/oral_eng/exercise/del',
      method: 'DELETE',
      params: { id }
    })
  }
}

