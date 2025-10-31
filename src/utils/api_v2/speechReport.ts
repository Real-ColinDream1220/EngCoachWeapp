import { request } from './request'
import { SpeechReport, ApiResponse, ListResponse, DetailResponse, EditResponse, DeleteResponse } from './types'

/**
 * 自由练习报告接口
 */
export const speechReportAPI = {
  /**
   * 获取报告列表
   * @param unit_id 单元ID（可选）
   * @param student_id 学生ID（可选）
   */
  getReportList: (unit_id?: number, student_id?: number) => {
    const params: any = {}
    if (unit_id !== undefined) params.unit_id = unit_id
    if (student_id !== undefined) params.student_id = student_id
    
    return request<ListResponse<SpeechReport>>({
      url: '/api/speech/report/list',
      method: 'GET',
      params
    })
  },

  /**
   * 获取报告详情
   * @param id 报告ID
   */
  getReportDetail: (id: number) => {
    return request<DetailResponse<SpeechReport>>({
      url: '/api/speech/report/detail',
      method: 'GET',
      params: { id }
    })
  },

  /**
   * 新增/编辑报告
   * @param data 报告数据
   */
  editReport: (data: SpeechReport) => {
    return request<EditResponse>({
      url: '/api/speech/report/edit',
      method: 'POST',
      data
    })
  },

  /**
   * 删除报告
   * @param id 报告ID
   */
  deleteReport: (id: number) => {
    return request<DeleteResponse>({
      url: '/api/speech/report/del',
      method: 'DELETE',
      params: { id }
    })
  }
}

