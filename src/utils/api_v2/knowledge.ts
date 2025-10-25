import { request } from './request'

// 目录信息接口
export interface CatalogInfo {
  id: number
  name: string
}

// 知识点数据接口
export interface KnowledgePoint {
  id: number
  name: string
  direction: string
  parent_id: number
  depth: number
  root_id: number
  tag: string
  type: string
  catalogs: CatalogInfo[]
}

// 知识点列表返回数据接口
export interface KnowledgePointsData {
  knowledge_points: KnowledgePoint[]
}

// 知识点相关接口
export const knowledgeAPI = {
  // 获取知识点列表
  getKnowledgePoints: (catalog_id: number) => {
    return request<KnowledgePointsData>({
      url: '/api/v1/knowledge-points',
      method: 'GET',
      params: { catalog_id }
    })
  }
}

