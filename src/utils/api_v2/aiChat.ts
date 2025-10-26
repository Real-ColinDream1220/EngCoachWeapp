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
   * AI 对话完成接口（模拟流式输出）
   * 注意：小程序不支持真正的 SSE，这里使用普通请求 + 前端模拟流式效果
   * @param params 请求参数
   * @param onMessage 接收到消息块的回调
   * @param onComplete 完成回调
   * @param onError 错误回调
   */
  completions: async (params: {
    tid: number
    text: string
    onMessage: (chunk: string) => void
    onComplete: () => void
    onError?: (error: any) => void
  }) => {
    const { tid, text, onMessage, onComplete, onError } = params
    
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
          agent_id: 5864,
          ai_config: {
            agent_id: 5864
          }
        }
      })
      
      console.log('completions 响应:', response)
      
      // API 返回的是 SSE 格式的字符串，需要解析
      // 尝试多种可能的数据结构
      let rawData = ''
      
      if (typeof response === 'string') {
        // 情况1: response 本身就是字符串
        rawData = response
      } else if (response.data) {
        if (typeof response.data === 'string') {
          // 情况2: response.data 是字符串
          rawData = response.data
        } else if (response.data.data && typeof response.data.data === 'string') {
          // 情况3: response.data.data 是字符串（嵌套结构）
          rawData = response.data.data
        }
      } else if (response.result) {
        if (typeof response.result === 'string') {
          // 情况4: response.result 是字符串
          rawData = response.result
        } else if (response.result.data && typeof response.result.data === 'string') {
          // 情况5: response.result.data 是字符串
          rawData = response.result.data
        }
      }
      
      if (!rawData) {
        console.error('❌ 无法提取 SSE 数据，响应结构:', JSON.stringify(response).substring(0, 200))
        throw new Error('无法提取响应数据')
      }
      
      console.log('✅ 成功提取 SSE 数据')
      console.log('原始 SSE 数据 (前500字符):', rawData.substring(0, 500))
      
      // 解析 SSE 格式数据
      // 处理各种换行符：\n, \r\n, 或实际的换行
      const lines = rawData.split(/\r?\n/)
      let fullContent = ''
      let hasError = false
      let errorMessage = ''
      let messageCount = 0
      
      console.log(`📋 开始解析 ${lines.length} 行 SSE 数据`)
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        
        if (trimmedLine.startsWith('data:')) {
          try {
            const jsonStr = trimmedLine.substring(5).trim()
            
            // 跳过 [DONE] 标记
            if (jsonStr === '[DONE]') {
              console.log('✅ 收到 [DONE] 标记')
              break
            }
            
            // 跳过空数据
            if (!jsonStr) {
              continue
            }
            
            const data = JSON.parse(jsonStr)
            
            // 检查是否是错误事件
            if (data.event === 'error') {
              hasError = true
              errorMessage = data.content || '未知错误'
              console.error('❌ AI 返回错误:', errorMessage)
              break
            }
            
            // 只提取 event === "message" 的 content 内容
            if (data.event === 'message' && data.content) {
              messageCount++
              console.log(`📝 [${messageCount}] 提取内容片段 (${data.content.length}字符):`, data.content)
              fullContent += data.content
            } else if (data.event === 'workflow') {
              // workflow 事件仅记录日志，不提取内容
              console.log(`🔄 工作流状态: ${data.workflow}`)
            }
          } catch (e) {
            console.warn('⚠️  解析 SSE 数据失败:', trimmedLine.substring(0, 100), e)
          }
        }
      }
      
      console.log(`✅ 解析完成，共提取 ${messageCount} 个消息片段`)
      
      // 如果有错误，抛出异常
      if (hasError) {
        throw new Error(errorMessage || 'AI 处理失败')
      }
      
      // 如果没有内容，记录警告
      if (!fullContent) {
        console.error('❌ 未能提取到任何内容')
        console.error('响应中的所有行:', lines.slice(0, 20).join('\n'))
        throw new Error('AI 未返回有效内容')
      }
      
      console.log(`✅ 最终提取的完整内容 (${fullContent.length} 字符)`)
      console.log('内容预览:', fullContent.substring(0, 200) + (fullContent.length > 200 ? '...' : ''))
      
      // 模拟流式输出效果：逐字显示
      const chunkSize = 3  // 每次显示3个字符
      const delay = 30  // 每30ms显示一次
      
      for (let i = 0; i < fullContent.length; i += chunkSize) {
        const chunk = fullContent.substring(i, i + chunkSize)
        onMessage(chunk)
        
        // 延迟，模拟流式效果
        if (i + chunkSize < fullContent.length) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
      
      console.log('✅ 模拟流式输出完成')
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

