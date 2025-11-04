# Taro 语音识别服务使用说明

本项目提供了两种语音识别方案：

## 方案对比

| 特性 | 方案1: TaroVoiceRecognitionService | 方案2: TaroVoiceRecognitionServiceSimple |
|------|-------------------------------------|------------------------------------------|
| **实时识别** | ✅ 支持（实时返回结果） | ❌ 不支持（录音完成后识别） |
| **依赖** | 需要 RecorderManager | 只需 Taro.startRecord() |
| **复杂度** | 较高（WebSocket + 音频帧处理） | 较低（录音后调用API） |
| **体验** | 更好（实时反馈） | 一般（需要等待录音完成） |
| **推荐场景** | 需要实时识别、用户体验要求高 | 简单场景、RecorderManager 不可用 |

## 方案1: 实时语音识别（推荐）

使用 `TaroVoiceRecognitionService`，通过 WebSocket 实时发送音频帧到阿里云 NLS，实现实时语音识别。

### 特点
- ✅ 实时识别，边说边显示结果
- ✅ 通过 WebSocket 实时传输音频数据
- ✅ 使用 RecorderManager 的 `onFrameRecorded` 获取音频帧

### 使用方法

```typescript
import { TaroVoiceRecognitionService } from '@/utils/voiceRecognition'

const service = new TaroVoiceRecognitionService(
  {
    // 可选配置，会自动获取 token 和 appKey
  },
  {
    onResult: (text: string, isFinal: boolean) => {
      console.log('识别结果:', text, '是否最终:', isFinal)
    },
    onError: (error: string) => {
      console.error('识别错误:', error)
    },
    onStarted: () => {
      console.log('识别开始')
    },
    onStopped: () => {
      console.log('识别停止')
    }
  }
)

// 开始识别
await service.start()

// 停止识别
service.stop()

// 销毁服务
service.destroy()
```

### 注意事项
- 需要小程序支持 `RecorderManager.onFrameRecorded`
- 需要网络连接（WebSocket）
- 需要获取 NLS Token（自动获取）

## 方案2: 简化版语音识别

使用 `TaroVoiceRecognitionServiceSimple`，录音完成后调用音频转文字 API。

### 特点
- ✅ 不依赖 RecorderManager
- ✅ 使用 Taro.startRecord() / Taro.stopRecord()
- ✅ 录音完成后识别
- ❌ 不支持实时识别

### 使用方法

```typescript
import { TaroVoiceRecognitionServiceSimple } from '@/utils/voiceRecognition'

const service = new TaroVoiceRecognitionServiceSimple({
  onResult: (text: string, isFinal: boolean) => {
    console.log('识别结果:', text)
  },
  onError: (error: string) => {
    console.error('识别错误:', error)
  },
  onStarted: () => {
    console.log('录音开始')
  },
  onStopped: () => {
    console.log('录音停止')
  }
})

// 开始录音
await service.start()

// 停止录音并识别
service.stop()

// 销毁服务
service.destroy()
```

## 常见问题

### Q: 为什么方案1没有识别结果？
A: 可能的原因：
1. `onFrameRecorded` 回调未触发 - 检查小程序是否支持此功能
2. WebSocket 连接失败 - 检查网络和 token
3. 音频帧未发送成功 - 检查日志中的错误信息

### Q: 方案1和方案2的区别？
A: 
- 方案1：实时识别，边说边显示结果，需要 RecorderManager
- 方案2：录音完成后识别，需要等待录音完成，只需 Taro.startRecord()

### Q: 如何选择方案？
A:
- 需要实时识别 → 使用方案1
- RecorderManager 不可用 → 使用方案2
- 简单场景，不需要实时识别 → 使用方案2

## 调试建议

如果方案1不工作，请检查：
1. 控制台日志中是否有 "🎵 收到音频帧数据"
2. 是否有 "✅ 音频帧发送成功" 日志
3. WebSocket 是否正常连接（"WebSocket已打开"）
4. 是否收到 "TranscriptionStarted" 消息

如果都没有，可能是：
- 小程序平台不支持 `onFrameRecorded`
- 录音配置有问题
- WebSocket 连接失败

此时建议切换到方案2。

