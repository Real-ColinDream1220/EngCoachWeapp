# 🎙️ 数字人语音功能使用指南

## 功能概述

数字人语音功能为对话练习添加了真实的语音播放能力：

1. **用户消息**：添加播放按钮，点击后调用数字人语音API并播放
2. **AI消息**：去除播放按钮，在AI流式输出完成后**自动调用**数字人语音API并播放

---

## 🎯 实现效果

### **用户消息（User Message）**

```
┌────────────────────────────────┐
│  Q: Hello, how are you?        │  ← 用户消息文本
│  [ 🔊 播放 ]                    │  ← 播放数字人语音按钮
│  [ 点击开始录音 ]               │  ← 录音按钮
└────────────────────────────────┘
```

- ✅ 点击"🔊 播放"按钮，自动调用数字人语音API
- ✅ 播放中图标会动画变化：🔈 → 🔉 → 🔊
- ✅ 再次点击可停止播放

### **AI消息（AI Message）**

```
┌────────────────────────────────┐
│  AI: Good morning! ...●        │  ← AI流式输出
└────────────────────────────────┘
              ↓
    流式输出完成后自动播放
              ↓
┌────────────────────────────────┐
│  AI: Good morning! How can I   │
│      help you today?           │  ← 正在播放数字人语音
└────────────────────────────────┘
```

- ✅ **无需手动点击**
- ✅ AI流式输出完成后**自动播放**数字人语音
- ✅ 去除了原来的"🔊 播放"按钮

---

## 🔧 技术实现

### **1. API接口**

**文件：** `src/utils/api_v2/voicePack.ts`

```typescript
export const voicePackAPI = {
  generate: async (textList: string[]): Promise<VoicePackResponse> => {
    const params = {
      text_list: textList,        // 需要转语音的文本列表（去掉QA）
      voice: 'longxiaochun_v2',   // 固定语音类型
      speech_rate: 5,             // 固定语速
      pitch_rate: 5               // 固定音调
    }
    
    const response = await request({
      url: '/api/digital_human/voice_pack/generate',
      method: 'POST',
      data: params
    })
    
    return response
  }
}
```

**请求参数：**
```json
{
  "text_list": ["Hello, how are you?"],
  "voice": "longxiaochun_v2",
  "speech_rate": 5,
  "pitch_rate": 5
}
```

**响应数据：**
```json
{
  "success": true,
  "status": "ok",
  "result": [
    {
      "text": "Hello, how are you?",
      "url": "https://data.aix101.com/mp3/longxiaochun_v2_xxx.mp3"
    }
  ]
}
```

### **2. 播放器初始化**

**文件：** `src/pages/conversation/index.tsx`

```typescript
// 两个独立的音频播放器
this.audioContext = Taro.createInnerAudioContext()          // 用户录音播放器
this.digitalVoiceContext = Taro.createInnerAudioContext()  // 数字人语音播放器
```

### **3. 核心方法**

#### **playDigitalVoice - 播放数字人语音**

```typescript
playDigitalVoice = async (messageId: number, messageText: string) => {
  // 1. 去掉 Q:/A: 前缀
  const cleanText = messageText.replace(/^[QA]:\s*/, '')
  
  // 2. 调用数字人语音API
  const response = await voicePackAPI.generate([cleanText])
  
  // 3. 获取音频URL
  const audioUrl = response.result[0].url
  
  // 4. 播放音频
  this.digitalVoiceContext.src = audioUrl
  this.digitalVoiceContext.play()
  
  // 5. 启动动画
  this.startDigitalVoiceAnimation()
}
```

#### **自动播放 - AI流式输出完成后**

```typescript
// 在 streamText 方法中
if (currentIndex >= fullText.length) {
  // 流式输出完成
  clearInterval(streamInterval)
  
  // 自动播放AI消息的数字人语音
  this.playDigitalVoice(messageId, fullText)  // ← 自动调用
  
  // 显示下一条用户消息
  this.showNextUserMessage()
}
```

### **4. UI渲染**

```tsx
{/* 用户消息 */}
{message.isUser ? (
  <>
    {/* 录音气泡 */}
    {recordedMessages[message.id] && (
      <View className='voice-bubble' onClick={() => this.handlePlayVoice(message.id)}>
        <Text>{recordedMessages[message.id].duration}"</Text>
        {this.renderVoiceIcon(message.id)}
      </View>
    )}
    
    {/* 文本消息 */}
    <View className='message-bubble'>
      <Text>{message.text}</Text>
    </View>
    
    {/* 播放数字人语音按钮 ✅ */}
    <SafeAtButton onClick={() => this.playDigitalVoice(message.id, message.text)}>
      {this.renderDigitalVoiceIcon(message.id)} 播放
    </SafeAtButton>
  </>
) : (
  /* AI消息：去除播放按钮 ❌ */
  <View className='message-bubble'>
    <Text>{message.text}</Text>
    {message.isStreaming && <Text>●</Text>}
  </View>
)}
```

---

## 🎨 动画效果

### **播放状态图标**

```typescript
renderDigitalVoiceIcon = (messageId: number) => {
  if (playingDigitalVoiceId !== messageId) {
    return '🔊'  // 未播放状态
  }
  
  // 播放中：动画切换
  const icons = ['🔈', '🔉', '🔊']
  return icons[digitalVoiceIconIndex]
}
```

**动画效果：**
- 🔊 → 🔈 → 🔉 → 🔊 → 循环
- 每80ms切换一次图标
- 播放完成后恢复为 🔊

---

## 📋 使用流程

### **场景1：用户主动播放消息**

```
1. 用户看到消息："Q: Hello, how are you?"
2. 点击 [ 🔊 播放 ] 按钮
3. 系统调用数字人语音API
4. 自动播放返回的音频
5. 播放中图标动画：🔈 → 🔉 → 🔊
6. 播放完成，恢复 🔊 图标
```

### **场景2：AI消息自动播放**

```
1. AI开始流式输出："Good morning..."
2. 流式输出中显示：●
3. 流式输出完成
4. 🎵 自动调用数字人语音API
5. 🎵 自动播放返回的音频
6. 显示下一条用户消息，等待录音
```

---

## 🔍 调试日志

### **播放数字人语音**

```
=== 播放数字人语音 ===
消息ID: 123
消息内容: Q: Hello, how are you?
处理后文本: Hello, how are you?
调用数字人语音接口...
✅ 获取到音频URL: https://data.aix101.com/mp3/xxx.mp3
===============
```

### **AI流式输出完成**

```
=== AI消息流式输出完成 ===
🎵 AI流式输出完成，自动播放数字人语音
=== 播放数字人语音 ===
消息ID: 456
消息内容: A: Good morning! How can I help you today?
处理后文本: Good morning! How can I help you today?
...
```

---

## ⚙️ 配置说明

### **固定参数**

所有数字人语音API的参数都是固定的，无需配置：

```typescript
{
  voice: 'longxiaochun_v2',   // 语音类型：固定
  speech_rate: 5,             // 语速：固定为5
  pitch_rate: 5               // 音调：固定为5
}
```

### **文本处理**

- 自动去除 `Q:` 和 `A:` 前缀
- 只发送纯文本内容到API

**示例：**
```typescript
// 原始消息
"Q: Hello, how are you?"

// 处理后
"Hello, how are you?"

// 发送到API
{ text_list: ["Hello, how are you?"] }
```

---

## 🚫 已移除的功能

### **AI消息的播放按钮**

**之前：**
```tsx
<View className='message-bubble'>
  <Text>{message.text}</Text>
</View>
<SafeAtButton onClick={handlePlayMessage}>  ← 已移除
  🔊 播放
</SafeAtButton>
```

**现在：**
```tsx
<View className='message-bubble'>
  <Text>{message.text}</Text>
</View>
// 无播放按钮，自动播放
```

**原因：** AI消息在流式输出完成后会**自动播放**数字人语音，不需要手动点击。

---

## 🎯 关键特性

### **1. 自动播放**
- ✅ AI消息流式输出完成后自动调用API
- ✅ 自动播放返回的音频
- ✅ 无需用户手动操作

### **2. 独立播放器**
- ✅ 用户录音和数字人语音使用不同的播放器
- ✅ 互不干扰
- ✅ 可以同时管理

### **3. 动画反馈**
- ✅ 播放中图标动画
- ✅ 视觉反馈清晰
- ✅ 用户体验友好

### **4. 错误处理**
- ✅ API调用失败提示
- ✅ 播放失败提示
- ✅ 自动停止播放

---

## 📝 相关文件

- **API定义：** `src/utils/api_v2/voicePack.ts`
- **类型定义：** `src/utils/api_v2/types.ts`
- **对话页面：** `src/pages/conversation/index.tsx`
- **API导出：** `src/utils/api_v2/index.ts`

---

## ✅ 测试建议

### **1. 用户消息播放**
- 点击播放按钮
- 检查音频是否正确播放
- 检查图标动画是否正常

### **2. AI消息自动播放**
- 观察AI流式输出完成
- 检查是否自动调用API
- 检查音频是否自动播放

### **3. 控制台日志**
```
🎵 AI流式输出完成，自动播放数字人语音
=== 播放数字人语音 ===
消息ID: 456
处理后文本: Hello...
调用数字人语音接口...
✅ 获取到音频URL: https://...
```

---

## 🎉 总结

数字人语音功能已完全集成到对话练习中：

1. ✅ **用户消息**：手动点击播放
2. ✅ **AI消息**：自动播放（流式输出完成后）
3. ✅ **独立播放器**：互不干扰
4. ✅ **动画反馈**：视觉体验良好
5. ✅ **错误处理**：完善的异常处理

所有功能已实现并可正常使用！🎊

