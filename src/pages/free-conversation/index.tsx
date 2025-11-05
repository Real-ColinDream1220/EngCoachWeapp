import { Component } from 'react'
import { View, Text, Video } from '@tarojs/components'
import { AtButton, AtIcon } from 'taro-ui'
import Taro from '@tarojs/taro'
import './index.scss'
import { aiChatAPI } from '../../utils/api_v2/aiChat'
import { TaroVoiceRecognitionService } from '../../utils/voiceRecognition/TaroVoiceRecognitionService'
import { contentAPI } from '../../utils/api_v2/content'

// Safety check for taro-ui components
const SafeAtButton = AtButton || (() => <View>Button not available</View>)

export default class FreeConversation extends Component {
  state = {
    isRecording: false,
    isStreaming: false,
    streamingText: '',
    streamingMessageId: null as number | null,
    recordingStartTime: 0,
    playingVoiceId: null as number | null,
    voiceIconIndex: 0,
    tid: null as number | null,
    messages: [] as any[],
    recordedMessages: {} as Record<number, any>,
    studentName: '学生',
    scrollIntoViewId: '' as string,
    // 视频相关
    currentVideoUrl: 'https://t.aix101.com/udata/100728/mp4/40c275f8085c7dfb3cc5802d3caf1f0e_20251105145241.mp4'
  }

  voiceAnimationTimer: any = null
  audioContext: any = null
  voiceRecognitionService: TaroVoiceRecognitionService | null = null
  recognizedText: string = ''
  videoContext: any = null

  componentDidMount() {
    // 检查登录状态
    const isLoggedIn = Taro.getStorageSync('isLoggedIn')
    if (!isLoggedIn) {
      Taro.reLaunch({
        url: '/pages/login/index'
      })
      return
    }
    
    // 读取学生信息
    const studentInfo = Taro.getStorageSync('studentInfo')
    if (studentInfo && studentInfo.name) {
      this.setState({ studentName: studentInfo.name })
    }
    
    // 初始化音频播放器
    this.audioContext = Taro.createInnerAudioContext()
    
    // 延迟初始化视频播放器，确保DOM已渲染
    setTimeout(() => {
      try {
        // 初始化视频播放器
        this.videoContext = Taro.createVideoContext('free-conversation-video')
        console.log('视频播放器初始化完成')
        
        // 自动播放默认视频
        this.playVideo(this.state.currentVideoUrl)
      } catch (error) {
        console.error('视频播放器初始化失败:', error)
      }
    }, 500)
  }

  componentWillUnmount() {
    // 清理资源
    if (this.voiceRecognitionService) {
      this.voiceRecognitionService.destroy().catch(() => {})
    }
    if (this.audioContext) {
      this.audioContext.destroy()
    }
    if (this.voiceAnimationTimer) {
      clearInterval(this.voiceAnimationTimer)
    }
  }

  /**
   * 播放视频
   */
  playVideo = (url: string) => {
    console.log('准备播放视频:', url)
    console.log('当前视频URL:', this.state.currentVideoUrl)
    
    // 如果URL相同，直接播放
    if (url === this.state.currentVideoUrl && this.videoContext) {
      console.log('URL相同，直接播放')
      try {
        this.videoContext.play()
      } catch (error) {
        console.error('直接播放失败:', error)
      }
      return
    }
    
    // 更新URL
    this.setState({ currentVideoUrl: url }, () => {
      // 使用nextTick确保状态更新和DOM渲染完成
      Taro.nextTick(() => {
        if (this.videoContext) {
          // 延迟一下，确保视频组件已更新
          setTimeout(() => {
            try {
              console.log('调用视频播放API')
              this.videoContext.play()
            } catch (error) {
              console.error('视频播放失败:', error)
              // 如果直接调用失败，延迟重试
              setTimeout(() => {
                if (this.videoContext) {
                  try {
                    console.log('重试播放视频')
                    this.videoContext.play()
                  } catch (e) {
                    console.error('视频播放重试失败:', e)
                  }
                }
              }, 500)
            }
          }, 200)
        } else {
          // 如果videoContext还没初始化，重新初始化
          console.log('videoContext未初始化，重新初始化...')
          setTimeout(() => {
            try {
              this.videoContext = Taro.createVideoContext('free-conversation-video')
              if (this.videoContext) {
                console.log('videoContext重新初始化成功，尝试播放')
                setTimeout(() => {
                  try {
                    this.videoContext.play()
                  } catch (e) {
                    console.error('播放失败:', e)
                  }
                }, 200)
              }
            } catch (error) {
              console.error('重新初始化视频播放器失败:', error)
            }
          }, 300)
        }
      })
    })
  }

  /**
   * 初始化语音识别服务
   */
  initVoiceRecognitionService = async () => {
    try {
      this.voiceRecognitionService = new TaroVoiceRecognitionService(
        {},
        {
          onResult: (text: string, isFinal: boolean) => {
            this.recognizedText = text
          },
          onError: (error: string) => {
            Taro.showToast({ title: error, icon: 'none' })
          },
          onStarted: () => {
            this.recognizedText = ''
          },
          onStopped: () => {}
        }
      )
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '初始化失败',
        icon: 'none'
      })
    }
  }

  /**
   * 开始录音
   */
  handleStartRecording = async () => {
    // 如果服务存在但正在识别，先停止并销毁
    if (this.voiceRecognitionService && this.voiceRecognitionService.getIsRecognizing()) {
      try {
        await this.voiceRecognitionService.destroy()
      } catch (e) {
        // 忽略停止错误
      }
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // 重新初始化服务
    await this.initVoiceRecognitionService()

    if (!this.voiceRecognitionService) {
      Taro.showToast({ title: '语音识别服务初始化失败', icon: 'none' })
      return
    }

    const startTime = Date.now()
    this.setState({ 
      isRecording: true,
      recordingStartTime: startTime
    })

    // 启动录音
    try {
      await this.voiceRecognitionService.start()
    } catch (error: any) {
      this.setState({ isRecording: false })
      Taro.showToast({ title: '启动录音失败', icon: 'none' })
    }
  }

  /**
   * 停止录音
   */
  handleStopRecording = async () => {
    const { recordingStartTime, tid } = this.state
    const endTime = Date.now()
    const duration = Math.floor((endTime - recordingStartTime) / 1000)
    
    this.setState({ isRecording: false })

    if (this.voiceRecognitionService) {
      await this.voiceRecognitionService.stop()
      
      // 等待识别API调用完成
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 获取最终识别文本和WAV文件路径
      const serviceText = this.voiceRecognitionService.getCurrentText()
      const callbackText = this.recognizedText
      const recognizedText = serviceText || callbackText || ''
      const pcmFilePath = this.voiceRecognitionService.getPcmFilePath()

      // 保存录音信息
      const messageId = Date.now()
      const rawText = recognizedText ? recognizedText.trim() : ''
      
      // 先调用 content_generate 接口处理识别文本
      let processedRefText = rawText
      let textToSend = rawText
      
      if (rawText) {
        try {
          console.log('📝 调用 content_generate 处理识别文本...')
          console.log('原始识别文本:', rawText)
          
          // 调用 content_generate 接口，agent_id 为 6215
          const contentResult = await contentAPI.generate(6215, rawText)
          
          // 检查是否有 task_id（异步任务）
          const taskId = contentResult.data?.task_id || contentResult.result?.task_id
          if (taskId) {
            // 异步任务，需要轮询监听
            console.log('⏳ content_generate 是异步任务，开始轮询...')
            const pollResult = await contentAPI.pollUntilComplete(taskId)
            if (pollResult.success && pollResult.content) {
              processedRefText = pollResult.content.trim()
              textToSend = processedRefText
              console.log('✅ content_generate 处理完成，规范化文本:', processedRefText)
            } else {
              console.warn('⚠️ content_generate 处理失败，使用原始文本')
              processedRefText = rawText
              textToSend = rawText
            }
          } else {
            // 同步任务，直接获取 content
            const processedContent = contentResult.data?.content || contentResult.result?.content || ''
            if (processedContent) {
              processedRefText = processedContent.trim()
              textToSend = processedRefText
              console.log('✅ content_generate 处理完成，规范化文本:', processedRefText)
            } else {
              console.warn('⚠️ content_generate 返回内容为空，使用原始文本')
              processedRefText = rawText
              textToSend = rawText
            }
          }
        } catch (error) {
          console.error('❌ content_generate 处理失败:', error)
          console.warn('⚠️ 使用原始识别文本作为 ref_text')
          processedRefText = rawText
          textToSend = rawText
        }
      }
      
      // 使用处理后的文本作为 ref_text
      const recordData = {
        pcmFilePath: pcmFilePath || '',
        ref_text: processedRefText,
        duration: duration,
        timestamp: Date.now()
      }

      // 保存录音信息
      this.setState((prev: any) => ({
        recordedMessages: {
          ...prev.recordedMessages,
          [messageId]: recordData
        }
      }))

      // 添加用户消息
      const userMessage = {
        id: messageId,
        text: '',
        isUser: true,
        timestamp: Date.now()
      }

      this.setState((prev: any) => ({
        messages: [...prev.messages, userMessage]
      }))

      // 滚动到最新消息
      this.scrollToLatestMessage()

      // 发送给智能体
      console.log('📤 发送给智能体的消息（处理后的文本）:', textToSend || '(空文本)')
      await this.sendUserMessageToAI(textToSend, tid || null)
    }
  }

  /**
   * 发送用户消息给AI并接收流式回复
   */
  sendUserMessageToAI = async (userText: string, currentTid: number | null) => {
    try {
      let tid = currentTid
      
      // 如果没有tid，先获取
      if (!tid) {
        const topicResponse = await aiChatAPI.topicEdit()
        tid = (topicResponse && typeof topicResponse.data === 'object' && 'id' in topicResponse.data) 
          ? topicResponse.data.id 
          : null
        if (!tid) throw new Error('未能获取到tid')
        this.setState({ tid })
      }

      const trimmedText = (userText || '').trim()
      
      let fullResponse = ''
      const streamingMessageId = Date.now()
      const aiMessageId = streamingMessageId + 1

      // 先添加AI消息占位符
      this.setState((prev: any) => ({
        messages: [...prev.messages, {
          id: aiMessageId,
          text: '',
          isUser: false,
          timestamp: Date.now(),
          isStreaming: true
        }],
        streamingMessageId: aiMessageId
      }))

      this.scrollToLatestMessage()

      await aiChatAPI.completions({
        tid,
        text: trimmedText,
        agent_id: 5778,
        onMessage: (chunk: string) => {
          fullResponse += chunk
          this.setState((prev: any) => {
            const updatedMessages = prev.messages.map((msg: any) => 
              msg.id === aiMessageId 
                ? { ...msg, text: fullResponse, isStreaming: true }
                : msg
            )
            return {
              isStreaming: true,
              streamingText: fullResponse,
              messages: updatedMessages
            }
          }, () => {
            this.scrollToLatestMessage()
          })
        },
        onComplete: () => {
          this.setState((prev: any) => ({
            isStreaming: false,
            streamingText: '',
            streamingMessageId: null,
            messages: prev.messages.map((msg: any) => 
              msg.id === aiMessageId 
                ? { ...msg, text: fullResponse, isStreaming: false }
                : msg
            )
          }))
          this.scrollToLatestMessage()
        },
        onError: (err: any) => {
          this.setState((prev: any) => ({
            isStreaming: false, 
            streamingText: '',
            streamingMessageId: null,
            messages: prev.messages.filter((msg: any) => msg.id !== aiMessageId)
          }))
          Taro.showToast({ title: 'AI对话出错', icon: 'none' })
        }
      })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '发送失败', icon: 'none' })
    }
  }

  /**
   * 滚动到最新消息
   */
  scrollToLatestMessage = () => {
    const { messages } = this.state
    if (messages.length > 0) {
      const latestMessageId = messages[messages.length - 1].id
      this.setState({
        scrollIntoViewId: `message-${latestMessageId}`
      })
    }
  }

  /**
   * 处理录音按钮点击
   */
  handleRecordButtonClick = () => {
    const { isRecording } = this.state
    if (isRecording) {
      this.handleStopRecording()
    } else {
      this.handleStartRecording()
    }
  }

  /**
   * 播放语音消息
   */
  handlePlayVoice = (messageId: number) => {
    const { playingVoiceId, recordedMessages } = this.state

    if (playingVoiceId === messageId) {
      this.stopVoicePlayback()
      return
    }

    if (playingVoiceId !== null) {
      this.stopVoicePlayback()
    }

    const recordedData = recordedMessages[messageId]
    if (!recordedData) {
      Taro.showToast({
        title: '该消息未录音',
        icon: 'none'
      })
      return
    }

    const audioPath = recordedData.pcmFilePath
    if (!audioPath || audioPath.trim() === '') {
      Taro.showToast({
        title: '音频文件路径不存在',
        icon: 'none'
      })
      return
    }

    this.setState({ 
      playingVoiceId: messageId,
      voiceIconIndex: 0
    })

    this.startVoiceAnimation()

    if (!this.audioContext) {
      this.audioContext = Taro.createInnerAudioContext()
    }

    try {
      try {
        this.audioContext.stop()
      } catch (e) {}

      this.audioContext.offEnded()
      this.audioContext.offError()

      this.audioContext.src = audioPath
      
      this.audioContext.onEnded(() => {
        this.stopVoicePlayback()
      })

      this.audioContext.onError((error: any) => {
        this.stopVoicePlayback()
        Taro.showToast({
          title: '播放失败: ' + (error.errMsg || '未知错误'),
          icon: 'none',
          duration: 2000
        })
      })
      
      this.audioContext.play()
    } catch (error: any) {
      this.stopVoicePlayback()
      Taro.showToast({
        title: '播放异常: ' + (error.errMsg || error.message || '未知错误'),
        icon: 'none',
        duration: 2000
      })
    }
  }

  /**
   * 启动语音播放动画
   */
  startVoiceAnimation = () => {
    if (this.voiceAnimationTimer) {
      clearInterval(this.voiceAnimationTimer)
    }

    this.voiceAnimationTimer = setInterval(() => {
      this.setState((prev: any) => ({
        voiceIconIndex: (prev.voiceIconIndex + 1) % 3
      }))
    }, 80)
  }

  /**
   * 停止语音播放
   */
  stopVoicePlayback = () => {
    if (this.audioContext) {
      try {
        this.audioContext.stop()
      } catch (e) {}
    }

    if (this.voiceAnimationTimer) {
      clearInterval(this.voiceAnimationTimer)
      this.voiceAnimationTimer = null
    }

    this.setState({
      playingVoiceId: null,
      voiceIconIndex: 0
    })
  }

  /**
   * 渲染语音图标
   */
  renderVoiceIcon = (messageId: number) => {
    const { playingVoiceId, voiceIconIndex } = this.state

    if (playingVoiceId === messageId) {
      const icons = ['volume-off', 'volume-minus', 'volume-plus']
      return <AtIcon value={icons[voiceIconIndex]} size='24' color='white' />
    }

    return <AtIcon value='volume-plus' size='24' color='white' />
  }

  render() {
    const { 
      isRecording,
      messages,
      studentName,
      isStreaming,
      currentVideoUrl
    } = this.state

    return (
      <View className='free-conversation-page'>
        {/* 头部 */}
        <View className='header'>
          <View className='header-content'>
            <View className='header-left'>
              <AtIcon value='message' size='32' color='white' />
              <Text className='header-title'>自由对话</Text>
            </View>
            <View className='header-right'>
              <Text className='user-name'>{studentName}</Text>
            </View>
          </View>
        </View>

        {/* 视频容器 - 正中间 */}
        <View className='video-container'>
          <Video
            id='free-conversation-video'
            src={currentVideoUrl}
            className='video-player'
            controls={true}
            autoplay={false}
            loop={true}
            muted={false}
            show-center-play-btn={true}
            show-fullscreen-btn={false}
            show-play-btn={true}
            enable-play-gesture={true}
            onPlay={() => {
              console.log('✅ 视频开始播放')
            }}
            onPause={() => {
              console.log('⏸️ 视频暂停')
            }}
            onEnded={() => {
              console.log('▶️ 视频播放结束')
            }}
            onError={(e: any) => {
              console.error('❌ 视频播放错误:', e)
              console.error('错误详情:', {
                detail: e.detail,
                errMsg: e.detail?.errMsg,
                errCode: e.detail?.errCode,
                message: e.detail?.message
              })
              // 显示更详细的错误信息
              const errMsg = e.detail?.errMsg || e.detail?.message || '视频播放失败'
              Taro.showToast({
                title: `视频错误: ${errMsg}`,
                icon: 'none',
                duration: 3000
              })
            }}
            onLoadedMetadata={() => {
              console.log('✅ 视频元数据加载完成')
              // 元数据加载完成后，尝试播放
              if (this.videoContext) {
                setTimeout(() => {
                  try {
                    console.log('尝试自动播放视频...')
                    this.videoContext.play()
                  } catch (error) {
                    console.error('自动播放失败:', error)
                  }
                }, 300)
              }
            }}
            onWaiting={() => {
              console.log('⏳ 视频缓冲中...')
            }}
            onProgress={(e: any) => {
              console.log('视频播放进度:', e.detail)
            }}
          />
        </View>

        {/* 消息列表区域 */}
        <View className='messages-container-wrapper'>
          <View className='messages-container'>
            {messages.map((message: any) => (
              <View 
                key={message.id}
                id={`message-${message.id}`}
                className={`message-wrapper ${message.isUser ? 'user-message-wrapper' : 'ai-message-wrapper'}`}
              >
                <View className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}>
                  <View className='message-content'>
                    {message.isUser ? (
                      // 用户消息：显示语音气泡
                      (this.state as any).recordedMessages[message.id] ? (
                        <View 
                          className={`voice-bubble ${(this.state as any).playingVoiceId === message.id ? 'playing' : ''}`}
                          onClick={() => this.handlePlayVoice(message.id)}
                        >
                          <Text className='voice-duration'>
                            {((this.state as any).recordedMessages[message.id]?.duration || 0)}"
                          </Text>
                          <View className='voice-icon-wrapper'>
                            {this.renderVoiceIcon(message.id)}
                          </View>
                        </View>
                      ) : null
                    ) : (
                      // AI消息：显示文本
                      message.text || message.isStreaming ? (
                        <View className='message-bubble'>
                          <Text className='message-text'>
                            {message.text || ''}
                            {message.isStreaming || (isStreaming && message.id === (this.state as any).streamingMessageId) ? (
                              <Text className='streaming-dot' style={{ marginLeft: '8px', color: '#667eea' }}>●</Text>
                            ) : null}
                          </Text>
                        </View>
                      ) : null
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 录音按钮区域（页面底部中间） */}
        <View className='recording-button-section'>
          <SafeAtButton 
            type={isRecording ? 'primary' : 'secondary'}
            size='normal'
            onClick={this.handleRecordButtonClick}
            className={`record-button ${isRecording ? 'recording' : ''}`}
          >
            {isRecording ? '停止录音' : '开始录音'}
          </SafeAtButton>
        </View>
      </View>
    )
  }
}

