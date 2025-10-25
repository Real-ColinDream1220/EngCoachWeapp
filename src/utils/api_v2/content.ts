import { request } from './request'

/**
 * Content（内容生成）API
 */
export const contentAPI = {
  /**
   * 生成学习建议内容
   * @param agent_id 代理ID（固定值：5844）
   * @param query SOE评测结果的完整JSON字符串
   * @returns Promise<{ success: boolean, data: { content: string } }>
   */
  generate: async (agent_id: number, query: string) => {
    console.log('开始生成学习建议...')
    console.log('agent_id:', agent_id)
    console.log('query长度:', query.length)
    
    try {
      const response = await request<{ content: string }>({
        url: '/api/oral_eng/content/generate',
        method: 'POST',
        data: {
          agent_id,
          query
        }
      })
      
      console.log('学习建议生成成功')
      console.log('content长度:', response.data?.content?.length || 0)
      
      return response
    } catch (error) {
      console.error('生成学习建议失败:', error)
      throw error
    }
  }
}

