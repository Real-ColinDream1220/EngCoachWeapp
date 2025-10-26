# 🎙️ 语音识别 + WAV 导出 使用指南

## 功能概述

`TaroVoiceRecognitionWithWav` 是一个增强版的语音识别服务，支持：

1. **实时语音识别**：PCM 数据实时发送给阿里云 NLS 进行语音转文字
2. **WAV 文件生成**：同时缓存 PCM 数据，录音结束后自动生成 WAV 文件
3. **SOE 评测**：生成的 WAV 文件可直接用于 SOE 语音评测

## 核心原理

```
┌─────────────┐
│  开始录音    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  onFrameRecorded 回调触发          │
│  (每 1KB 触发一次)                 │
└──────┬──────────────────────────────┘
       │
       ├──────────────────┬───────────────────┐
       ▼                  ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ 发送给 NLS   │   │ 缓存到内存   │   │ 显示日志     │
│ (实时识别)   │   │ (生成 WAV)   │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
       │                  │
       ▼                  │
┌──────────────┐          │
│ 返回识别文本 │          │
└──────────────┘          │
                          │
                          ▼
                   ┌──────────────┐
                   │  录音停止    │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ 合并 PCM 数据│
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ 转换为 WAV   │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ 保存为文件   │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │onWavReady回调│
                   └──────────────┘
```

## 使用方法

### 1. 导入服务类

```typescript
import { TaroVoiceRecognitionWithWav } from '@/utils/voiceRecognition/TaroVoiceRecognitionWithWav'
import { nlsAPI } from '@/utils/api_v2'
```

### 2. 获取 NLS Token

```typescript
// 获取阿里云 NLS Token
const nlsResponse = await nlsAPI.getNlsToken()
const token = nlsResponse.data?.Token?.Id || ''
const appKey = 'YOUR_APP_KEY'  // 从阿里云控制台获取
```

### 3. 创建服务实例

```typescript
const voiceService = new TaroVoiceRecognitionWithWav(
  {
    token: token,
    appKey: appKey,
    enableWavExport: true  // 启用 WAV 导出（默认 true）
  },
  {
    // 识别结果回调
    onResult: (text: string, isFinal: boolean) => {
      console.log('识别结果:', text)
      console.log('是否最终结果:', isFinal)
      
      // 更新 UI 显示识别文本
      this.setState({ recognizedText: text })
    },
    
    // WAV 文件生成完成回调
    onWavReady: async (wavFilePath: string) => {
      console.log('✅ WAV 文件已生成:', wavFilePath)
      
      // 上传文件
      const { fileAPI } = await import('@/utils/api_v2')
      const uploadResponse = await fileAPI.uploadFile(wavFilePath)
      
      if (uploadResponse.success) {
        const fileUrl = uploadResponse.data?.file?.url
        
        // 调用 SOE 评测
        const { soeAPI } = await import('@/utils/api_v2')
        const refText = 'Hello, how are you?'  // 参考文本
        const soeResponse = await soeAPI.evaluate(wavFilePath, refText)
        
        if (soeResponse.success) {
          console.log('✅ SOE 评测成功:', soeResponse.data)
          // 显示评测结果
          this.setState({ soeResult: soeResponse.data })
        }
      }
    },
    
    // 错误回调
    onError: (error: string) => {
      console.error('❌ 语音识别错误:', error)
      Taro.showToast({
        title: error,
        icon: 'none'
      })
    },
    
    // 开始回调
    onStarted: () => {
      console.log('🎤 开始录音')
      this.setState({ isRecording: true })
    },
    
    // 停止回调
    onStopped: () => {
      console.log('⏹️  停止录音')
      this.setState({ isRecording: false })
    }
  }
)
```

### 4. 开始录音

```typescript
// 开始语音识别
await voiceService.start()
```

### 5. 停止录音

```typescript
// 停止语音识别
voiceService.stop()

// 注意：stop() 后会自动触发 WAV 文件生成
// 生成完成后会调用 onWavReady 回调
```

### 6. 销毁实例

```typescript
// 组件卸载时清理
componentWillUnmount() {
  if (this.voiceService) {
    this.voiceService.destroy()
  }
}
```

## 完整示例

```typescript
import { Component } from 'react'
import { View, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { TaroVoiceRecognitionWithWav } from '@/utils/voiceRecognition/TaroVoiceRecognitionWithWav'
import { nlsAPI, soeAPI, fileAPI } from '@/utils/api_v2'

export default class VoicePractice extends Component {
  state = {
    isRecording: false,
    recognizedText: '',
    wavFilePath: '',
    soeResult: null,
    referenceText: 'Hello, how are you today?'
  }
  
  voiceService: TaroVoiceRecognitionWithWav | null = null

  // 初始化语音识别服务
  initVoiceService = async () => {
    try {
      // 1. 获取 NLS Token
      Taro.showLoading({ title: '初始化中...' })
      const nlsResponse = await nlsAPI.getNlsToken()
      
      if (!nlsResponse.success) {
        throw new Error('获取 NLS Token 失败')
      }
      
      const token = nlsResponse.data?.Token?.Id || ''
      const appKey = 'YOUR_APP_KEY'  // 替换为您的 AppKey
      
      console.log('✅ NLS Token 获取成功')
      
      // 2. 创建语音服务
      this.voiceService = new TaroVoiceRecognitionWithWav(
        {
          token: token,
          appKey: appKey,
          enableWavExport: true
        },
        {
          onResult: (text: string, isFinal: boolean) => {
            console.log('识别中:', text, '最终:', isFinal)
            this.setState({ recognizedText: text })
          },
          
          onWavReady: async (wavFilePath: string) => {
            console.log('✅ WAV 文件已生成:', wavFilePath)
            this.setState({ wavFilePath })
            
            // 自动进行 SOE 评测
            await this.performSoeEvaluation(wavFilePath)
          },
          
          onError: (error: string) => {
            console.error('❌ 错误:', error)
            Taro.showToast({ title: error, icon: 'none' })
          },
          
          onStarted: () => {
            console.log('🎤 开始录音')
            this.setState({ isRecording: true })
          },
          
          onStopped: () => {
            console.log('⏹️  停止录音')
            this.setState({ isRecording: false })
          }
        }
      )
      
      Taro.hideLoading()
      console.log('✅ 语音服务初始化完成')
      
    } catch (error: any) {
      Taro.hideLoading()
      console.error('❌ 初始化失败:', error)
      Taro.showToast({
        title: error.message || '初始化失败',
        icon: 'none'
      })
    }
  }

  // 执行 SOE 评测
  performSoeEvaluation = async (wavFilePath: string) => {
    try {
      Taro.showLoading({ title: '评测中...' })
      
      const { referenceText } = this.state
      
      // 调用 SOE 评测接口
      const soeResponse = await soeAPI.evaluate(wavFilePath, referenceText)
      
      Taro.hideLoading()
      
      if (soeResponse.success) {
        console.log('✅ SOE 评测成功:', soeResponse.data)
        this.setState({ soeResult: soeResponse.data })
        
        Taro.showToast({
          title: '评测完成',
          icon: 'success'
        })
      } else {
        throw new Error(soeResponse.message || '评测失败')
      }
      
    } catch (error: any) {
      Taro.hideLoading()
      console.error('❌ SOE 评测失败:', error)
      Taro.showToast({
        title: error.message || '评测失败',
        icon: 'none'
      })
    }
  }

  // 开始录音
  startRecording = async () => {
    if (!this.voiceService) {
      await this.initVoiceService()
    }
    
    if (this.voiceService) {
      await this.voiceService.start()
    }
  }

  // 停止录音
  stopRecording = () => {
    if (this.voiceService) {
      this.voiceService.stop()
    }
  }

  componentWillUnmount() {
    if (this.voiceService) {
      this.voiceService.destroy()
    }
  }

  render() {
    const { isRecording, recognizedText, soeResult, referenceText } = this.state
    
    return (
      <View className='voice-practice'>
        <View className='reference-text'>
          参考文本：{referenceText}
        </View>
        
        <View className='recognized-text'>
          识别结果：{recognizedText || '（开始说话...）'}
        </View>
        
        <Button
          onClick={isRecording ? this.stopRecording : this.startRecording}
          className={isRecording ? 'stop-btn' : 'start-btn'}
        >
          {isRecording ? '停止录音' : '开始录音'}
        </Button>
        
        {soeResult && (
          <View className='soe-result'>
            <View>评分：{soeResult.score}</View>
            <View>准确度：{soeResult.accuracy}</View>
            <View>流利度：{soeResult.fluency}</View>
          </View>
        )}
      </View>
    )
  }
}
```

## 配置选项

### VoiceRecognitionConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|-----|------|------|--------|------|
| token | string | ✅ | - | 阿里云 NLS Token |
| appKey | string | ✅ | - | 阿里云 NLS AppKey |
| socketUrl | string | ❌ | wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1 | WebSocket 地址 |
| autoStopDelay | number | ❌ | 2000 | 自动停止延迟（毫秒） |
| enableWavExport | boolean | ❌ | true | 是否启用 WAV 导出 |

### VoiceRecognitionCallbacks

| 回调 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| onResult | (text: string, isFinal: boolean) => void | ✅ | 识别结果回调 |
| onWavReady | (wavFilePath: string) => void | ❌ | WAV 文件生成完成回调 |
| onError | (error: string) => void | ❌ | 错误回调 |
| onStarted | () => void | ❌ | 开始录音回调 |
| onStopped | () => void | ❌ | 停止录音回调 |

## WAV 文件格式

生成的 WAV 文件规格：
- **格式**: PCM
- **采样率**: 16000 Hz
- **位深度**: 16 bits
- **声道数**: 1 (单声道)
- **文件位置**: `${Taro.env.USER_DATA_PATH}/recording_${timestamp}.wav`

## 性能优化

### 1. 内存管理

- PCM 数据在内存中缓存
- 录音停止后自动清空缓存
- 避免长时间录音导致内存溢出

### 2. 帧处理优化

```typescript
// 每 1KB 触发一次 onFrameRecorded
frameSize: 1

// 日志节流：每 20 帧输出一次日志
if (frameCount === 1 || frameCount % 20 === 0) {
  console.log('处理帧 #', frameCount)
}
```

### 3. 异步处理

```typescript
// WAV 生成在后台异步进行
// 不阻塞主线程
this.generateWavFile()
```

## 调试技巧

### 1. 启用详细日志

所有关键步骤都有详细日志输出：

```
✅ NLS Token 获取成功
🎤 开始录音
📦 开始缓存 PCM 数据用于 WAV 生成
📊 发送音频帧 #1 给 NLS, 大小: 1024 bytes
📦 已缓存 20 帧 PCM 数据，总大小: 20480 bytes
⏹️  录音已停止, 时长: 3000 ms
=== 开始生成 WAV 文件 ===
PCM 片段数量: 45
总 PCM 数据大小: 46080 bytes
✅ PCM 数据合并完成
✅ WAV 文件生成完成，总大小: 46124 bytes
✅ WAV 文件已保存: wxfile://usr/recording_1234567890.wav
```

### 2. 验证 WAV 文件

```typescript
// 验证文件大小
const fileInfo = await Taro.getFileSystemManager().getFileInfo({
  filePath: wavFilePath
})
console.log('WAV 文件大小:', fileInfo.size, 'bytes')

// 验证文件可访问
const fileExists = await Taro.getFileSystemManager().access({
  path: wavFilePath
})
```

### 3. 测试 SOE 评测

```typescript
// 直接测试 SOE
const testSoe = async () => {
  const soeResponse = await soeAPI.evaluate(
    wavFilePath,
    'Hello, how are you?'
  )
  
  if (soeResponse.success) {
    console.log('SOE 评测结果:', soeResponse.data)
  } else {
    console.error('SOE 评测失败:', soeResponse.message)
  }
}
```

## 常见问题

### Q1: 小程序不支持 PCM 格式怎么办？

**A**: 在小程序中，如果 `format: 'PCM'` 不支持，可以使用 `format: 'wav'`：

```typescript
this.recorderManager.start({
  duration: 60000,
  sampleRate: 16000,
  numberOfChannels: 1,
  format: 'wav',  // 改用 wav
  frameSize: 1
})
```

然后相应地调整数据处理逻辑。

### Q2: WAV 文件太大怎么办？

**A**: 可以限制录音时长或降低采样率：

```typescript
// 限制录音时长为 10 秒
this.recorderManager.start({
  duration: 10000,  // 10秒
  // ...
})
```

### Q3: 如何禁用 WAV 导出？

**A**: 设置 `enableWavExport: false`：

```typescript
const voiceService = new TaroVoiceRecognitionWithWav(
  {
    token: token,
    appKey: appKey,
    enableWavExport: false  // 禁用 WAV 导出
  },
  callbacks
)
```

### Q4: 能否同时录多个音频？

**A**: 不建议。Taro 的 RecorderManager 是全局单例，同时只能有一个录音实例。

## 完整工作流程

```
1. 用户点击"开始录音"
   ↓
2. 初始化 NLS Token 和 AppKey
   ↓
3. 创建 TaroVoiceRecognitionWithWav 实例
   ↓
4. 调用 start() 开始录音
   ↓
5. onFrameRecorded 触发
   ├─→ 发送 PCM 给 NLS (实时识别)
   └─→ 缓存 PCM 到内存 (生成 WAV)
   ↓
6. onResult 回调返回识别文本
   ↓
7. 用户点击"停止录音"
   ↓
8. 调用 stop() 停止录音
   ↓
9. onStop 触发，自动生成 WAV 文件
   ↓
10. onWavReady 回调返回 WAV 文件路径
   ↓
11. 上传 WAV 文件
   ↓
12. 调用 SOE 评测接口
   ↓
13. 显示评测结果
```

## 相关文件

- **服务类**: `src/utils/voiceRecognition/TaroVoiceRecognitionWithWav.ts`
- **SOE API**: `src/utils/api_v2/soe.ts`
- **NLS API**: `src/utils/api_v2/nls.ts`
- **文件上传 API**: `src/utils/api_v2/file.ts`

## 更新日志

- **2024-10-26**: 创建 TaroVoiceRecognitionWithWav 服务类，支持同时识别和生成 WAV


