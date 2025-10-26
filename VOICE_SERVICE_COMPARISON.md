# 语音识别服务对比

## 旧版 vs 新版

### 旧版：`TaroVoiceRecognitionService`

```typescript
// ❌ 只支持语音识别，无法生成 WAV 文件
onFrameRecorded((res) => {
  // 只发送给 NLS
  Taro.sendSocketMessage({
    data: res.frameBuffer
  })
})
```

**功能**：
- ✅ 实时语音识别（NLS）
- ❌ 无法生成 WAV 文件
- ❌ 无法用于 SOE 评测

**使用场景**：
- 只需要语音转文字
- 不需要音频文件

---

### 新版：`TaroVoiceRecognitionWithWav`

```typescript
// ✅ 同时支持语音识别 + WAV 生成
onFrameRecorded((res) => {
  // 1. 缓存 PCM 数据
  this.pcmDataBuffers.push(res.frameBuffer)
  this.totalPcmDataSize += res.frameBuffer.byteLength
  
  // 2. 发送给 NLS
  Taro.sendSocketMessage({
    data: res.frameBuffer
  })
})

// 录音停止时自动生成 WAV
onStop(() => {
  this.generateWavFile()  // 自动合并 PCM 并转换为 WAV
})
```

**功能**：
- ✅ 实时语音识别（NLS）
- ✅ 自动生成 WAV 文件
- ✅ 支持 SOE 评测
- ✅ 性能优化（日志节流）
- ✅ 内存管理（自动清理缓存）

**使用场景**：
- 需要语音转文字 + 语音评测
- 一次录音，两种用途
- 对话练习场景

---

## 功能对比表

| 功能 | 旧版 | 新版 | 备注 |
|-----|------|------|------|
| 实时语音识别 | ✅ | ✅ | 通过 NLS WebSocket |
| 生成 WAV 文件 | ❌ | ✅ | 自动转换 PCM → WAV |
| SOE 语音评测 | ❌ | ✅ | 可直接使用生成的 WAV |
| PCM 数据缓存 | ❌ | ✅ | 内存缓存，录音结束后清理 |
| WAV 回调 | ❌ | ✅ | `onWavReady(filePath)` |
| 内存管理 | - | ✅ | 自动清理缓存，防止溢出 |
| 日志优化 | ❌ | ✅ | 日志节流（每 20 帧） |
| 可配置导出 | ❌ | ✅ | `enableWavExport` 开关 |
| 统计信息 | ❌ | ✅ | `getPcmStats()` 方法 |

---

## 性能对比

### 内存占用

**旧版**：
```
基础内存 + 录音缓冲区
≈ 2MB (60秒录音)
```

**新版**：
```
基础内存 + 录音缓冲区 + PCM 缓存
≈ 2MB (录音) + 2MB (PCM 缓存) = 4MB (60秒录音)
录音结束后立即释放 PCM 缓存
```

### CPU 占用

**旧版**：
```
仅发送数据
CPU 占用低
```

**新版**：
```
发送数据 + 缓存数据
CPU 占用略高（+5%）
但仍在可接受范围
```

### 网络流量

**旧版 & 新版相同**：
```
仅发送 PCM 数据给 NLS
网络流量相同
```

---

## 使用建议

### 何时使用旧版？

```typescript
// 场景：只需要语音转文字，不需要音频文件
// 例如：语音搜索、语音输入

import { TaroVoiceRecognitionService } from '@/utils/voiceRecognition/TaroVoiceRecognitionService'

const service = new TaroVoiceRecognitionService(config, {
  onResult: (text) => {
    // 仅处理识别文本
    console.log('识别结果:', text)
  }
})
```

### 何时使用新版？

```typescript
// 场景：需要语音转文字 + 语音评测
// 例如：英语口语练习、发音纠正

import { TaroVoiceRecognitionWithWav } from '@/utils/voiceRecognition/TaroVoiceRecognitionWithWav'

const service = new TaroVoiceRecognitionWithWav(config, {
  onResult: (text) => {
    // 处理识别文本
    console.log('识别结果:', text)
  },
  onWavReady: (wavPath) => {
    // 处理 WAV 文件（评测）
    performSoeEvaluation(wavPath)
  }
})
```

---

## 数据流对比

### 旧版数据流

```
麦克风
  ↓
RecorderManager
  ↓
onFrameRecorded
  ↓
WebSocket → NLS
  ↓
识别结果
  ↓
onResult 回调
```

### 新版数据流

```
麦克风
  ↓
RecorderManager
  ↓
onFrameRecorded
  ├─→ WebSocket → NLS → 识别结果 → onResult 回调
  └─→ PCM 缓存 → 录音停止 → 合并 PCM → 转换 WAV → onWavReady 回调
```

---

## 迁移指南

### 从旧版迁移到新版

**步骤 1：更改导入**

```typescript
// 旧版
import { TaroVoiceRecognitionService } from '@/utils/voiceRecognition/TaroVoiceRecognitionService'

// 新版
import { TaroVoiceRecognitionWithWav } from '@/utils/voiceRecognition/TaroVoiceRecognitionWithWav'
```

**步骤 2：添加 WAV 回调**

```typescript
// 旧版
const service = new TaroVoiceRecognitionService(config, {
  onResult: (text) => { ... }
})

// 新版
const service = new TaroVoiceRecognitionWithWav(config, {
  onResult: (text) => { ... },
  onWavReady: (wavPath) => {
    // 新增：处理 WAV 文件
    this.performSoeEvaluation(wavPath)
  }
})
```

**步骤 3：（可选）禁用 WAV 导出**

如果不需要 WAV 文件，可以禁用：

```typescript
const service = new TaroVoiceRecognitionWithWav(
  {
    ...config,
    enableWavExport: false  // 禁用 WAV 导出
  },
  callbacks
)
```

---

## 实际应用案例

### 案例 1：对话练习（推荐使用新版）

```typescript
// 结构化练习：需要识别 + 评测
const practiceService = new TaroVoiceRecognitionWithWav(config, {
  onResult: (text) => {
    // 实时显示识别文本
    this.setState({ recognizedText: text })
  },
  onWavReady: async (wavPath) => {
    // 1. 上传音频
    const uploadRes = await fileAPI.uploadFile(wavPath)
    const fileUrl = uploadRes.data?.file?.url
    
    // 2. SOE 评测
    const soeRes = await soeAPI.evaluate(wavPath, this.state.refText)
    
    // 3. 保存到数据库
    await audioAPI.editAudio({
      student_id: studentId,
      exercise_id: exerciseId,
      file: fileUrl,
      score: soeRes.data?.score,
      feedback: JSON.stringify(soeRes.data)
    })
  }
})
```

### 案例 2：自由对话（推荐使用新版）

```typescript
// 自由对话：识别 + AI 回复 + 评测
const freeService = new TaroVoiceRecognitionWithWav(config, {
  onResult: async (text, isFinal) => {
    if (isFinal) {
      // 发送给 AI 获取回复
      const aiResponse = await aiChatAPI.completions({
        tid: topicId,
        text: text
      })
    }
  },
  onWavReady: async (wavPath) => {
    // 保存录音供后续分析
    await this.saveAudioForAnalysis(wavPath)
  }
})
```

### 案例 3：语音输入（推荐使用旧版）

```typescript
// 简单的语音输入：仅需识别
const inputService = new TaroVoiceRecognitionService(config, {
  onResult: (text) => {
    // 直接填充到输入框
    this.setState({ inputValue: text })
  }
})
```

---

## 总结

### 选择建议

| 场景 | 推荐版本 | 理由 |
|-----|---------|------|
| 英语口语练习 | 新版 | 需要评测 |
| 发音纠正 | 新版 | 需要评测 |
| 对话练习 | 新版 | 需要评测 + 存档 |
| 语音搜索 | 旧版 | 只需识别 |
| 语音输入 | 旧版 | 只需识别 |
| 语音备忘录 | 新版 | 需要保存音频 |

### 性能影响

- **内存**: 新版增加 ~2MB（60秒录音）
- **CPU**: 新版增加 ~5%
- **网络**: 无影响（发送数据相同）
- **用户体验**: 无影响（处理在后台）

### 推荐方案

**对于 EngCoach 项目**，建议：
1. **对话练习页面**使用新版（需要评测）
2. **自由对话页面**使用新版（需要评测）
3. **其他简单场景**可使用旧版


