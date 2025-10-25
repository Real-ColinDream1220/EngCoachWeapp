import { request } from './request'

// 教材版本数据接口
export interface TextbookVersion {
  xkw_id: number
  course_id: number
  year: number
  name: string
  ordinal: number
  id: number
  created_at: string
  updated_at: string
}

// 教材版本返回数据接口
export interface TextbookVersionsData {
  versions: TextbookVersion[]
}

// 教材数据接口
export interface Textbook {
  [key: string]: any
}

// 教材列表返回数据接口
export interface TextbooksData {
  textbooks: Textbook[]
}

// 目录数据接口
export interface Catalog {
  id: number
  name: string
  parent_id: number
  type: string
  ordinal: number
}

// 目录列表返回数据接口
export interface CatalogsData {
  catalogs: Catalog[]
}

// 教材相关接口
export const textbookAPI = {
  // 获取教材版本列表
  getTextbookVersions: (course_id: number) => {
    return request<TextbookVersionsData>({
      url: '/api/v1/textbook-versions',
      method: 'GET',
      params: { course_id }
    })
  },
  
  // 获取教材列表
  getTextbooks: (course_id: number, version_id: number) => {
    return request<TextbooksData>({
      url: '/api/v1/textbooks',
      method: 'GET',
      params: { course_id, version_id }
    })
  },
  
  // 获取教材目录列表
  getCatalogs: (textbook_id: number) => {
    return request<CatalogsData>({
      url: '/api/v1/catalogs',
      method: 'GET',
      params: { textbook_id }
    })
  }
}

