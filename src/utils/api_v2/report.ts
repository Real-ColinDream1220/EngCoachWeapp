import { request } from './request'
import { Report, ReportListData, ReportDetailData, EditResponse, DeleteResponse } from './types'

// 报告相关接口
export const reportAPI = {
  // 获取报告列表
  getReportList: (exercise_id?: number) => {
    return request<ReportListData>({
      url: '/api/oral_eng/report/list',
      method: 'GET',
      params: exercise_id ? { exercise_id } : undefined
    })
  },

  // 获取报告详情
  getReportDetail: (id: number) => {
    return request<ReportDetailData>({
      url: '/api/oral_eng/report/detail',
      method: 'GET',
      params: { id }
    })
  },

  // 编辑报告（新增或编辑）
  editReport: (data: Report) => {
    return request<EditResponse>({
      url: '/api/oral_eng/report/edit',
      method: 'POST',
      data
    })
  },

  // 删除报告
  deleteReport: (id: number) => {
    return request<DeleteResponse>({
      url: '/api/oral_eng/report/del',
      method: 'DELETE',
      params: { id }
    })
  }
}

