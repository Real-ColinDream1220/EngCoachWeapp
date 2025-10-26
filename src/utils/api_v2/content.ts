import { request } from './request'

/**
 * Content（内容生成）API
 */
export const contentAPI = {
  /**
   * 生成学习建议内容（支持轮询监听状态）
   * @param agent_id 代理ID（固定值：5844）
   * @param query SOE评测结果的完整JSON字符串
   * @returns Promise<{ success: boolean, data: { content: string, task_id?: string } }>
   */
  generate: async (agent_id: number, query: string) => {
    console.log('开始生成学习建议...')
    console.log('agent_id:', agent_id)
    console.log('query长度:', query.length)
    
    try {
      const response = await request<{ content: string, task_id?: string }>({
        url: '/api/oral_eng/content/generate',
        method: 'POST',
        data: {
          agent_id,
          query
        }
      })
      
      console.log('学习建议生成请求响应:', response)
      
      return response
    } catch (error) {
      console.error('生成学习建议失败:', error)
      throw error
    }
  },

  /**
   * 查询生成任务状态
   * @param task_id 任务ID
   * @returns Promise<{ success: boolean, data: { status: string, content?: string } }>
   */
  getTaskStatus: async (task_id: string) => {
    console.log('查询任务状态:', task_id)
    
    try {
      const response = await request<{ status: string, content?: string }>({
        url: '/api/oral_eng/content/task_status',
        method: 'GET',
        params: { task_id }
      })
      
      console.log('任务状态查询响应:', response)
      
      return response
    } catch (error) {
      console.error('查询任务状态失败:', error)
      throw error
    }
  },

  /**
   * 持续监听生成任务直到完成
   * @param task_id 任务ID
   * @param maxAttempts 最大轮询次数（默认60次，每次间隔5秒，总共5分钟）
   * @returns Promise<{ success: boolean, content: string }>
   */
  pollUntilComplete: async (task_id: string, maxAttempts: number = 60) => {
    console.log('开始轮询任务状态，任务ID:', task_id)
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`第 ${attempt}/${maxAttempts} 次查询任务状态...`)
        
        const statusResponse = await contentAPI.getTaskStatus(task_id)
        
        if (statusResponse.success) {
          const status = statusResponse.data?.status || statusResponse.result?.status
          const content = statusResponse.data?.content || statusResponse.result?.content
          
          console.log('任务状态:', status)
          
          if (status === 'completed' || status === 'success') {
            console.log('✅ 任务完成，获取到内容')
            console.log('内容长度:', content?.length || 0)
            return {
              success: true,
              content: content || ''
            }
          } else if (status === 'failed' || status === 'error') {
            console.log('❌ 任务失败')
            return {
              success: false,
              content: '',
              error: '任务执行失败'
            }
          } else if (status === 'pending' || status === 'processing') {
            console.log('⏳ 任务进行中，继续等待...')
            // 等待5秒后继续查询
            await new Promise(resolve => setTimeout(resolve, 5000))
            continue
          } else {
            console.log('⚠️ 未知状态:', status)
            // 等待5秒后继续查询
            await new Promise(resolve => setTimeout(resolve, 5000))
            continue
          }
        } else {
          console.log('⚠️ 查询状态失败，继续重试...')
          await new Promise(resolve => setTimeout(resolve, 5000))
          continue
        }
      } catch (error) {
        console.error(`第 ${attempt} 次查询失败:`, error)
        if (attempt === maxAttempts) {
          throw error
        }
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
    
    console.log('⏰ 轮询超时，任务未在预期时间内完成')
    return {
      success: false,
      content: '',
      error: '任务超时'
    }
  }
}

