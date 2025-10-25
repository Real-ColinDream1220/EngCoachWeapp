import { request } from './request'

// 课程数据接口
export interface Course {
  xkw_id: number
  name: string
  subject_id: number
  stage_id: number
  ordinal: number
  id: number
  created_at: string
  updated_at: string
}

// 公开课程返回数据接口
export interface PublicCoursesData {
  courses: Course[]
}

// 课程相关接口
export const courseAPI = {
  // 获取公开课程列表
  getPublicCourses: () => {
    return request<PublicCoursesData>({
      url: '/api/v1/public-courses',
      method: 'GET'
    })
  }
}

