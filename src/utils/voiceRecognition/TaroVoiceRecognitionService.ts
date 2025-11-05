import Taro from '@tarojs/taro'
import { VoiceRecognitionConfig, VoiceRecognitionCallbacks } from './types'
import { audio2TextAPI } from '../api_v2/audio2text'

/**
 * Taro小程序语音识别服务类
 * 
 * 使用方案：
 * - 使用 RecorderManager 直接录制 WAV 格式
 * - 录音完成后直接传递文件到 /api/digital_human/audio2text 接口进行语音识别
 */
export class TaroVoiceRecognitionService {
  private recorderManager: Taro.RecorderManager | null = null
  private voiceText: string = ''
  private isRecognizing: boolean = false
  public isDestroyed: boolean = false
  private recordingStartTime: number = 0

  private config: VoiceRecognitionConfig
  private callbacks: VoiceRecognitionCallbacks
  
  // 录音文件路径（WAV格式）
  private audioFilePath: string = ''

  constructor(config: VoiceRecognitionConfig, callbacks: VoiceRecognitionCallbacks) {
    this.config = {
      socketUrl: 'wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1',
      format: 'wav', // 默认使用 WAV 格式
      sampleRate: 16000,
      numberOfChannels: 1,
      frameSize: 50,
      autoStopDelay: 2000,
      gain: 0.05,
      appKey: 'tRAwRgCPdmM3pqeJ',
      ...config
    }
    this.callbacks = callbacks
  }

  // 开始音频采集（使用 RecorderManager，直接录制 WAV 格式）
  private async startAudioCapture(): Promise<void> {
    if (this.isDestroyed) return

    try {
      console.log('🎙️ 开始初始化录音管理器（WAV格式）...')
      
      // 初始化录音管理器
      this.recorderManager = Taro.getRecorderManager()
      
      // 监听录音开始
      this.recorderManager.onStart(() => {
        console.log('✅ 录音开始（WAV格式）')
        this.isRecognizing = true
        this.callbacks.onStarted?.()
      })

      // 监听录音停止
      this.recorderManager.onStop(async (res) => {
        const tempFilePath = res.tempFilePath
        console.log('✅ 录音停止，文件路径:', tempFilePath)
        this.isRecognizing = false
        this.callbacks.onStopped?.()

        if (!tempFilePath) {
          this.callbacks.onError?.('未获取到录音文件')
          return
        }

        // 保存文件路径（已经是 WAV 格式）
        this.audioFilePath = tempFilePath

        // 直接调用语音识别接口（不需要转换）
        try {
          this.callbacks.onResult?.('识别中...', false)
          
          console.log('🔄 开始调用 audio2text API 识别音频...')
          console.log('📁 音频文件路径:', tempFilePath)
          
          // 直接调用音频转文字 API（文件已经是 WAV 格式）
          const text = await audio2TextAPI.recognize(tempFilePath)
          
          if (text) {
            console.log('✅ 语音识别成功:', text)
            this.voiceText = text
            this.callbacks.onResult?.(text, true)
          } else {
            console.error('❌ 语音识别返回空文本')
            this.callbacks.onError?.('语音识别失败: 未返回文本')
          }
        } catch (error) {
          console.error('❌ 识别过程出错:', error)
          this.callbacks.onError?.('识别失败: ' + (error instanceof Error ? error.message : '未知错误'))
        }
      })

      // 监听录音错误
      this.recorderManager.onError((err) => {
        console.error('❌ 录音错误:', err)
        this.isRecognizing = false
        this.callbacks.onError?.('录音失败: ' + (err.errMsg || '未知错误'))
      })

      // 开始录音（使用 WAV 格式）
      const recordOptions = {
        format: 'wav' as const, // 直接使用 WAV 格式（小写）
        sampleRate: (this.config.sampleRate || 16000) as 8000 | 11025 | 12000 | 16000 | 22050 | 24000 | 32000 | 44100 | 48000,
        numberOfChannels: (this.config.numberOfChannels || 1) as 1 | 2,
        frameSize: this.config.frameSize || 50,
        duration: 60000, // 最大录音时长60秒
        encodeBitRate: 96000 // 编码码率
      }

      console.log('🎙️ 调用 recorderManager.start()，参数:', recordOptions)
      this.recorderManager.start(recordOptions)
      console.log('✅ recorderManager.start() 调用完成')
      console.log('🎙️ 录音参数配置:')
      console.log('  - 格式: WAV (直接录制)')
      console.log('  - 采样率:', recordOptions.sampleRate, 'Hz')
      console.log('  - 声道数:', recordOptions.numberOfChannels, '(单声道)')
      console.log('  - 帧大小:', recordOptions.frameSize, 'KB')
      console.log('  - 最大时长:', recordOptions.duration / 1000, '秒')

    } catch (error) {
      console.error('❌ 启动音频采集失败:', error)
      this.isRecognizing = false
      this.callbacks.onError?.('启动音频采集出错: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // 停止音频采集
  private stopAudioCapture(): void {
    if (this.recorderManager) {
      try {
        this.recorderManager.stop()
        console.log('✅ 停止录音成功')
      } catch (error) {
        console.error('❌ 停止录音失败:', error)
      }
      this.recorderManager = null
    }
  }

  // 开始语音识别
  public async start(): Promise<void> {
    if (this.isDestroyed || this.isRecognizing) return

    console.log('🎤 开始语音识别（使用 RecorderManager 录制 WAV 格式）')
    
    this.voiceText = ''
    this.audioFilePath = ''
    this.recordingStartTime = Date.now()
    
    // 开始录音
    await this.startAudioCapture()
  }

  // 停止语音识别
  public stop(): void {
    if (this.isDestroyed || !this.isRecognizing) return

    console.log('🛑 停止录音...')
    
    // 停止录音（会触发 onStop 回调，在回调中直接调用 audio2text API）
    this.stopAudioCapture()
  }

  // 销毁实例，清理所有资源
  public destroy(): void {
    this.isDestroyed = true
    this.stopAudioCapture()
    this.isRecognizing = false
    this.voiceText = ''
    this.audioFilePath = ''
    this.recordingStartTime = 0
    this.callbacks.onDestroy?.('destroy')
  }

  // 获取当前识别状态
  public getIsRecognizing(): boolean {
    return this.isRecognizing && !this.isDestroyed
  }

  // 获取当前语音文本
  public getCurrentText(): string {
    return this.voiceText
  }

  // 获取音频文件路径（WAV格式）
  public getPcmFilePath(): string {
    return this.audioFilePath
  }
}
