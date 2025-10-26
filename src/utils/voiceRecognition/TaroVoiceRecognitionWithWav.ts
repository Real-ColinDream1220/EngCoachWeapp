import Taro from '@tarojs/taro'

/**
 * Taro 语音识别服务类（基于阿里云 NLS）
 * 
 * 增强功能：
 * 1. 实时发送 PCM 数据给 NLS 进行语音识别
 * 2. 同时缓存 PCM 数据，录音结束后生成 WAV 文件用于 SOE 评测
 */

interface VoiceRecognitionConfig {
  token: string
  appKey: string
  socketUrl?: string
  autoStopDelay?: number
  enableWavExport?: boolean  // 是否启用 WAV 导出（默认 true）
}

interface VoiceRecognitionCallbacks {
  onResult: (text: string, isFinal: boolean) => void
  onError?: (error: string) => void
  onStarted?: () => void
  onStopped?: () => void
  onWavReady?: (wavFilePath: string) => void  // WAV 文件生成完成回调
}

export class TaroVoiceRecognitionWithWav {
  private config: VoiceRecognitionConfig
  private callbacks: VoiceRecognitionCallbacks
  private recorderManager: any = null
  private taskId: string = ''
  private voiceText: string = ''
  private isRecognizing: boolean = false
  private isDestroyed: boolean = false
  
  // PCM 数据缓存（用于生成 WAV 文件）
  private pcmDataBuffers: ArrayBuffer[] = []
  private totalPcmDataSize: number = 0

  constructor(config: VoiceRecognitionConfig, callbacks: VoiceRecognitionCallbacks) {
    this.config = {
      socketUrl: 'wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1',
      autoStopDelay: 2000,
      enableWavExport: true,  // 默认启用 WAV 导出
      ...config
    }
    this.callbacks = callbacks
    
    // 初始化录音管理器
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

  // 将 PCM 数据转换为 WAV 格式
  private pcmToWav(pcmData: ArrayBuffer, sampleRate: number = 16000, bitDepth: number = 16, channels: number = 1): ArrayBuffer {
    console.log('=== 开始将 PCM 转换为 WAV ===')
    console.log('PCM 数据大小:', pcmData.byteLength, 'bytes')
    console.log('采样率:', sampleRate, 'Hz')
    console.log('位深度:', bitDepth, 'bits')
    console.log('声道数:', channels)
    
    const dataLength = pcmData.byteLength
    const buffer = new ArrayBuffer(44 + dataLength)
    const view = new DataView(buffer)
    
    // 写入 WAV 文件头
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    // RIFF chunk descriptor
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + dataLength, true)  // 文件大小 - 8
    writeString(8, 'WAVE')
    
    // fmt sub-chunk
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)  // fmt chunk size
    view.setUint16(20, 1, true)   // audio format (1 = PCM)
    view.setUint16(22, channels, true)  // 声道数
    view.setUint32(24, sampleRate, true)  // 采样率
    view.setUint32(28, sampleRate * channels * bitDepth / 8, true)  // byte rate
    view.setUint16(32, channels * bitDepth / 8, true)  // block align
    view.setUint16(34, bitDepth, true)  // bits per sample
    
    // data sub-chunk
    writeString(36, 'data')
    view.setUint32(40, dataLength, true)  // data size
    
    // 写入 PCM 数据
    const pcmView = new Uint8Array(pcmData)
    const wavView = new Uint8Array(buffer)
    wavView.set(pcmView, 44)
    
    console.log('✅ WAV 文件生成完成，总大小:', buffer.byteLength, 'bytes')
    return buffer
  }

  // 将 ArrayBuffer 保存为文件
  private async saveWavFile(wavData: ArrayBuffer): Promise<string> {
    try {
      console.log('=== 开始保存 WAV 文件 ===')
      
      // 将 ArrayBuffer 转换为 Base64
      const uint8Array = new Uint8Array(wavData)
      let binaryString = ''
      for (let i = 0; i < uint8Array.byteLength; i++) {
        binaryString += String.fromCharCode(uint8Array[i])
      }
      const base64Data = Taro.arrayBufferToBase64(wavData)
      
      console.log('Base64 数据长度:', base64Data.length)
      
      // 写入临时文件
      const filePath = `${Taro.env.USER_DATA_PATH}/recording_${Date.now()}.wav`
      
      await Taro.getFileSystemManager().writeFile({
        filePath: filePath,
        data: base64Data,
        encoding: 'base64'
      })
      
      console.log('✅ WAV 文件已保存:', filePath)
      
      // 验证文件（使用回调方式）
      Taro.getFileSystemManager().getFileInfo({
        filePath: filePath,
        success: (res) => {
          console.log('文件大小验证:', res.size, 'bytes')
        },
        fail: (err) => {
          console.warn('⚠️  文件验证失败:', err)
        }
      })
      
      return filePath
      
    } catch (error) {
      console.error('❌ 保存 WAV 文件失败:', error)
      throw error
    }
  }

  // 合并所有 PCM 数据并生成 WAV 文件
  private async generateWavFile(): Promise<void> {
    if (!this.config.enableWavExport) {
      console.log('⚠️  WAV 导出未启用，跳过')
      return
    }
    
    if (this.pcmDataBuffers.length === 0) {
      console.warn('⚠️  没有 PCM 数据可导出')
      return
    }
    
    try {
      console.log('=== 开始生成 WAV 文件 ===')
      console.log('PCM 片段数量:', this.pcmDataBuffers.length)
      console.log('总 PCM 数据大小:', this.totalPcmDataSize, 'bytes')
      
      // 合并所有 PCM 数据
      const mergedPcmData = new Uint8Array(this.totalPcmDataSize)
      let offset = 0
      
      for (const buffer of this.pcmDataBuffers) {
        const uint8Array = new Uint8Array(buffer)
        mergedPcmData.set(uint8Array, offset)
        offset += uint8Array.byteLength
      }
      
      console.log('✅ PCM 数据合并完成，总大小:', mergedPcmData.byteLength, 'bytes')
      
      // 转换为 WAV 格式
      const wavData = this.pcmToWav(mergedPcmData.buffer, 16000, 16, 1)
      
      // 保存为文件
      const wavFilePath = await this.saveWavFile(wavData)
      
      console.log('✅ WAV 文件生成成功:', wavFilePath)
      
      // 触发回调
      this.callbacks.onWavReady?.(wavFilePath)
      
    } catch (error) {
      console.error('❌ 生成 WAV 文件失败:', error)
      this.callbacks.onError?.('生成 WAV 文件失败')
    } finally {
      // 清空缓存
      this.pcmDataBuffers = []
      this.totalPcmDataSize = 0
    }
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

      console.log('=== 连接 WebSocket ===')
      console.log('SocketUrl:', this.config.socketUrl)
      console.log('Token (前20字符):', this.config.token.substring(0, 20))
      console.log('AppKey:', this.config.appKey)
      console.log('TaskId:', this.taskId)
      console.log('完整 URL:', wsUrl)

      // 清空之前的 PCM 缓存
      this.pcmDataBuffers = []
      this.totalPcmDataSize = 0
      console.log('🗑️  已清空 PCM 数据缓存')

      // 先注册全局监听器，然后再连接
      // 这是 Taro 推荐的方式
      
      // 监听 WebSocket 打开
      Taro.onSocketOpen((res) => {
        console.log('✅ WebSocket 已连接', res)
        
        // 发送开始识别消息
        const messageId = this.generateUUID()
        const startMessage = {
          header: {
            appkey: this.config.appKey,
            namespace: 'SpeechTranscriber',
            name: 'StartTranscription',
            task_id: this.taskId,
            message_id: messageId
          },
          payload: {
            format: 'pcm',
            sample_rate: 16000,
            enable_intermediate_result: true,
            enable_punctuation_prediction: true,
            enable_inverse_text_normalization: true
          }
        }

        console.log('📤 准备发送开始识别消息:')
        console.log('- AppKey:', this.config.appKey)
        console.log('- TaskId:', this.taskId, '(长度:', this.taskId.length, ')')
        console.log('- MessageId:', messageId, '(长度:', messageId.length, ')')
        console.log('- MessageId 包含 "-"?', messageId.includes('-') ? '是 ❌' : '否 ✅')
        console.log('- 完整消息:', JSON.stringify(startMessage, null, 2))

        Taro.sendSocketMessage({
          data: JSON.stringify(startMessage),
          success: () => {
            console.log('✅ 已发送开始识别消息')
            this.startAudioCapture()
          },
          fail: (err) => {
            console.error('❌ 发送开始消息失败:', err)
            this.callbacks.onError?.('发送开始消息失败')
          }
        })
      })

      // 监听 WebSocket 消息
      Taro.onSocketMessage((res) => {
        try {
          console.log('📥 收到 WebSocket 消息:', res.data)
          const message = JSON.parse(res.data)
          console.log('📦 解析后的消息:', message)
          this.handleWebSocketMessage(message)
        } catch (error) {
          console.error('❌ 解析消息失败:', error)
          console.error('原始数据:', res.data)
        }
      })

      // 监听 WebSocket 关闭
      Taro.onSocketClose((res) => {
        console.log('🔌 WebSocket 已关闭')
        console.log('关闭代码:', res.code)
        console.log('关闭原因:', res.reason)
        console.log('完整信息:', res)
        this.isRecognizing = false
        
        // 解释常见的关闭代码
        if (res.code === 4402) {
          console.error('❌ 认证失败 (4402)')
          console.error('可能原因:')
          console.error('1. Token 无效或过期')
          console.error('2. AppKey 不匹配')
          console.error('3. 消息格式错误')
        }
      })

      // 监听 WebSocket 错误
      Taro.onSocketError((res) => {
        console.error('❌ WebSocket 错误:', res)
        this.callbacks.onError?.('WebSocket 连接错误')
        this.isRecognizing = false
      })

      // 创建 WebSocket 连接
      Taro.connectSocket({
        url: wsUrl,
        success: () => {
          console.log('✅ WebSocket 连接请求已发送')
        },
        fail: (err) => {
          console.error('❌ WebSocket 连接失败:', err)
          this.callbacks.onError?.('WebSocket 连接失败')
        }
      })

    } catch (error: any) {
      console.error('❌ 初始化 WebSocket 失败:', error)
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
            console.log('识别已开始')
            break

          case 'TranscriptionResultChanged':
            // 中间结果
            console.log('📝 收到中间识别结果:', message.payload?.result)
            if (message.payload && message.payload.result) {
              const text = this.voiceText + message.payload.result
              this.callbacks.onResult(text, false)
            }
            break

          case 'SentenceEnd':
            // 句子结束
            console.log('✅ 句子结束:', message.payload?.result)
            if (message.payload && message.payload.result) {
              this.voiceText += message.payload.result
              console.log('当前累计文本:', this.voiceText)
              this.callbacks.onResult(this.voiceText, false)
            }
            break

          case 'TaskFailed':
            console.error('❌ 识别任务失败')
            console.error('错误信息:', message.header.status_text)
            console.error('错误代码:', message.header.status)
            console.error('完整消息:', JSON.stringify(message, null, 2))
            this.callbacks.onError?.('识别任务失败')
            this.stop()
            break

          case 'TranscriptionCompleted':
            console.log('识别完成，最终文本:', this.voiceText)
            this.callbacks.onResult(this.voiceText, true)
            this.destroy()
            break
        }
      }
    } catch (error) {
      console.error('❌ 处理消息失败:', error)
    }
  }

  // 开始音频采集
  private startAudioCapture(): void {
    if (this.isDestroyed) return

    try {
      console.log('=== 开始录音 ===')

      // 监听录音帧数据
      let frameCount = 0
      this.recorderManager.onFrameRecorded((res: any) => {
        if (this.isRecognizing && !this.isDestroyed) {
          frameCount++
          
          // 1. 缓存 PCM 数据（用于生成 WAV）
          if (this.config.enableWavExport && res.frameBuffer) {
            this.pcmDataBuffers.push(res.frameBuffer)
            this.totalPcmDataSize += res.frameBuffer.byteLength
            
            if (frameCount === 1) {
              console.log('📦 开始缓存 PCM 数据用于 WAV 生成')
            }
            if (frameCount % 20 === 0) {
              console.log(`📦 已缓存 ${frameCount} 帧 PCM 数据，总大小: ${this.totalPcmDataSize} bytes`)
            }
          }
          
          // 2. 实时发送给 NLS（用于语音识别）
          if (frameCount === 1 || frameCount % 20 === 0) {
            console.log(`📊 发送音频帧 #${frameCount} 给 NLS, 大小:`, res.frameBuffer?.byteLength || 0, 'bytes')
          }
          
          Taro.sendSocketMessage({
            data: res.frameBuffer,
            success: () => {
              if (frameCount === 1) {
                console.log('✅ 首帧音频发送成功')
              }
            },
            fail: (err) => {
              console.error('❌ 发送音频数据失败 (帧 #' + frameCount + '):', err)
            }
          })
        }
      })
      
      // 监听录音错误
      this.recorderManager.onError((err: any) => {
        console.error('❌ 录音错误:', err)
        this.callbacks.onError?.('录音失败: ' + (err.errMsg || '未知错误'))
      })
      
      // 监听录音开始
      this.recorderManager.onStart(() => {
        console.log('🎤 录音已开始')
      })
      
      // 监听录音停止
      this.recorderManager.onStop((res: any) => {
        console.log('⏹️  录音已停止, 时长:', res.duration, 'ms, 文件大小:', res.fileSize, 'bytes')
        console.log('临时文件路径:', res.tempFilePath)
        
        // 录音停止后生成 WAV 文件
        this.generateWavFile()
      })

      // 开始录音
      // 注意：PCM 格式在小程序中可能不支持，仅 H5 支持
      console.log('📝 录音配置: PCM, 16kHz, 单声道, frameSize=1')
      this.recorderManager.start({
        duration: 60000,  // 最长60秒
        sampleRate: 16000,  // 16kHz 采样率（NLS 要求）
        numberOfChannels: 1,  // 单声道
        format: 'PCM',  // PCM 格式（NLS 要求）
        frameSize: 1  // 每1KB返回一次数据
      })

      this.isRecognizing = true
      this.callbacks.onStarted?.()

    } catch (error: any) {
      console.error('❌ 启动录音失败:', error)
      this.callbacks.onError?.('启动录音失败')
    }
  }

  // 停止音频采集
  private stopAudioCapture(): void {
    try {
      if (this.recorderManager) {
        this.recorderManager.stop()
      }
    } catch (error) {
      console.error('❌ 停止录音失败:', error)
    }
  }

  // 开始识别
  public async start(): Promise<void> {
    if (this.isDestroyed || this.isRecognizing) return

    this.voiceText = ''
    await this.initWebSocket()
  }

  // 停止识别
  public stop(): void {
    if (this.isDestroyed) return

    this.stopAudioCapture()

    // 发送停止消息
    if (this.taskId) {
      const stopMessage = {
        header: {
          appkey: this.config.appKey,
          namespace: 'SpeechTranscriber',
          name: 'StopTranscription',
          task_id: this.taskId,
          message_id: this.generateUUID()
        }
      }

      Taro.sendSocketMessage({
        data: JSON.stringify(stopMessage)
      })
    }

    this.isRecognizing = false
    this.callbacks.onStopped?.()
  }

  // 销毁实例
  public destroy(): void {
    this.isDestroyed = true
    this.stopAudioCapture()
    
    // 关闭 WebSocket 连接
    Taro.closeSocket({
      success: () => {
        console.log('✅ WebSocket 已关闭')
      }
    })

    this.isRecognizing = false
    this.voiceText = ''
    this.taskId = ''
  }

  // 获取当前识别文本
  public getCurrentText(): string {
    return this.voiceText
  }

  // 获取识别状态
  public getIsRecognizing(): boolean {
    return this.isRecognizing && !this.isDestroyed
  }

  // 获取缓存的 PCM 数据统计
  public getPcmStats(): { frameCount: number; totalSize: number } {
    return {
      frameCount: this.pcmDataBuffers.length,
      totalSize: this.totalPcmDataSize
    }
  }
}

