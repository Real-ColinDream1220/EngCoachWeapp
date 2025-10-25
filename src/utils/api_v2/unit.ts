import { request } from './request'
import { Unit, UnitListData, UnitDetailData, EditResponse, DeleteResponse } from './types'

// 单元相关接口
export const unitAPI = {
  // 获取单元列表
  getUnitList: (chapter_id?: number) => {
    return request<UnitListData>({
      url: '/api/oral_eng/unit/list',
      method: 'GET',
      params: chapter_id ? { chapter_id } : undefined
    })
  },

  // 获取单元详情
  getUnitDetail: (id: number) => {
    return request<UnitDetailData>({
      url: '/api/oral_eng/unit/detail',
      method: 'GET',
      params: { id }
    })
  },

  // 编辑单元（新增或编辑）
  editUnit: (data: Unit) => {
    return request<EditResponse>({
      url: '/api/oral_eng/unit/edit',
      method: 'POST',
      data
    })
  },

  // 删除单元
  deleteUnit: (id: number) => {
    return request<DeleteResponse>({
      url: '/api/oral_eng/unit/del',
      method: 'DELETE',
      params: { id }
    })
  }
}

