import Taro from '@tarojs/taro'

/**
 * Taro 语音识别服务类（基于阿里云 NLS）
 * 
 * 注意：由于小程序环境限制，这里使用简化的录音后识别方式
 * 如果需要实时识别，需要在 H5 环境下使用 Web Audio API
 */

interface VoiceRecognitionConfig {
  token: string
  appKey: string
  socketUrl?: string
  autoStopDelay?: number
}

interface VoiceRecognitionCallbacks {
  onResult: (text: string, isFinal: boolean) => void
  onError?: (error: string) => void
  onStarted?: () => void
  onStopped?: () => void
}

export class TaroVoiceRecognitionService {
  private config: VoiceRecognitionConfig
  private callbacks: VoiceRecognitionCallbacks
  private recorderManager: any = null  // 录音管理器
  private taskId: string = ''
  private voiceText: string = ''
  private isRecognizing: boolean = false
  private isDestroyed: boolean = false
  private pcmFilePath: string = ''  // 保存录音文件路径（用于SOE评测，格式为PCM）
  private frameCount: number = 0  // 接收到的帧数
  private socketOpenHandler: ((res: any) => void) | null = null  // WebSocket打开回调
  private socketMessageHandler: ((res: any) => void) | null = null  // WebSocket消息回调
  private socketCloseHandler: ((res: any) => void) | null = null  // WebSocket关闭回调
  private socketErrorHandler: ((res: any) => void) | null = null  // WebSocket错误回调

  constructor(config: VoiceRecognitionConfig, callbacks: VoiceRecognitionCallbacks) {
    this.config = {
      socketUrl: 'wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1',
      autoStopDelay: 2000,
      ...config
    }
    this.callbacks = callbacks
    
    // 初始化录音管理器（小程序只支持单一录音器）
    this.recorderManager = Taro.getRecorderManager()
  }

  // 生成UUID（不包含 "-" 分隔符，阿里云 NLS 要求）
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    }).replace(/-/g, '')  // ← 移除所有 "-" 分隔符
  }
  
  // PCM格式数据处理（纯PCM数据，无需提取）
  private processPCMData(pcmBuffer: ArrayBuffer): ArrayBuffer {
    // 直接返回PCM数据，无需处理
    return pcmBuffer
  }

  // 初始化 WebSocket
  private async initWebSocket(): Promise<void> {
    if (this.isDestroyed) return

    try {
      if (!this.config.token) {
        throw new Error('未找到认证令牌')
      }

      this.taskId = this.generateUUID()
      const wsUrl = `${this.config.socketUrl}?token=${this.config.token}`

      // 先清理旧的监听器（如果存在），避免重复注册
      this.cleanupSocketListeners()
      
      // 创建新的监听器函数（使用箭头函数确保this指向正确）
      this.socketOpenHandler = (res: any) => {
        // 检查taskId是否匹配，避免处理旧连接的消息
        if (this.isDestroyed || !this.taskId) {
          return
        }
        
        // 发送开始识别消息（使用PCM格式）
        const messageId = this.generateUUID()
        const startMessage = {
          header: {
            appkey: this.config.appKey,
            namespace: 'SpeechTranscriber',
            name: 'StartTranscription',
            enable_punctuation_prediction: true,
            disfluency: true,
            customization_id: null,
            vocabulary_id: null,
            speech_noise_threshold: 0.5,
            task_id: this.taskId,
            message_id: messageId
          },
          payload: {
            format: 'pcm',  // 使用PCM格式
            sample_rate: 16000,
            enable_intermediate_result: true,
            enable_punctuation_prediction: true,
            enable_inverse_text_normalization: true
          }
        }

        Taro.sendSocketMessage({
          data: JSON.stringify(startMessage),
          success: () => {
            this.startAudioCapture()
          },
          fail: (err) => {
            this.callbacks.onError?.('发送开始消息失败')
          }
        })
      }

      this.socketMessageHandler = (res: any) => {
        // 检查taskId是否匹配，避免处理旧连接的消息
        if (this.isDestroyed || !this.taskId) {
          return
        }
        
        try {
          // 处理二进制数据（PCM音频帧）
          if (res.data instanceof ArrayBuffer) {
            return
          }
          
          // 处理文本消息（JSON格式）
          const messageText = typeof res.data === 'string' ? res.data : String(res.data)
          const message = JSON.parse(messageText)
          this.handleWebSocketMessage(message)
        } catch (error) {
          // 忽略解析错误
        }
      }

      this.socketCloseHandler = (res: any) => {
        // 只有在当前任务时才更新状态
        if (!this.isDestroyed) {
          this.isRecognizing = false
        }
        
        // 解释常见的关闭代码
        if (res.code === 4402) {
          if (!this.isDestroyed) {
            this.callbacks.onError?.('WebSocket认证失败')
          }
        }
      }

      this.socketErrorHandler = (res: any) => {
        if (!this.isDestroyed) {
          this.callbacks.onError?.('WebSocket 连接错误')
          this.isRecognizing = false
        }
      }

      // 注册监听器
      Taro.onSocketOpen(this.socketOpenHandler)
      Taro.onSocketMessage(this.socketMessageHandler)
      Taro.onSocketClose(this.socketCloseHandler)
      Taro.onSocketError(this.socketErrorHandler)

      // 创建 WebSocket 连接
      Taro.connectSocket({
        url: wsUrl,
        success: () => {
          // 连接请求已发送
        },
        fail: (err) => {
          this.callbacks.onError?.('WebSocket 连接失败')
        }
      })

    } catch (error: any) {
      this.callbacks.onError?.('初始化失败')
    }
  }

  // 处理 WebSocket 消息
  private handleWebSocketMessage(message: any): void {
    if (this.isDestroyed) return

    try {
      if (message.header && message.header.name) {
        switch (message.header.name) {
          case 'TranscriptionStarted':
            break

          case 'TranscriptionResultChanged':
            // 中间结果
            if (message.payload && message.payload.result) {
              const resultText = message.payload.result || ''
              if (resultText.includes(' ') || resultText.length > this.voiceText.length) {
                this.voiceText = resultText
              } else {
                if (!this.voiceText.endsWith(resultText)) {
                  this.voiceText += resultText
                }
              }
              // 实时识别结果
              console.log('🎤 阿里云实时识别结果:', this.voiceText)
              this.callbacks.onResult(this.voiceText, false)
            }
            break

          case 'SentenceEnd':
            // 句子结束
            if (message.payload && message.payload.result) {
              const resultText = message.payload.result || ''
              if (!this.voiceText.includes(resultText)) {
                this.voiceText += (this.voiceText ? ' ' : '') + resultText
              } else {
                this.voiceText = resultText
              }
              // 实时识别结果
              console.log('🎤 阿里云实时识别结果:', this.voiceText)
              this.callbacks.onResult(this.voiceText, false)
            }
            break

          case 'TaskFailed':
            const statusCode = message.header.status
            const statusText = message.header.status_text || ''
            
            if (statusCode === 40000004 && statusText.includes('IDLE_TIMEOUT')) {
              if (this.voiceText) {
                this.callbacks.onResult(this.voiceText, true)
              }
              this.isRecognizing = false
            } else {
              this.callbacks.onError?.('识别任务失败: ' + statusText)
            }
            break

          case 'TranscriptionCompleted':
            // 识别完成，确保获取最终文本
            if (message.payload && message.payload.result) {
              const completedText = message.payload.result
              if (completedText && completedText.trim()) {
                this.voiceText = completedText.trim()
              }
            }
            // 最终识别结果
            console.log('🎤 阿里云最终识别结果:', this.voiceText)
            this.callbacks.onResult(this.voiceText, true)
            break
        }
      }
    } catch (error) {
      // 忽略处理错误
    }
  }

  // 开始音频采集
  private startAudioCapture(): void {
    if (this.isDestroyed) return

    try {
      // 监听录音帧数据
      this.frameCount = 0
      
      this.recorderManager.onFrameRecorded((res: any) => {
        if (this.isRecognizing && !this.isDestroyed) {
          this.frameCount++
          
          if (!res.frameBuffer) {
            return
          }
          
          try {
            // 发送 PCM 数据到 WebSocket
            Taro.sendSocketMessage({
              data: res.frameBuffer,
              success: () => {},
              fail: () => {}
            })
          } catch (error) {
            // 忽略发送错误
          }
        }
      })
      
      // 监听录音错误
      this.recorderManager.onError((err: any) => {
        this.callbacks.onError?.('录音失败: ' + (err.errMsg || '未知错误'))
      })
      
      // 监听录音开始
      this.recorderManager.onStart(() => {})
      
      // 监听录音停止，保存录音文件路径（用于SOE评测）
      this.recorderManager.onStop(async (res: any) => {
        if (res.tempFilePath) {
          this.pcmFilePath = res.tempFilePath
        }
      })

      // 开始录音（PCM 格式）
      this.recorderManager.start({
        duration: 60000,  // 最长60秒
        sampleRate: 16000,  // 16kHz 采样率
        numberOfChannels: 1,  // 单声道
        format: 'pcm',  // PCM 格式
        frameSize: 1  // 每1KB返回一次（用于实时识别）
      })

      this.isRecognizing = true
      this.callbacks.onStarted?.()

    } catch (error: any) {
      this.callbacks.onError?.('启动录音失败')
    }
  }

  // 停止音频采集
  private stopAudioCapture(): void {
    try {
      if (this.recorderManager && this.isRecognizing) {
        // 检查录音是否真的在运行
        this.recorderManager.stop()
      }
    } catch (error: any) {
      // 忽略 "recorder not start" 错误（可能是因为已经停止或销毁）
      if (!error?.errMsg?.includes('recorder not start')) {
        // 其他错误忽略
      }
    }
  }

  // 开始识别
  public async start(): Promise<void> {
    // 如果已经存在连接，先销毁旧连接
    if (this.isRecognizing || this.taskId) {
      await this.destroy()
      // 等待一小段时间确保资源清理完成
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // 重置状态
    this.isDestroyed = false
    this.voiceText = ''
    this.frameCount = 0
    this.pcmFilePath = ''
    
    await this.initWebSocket()
  }

  // 停止识别
  public async stop(): Promise<void> {
    if (this.isDestroyed) return

    // 先发送停止消息（立即发送，避免WebSocket空闲超时）
    // 然后在后台等待数据发送完成
    if (this.taskId && this.isRecognizing) {
      const stopMessage = {
        header: {
          appkey: this.config.appKey,
          namespace: 'SpeechTranscriber',
          name: 'StopTranscription',
          task_id: this.taskId,
          message_id: this.generateUUID()
        }
      }

      try {
        Taro.sendSocketMessage({
          data: JSON.stringify(stopMessage),
          success: () => {},
          fail: () => {}
        })
      } catch (error) {
        // 忽略发送错误
      }
    }

    // 停止录音（会触发onStop回调）
    this.stopAudioCapture()

    // 等待一小段时间确保：
    // 1. 所有帧数据都已发送到NLS（如果还有未发送的）
    // 2. onStop回调执行完成，保存文件路径
    if (this.frameCount > 0) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // 额外等待确保onStop回调执行完成
    await new Promise(resolve => setTimeout(resolve, 100))

    // 最后才设置 isRecognizing = false
    // 注意：WebSocket断开应该在外部调用destroy()方法，在停止后500ms再断开
    this.isRecognizing = false
    this.callbacks.onStopped?.()
  }

  // 清理WebSocket监听器
  private cleanupSocketListeners(): void {
    // Taro没有提供offSocketOpen等方法，所以无法直接移除监听器
    // 但可以通过设置isDestroyed标志来忽略旧连接的消息
  }

  // 销毁实例
  public async destroy(): Promise<void> {
    this.isDestroyed = true
    
      // 如果正在识别，先停止（这会调用stopAudioCapture，所以不需要重复调用）
      if (this.isRecognizing && this.taskId) {
        try {
          await this.stop()
        } catch (e) {
          // 忽略停止错误
        }
      } else {
        // 如果不在识别状态，只停止录音（避免重复调用stop()导致的错误）
        this.stopAudioCapture()
      }
    
    // 关闭 WebSocket 连接
    try {
      Taro.closeSocket({
        success: () => {},
        fail: () => {}
      })
    } catch (e) {
      // 忽略关闭错误
    }

    // 清理监听器引用
    this.socketOpenHandler = null
    this.socketMessageHandler = null
    this.socketCloseHandler = null
    this.socketErrorHandler = null

    // 重置状态（但保留pcmFilePath，因为可能还在使用）
    this.isRecognizing = false
    this.voiceText = ''
    this.taskId = ''
    this.frameCount = 0
    // 注意：不清空 pcmFilePath，因为可能在 stop() 之后还需要使用
    // this.pcmFilePath = ''
  }

  // 获取当前识别文本
  public getCurrentText(): string {
    return this.voiceText
  }

  // 获取识别状态
  public getIsRecognizing(): boolean {
    return this.isRecognizing && !this.isDestroyed
  }
  
  // 获取 PCM 文件路径（用于 SOE 评测）
  public getPcmFilePath(): string {
    return this.pcmFilePath
  }
}


