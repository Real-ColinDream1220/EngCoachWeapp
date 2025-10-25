import { request } from './request'
import { Chapter, ChapterListData, ChapterDetailData, EditResponse, DeleteResponse } from './types'

// 章节相关接口
export const chapterAPI = {
  // 获取章节列表
  getChapterList: (textbook_id?: number) => {
    return request<ChapterListData>({
      url: '/api/oral_eng/chapter/list',
      method: 'GET',
      params: textbook_id ? { textbook_id } : undefined
    })
  },

  // 获取章节详情
  getChapterDetail: (id: number) => {
    return request<ChapterDetailData>({
      url: '/api/oral_eng/chapter/detail',
      method: 'GET',
      params: { id }
    })
  },

  // 编辑章节（新增或编辑）
  editChapter: (data: Chapter) => {
    return request<EditResponse>({
      url: '/api/oral_eng/chapter/edit',
      method: 'POST',
      data
    })
  },

  // 删除章节
  deleteChapter: (id: number) => {
    return request<DeleteResponse>({
      url: '/api/oral_eng/chapter/del',
      method: 'DELETE',
      params: { id }
    })
  }
}

