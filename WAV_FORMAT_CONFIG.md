# 🎵 WAV 格式配置总结

## 📋 配置状态

### ✅ 1. NLS 语音识别（实时流式）

**配置文件**: `src/utils/voiceRecognition/TaroVoiceRecognitionService.ts`

**录音配置**:
```typescript
this.recorderManager.start({
  duration: 60000,
  sampleRate: 16000,      // ✅ 16kHz（NLS 要求）
  numberOfChannels: 1,    // ✅ 单声道
  format: 'wav',          // ✅ WAV 格式
  frameSize: 1            // 每1KB返回一次（用于实时识别）
})
```

**数据处理**:
- 录制格式: **WAV**（16bit PCM + 44字节文件头）
- 传输格式: **WAV**（直接发送，包含文件头）
- 处理流程: 
  ```
  WAV 帧数据 → 直接发送到 NLS WebSocket（无需处理）
  ```

**关键代码**:
```typescript
// 直接发送 WAV 数据（包含文件头）
Taro.sendSocketMessage({
  data: res.frameBuffer,  // 直接使用 WAV 帧数据
  success: () => {
    console.log('✅ WAV 数据发送成功')
  }
})

// 开始识别消息
const startMessage = {
  header: { /* ... */ },
  payload: {
    format: 'wav',  // ✅ 指定 WAV 格式
    sample_rate: 16000,
    enable_intermediate_result: true,
    // ...
  }
}
```

---

### ✅ 2. SOE 语音评测

**配置文件**: `src/utils/api_v2/soe.ts`

**接口配置**:
```typescript
const formData: Record<string, any> = {
  refText: refText,           // 参考文本
  engineType: '16k_en',       // 16kHz 英文引擎
  scoreCoeff: '1.0',          // 评分系数
  evalMode: '1',              // 评估模式
  recMode: '1',               // 识别模式
  voiceFormat: 'wav'          // ✅ WAV 格式（固定值）
}
```

**文件要求**:
- 格式: **WAV**
- 采样率: **16kHz**
- 声道: **单声道**
- 位深度: **16bit**

**使用示例**:
```typescript
// 传递 WAV 文件路径
const wavFilePath = 'wxfile://tmp_xxxxx.wav'
const response = await soeAPI.evaluate([wavFilePath], [refText])
```

---

## 📊 技术规格

### WAV 文件格式

**文件结构**:
```
┌─────────────────────────┐
│  RIFF Header (4 bytes)  │  "RIFF"
├─────────────────────────┤
│  File Size (4 bytes)    │  文件大小
├─────────────────────────┤
│  WAVE Header (4 bytes)  │  "WAVE"
├─────────────────────────┤
│  fmt Chunk (24 bytes)   │  格式信息
├─────────────────────────┤
│  data Chunk Header      │  "data" + 数据大小
├─────────────────────────┤
│  Audio Data (PCM)       │  ← 实际音频数据（纯 PCM）
└─────────────────────────┘
         总共 44 字节文件头
```

**参数规格**:
- **采样率**: 16000 Hz（16kHz）
- **位深度**: 16 bit
- **声道数**: 1（单声道）
- **编码**: Linear PCM
- **字节序**: Little-Endian（小端）

---

## 🔄 数据流转

### 完整流程图

```
用户长按录音
    ↓
开始 WAV 录音（16kHz, 16bit, 单声道）
    ↓
┌──────────────────┐
│ onFrameRecorded  │  ← 每1KB返回一次
│  回调触发        │
└────────┬─────────┘
         ↓
    直接发送 WAV 数据
         ↓
┌────────────────────┐
│ 发送到 NLS WebSocket │  ← 实时语音识别（WAV 格式）
└────────────────────┘
         ↓
    实时识别结果
         ↓
    显示识别文本
         ↓
    录音停止
         ↓
┌────────────────────┐
│ 保存完整 WAV 文件  │  ← 包含文件头
└────────┬───────────┘
         ↓
┌────────────────────┐
│ 上传到 SOE 接口    │  ← 语音评测
└────────────────────┘
         ↓
    评测结果
```

---

## ⚠️  重要注意事项

### 1. frameSize 参数兼容性

**微信小程序环境**:
- ✅ **mp3 + frameSize**: 支持
- ✅ **aac + frameSize**: 支持  
- ❓ **wav + frameSize**: **部分版本/平台可能不支持**

**检测方法**:
```typescript
// 如果 2 秒后未收到帧回调
setTimeout(() => {
  if (!hasReceivedFrame && this.isRecognizing) {
    console.error('❌ WAV 格式可能不支持 frameSize')
    console.error('建议：使用录音完成后的文件识别')
  }
}, 2000)
```

### 2. 实时识别 vs 文件识别

**实时识别**（当前实现）:
- ✅ 优点：即时反馈，用户体验好
- ❌ 缺点：依赖 frameSize 支持，兼容性问题

**文件识别**（备选方案）:
- ✅ 优点：100% 兼容，稳定性高
- ❌ 缺点：有延迟，无法显示中间结果

**推荐策略**: 
- 优先尝试实时识别
- 如果 frameSize 不工作，降级为文件识别

---

## 🔍 调试日志

### 成功情况（frameSize 工作）

```
📝 开始录音: WAV 格式, 16kHz, 单声道, frameSize=1
💡 将直接发送 WAV 数据到 NLS（包含文件头）
🎤 录音已开始
等待 onFrameRecorded 回调...
✅ 首次收到录音帧回调
首帧 WAV 数据大小: 1068 bytes
✅ 首帧 WAV 数据发送成功
📊 已发送 20 帧 WAV 数据
💡 正在发送 WAV 格式音频数据
📝 收到中间识别结果: hello
✅ 句子结束: hello world
```

### 失败情况（frameSize 不工作）

```
📝 尝试开始录音: wav, 16kHz, 单声道, frameSize=1
🎤 录音已开始
等待 onFrameRecorded 回调...
❌ 2秒后仍未收到录音帧回调
可能原因:
1. frameSize 参数在当前环境不生效
2. WAV 格式不支持实时帧回调
3. 录音权限问题
⏹️  录音已停止
实际收到帧数: 0
⚠️  未收到实时帧数据，frameSize 可能不生效
建议：使用录音文件进行一次性识别
```

---

## 📝 配置文件清单

### 已修改文件

1. ✅ `src/utils/voiceRecognition/TaroVoiceRecognitionService.ts`
   - 录音格式: `format: 'wav'`
   - 添加 WAV 文件头检测与去除逻辑
   - 实时提取 PCM 数据并发送到 NLS

2. ✅ `src/utils/api_v2/soe.ts`
   - 接口参数: `voiceFormat: 'wav'`
   - 已配置为 WAV 格式

3. ✅ `src/pages/conversation/index.tsx`
   - 使用 `getWavFilePath()` 获取 WAV 文件路径
   - 保存 WAV 文件用于 SOE 评测

---

## ✅ 配置确认

- [x] NLS 录音格式: **WAV**
- [x] NLS 传输格式: **WAV**（包含文件头）
- [x] SOE 接口格式: **WAV**
- [x] SOE voiceFormat 参数: **"wav"**
- [x] 采样率统一: **16kHz**
- [x] 声道统一: **单声道**
- [x] 位深度统一: **16bit**

---

## 🚀 测试建议

### 测试步骤

1. **测试实时识别**:
   - 长按录音按钮 2-3 秒
   - 观察是否出现 "✅ 首次收到录音帧回调"
   - 检查是否有实时识别文本

2. **测试 WAV 文件保存**:
   - 录音完成后查看日志
   - 确认 WAV 文件路径: `wxfile://tmp_xxxxx.wav`

3. **测试 SOE 评测**:
   - 完成练习时会调用 SOE 接口
   - 确认传递的是 WAV 文件路径

### 降级方案

如果遇到 frameSize 不工作：
1. 改用 **mp3 格式** + frameSize（测试帧回调）
2. 或改用 **文件识别**（录音完成后识别）

---

## 📚 相关文档

- [SOE API 使用说明](./SOE_API_USAGE.md)
- [语音识别指南](./VOICE_RECOGNITION_WITH_WAV_GUIDE.md)
- [音频格式信息](./AUDIO_FORMAT_INFO.md)

---

**更新时间**: 2025-01-28  
**配置状态**: ✅ 所有配置已设置为 WAV 格式  
**兼容性**: 取决于微信小程序版本对 WAV + frameSize 的支持

