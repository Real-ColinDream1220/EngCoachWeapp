import Taro from '@tarojs/taro'
import { VoiceRecognitionCallbacks } from './types'
import { audio2TextAPI } from '../api_v2/audio2text'
import { convertPcmToWav } from '../audioUtils'

/**
 * 简化版 Taro 语音识别服务
 * 不使用 RecorderManager，使用 Taro.startRecord() 和 Taro.stopRecord()
 * 录音完成后调用音频转文字 API
 * 
 * 注意：这不是实时识别，而是录音完成后识别
 */
export class TaroVoiceRecognitionServiceSimple {
  private isRecognizing: boolean = false
  public isDestroyed: boolean = false
  private callbacks: VoiceRecognitionCallbacks
  private recordingStartTime: number = 0
  private pcmFilePath: string = ''

  constructor(callbacks: VoiceRecognitionCallbacks) {
    this.callbacks = callbacks
  }

  // 开始录音
  public async start(): Promise<void> {
    if (this.isDestroyed || this.isRecognizing) return

    try {
      this.isRecognizing = true
      this.recordingStartTime = Date.now()
      this.pcmFilePath = ''

      // 开始录音
      await Taro.startRecord({
        success: () => {
          console.log('✅ 录音开始')
          this.callbacks.onStarted?.()
        },
        fail: (err) => {
          console.error('❌ 录音开始失败:', err)
          this.isRecognizing = false
          this.callbacks.onError?.('录音开始失败: ' + (err.errMsg || '未知错误'))
        }
      })
    } catch (error) {
      console.error('❌ 启动录音失败:', error)
      this.isRecognizing = false
      this.callbacks.onError?.('启动录音失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // 停止录音并识别
  public stop(): void {
    if (this.isDestroyed || !this.isRecognizing) return

    try {
      // 停止录音
      Taro.stopRecord({
        success: async (res) => {
          console.log('✅ 录音停止，文件路径:', res.tempFilePath)
          this.isRecognizing = false
          this.callbacks.onStopped?.()

          const tempFilePath = res.tempFilePath
          if (!tempFilePath) {
            this.callbacks.onError?.('未获取到录音文件')
            return
          }

          // 保存文件路径
          this.pcmFilePath = tempFilePath

          // 识别音频
          try {
            this.callbacks.onResult?.('识别中...', false)
            
            // 如果文件是 PCM 格式，需要转换为 WAV
            let wavFilePath = tempFilePath
            if (tempFilePath.toLowerCase().endsWith('.pcm')) {
              console.log('🔄 将 PCM 转换为 WAV...')
              wavFilePath = await convertPcmToWav(tempFilePath, 16000, 1, 16)
              console.log('✅ PCM 转换完成:', wavFilePath)
            }

            // 调用音频转文字 API
            const result = await audio2TextAPI.recognize(wavFilePath)
            
            if (result.success && result.data) {
              const text = result.data.text || ''
              console.log('✅ 语音识别成功:', text)
              this.callbacks.onResult?.(text, true)
            } else {
              console.error('❌ 语音识别失败:', result)
              this.callbacks.onError?.('语音识别失败: ' + (result.message || '未知错误'))
            }
          } catch (error) {
            console.error('❌ 识别过程出错:', error)
            this.callbacks.onError?.('识别失败: ' + (error instanceof Error ? error.message : '未知错误'))
          }
        },
        fail: (err) => {
          console.error('❌ 录音停止失败:', err)
          this.isRecognizing = false
          this.callbacks.onError?.('录音停止失败: ' + (err.errMsg || '未知错误'))
        }
      })
    } catch (error) {
      console.error('❌ 停止录音异常:', error)
      this.isRecognizing = false
      this.callbacks.onError?.('停止录音失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // 销毁实例
  public destroy(): void {
    this.isDestroyed = true
    this.isRecognizing = false
    this.pcmFilePath = ''
    this.callbacks.onDestroy?.('destroy')
  }

  // 获取当前识别状态
  public getIsRecognizing(): boolean {
    return this.isRecognizing && !this.isDestroyed
  }

  // 获取当前语音文本（简化版不支持实时文本）
  public getCurrentText(): string {
    return ''
  }

  // 获取 PCM 文件路径
  public getPcmFilePath(): string {
    return this.pcmFilePath
  }
}

