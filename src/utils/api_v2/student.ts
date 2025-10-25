import { request } from './request'
import { Student, StudentListData, StudentDetailData, EditResponse, DeleteResponse } from './types'

// 学生相关接口
export const studentAPI = {
  // 获取学生列表
  getStudentList: () => {
    return request<StudentListData>({
      url: '/api/oral_eng/student/list',
      method: 'GET'
    })
  },

  // 获取学生详情
  getStudentDetail: (id: number) => {
    return request<StudentDetailData>({
      url: '/api/oral_eng/student/detail',
      method: 'GET',
      params: { id }
    })
  },

  // 通过Passcode获取学生（用于学生登录）
  getStudentByKey: (passcode: string) => {
    return request<StudentDetailData>({
      url: '/api/oral_eng/student/by_key',
      method: 'GET',
      params: { passcode }
    })
  },

  // 编辑学生（新增或编辑）
  editStudent: (data: Student) => {
    return request<EditResponse>({
      url: '/api/oral_eng/student/edit',
      method: 'POST',
      data
    })
  },

  // 删除学生
  deleteStudent: (id: number) => {
    return request<DeleteResponse>({
      url: '/api/oral_eng/student/del',
      method: 'DELETE',
      params: { id }
    })
  }
}

