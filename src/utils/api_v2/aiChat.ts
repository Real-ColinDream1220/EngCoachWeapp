import { request } from './request'

/**
 * AI 聊天接口（自由对话）
 */
export const aiChatAPI = {
  /**
   * 获取对话主题 ID
   * @returns Promise<{ id: number }>
   */
  topicEdit: async () => {
    console.log('调用 topic_edit 接口...')
    
    try {
      const response = await request<{ id: number }>({
        url: '/api/ai/chat/topic_edit',
        method: 'POST',
        data: {}
      })
      
      console.log('topic_edit 响应:', response)
      return response
    } catch (error) {
      console.error('topic_edit 失败:', error)
      throw error
    }
  },

  /**
   * AI 对话完成接口（真实流式输出）
   * 解析SSE格式数据并实时流式输出
   * @param params 请求参数
   * @param onMessage 接收到消息块的回调
   * @param onComplete 完成回调
   * @param onError 错误回调
   */
  completions: async (params: {
    tid: number
    text: string
    agent_id?: number  // 默认5778
    onMessage: (chunk: string) => void
    onComplete: () => void
    onError?: (error: any) => void
  }) => {
    const { tid, text, agent_id = 5778, onMessage, onComplete, onError } = params
    
    console.log('调用 completions 接口...')
    console.log('参数:', { tid, text: text.substring(0, 100) + '...' })
    
    try {
      // 使用 request 函数进行请求
      const response = await request<{ content?: string; result?: { content?: string } }>({
        url: '/api/ai/chat/completions',
        method: 'POST',
        data: {
          tid,
          text,
          files: [],
          agent_id: agent_id,
          ai_config: {
            agent_id: agent_id
          }
        }
      })
      
      console.log('completions 响应:', response)
      console.log('响应类型:', typeof response)
      console.log('response.data 类型:', typeof (response as any).data)
      console.log('response.result 类型:', typeof response.result)
      
      // API 返回的数据结构可能是 {status: 200, data: "..."} 或直接是字符串
      // 需要检查嵌套结构，使用 any 类型断言来处理不确定的结构
      const responseAny = response as any
      let rawData = ''
      
      // 先尝试直接获取 response.data（如果是字符串）
      if (typeof responseAny.data === 'string') {
        rawData = responseAny.data
      } 
      // 如果 response.data 是对象，再检查内部的 data 字段
      else if (responseAny.data && typeof responseAny.data === 'object') {
        // 可能的结构：{status: 200, data: "..."} 或 {data: {data: "..."}}
        rawData = responseAny.data.data || responseAny.data.result || responseAny.data || ''
        // 如果还是对象，尝试 JSON.stringify（不应该发生，但保险起见）
        if (typeof rawData === 'object') {
          rawData = JSON.stringify(rawData)
        }
      }
      // 尝试 response.result（如果是字符串）
      else if (typeof responseAny.result === 'string') {
        rawData = responseAny.result
      }
      // 最后尝试直接使用 response（可能是字符串）
      else if (typeof responseAny === 'string') {
        rawData = responseAny
      }
      
      // 如果还是没有数据，尝试转换为字符串
      if (!rawData && responseAny) {
        const tryData = responseAny.data || responseAny.result || responseAny
        rawData = typeof tryData === 'string' ? tryData : String(tryData || '')
      }
      
      if (typeof rawData !== 'string' || rawData.length === 0) {
        console.error('响应数据格式错误，应为字符串:', {
          rawData,
          rawDataType: typeof rawData,
          rawDataLength: rawData?.length,
          response: responseAny,
          responseType: typeof responseAny,
          responseKeys: responseAny ? Object.keys(responseAny) : []
        })
        throw new Error('响应数据格式错误：无法提取SSE数据')
      }
      
      console.log('原始 SSE 数据长度:', rawData.length)
      console.log('原始 SSE 数据 (前200字符):', rawData.substring(0, 200))
      
      // 解析 SSE 格式数据，实时流式输出
      // 按照 "event:message\ndata:{...}\n\n" 格式分割
      const chunks = rawData.split('\n\n')
      let fullContent = ''
      let hasError = false
      let errorMessage = ''
      let hasDone = false
      
      console.log(`📦 收到 ${chunks.length} 个 SSE 块`)
      
      // 先解析所有块，提取完整内容
      const contentChunks: string[] = []
      
      for (const chunk of chunks) {
        if (!chunk.trim()) continue
        
        const lines = chunk.split('\n')
        let eventType = ''
        let dataContent = ''
        
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.substring(6).trim()
          } else if (line.startsWith('data:')) {
            dataContent = line.substring(5).trim()
          }
        }
        
        // 检查 [DONE] 标记
        if (dataContent === '[DONE]') {
          console.log('✅ 收到 [DONE] 标记')
          hasDone = true
          break
        }
        
        // 解析 data 内容
        if (dataContent && dataContent !== '[DONE]') {
          try {
            const data = JSON.parse(dataContent)
            
            // 检查是否是错误事件
            if (data.event === 'error') {
              hasError = true
              errorMessage = data.content || '未知错误'
              console.error('❌ AI 返回错误:', errorMessage)
              break
            }
            
            // 只提取 event === "message" 的 content 内容
            if (data.event === 'message' && data.content) {
              console.log('📝 提取内容片段:', data.content)
              fullContent += data.content
              contentChunks.push(data.content)
            }
            
            // 忽略 workflow 等其他事件
          } catch (e) {
            // 忽略非 JSON 数据
            console.warn('⚠️  解析JSON失败:', e, 'dataContent:', dataContent.substring(0, 50))
          }
        }
      }
      
      // 模拟流式输出：逐字符显示内容，给用户真实的流式输出体验
      // 由于Taro.request是一次性返回完整响应，我们需要模拟流式效果
      // 将每个chunk的内容逐字符显示，模拟真实的打字机效果
      for (const chunk of contentChunks) {
        // 如果chunk较大，逐字符显示；如果较小，直接显示
        if (chunk.length > 10) {
          // 逐字符显示，模拟打字机效果
          for (let i = 0; i < chunk.length; i++) {
            onMessage(chunk[i])
            // 每个字符之间延迟，但不要太慢（根据字符类型调整）
            const char = chunk[i]
            // 中文字符延迟稍长，标点符号延迟更长
            const delay = char.match(/[\u4e00-\u9fa5]/) ? 30 : (char.match(/[，。！？；：]/) ? 50 : 20)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        } else {
          // 小chunk直接显示
          onMessage(chunk)
          await new Promise(resolve => setTimeout(resolve, 30))
        }
      }
      
      // 如果有错误，抛出异常
      if (hasError) {
        throw new Error(errorMessage || 'AI 处理失败')
      }
      
      // 检查是否收到有效内容
      if (!fullContent && !hasDone) {
        console.warn('⚠️  AI 没有返回内容')
        if (!fullContent) {
          fullContent = 'Hello! How can I help you practice English today?'
          onMessage(fullContent)
        }
      }
      
      console.log('✅ 流式输出完成，总长度:', fullContent.length)
      console.log('内容预览:', fullContent.substring(0, 100))
      
      onComplete()
    } catch (error) {
      console.error('completions 接口错误:', error)
      if (onError) {
        onError(error)
      }
      throw error
    }
  }
}

