# AI 聊天 SSE 数据解析修复

## 问题描述

在使用 AI 聊天接口时，遇到了 SSE（Server-Sent Events）数据无法正确解析的问题。

### 错误日志

```
API响应: {status: 200, data: "event:message↵data:{"event":"workflow",...}"}
completions 响应: event:message...
原始 SSE 数据 (前500字符): 
⚠️ AI 没有返回有效内容
```

### 问题原因

1. **数据结构提取不正确**：API 返回的响应结构可能有多层嵌套（`response.data`、`response.data.data`、`response.result` 等），之前的代码只考虑了单层结构。

2. **换行符处理不完善**：SSE 数据可能包含不同格式的换行符（`\n`、`\r\n`），需要统一处理。

3. **解析逻辑不够健壮**：没有充分处理空数据、workflow 事件等特殊情况。

## 修复方案

### 1. 增强数据提取逻辑

```typescript
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
```

### 2. 优化换行符处理

```typescript
// 使用正则表达式处理各种换行符格式
const lines = rawData.split(/\r?\n/)
```

### 3. 完善 SSE 解析逻辑

```typescript
for (const line of lines) {
  const trimmedLine = line.trim()
  
  if (trimmedLine.startsWith('data:')) {
    const jsonStr = trimmedLine.substring(5).trim()
    
    // 跳过 [DONE] 标记
    if (jsonStr === '[DONE]') {
      break
    }
    
    // 跳过空数据
    if (!jsonStr) {
      continue
    }
    
    const data = JSON.parse(jsonStr)
    
    // 只提取 event === "message" 的 content
    if (data.event === 'message' && data.content) {
      fullContent += data.content
    } else if (data.event === 'workflow') {
      // workflow 事件仅记录日志
      console.log(`🔄 工作流状态: ${data.workflow}`)
    }
  }
}
```

### 4. 增强错误处理

```typescript
// 如果没有提取到内容，抛出详细错误
if (!fullContent) {
  console.error('❌ 未能提取到任何内容')
  console.error('响应中的所有行:', lines.slice(0, 20).join('\n'))
  throw new Error('AI 未返回有效内容')
}
```

## SSE 数据格式说明

### 标准 SSE 格式

```
event:message
data:{"event":"workflow","content":"","workflow":"正在识别用户意图..."}

event:message
data:{"event":"message","content":"Hello! Wha"}

event:message
data:{"event":"message","content":"t is your name?"}

event:message
data:[DONE]
```

### 事件类型

1. **workflow 事件**：工作流状态通知
   - 不包含用户需要的内容
   - 仅用于显示处理状态（"正在识别用户意图..."、"正在思考..."）

2. **message 事件**：实际的 AI 回复内容
   - `content` 字段包含文本片段
   - 需要拼接所有 message 事件的 content 形成完整回复

3. **error 事件**：错误信息
   - 表示 AI 处理失败
   - 需要中断处理并抛出错误

4. **[DONE] 标记**：数据流结束标记

## 测试建议

### 1. 正常对话测试

```javascript
const response = await aiChatAPI.completions({
  tid: topicId,
  text: 'Hello',
  onMessage: (chunk) => console.log('接收:', chunk),
  onComplete: () => console.log('完成'),
  onError: (error) => console.error('错误:', error)
})
```

预期输出：
```
✅ 成功提取 SSE 数据
📋 开始解析 X 行 SSE 数据
🔄 工作流状态: 正在识别用户意图...
🔄 工作流状态: 正在思考...
📝 [1] 提取内容片段 (10字符): Hello! Wha
📝 [2] 提取内容片段 (15字符): t is your name?
✅ 解析完成，共提取 2 个消息片段
✅ 最终提取的完整内容 (25 字符)
✅ 模拟流式输出完成
```

### 2. 错误情况测试

- 网络错误
- API 返回错误事件
- 空响应
- 格式错误的 SSE 数据

## 更新日志

- **2024-10-26**：修复 SSE 数据解析问题，增强容错性

## 相关文件

- `src/utils/api_v2/aiChat.ts` - AI 聊天接口实现
- `src/utils/api_v2/request.ts` - 通用请求函数
- `src/pages/conversation/index.tsx` - 对话页面（使用 AI 聊天）


