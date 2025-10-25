# 🎙️ SOE（语音评测）API 使用说明

## 接口信息

**接口地址：** `POST /api/ai/soe`

**用途：** 对用户录音进行语音评测，返回评分和评估结果

---

## 请求参数

### FormData 字段

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| **file** | File | ✅ | 音频文件（WAV 格式） |
| **refText** | String | ✅ | 参考文本（用户录音的消息文字，需去掉 Q:/A: 前缀） |
| **engineType** | String | ✅ | 引擎类型，固定值：`"16k_en"` |
| **scoreCoeff** | String | ✅ | 评分系数，固定值：`"1.0"` |
| **evalMode** | String | ✅ | 评估模式，固定值：`"1"` |
| **recMode** | String | ✅ | 识别模式，固定值：`"0"` |
| **voiceFormat** | String | ✅ | 音频格式，固定值：`"wav"` |

**注意：** 所有参数类型都是 `string`

---

## 使用方法

### 1. 导入 API

```typescript
import { soeAPI } from '../../utils/api_v2'
```

### 2. 调用评测接口

```typescript
// 示例：在录音完成后进行评测
const handleEvaluate = async () => {
  try {
    const filePath = 'wxfile://tmp_xxxxx.wav'  // 录音文件路径
    const refText = 'Hello, how are you?'      // 参考文本（去掉 Q:/A: 前缀）
    
    // 调用评测
    const response = await soeAPI.evaluate(filePath, refText)
    
    if (response.success) {
      console.log('评测成功:', response.data)
      // 处理评测结果
      // response.data 包含评分等信息
    } else {
      console.error('评测失败:', response.message)
    }
  } catch (error) {
    console.error('评测出错:', error)
  }
}
```

### 3. 在对话页面中集成

#### 在 `conversation/index.tsx` 中添加评测功能

```typescript
// 在 handleModalRecordStop 方法中，保存文件后进行评测
handleModalRecordStop = async () => {
  // ... 现有的录音停止逻辑 ...
  
  // 保存文件后
  Taro.saveFile({
    tempFilePath: tempFilePath,
    success: async (res) => {
      const savedFilePath = res.savedFilePath
      
      // 动态导入 soeAPI
      const { soeAPI } = await import('../../utils/api_v2')
      
      // 获取参考文本（去掉 Q:/A: 前缀）
      const message = messages.find(m => m.id === currentRecordingMessageId)
      if (message && message.text) {
        // 去掉 "Q: " 或 "A: " 前缀
        const refText = message.text.replace(/^[QA]:\s*/, '')
        
        console.log('开始语音评测...')
        console.log('参考文本:', refText)
        
        try {
          // 调用评测接口
          const soeResponse = await soeAPI.evaluate(savedFilePath, refText)
          
          if (soeResponse.success) {
            console.log('✅ 评测成功:', soeResponse.data)
            
            // 可以将评测结果保存到 state 或显示给用户
            // 例如：显示评分、发音准确度等
            
            Taro.showToast({
              title: '评测完成',
              icon: 'success'
            })
          } else {
            console.error('❌ 评测失败:', soeResponse.message)
          }
        } catch (error) {
          console.error('❌ 评测出错:', error)
        }
      }
      
      // ... 现有的录音记录保存逻辑 ...
    }
  })
}
```

---

## 参数说明

### refText 处理

**用户录音的消息文字需要去掉 Q:/A: 前缀**

示例：
```typescript
// 原始消息
const originalText = "Q: Hello, how are you?"

// 处理后的 refText
const refText = originalText.replace(/^[QA]:\s*/, '')
// 结果: "Hello, how are you?"
```

**处理逻辑：**
```typescript
// 方法1：使用正则表达式
const refText = messageText.replace(/^[QA]:\s*/, '')

// 方法2：判断前缀
let refText = messageText
if (messageText.startsWith('Q: ')) {
  refText = messageText.substring(3)
} else if (messageText.startsWith('A: ')) {
  refText = messageText.substring(3)
}
```

### 固定参数

所有固定参数已在 `soeAPI.evaluate()` 方法中自动设置：

```typescript
{
  engineType: '16k_en',    // 16kHz 英语引擎
  scoreCoeff: '1.0',       // 评分系数 1.0
  evalMode: '1',           // 评估模式 1
  recMode: '0',            // 识别模式 0
  voiceFormat: 'wav'       // 音频格式 WAV
}
```

你只需要传递：
- `filePath`：音频文件路径
- `refText`：参考文本（去掉前缀）

---

## 响应数据

### 成功响应

```typescript
{
  success: true,
  data: {
    // 具体的评测结果
    // 根据实际返回调整
    score?: number           // 评分
    accuracy?: number        // 准确度
    fluency?: number         // 流利度
    pronunciation?: number   // 发音准确度
    // ... 其他字段
  }
}
```

### 失败响应

```typescript
{
  success: false,
  message: "错误信息"
}
```

---

## 错误处理

```typescript
try {
  const response = await soeAPI.evaluate(filePath, refText)
  
  if (response.success) {
    // 处理成功结果
  } else {
    // 处理业务错误
    Taro.showToast({
      title: response.message || '评测失败',
      icon: 'none'
    })
  }
} catch (error) {
  // 处理网络错误或其他异常
  console.error('评测异常:', error)
  Taro.showToast({
    title: '网络错误',
    icon: 'none'
  })
}
```

---

## 调试建议

### 1. 查看请求参数

```typescript
console.log('📤 SOE 请求:')
console.log('  文件路径:', filePath)
console.log('  参考文本:', refText)
console.log('  固定参数:', {
  engineType: '16k_en',
  scoreCoeff: '1.0',
  evalMode: '1',
  recMode: '0',
  voiceFormat: 'wav'
})
```

### 2. 查看响应数据

```typescript
console.log('📥 SOE 响应:', response)
console.log('  成功:', response.success)
console.log('  数据:', response.data)
console.log('  消息:', response.message)
```

### 3. 验证文件路径

```typescript
// 确保文件存在且格式正确
Taro.getFileInfo({
  filePath: filePath,
  success: (info) => {
    console.log('✅ 文件信息:', info)
    console.log('  大小:', (info.size / 1024).toFixed(2), 'KB')
  },
  fail: (err) => {
    console.error('❌ 文件不存在:', err)
  }
})
```

---

## 完整示例

```typescript
// 在对话页面中完整的评测流程
handleCompleteWithEvaluation = async () => {
  const { recordedMessages, messages } = this.state
  
  try {
    Taro.showLoading({ title: '正在评测...' })
    
    // 动态导入 API
    const { soeAPI, fileAPI, audioAPI } = await import('../../utils/api_v2')
    
    // 遍历所有录音
    for (const [messageId, recordData] of Object.entries(recordedMessages)) {
      const message = messages.find(m => m.id === Number(messageId))
      
      if (message && recordData.filePath) {
        // 获取参考文本（去掉 Q:/A: 前缀）
        const refText = message.text.replace(/^[QA]:\s*/, '')
        
        console.log(`\n=== 评测消息 ${messageId} ===`)
        console.log('参考文本:', refText)
        
        try {
          // 1. 语音评测
          const soeResponse = await soeAPI.evaluate(recordData.filePath, refText)
          
          if (soeResponse.success) {
            console.log('✅ 评测成功:', soeResponse.data)
            
            // 2. 上传文件
            const uploadResponse = await fileAPI.uploadFile(recordData.filePath)
            
            if (uploadResponse.success) {
              const fileUrl = uploadResponse.data?.file?.url
              
              // 3. 保存到数据库（包含评测结果）
              await audioAPI.editAudio({
                student_id: studentId,
                exercise_id: exerciseId,
                file: fileUrl,
                duration: recordData.duration,
                // 可以将评测结果也保存
                score: soeResponse.data?.score,
                feedback: JSON.stringify(soeResponse.data)
              })
              
              console.log('✅ 完整流程成功')
            }
          } else {
            console.log('⚠️ 评测失败:', soeResponse.message)
          }
        } catch (error) {
          console.error('❌ 处理失败:', error)
        }
      }
    }
    
    Taro.hideLoading()
    Taro.showToast({
      title: '评测完成',
      icon: 'success'
    })
    
    // 返回练习详情页
    Taro.navigateBack()
    
  } catch (error) {
    Taro.hideLoading()
    console.error('评测流程失败:', error)
    Taro.showToast({
      title: '评测失败',
      icon: 'none'
    })
  }
}
```

---

## 注意事项

1. ✅ **文件格式必须是 WAV**
   - 当前录音配置已设置为 WAV 格式
   - 采样率：16000 Hz
   - 声道：单声道（mono）
   - 采样精度：16 bits

2. ✅ **refText 必须去掉 Q:/A: 前缀**
   - 使用正则表达式处理：`text.replace(/^[QA]:\s*/, '')`

3. ✅ **所有参数类型都是 string**
   - 即使是数字，也需要以字符串形式传递
   - 例如：`scoreCoeff: '1.0'` 而不是 `scoreCoeff: 1.0`

4. ✅ **Token 认证**
   - 接口会自动从本地存储读取 token
   - 如果没有，会使用硬编码的静态 token

5. ✅ **错误处理**
   - 建议使用 try-catch 包裹
   - 检查 response.success 判断是否成功

---

## 相关文件

- **API 定义：** `src/utils/api_v2/soe.ts`
- **类型定义：** `src/utils/api_v2/types.ts`
- **使用页面：** `src/pages/conversation/index.tsx`

---

## 更新日志

- **2024-10-25：** 创建 SOE API，支持语音评测功能

