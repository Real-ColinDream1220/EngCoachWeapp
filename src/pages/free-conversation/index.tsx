import { Component } from 'react'
import { View, Text, Image, Video } from '@tarojs/components'
import { AtButton, AtCard, AtIcon, AtActivityIndicator } from 'taro-ui'

// Safety check for taro-ui components
const SafeAtButton = AtButton || (() => <View>Button not available</View>)
const SafeAtCard = AtCard || (() => <View>Card not available</View>)
const SafeAtIcon = AtIcon || (() => <View>Icon not available</View>)
const SafeAtActivityIndicator = AtActivityIndicator || (() => <View>Loading...</View>)

import Taro from '@tarojs/taro'
import './index.scss'
import { aiChatAPI } from '../../utils/api_v2/aiChat'
import { TaroVoiceRecognitionService } from '../../utils/voiceRecognition/TaroVoiceRecognitionService'
import { contentAPI } from '../../utils/api_v2/content'

export default class FreeConversation extends Component {
  state = {
    isRecording: false,
    isStreaming: false,
    streamingText: '', // 当前流式输出的文本
    currentAIText: '', // 当前AI回复的文本（用于中间文字框显示）
    recordingStartTime: 0,
    tid: null as number | null,
    recordedMessages: {} as Record<number, any>, // 已录音的消息记录（不显示，仅用于评测）
    studentName: '学生',
    isLoadingConversation: false, // 是否正在加载对话
    isGeneratingSpeech: false, // 是否正在生成语音
    isPlayingSpeech: false, // 是否正在播放语音
    speechAudioUrl: '', // 生成的语音音频URL
    translationText: '', // 翻译文本
    isTranslating: false, // 是否正在翻译
    exerciseImageUrl: '', // 当前背景使用的练习图片URL
    videoUrls: [
      'https://t.aix101.com/udata/100728/mov/6f83c2a74808409c80547f5d398487e1_20251110142817.mov',
      'https://t.aix101.com/udata/100728/mov/cc9091d150902835ec8c444bd4b6ab5c_20251110142839.mov'
    ] as string[],
    videoUrlsCached: [] as string[],
    currentVideoIndex: 0,
    speakingVideoUrl: 'https://t.aix101.com/udata/100728/mov/eccbb89ace11af0a0839b70a5c567bfa_20251110143611.mov',
    speakingVideoCachedUrl: '',
    isSpeaking: false,
    activeIdleIndex: 0
  }

  audioContext: any = null
  speechAudioContext: any = null // 用于播放AI回复的语音
  voiceRecognitionService: TaroVoiceRecognitionService | null = null
  recognizedText: string = ''
  audio2TextPromiseResolve: ((text: string) => void) | null = null
  audio2TextPromiseReject: ((error: Error) => void) | null = null
  videoContext: any = null
  idleVideoContextA: any = null
  idleVideoContextB: any = null
  speakingVideoContext: any = null
  SPEECH_CACHE_KEY: string = 'freeConversationSpeechAudioPath'
  IDLE_VIDEO_CACHE_KEYS: string[] = ['freeIdleVideo0', 'freeIdleVideo1']
  SPEAKING_VIDEO_CACHE_KEY: string = 'freeSpeakingVideo'
  videoPlayRetryTimer: any = null
  videoPlayRetryAttempts: number = 0
  isIdleSwitching: boolean = false

  // 下载并持久化缓存语音文件，返回本地路径
  cacheSpeechAudioFromUrl = async (remoteUrl: string): Promise<string> => {
    try {
      const downloadRes = await Taro.downloadFile({ url: remoteUrl })
      // 微信端返回 statusCode，H5可能不返回；以 tempFilePath 存在为准
      if ((downloadRes as any).tempFilePath) {
        const tempPath = (downloadRes as any).tempFilePath
        const saveRes = await Taro.saveFile({ tempFilePath: tempPath })
        const localPath = (saveRes as any).savedFilePath || (saveRes as any).filePath || ''
        if (localPath) {
          Taro.setStorageSync(this.SPEECH_CACHE_KEY, localPath)
          return localPath
        }
      }
    } catch (e) {
      // 回退到远程URL
    }
    return remoteUrl
  }

  // 预下载并缓存视频到本地文件，减少切换等待
  cacheVideoFromUrl = async (remoteUrl: string, storageKey?: string): Promise<string> => {
    try {
      const cachedPath = storageKey ? Taro.getStorageSync(storageKey) : ''
      if (cachedPath) {
        return cachedPath
      }
    } catch (_) {}

    const res = await Taro.downloadFile({ url: remoteUrl })
    if (res.statusCode === 200 && res.tempFilePath) {
      try {
        if (storageKey) {
          Taro.setStorageSync(storageKey, res.tempFilePath)
        }
      } catch (_) {}
      return res.tempFilePath
    }
    return remoteUrl
  }

  // 预加载两个待机视频与说话视频并更新到状态
  preloadAllAvatarVideos = async () => {
    try {
      const idle0 = await this.cacheVideoFromUrl(this.state.videoUrls[0], this.IDLE_VIDEO_CACHE_KEYS[0])
      const idle1 = await this.cacheVideoFromUrl(this.state.videoUrls[1], this.IDLE_VIDEO_CACHE_KEYS[1])
      const speak = await this.cacheVideoFromUrl(this.state.speakingVideoUrl, this.SPEAKING_VIDEO_CACHE_KEY)
      this.setState({
        videoUrlsCached: [idle0, idle1],
        speakingVideoCachedUrl: speak
      })
    } catch (_) {}
  }

  // 头像URL
  avatarUrl = 'https://t.aix101.com/udata/100728/png/32036005d1f6ed59803ba3e13c80993e_20251105112941.png'

  // 保证头像视频始终由play()触发播放；在src或状态切换后可选seek到开头
  playAvatarVideo = (forceSeek: boolean = false) => {
    try {
      const ctx = this.state.isSpeaking
        ? this.speakingVideoContext
        : (this.state.activeIdleIndex === 0 ? this.idleVideoContextA : this.idleVideoContextB)
      if (forceSeek) {
        ctx?.seek?.(0)
      }
      ctx?.play?.()
    } catch (_) {}
  }

  // 在切换视频源或状态后，进行短时重试播放，避免某些机型或时序下不触发播放
  scheduleEnsureVideoPlaying = () => {
    try {
      if (this.videoPlayRetryTimer) {
        clearTimeout(this.videoPlayRetryTimer)
        this.videoPlayRetryTimer = null
      }
    } catch (_) {}
    this.videoPlayRetryAttempts = 0
    const tryPlay = () => {
      this.videoPlayRetryAttempts += 1
      this.playAvatarVideo(false)
      if (this.videoPlayRetryAttempts < 6) {
        this.videoPlayRetryTimer = setTimeout(tryPlay, 200)
      } else {
        this.videoPlayRetryTimer = null
      }
    }
    tryPlay()
  }

  clearEnsureVideoPlaying = () => {
    try {
      if (this.videoPlayRetryTimer) {
        clearTimeout(this.videoPlayRetryTimer)
        this.videoPlayRetryTimer = null
      }
    } catch (_) {}
  }

  // 预热指定的待机视频：回到开头并开始播放（隐藏态下播放以预热）
  preheatIdleVideo = (index: number) => {
    try {
      const ctx = index === 0 ? this.idleVideoContextA : this.idleVideoContextB
      ctx?.seek?.(0)
      ctx?.play?.()
      this.scheduleEnsureVideoPlaying()
    } catch (_) {}
  }

  // 切换到下一个待机视频（1-2-1-2-…），尽量无缝
  swapIdleToNext = () => {
    if (this.isIdleSwitching) return
    this.isIdleSwitching = true
    const nextIndex = this.state.activeIdleIndex === 0 ? 1 : 0
    // 先预热下一个
    this.preheatIdleVideo(nextIndex)
    // 再切换可见索引
    this.setState({ activeIdleIndex: nextIndex }, () => {
      try {
        // 重试确保切换后的视频处于播放态
        this.scheduleEnsureVideoPlaying()
      } finally {
        // 轻微延时后允许下一次切换
        setTimeout(() => { this.isIdleSwitching = false }, 300)
      }
    })
  }

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
    
    // 初始化录音管理器
    this.audioContext = Taro.createInnerAudioContext()
    
    // 初始化语音播放器（用于播放AI回复的语音）
    this.speechAudioContext = Taro.createInnerAudioContext()
    this.speechAudioContext.onEnded(() => {
      // 语音结束：切回到两个动画视频的循环
      this.setState({ isPlayingSpeech: false, isSpeaking: false }, () => {
        try {
          const nextIndex = (this.state.currentVideoIndex + 1) % this.state.videoUrls.length
          this.setState({ currentVideoIndex: nextIndex }, () => {
            // 切换待机动画时触发重试播放，避免不触发播放
            this.scheduleEnsureVideoPlaying()
          })
        } catch (e) {}
      })
    })
    this.speechAudioContext.onCanplay(() => {
      // 资源加载完成后：开始播放语音并切换到说话动画
      try {
        this.setState({ isPlayingSpeech: true, isSpeaking: true }, () => {
          // 切换说话动画时触发重试播放，避免不触发播放
          this.scheduleEnsureVideoPlaying()
          this.speechAudioContext?.play?.()
        })
      } catch (e) {
        this.setState({ isPlayingSpeech: false, isSpeaking: false })
      }
    })
    this.speechAudioContext.onError((error: any) => {
      console.error('语音播放失败:', error)
      this.setState({ isPlayingSpeech: false })
      // 去掉播放失败的toast提示
    })
    
    // 加载并启动对话（使用unit_id=1）
    this.startConversation()

    // 初始化视频上下文并开始播放当前视频（不使用autoplay属性）
    Taro.nextTick(() => {
      try {
        // 初始化三个视频上下文
        this.idleVideoContextA = Taro.createVideoContext('freeIdleVideoA', this)
        this.idleVideoContextB = Taro.createVideoContext('freeIdleVideoB', this)
        this.speakingVideoContext = Taro.createVideoContext('freeSpeakingVideo', this)
        // 使用重试机制确保初次播放触发（待机A为初始可见）
        this.scheduleEnsureVideoPlaying()
      } catch (e) {
        // 忽略H5不支持的情况
      }
    })

    // 异步预加载视频到本地，减少切换间隔
    this.preloadAllAvatarVideos()
  }

  componentWillUnmount() {
    // 清理资源
    if (this.voiceRecognitionService) {
      try {
        this.voiceRecognitionService.destroy()
      } catch (e) {
        // 忽略错误
      }
    }
    if (this.audioContext) {
      this.audioContext.destroy()
    }
    if (this.speechAudioContext) {
      try {
        this.speechAudioContext.stop()
        this.speechAudioContext.destroy()
      } catch (e) {
        // 忽略错误
      }
    }
    this.clearEnsureVideoPlaying()
  }

  /**
   * 启动对话：获取unit_id=1的所有exercises的vocabs，拼接后发送给智能体
   */
  startConversation = async () => {
    this.setState({ isLoadingConversation: true, currentAIText: '' })
    
    try {
      // 1. 使用unit_id=1获取所有exercises
      const { exerciseAPI } = await import('../../utils/api_v2')
      const exercisesResponse = await exerciseAPI.getExerciseList(1)
      const exercises = exercisesResponse.data || exercisesResponse.result
      
      if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
        throw new Error('该单元没有练习')
      }

      // 设置背景图片为第一个有图片的练习
      // try {
      //   const firstWithImage = Array.isArray(exercises)
      //     ? exercises.find((ex: any) => !!ex.image)
      //     : null
      //   if (firstWithImage && firstWithImage.image) {
      //     this.setState({ exerciseImageUrl: firstWithImage.image })
      //   }
      // } catch (_) {}

      // 2. 收集所有exercises的vocabs
      const allVocabs: string[] = []
      for (const exercise of exercises) {
        if (exercise.vocabs && Array.isArray(exercise.vocabs)) {
          allVocabs.push(...exercise.vocabs)
        }
      }

      // 去重
      const uniqueVocabs = Array.from(new Set(allVocabs))

      if (uniqueVocabs.length === 0) {
        throw new Error('该单元所有练习都没有vocabs')
      }

      console.log('收集到的vocabs:', uniqueVocabs)
      console.log('vocabs数量:', uniqueVocabs.length)

      // 3. 获取新tid
      const topicResponse = await aiChatAPI.topicEdit()
      const tid = (topicResponse && typeof topicResponse.data === 'object' && 'id' in topicResponse.data) 
        ? topicResponse.data.id 
        : undefined
      
      if (!tid) throw new Error('未能获取到tid')
      
      this.setState({ tid })

      // 4. vocabs拼接后，调用completions接口，agentId=5864
      // 将所有vocabs拼接成一个字符串
      const vocabsText = uniqueVocabs.join(', ')
      console.log('拼接后的vocabs文本:', vocabsText)
      
      let fullResponse = ''
      
      // 开始流式输出
      this.setState({ 
        isStreaming: true,
        currentAIText: '',
        streamingText: '',
        speechAudioUrl: '', // 清除旧的语音URL，新文本需要重新生成
        isPlayingSpeech: false, // 停止播放
        isGeneratingSpeech: false, // 清除生成状态
        translationText: '' // 清空翻译内容
      })
      // 清除本地语音缓存
      try { Taro.removeStorageSync(this.SPEECH_CACHE_KEY) } catch (_) {}
      
      // 停止当前播放的语音
      if (this.speechAudioContext) {
        try {
          this.speechAudioContext.stop()
        } catch (e) {
          // 忽略错误
        }
      }
      
      await aiChatAPI.completions({
        tid,
        text: vocabsText, // 直接使用拼接后的文本
        agent_id: 5864,
        onMessage: (chunk: string) => {
          fullResponse += chunk
          // 实时更新中间文字框的内容
          this.setState({
            isStreaming: true,
            streamingText: fullResponse,
            currentAIText: fullResponse
          })
        },
        onComplete: () => {
          // 流式输出完成
          this.setState({
            isStreaming: false,
            streamingText: '',
            currentAIText: fullResponse
          })
          // 流式输出完成后自动生成语音
          this.generateSpeechForText(fullResponse)
        },
        onError: (err: any) => {
          this.setState({
            isStreaming: false,
            streamingText: '',
            currentAIText: ''
          })
          Taro.showToast({ title: 'AI对话出错', icon: 'none' })
        }
      })
    } catch (e: any) {
      this.setState({ isLoadingConversation: false })
      Taro.showToast({ title: e.message || '对话初始化失败', icon: 'none' })
    }
    this.setState({ isLoadingConversation: false })
  }

  /**
   * 初始化语音识别服务（使用后端API）
   */
  initVoiceRecognitionService = async () => {
    try {
      this.voiceRecognitionService = new TaroVoiceRecognitionService(
        {},
        {
          onResult: (text: string, isFinal: boolean) => {
            this.recognizedText = text
            // 如果是最终结果，调用resolve
            if (isFinal && this.audio2TextPromiseResolve) {
              console.log('✅ audio2text识别完成，触发resolve:', text)
              this.audio2TextPromiseResolve(text)
              this.audio2TextPromiseResolve = null
              this.audio2TextPromiseReject = null
            }
          },
          onError: (error: string) => {
            // 如果识别失败，调用reject
            if (this.audio2TextPromiseReject) {
              console.error('❌ audio2text识别失败，触发reject:', error)
              this.audio2TextPromiseReject(new Error(error))
              this.audio2TextPromiseResolve = null
              this.audio2TextPromiseReject = null
            } else {
              Taro.showToast({ title: error, icon: 'none' })
            }
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
   * 开始录音（启动语音识别）
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

    try {
      await this.voiceRecognitionService.start()
    } catch (error: any) {
      this.setState({ isRecording: false })
      Taro.showToast({ title: '启动录音失败', icon: 'none' })
    }
  }

  /**
   * 停止录音（录音停止后会自动调用API进行识别）
   */
  handleStopRecording = async () => {
    const { recordingStartTime, tid } = this.state
    const endTime = Date.now()
    const duration = Math.floor((endTime - recordingStartTime) / 1000)
    
    this.setState({ isRecording: false })

    if (this.voiceRecognitionService) {
      this.recognizedText = ''
      
      // 创建Promise等待audio2text结果
      const audio2TextPromise = new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('audio2text识别超时'))
        }, 30000) // 30秒超时
        
        this.audio2TextPromiseResolve = (text: string) => {
          clearTimeout(timeout)
          resolve(text)
        }
        this.audio2TextPromiseReject = (error: Error) => {
          clearTimeout(timeout)
          reject(error)
        }
      })
      
      // 停止录音（会触发onStop回调，在回调中调用audio2text API）
      await this.voiceRecognitionService.stop()
      
      // 等待audio2text识别完成
      console.log('⏳ 等待audio2text识别完成...')
      let audio2TextResult = ''
      
      try {
        audio2TextResult = await audio2TextPromise
        console.log('✅ audio2text识别完成，识别文本:', audio2TextResult)
      } catch (error: any) {
        console.error('❌ audio2text识别失败:', error)
        Taro.showToast({
          title: error.message || '语音识别失败，请重试',
          icon: 'none',
          duration: 2000
        })
        return // 识别失败，不继续后续流程
      }
      
      const recognizedText = audio2TextResult
      const pcmFilePath = this.voiceRecognitionService.getPcmFilePath()
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
            // 异步任务，等待结果
            console.log('⏳ content_generate 是异步任务，等待结果...')
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
        ref_text: processedRefText, // 使用 content_generate 处理后的文本作为 ref_text
        duration: duration,
        timestamp: Date.now()
      }

      const messageId = Date.now()
      
      // 保存录音信息（不显示，仅用于评测）
      this.setState((prev: any) => ({
        recordedMessages: {
          ...prev.recordedMessages,
          [messageId]: recordData
        }
      }))

      // 立即清空当前的AI文字框和翻译内容
      this.setState({
        currentAIText: '',
        speechAudioUrl: '', // 清除旧的语音URL
        isPlayingSpeech: false, // 停止播放
        translationText: '' // 清空翻译内容
      })
      // 清除本地语音缓存
      try { Taro.removeStorageSync(this.SPEECH_CACHE_KEY) } catch (_) {}
      
      // 停止当前播放的语音
      if (this.speechAudioContext) {
        try {
          this.speechAudioContext.stop()
        } catch (e) {
          // 忽略错误
        }
      }

      // 等待600ms后发送给AI，等待下一条流式输出
      setTimeout(() => {
        // 发送给智能体（agentId=5864）
        console.log('📤 发送给智能体的消息（处理后的文本）:', textToSend || '(空文本)')
        this.sendUserMessageToAI(textToSend, tid || null)
      }, 600)
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
      
      // 清空之前的回复，开始新的流式输出
      this.setState({
        isStreaming: true,
        currentAIText: '',
        streamingText: '',
        speechAudioUrl: '', // 清除旧的语音URL，新文本需要重新生成
        isPlayingSpeech: false, // 停止播放
        isGeneratingSpeech: false, // 清除生成状态
        translationText: '' // 清空翻译内容
      })
      // 清除本地语音缓存
      try { Taro.removeStorageSync(this.SPEECH_CACHE_KEY) } catch (_) {}
      
      // 停止当前播放的语音
      if (this.speechAudioContext) {
        try {
          this.speechAudioContext.stop()
        } catch (e) {
          // 忽略错误
        }
      }

      await aiChatAPI.completions({
        tid,
        text: trimmedText,
        agent_id: 5864,
        onMessage: (chunk: string) => {
          fullResponse += chunk
          // 实时更新中间文字框的内容
          this.setState({
            isStreaming: true,
            streamingText: fullResponse,
            currentAIText: fullResponse
          })
        },
        onComplete: () => {
          // 流式输出完成
          this.setState({
            isStreaming: false,
            streamingText: '',
            currentAIText: fullResponse
          })
          // 流式输出完成后自动生成语音
          this.generateSpeechForText(fullResponse)
        },
        onError: (err: any) => {
          this.setState({
            isStreaming: false,
            streamingText: '',
            currentAIText: ''
          })
          Taro.showToast({ title: 'AI对话出错', icon: 'none' })
        }
      })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '发送失败', icon: 'none' })
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
   * 处理翻译按钮点击
   */
  handleTranslate = async () => {
    const { currentAIText, isTranslating, translationText } = this.state

    // 如果没有文本，无法翻译
    if (!currentAIText || currentAIText.trim() === '') {
      return
    }

    // 如果已经有翻译结果，清空
    if (translationText) {
      this.setState({ translationText: '' })
      return
    }

    // 如果正在翻译，不重复请求
    if (isTranslating) {
      return
    }

    try {
      this.setState({ isTranslating: true })

      // 调用generate接口，agentId=6219
      const cleanText = currentAIText.trim()
      
      console.log('📤 开始翻译，文本长度:', cleanText.length)
      const response = await contentAPI.generate(6219, cleanText)
      
      console.log('📥 翻译响应:', response)

      // 获取翻译内容
      let translation = ''
      if (response.success) {
        // 检查是否有task_id（异步任务）
        const taskId = response.data?.task_id || response.result?.task_id
        if (taskId) {
          // 异步任务，需要轮询监听
          console.log(`⏳ 检测到异步任务(taskId=${taskId})，开始轮询...`)
          const pollResult = await contentAPI.pollUntilComplete(taskId)
          if (pollResult.success && pollResult.content) {
            translation = pollResult.content.trim()
            console.log(`✅ 异步任务完成，获取到翻译内容，长度: ${translation.length}`)
          } else {
            console.error('翻译任务失败:', pollResult.error || '未知错误')
          }
        } else {
          // 同步任务，直接返回content
          translation = response.data?.content || response.result?.content || ''
          console.log(`✅ 同步任务完成，获取到翻译内容，长度: ${translation.length}`)
        }
      }

      if (translation) {
        console.log('✅ 翻译成功:', translation)
        this.setState({
          translationText: translation,
          isTranslating: false
        })
      } else {
        console.warn('⚠️ 未获取到翻译内容')
        this.setState({ isTranslating: false })
      }

    } catch (error: any) {
      console.error('❌ 翻译失败:', error)
      this.setState({ isTranslating: false })
    }
  }

  /**
   * 自动生成语音（流式输出完成后调用）
   */
  generateSpeechForText = async (text: string) => {
    if (!text || text.trim() === '') {
      return
    }

    const { isGeneratingSpeech } = this.state
    // 如果正在生成，不重复请求
    if (isGeneratingSpeech) {
      return
    }

    try {
      this.setState({ isGeneratingSpeech: true })

      // 调用文本转语音API
      const { voicePackAPI } = await import('../../utils/api_v2')
      
      // 清理文本
      const cleanText = text.trim()
      
      console.log('📤 流式输出完成，自动生成语音，文本长度:', cleanText.length)
      const response = await voicePackAPI.generate([cleanText])
      
      console.log('📥 语音生成响应:', response)

      // 获取音频URL
      let audioUrl = ''
      if (response.success) {
        // 处理不同的返回格式
        const responseAny = response as any
        let voiceItems: any[] = []
        if (Array.isArray(responseAny.data)) {
          voiceItems = responseAny.data
        } else if (Array.isArray(responseAny.result)) {
          voiceItems = responseAny.result
        } else if (responseAny.data?.items && Array.isArray(responseAny.data.items)) {
          voiceItems = responseAny.data.items
        } else if (responseAny.result?.items && Array.isArray(responseAny.result.items)) {
          voiceItems = responseAny.result.items
        }
        
        if (voiceItems.length > 0 && voiceItems[0].url) {
          audioUrl = voiceItems[0].url
        }
      }

      if (audioUrl) {
        console.log('✅ 语音生成成功，音频URL:', audioUrl)
        // 下载并缓存到本地文件，再保存到状态与本地存储
        const localPath = await this.cacheSpeechAudioFromUrl(audioUrl)
        this.setState({
          speechAudioUrl: localPath,
          isGeneratingSpeech: false,
          // 接口返回后立刻切换为说话动画（等待音频资源加载完成后onCanplay自动播放）
          isSpeaking: true
        }, () => {
          try {
            // 开始说话动画
            // 切换动画时触发重试播放，避免不触发播放
            this.scheduleEnsureVideoPlaying()
            // 设置音频src，等待onCanplay触发play()
            this.speechAudioContext.src = localPath
          } catch (e) {}
        })
      } else {
        console.warn('⚠️ 未获取到语音URL')
        this.setState({ isGeneratingSpeech: false })
      }

    } catch (error: any) {
      console.error('❌ 生成语音失败:', error)
      this.setState({ isGeneratingSpeech: false })
    }
  }

  /**
   * 处理播放AI回复语音按钮点击
   */
  handlePlayAISpeech = async () => {
    const { currentAIText, isPlayingSpeech, isGeneratingSpeech, speechAudioUrl } = this.state

    // 如果正在播放，停止播放
    if (isPlayingSpeech) {
      if (this.speechAudioContext) {
        try {
          this.speechAudioContext.stop()
        } catch (e) {
          // 忽略错误
        }
      }
      this.setState({ isPlayingSpeech: false })
      return
    }

    // 如果没有文本，无法播放
    if (!currentAIText || currentAIText.trim() === '') {
      return
    }

    // 如果已经有生成的语音URL，直接播放
    if (speechAudioUrl) {
      try {
        // 切换到说话动画并播放视频，不seek；立即更新播放中状态
        this.setState({ isSpeaking: true, isPlayingSpeech: true }, () => {
          this.playAvatarVideo(false)
          // 确保从头播放
          try { this.speechAudioContext.stop() } catch (_) {}
          this.speechAudioContext.src = speechAudioUrl
          try { this.speechAudioContext.seek?.(0) } catch (_) {}
          try { this.speechAudioContext.play() } catch (_) {}
        })
      } catch (error: any) {
        console.error('设置语音src失败:', error)
        this.setState({ isPlayingSpeech: false })
      }
      return
    }

    // 如果状态中没有URL，尝试读取本地缓存（多次点击复用缓存）
    try {
      const cachedPath = Taro.getStorageSync(this.SPEECH_CACHE_KEY)
      if (cachedPath) {
        // 切换到说话动画并播放视频，不seek；立即更新播放中状态
        this.setState({ isSpeaking: true, isPlayingSpeech: true }, () => {
          this.scheduleEnsureVideoPlaying()
          // 确保从头播放
          try { this.speechAudioContext.stop() } catch (_) {}
          this.speechAudioContext.src = cachedPath
          try { this.speechAudioContext.seek?.(0) } catch (_) {}
          try { this.speechAudioContext.play() } catch (_) {}
        })
        return
      }
    } catch (_) {}

    // 如果正在生成语音，等待生成完成
    if (isGeneratingSpeech) {
      // 等待生成完成，最多等待10秒
      let waitCount = 0
      const maxWait = 50 // 50次 * 200ms = 10秒
      while (this.state.isGeneratingSpeech && waitCount < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 200))
        waitCount++
      }

      // 检查是否生成完成
      if (this.state.speechAudioUrl) {
        try {
          // 仅设置src，等待onCanplay事件触发后再play()
          this.speechAudioContext.src = this.state.speechAudioUrl
        } catch (error: any) {
          console.error('设置语音src失败:', error)
          this.setState({ isPlayingSpeech: false })
        }
      } else {
        // 状态仍无URL时，尝试本地缓存
        try {
          const cachedPath = Taro.getStorageSync(this.SPEECH_CACHE_KEY)
          if (cachedPath) {
            this.speechAudioContext.src = cachedPath
          }
        } catch (_) {}
      }
      return
    }

    // 如果没有语音URL且不在生成中，尝试生成（兜底逻辑）
    if (currentAIText && currentAIText.trim() !== '') {
      await this.generateSpeechForText(currentAIText)
      // 等待生成完成后播放
      if (this.state.speechAudioUrl) {
        try {
          // 仅设置src，等待onCanplay事件触发后再play()
          this.speechAudioContext.src = this.state.speechAudioUrl
        } catch (error: any) {
          console.error('设置语音src失败:', error)
          this.setState({ isPlayingSpeech: false })
        }
      } else {
        // 状态仍无URL时，尝试本地缓存
        try {
          const cachedPath = Taro.getStorageSync(this.SPEECH_CACHE_KEY)
          if (cachedPath) {
            this.speechAudioContext.src = cachedPath
          }
        } catch (_) {}
      }
    }
  }

  /**
   * 处理任务重试逻辑（最多重试3次）
   */
  retryTask = async <T,>(
    taskFn: () => Promise<T>,
    maxRetries: number = 3,
    taskName: string = '任务'
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await taskFn()
        return { success: true, data: result }
      } catch (error: any) {
        if (attempt === maxRetries) {
          return { success: false, error: error.message || '任务执行失败' }
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }
    return { success: false, error: '未知错误' }
  }

  /**
   * 完成练习按钮处理逻辑
   * 自由对话以单元为单位，使用speech_audio和speech_report表
   * 使用unit_id=1
   */
  handleCompleteExercise = async () => {
    const { recordedMessages } = this.state
    const studentInfo = Taro.getStorageSync('studentInfo')
    const studentId = studentInfo?.id

    if (!studentId) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    const unitIdNum = 1 // 固定使用unit_id=1
    const recordedCount = Object.keys(recordedMessages).length

    if (recordedCount === 0) {
      Taro.showToast({ title: '请至少完成一次录音', icon: 'none' })
      return
    }

    // 确认对话框
    const confirmResult = await new Promise<boolean>((resolve) => {
      Taro.showModal({
        title: '确认完成',
        content: `确定要完成练习吗？共 ${recordedCount} 条录音将被评测。`,
        success: (res) => resolve(res.confirm),
        fail: () => resolve(false)
      })
    })

    if (!confirmResult) return

    try {
      Taro.showLoading({ title: '正在上传文件...', mask: true })

      // 步骤0: 删除学生在该单元的所有旧数据（speech_audio和speech_report）
      // 根据 unit_id 和 student_id 清除已有的 speech_audio 和 speech_report 数据
      const { speechAudioAPI, speechReportAPI } = await import('../../utils/api_v2')
      try {
        console.log('🗑️ 开始清除旧数据，unit_id:', unitIdNum, 'student_id:', studentId)
        
        // 获取该单元和学生的所有speech_audio
        const audioListResult = await speechAudioAPI.getAudioList(unitIdNum, studentId)
        console.log('📋 获取到的speech_audio列表:', audioListResult)
        
        // 处理不同的返回格式
        let audios: any[] = []
        if (Array.isArray(audioListResult.data)) {
          audios = audioListResult.data
        } else if (Array.isArray(audioListResult.result)) {
          audios = audioListResult.result
        } else if (audioListResult.data?.items && Array.isArray(audioListResult.data.items)) {
          audios = audioListResult.data.items
        } else if (audioListResult.result?.items && Array.isArray(audioListResult.result.items)) {
          audios = audioListResult.result.items
        }
        
        console.log(`📊 找到 ${audios.length} 个speech_audio记录需要删除`)
        
        // 删除所有音频
        let deletedAudioCount = 0
        for (const audio of audios) {
          if (audio.id) {
            try {
              await speechAudioAPI.deleteAudio(audio.id)
              deletedAudioCount++
              console.log(`✅ 删除speech_audio成功，id: ${audio.id}`)
            } catch (e) {
              console.error(`❌ 删除speech_audio失败，id: ${audio.id}:`, e)
            }
          }
        }
        console.log(`✅ 成功删除 ${deletedAudioCount}/${audios.length} 个speech_audio记录`)

        // 获取该单元和学生的所有speech_report
        const reportListResult = await speechReportAPI.getReportList(unitIdNum, studentId)
        console.log('📋 获取到的speech_report列表:', reportListResult)
        
        // 处理不同的返回格式
        let reports: any[] = []
        if (Array.isArray(reportListResult.data)) {
          reports = reportListResult.data
        } else if (Array.isArray(reportListResult.result)) {
          reports = reportListResult.result
        } else if (reportListResult.data?.items && Array.isArray(reportListResult.data.items)) {
          reports = reportListResult.data.items
        } else if (reportListResult.result?.items && Array.isArray(reportListResult.result.items)) {
          reports = reportListResult.result.items
        }
        
        console.log(`📊 找到 ${reports.length} 个speech_report记录需要删除`)
        
        // 删除所有报告
        let deletedReportCount = 0
        for (const report of reports) {
          if (report.id) {
            try {
              await speechReportAPI.deleteReport(report.id)
              deletedReportCount++
              console.log(`✅ 删除speech_report成功，id: ${report.id}`)
            } catch (e) {
              console.error(`❌ 删除speech_report失败，id: ${report.id}:`, e)
            }
          }
        }
        console.log(`✅ 成功删除 ${deletedReportCount}/${reports.length} 个speech_report记录`)
        
        console.log('✅ 旧数据清除完成')
      } catch (deleteError) {
        console.error('❌ 清除旧数据失败:', deleteError)
        console.warn('⚠️ 忽略删除错误，继续执行')
      }

      // 步骤1: 上传所有录音文件并创建speech_audio记录（同步，evaluation为空）
      const { fileAPI } = await import('../../utils/api_v2')
      const uploadResults: any[] = []

      for (const [messageId, recordDataRaw] of Object.entries(recordedMessages)) {
        try {
          const recordData = recordDataRaw as any
          const retryResult = await this.retryTask(
            async () => {
              // 上传文件
              const uploadResult = await fileAPI.uploadFile(recordData.pcmFilePath)
              if (!uploadResult.success) {
                throw new Error('文件上传失败')
              }

              const fileUrl = uploadResult.data?.file?.url || uploadResult.result?.file?.url
              if (!fileUrl) {
                throw new Error('文件URL为空')
              }

              // 创建speech_audio记录（evaluation为空）
              // 确保必填字段不为空且类型正确
              if (!studentId || studentId === 0) {
                throw new Error('student_id不能为0')
              }
              if (!fileUrl || fileUrl.trim() === '') {
                throw new Error('file不能为空')
              }
              // unitIdNum 固定为 1，无需检查

              const audioData: any = {
                unit_id: Number(unitIdNum),  // 确保是数字类型
                student_id: Number(studentId),  // 确保是数字类型
                file: String(fileUrl).trim()  // 确保是字符串且不为空
              }

              // 可选字段：只在有值时才添加
              if (recordData.duration !== undefined && recordData.duration !== null) {
                audioData.duration = Math.floor(Number(recordData.duration))  // 确保是整数
              }
              if (recordData.ref_text !== undefined && recordData.ref_text !== null && recordData.ref_text.trim() !== '') {
                audioData.ref_text = String(recordData.ref_text).trim()
              }
              if (recordData.evaluation !== undefined && recordData.evaluation !== null && recordData.evaluation.trim() !== '') {
                audioData.evaluation = String(recordData.evaluation).trim()
              } else {
                audioData.evaluation = ''  // 默认空字符串
              }

              console.log('📤 准备创建speech_audio记录:', {
                unit_id: audioData.unit_id,
                student_id: audioData.student_id,
                file: audioData.file,
                duration: audioData.duration,
                ref_text: audioData.ref_text,
                evaluation: audioData.evaluation
              })

              const saveResult = await speechAudioAPI.editAudio(audioData)
              console.log('📥 speech_audio创建响应:', saveResult)
              
              if (!saveResult.success) {
                console.error('❌ speech_audio创建失败:', {
                  success: saveResult.success,
                  message: saveResult.message,
                  data: saveResult.data,
                  result: saveResult.result
                })
                throw new Error(`保存音频记录失败: ${saveResult.message || '未知错误'}`)
              }

              const audioId = saveResult.data?.id || saveResult.result?.id
              return { fileUrl, audioId, messageId }
            },
            3,
            `上传录音 ${messageId}`
          )

          if (retryResult.success && retryResult.data) {
            uploadResults.push({
              ...retryResult.data,
              recordData
            })
          }
        } catch (error) {
          console.error(`上传录音 ${messageId} 失败:`, error)
        }
      }

      Taro.hideLoading()

      if (uploadResults.length === 0) {
        throw new Error('没有成功上传的录音文件')
      }

      // 步骤2: 创建speech_report记录（同步，content为空）
      const audioIds = uploadResults.map(r => r.audioId)

      const reportData = {
        unit_id: unitIdNum,
        student_id: studentId,
        audio_ids: audioIds,
        content: '' // 暂时为空，后台异步评测后更新
      }

      const reportResult = await speechReportAPI.editReport(reportData)
      if (!reportResult.success) {
        throw new Error('创建报告失败')
      }

      const reportId = reportResult.data?.id || reportResult.result?.id

      // 保存reportId和unitId到本地，用于后台评测
      Taro.setStorageSync('currentSpeechReportId', reportId)
      Taro.setStorageSync('currentUnitId', unitIdNum)

      // 步骤3: 后台异步开始评测（不等待，异步执行）
      console.log('🚀 准备启动后台评测任务...')
      console.log('参数检查:', {
        studentId,
        unitId: unitIdNum,
        uploadResultsCount: uploadResults.length,
        reportId
      })
      
      // 立即启动后台评测任务（不等待，异步执行）
      if (unitIdNum && reportId && uploadResults.length > 0) {
        setTimeout(() => {
          console.log('🚀 开始执行后台评测任务...')
          this.startBackgroundEvaluation(studentId, unitIdNum, uploadResults, reportId, reportData)
            .catch((error) => {
              console.error('❌ 后台评测任务启动失败:', error)
            })
        }, 100)
      }

      // 显示上传成功提示并立即返回上级页面
      Taro.showToast({
        title: '上传成功，评测进行中...',
        icon: 'success',
        duration: 1500
      })

      // 上传成功后立即返回上级页面
      setTimeout(() => {
        Taro.navigateBack()
      }, 100)

    } catch (error: any) {
      Taro.hideLoading()
      Taro.showToast({
        title: error.message || '上传失败',
        icon: 'none',
        duration: 3000
      })
    }
  }

  /**
   * 后台异步评测函数
   * 处理SOE评测、generate评价、更新数据库
   * 评测流程：
   * 1. 每个音频文件 + 识别文字 → SOE接口评测
   * 2. SOE返回的JSON数据 → generate接口(agentId=5844)处理 → content字段为总结内容 → 存入speech_audios.evaluation
   * 3. 所有音频的总结 → generate接口(agentId=5863) → 整体总结 → 存入speech_report.content
   */
  startBackgroundEvaluation = async (
    studentId: number,
    unitId: number,
    uploadResults: any[],
    reportId: number,
    reportData: any
  ) => {
    console.log('🚀 后台异步评测开始...')
    console.log(`📊 共 ${uploadResults.length} 个音频需要评测`)
    console.log('参数详情:', {
      studentId,
      unitId,
      reportId,
      uploadResultsCount: uploadResults.length
    })

    try {
      const { soeAPI, contentAPI, speechAudioAPI, speechReportAPI } = await import('../../utils/api_v2')
      console.log('✅ API模块加载成功')
      const allSoeResults: any[] = []
      const allEvaluations: string[] = []
      let successCount = 0
      let failCount = 0

      // 对每个音频进行评测
      for (let i = 0; i < uploadResults.length; i++) {
        const uploadResult = uploadResults[i]
        console.log(`\n📝 ========== 开始评测音频 ${i + 1}/${uploadResults.length} ==========`)
        console.log('音频详情:', {
          audioId: uploadResult.audioId,
          fileUrl: uploadResult.fileUrl,
          localFilePath: uploadResult.recordData?.pcmFilePath,
          refText: uploadResult.recordData?.ref_text
        })

        try {
          // 获取本地缓存的音频文件路径和识别文字
          const localFilePath = uploadResult.recordData?.pcmFilePath
          const refText = uploadResult.recordData?.ref_text

          if (!localFilePath) {
            throw new Error('本地音频文件路径不存在')
          }

          if (!refText) {
            throw new Error('识别文字不存在')
          }

          console.log(`✅ 使用本地缓存的音频文件: ${localFilePath}`)
          console.log(`✅ 使用识别文字作为ref_text: ${refText}`)

          // 步骤1: SOE评测（使用本地音频文件 + ref_text）
          console.log(`🔍 步骤1: 开始SOE评测 ${i + 1}...`)
          console.log('SOE评测参数:', {
            audioFile: localFilePath,
            refText: refText
          })
          
          const soeResult = await this.retryTask(
            async () => {
              console.log(`🔄 调用SOE接口，参数: audioFile=${localFilePath}, refText=${refText}`)
              // SOE接口：音频文件放在form-data的file里面，ref_text作为form-data参数
              const result = await soeAPI.evaluate([localFilePath], [refText])
              console.log('SOE接口返回结果:', result)
              if (!result.success) {
                throw new Error('SOE评测失败')
              }
              // SOE返回的是数组，取第一个元素
              const soeData = Array.isArray(result.data) ? result.data[0] : result.data
              console.log('SOE评测数据:', soeData)
              return soeData
            },
            3,
            `SOE评测 ${i + 1}`
          )

          if (!soeResult.success || !soeResult.data) {
            throw new Error(`SOE评测失败: ${soeResult.error || '未知错误'}`)
          }

          allSoeResults.push(soeResult.data)
          console.log(`✅ SOE评测完成 (audioId: ${uploadResult.audioId})`)

          // 步骤2: generate(agent_id=5844) → 处理SOE JSON → 获取content
          console.log(`🤖 步骤2: 调用generate接口(agentId=5844)处理SOE JSON...`)
          const evaluationResult = await this.retryTask(
            async () => {
              const soeJsonQuery = JSON.stringify(soeResult.data)
              console.log(`📤 发送SOE JSON数据到generate接口(agentId=5844)，数据长度: ${soeJsonQuery.length}`)
              
              const contentResult = await contentAPI.generate(5844, soeJsonQuery)
              console.log('generate接口(5844)返回结果:', contentResult)

              if (!contentResult.success) {
                throw new Error('生成评价请求失败')
              }

              // 检查是否有task_id（异步任务）
              const taskId = contentResult.data?.task_id || contentResult.result?.task_id
              if (taskId) {
                // 异步任务，需要轮询监听
                console.log(`⏳ 检测到异步任务(taskId=${taskId})，开始轮询...`)
                const pollResult = await contentAPI.pollUntilComplete(taskId)
                if (!pollResult.success) {
                  throw new Error(`评价生成任务失败: ${pollResult.error || '未知错误'}`)
                }
                console.log(`✅ 异步任务完成，获取到评价内容，长度: ${pollResult.content.length}`)
                return pollResult.content
              } else {
                // 同步任务，直接返回content
                const content = contentResult.data?.content || contentResult.result?.content || ''
                console.log(`✅ 同步任务完成，获取到评价内容，长度: ${content.length}`)
                return content
              }
            },
            3,
            `生成评价 ${i + 1}`
          )

          if (!evaluationResult.success || !evaluationResult.data) {
            throw new Error(`生成评价失败: ${evaluationResult.error || '未知错误'}`)
          }

          const evaluation = evaluationResult.data
          console.log(`✅ 评价生成完成 (audioId: ${uploadResult.audioId})，评价长度: ${evaluation.length}`)

          // 步骤3: 更新speech_audio记录的evaluation字段 = content
          console.log(`💾 步骤3: 更新speech_audio记录的evaluation字段...`)
          await this.retryTask(
            async () => {
              // 确保必填字段不为空且类型正确
              if (!uploadResult.audioId || uploadResult.audioId <= 0) {
                throw new Error('audioId无效')
              }
              if (!unitId || unitId === 0) {
                throw new Error('unit_id不能为0')
              }
              if (!studentId || studentId === 0) {
                throw new Error('student_id不能为0')
              }
              if (!uploadResult.fileUrl || uploadResult.fileUrl.trim() === '') {
                throw new Error('file不能为空')
              }

              const updateData: any = {
                id: Number(uploadResult.audioId),  // 编辑时必填，且>0
                unit_id: Number(unitId),  // 确保是数字类型
                student_id: Number(studentId),  // 确保是数字类型
                file: String(uploadResult.fileUrl).trim()  // 确保是字符串且不为空
              }

              // 可选字段：只在有值时才添加
              if (uploadResult.recordData.ref_text !== undefined && uploadResult.recordData.ref_text !== null && uploadResult.recordData.ref_text.trim() !== '') {
                updateData.ref_text = String(uploadResult.recordData.ref_text).trim()
              }
              if (evaluation !== undefined && evaluation !== null && evaluation.trim() !== '') {
                updateData.evaluation = String(evaluation).trim()
              } else {
                updateData.evaluation = ''  // 默认空字符串
              }
              if (uploadResult.recordData.duration !== undefined && uploadResult.recordData.duration !== null) {
                updateData.duration = Math.floor(Number(uploadResult.recordData.duration))  // 确保是整数
              }

              console.log(`📤 更新speech_audio记录，audioId: ${uploadResult.audioId}`)
              console.log('📤 更新数据:', {
                id: updateData.id,
                unit_id: updateData.unit_id,
                student_id: updateData.student_id,
                file: updateData.file,
                duration: updateData.duration,
                ref_text: updateData.ref_text,
                evaluation: updateData.evaluation
              })

              const updateResult = await speechAudioAPI.editAudio(updateData)
              console.log('📥 speech_audio更新响应:', updateResult)
              
              if (!updateResult.success) {
                console.error('❌ speech_audio更新失败:', {
                  success: updateResult.success,
                  message: updateResult.message,
                  data: updateResult.data,
                  result: updateResult.result
                })
                throw new Error(`更新音频记录失败: ${updateResult.message || '未知错误'}`)
              }
              console.log(`✅ speech_audio记录更新成功`)
            },
            3,
            `更新评价 ${i + 1}`
          )

          allEvaluations.push(evaluation)
          successCount++
          console.log(`✅ 音频 ${i + 1} 评测完成 (audioId: ${uploadResult.audioId})`)

        } catch (error: any) {
          failCount++
          console.error(`❌ 音频 ${i + 1} 评测失败:`, error)
          console.error(`错误详情:`, error.message || error)
        }
      }

      console.log(`\n📊 单个音频评测完成统计:`)
      console.log(`  - 成功: ${successCount}/${uploadResults.length}`)
      console.log(`  - 失败: ${failCount}/${uploadResults.length}`)

      // 步骤4: 所有音频评测完成后，生成整体报告
      if (allEvaluations.length > 0) {
        console.log(`\n📊 ========== 开始生成整体报告 ==========`)
        console.log(`共 ${allEvaluations.length} 个评价将用于生成整体报告`)

        // generate(agent_id=5863) → 处理所有evaluation → 获取整体报告
        console.log(`🤖 调用generate接口(agentId=5863)处理所有evaluation...`)
        const overallResult = await this.retryTask(
          async () => {
            const combinedEvaluations = allEvaluations.join('\n\n')
            console.log(`📤 发送所有evaluation到generate接口(agentId=5863)，数据长度: ${combinedEvaluations.length}`)
            
            const contentResult = await contentAPI.generate(5863, combinedEvaluations)
            console.log('generate接口(5863)返回结果:', contentResult)

            if (!contentResult.success) {
              throw new Error('生成整体分析请求失败')
            }

            // 检查是否有task_id（异步任务）
            const taskId = contentResult.data?.task_id || contentResult.result?.task_id
            if (taskId) {
              // 异步任务，需要轮询监听
              console.log(`⏳ 检测到异步任务(taskId=${taskId})，开始轮询...`)
              const pollResult = await contentAPI.pollUntilComplete(taskId)
              if (!pollResult.success) {
                throw new Error(`整体分析生成任务失败: ${pollResult.error || '未知错误'}`)
              }
              console.log(`✅ 异步任务完成，获取到整体报告内容，长度: ${pollResult.content.length}`)
              return pollResult.content
            } else {
              // 同步任务，直接返回content
              const content = contentResult.data?.content || contentResult.result?.content || ''
              console.log(`✅ 同步任务完成，获取到整体报告内容，长度: ${content.length}`)
              return content
            }
          },
          3,
          '生成整体分析'
        )

        if (overallResult.success && overallResult.data) {
          // 步骤5: 更新speech_report记录的content字段
          console.log(`💾 更新speech_report记录的content字段...`)
          await this.retryTask(
            async () => {
              const updateData = {
                id: reportId,
                unit_id: unitId,
                student_id: studentId,
                audio_ids: uploadResults.map(r => r.audioId),
                content: overallResult.data // 保存整体报告内容
              }

              console.log(`📤 更新speech_report记录，reportId: ${reportId}`)
              const updateResult = await speechReportAPI.editReport(updateData)
              if (!updateResult.success) {
                throw new Error('更新报告失败')
              }
              console.log(`✅ speech_report记录更新成功`)
            },
            3,
            '更新报告'
          )

          console.log('✅ 整体报告生成完成')
        } else {
          console.error(`❌ 整体报告生成失败:`, overallResult.error || '未知错误')
        }
      } else {
        console.error(`❌ 没有成功的评价，无法生成整体报告`)
      }

      console.log('\n🎉 ========== 后台异步评测全部完成 ==========')
      console.log(`📊 最终统计:`)
      console.log(`  - 成功评测: ${successCount}/${uploadResults.length}`)
      console.log(`  - 失败评测: ${failCount}/${uploadResults.length}`)
      console.log(`  - 生成评价: ${allEvaluations.length}`)
      console.log(`  - 整体报告: ${allEvaluations.length > 0 ? '已生成' : '未生成'}`)

      // 提示用户评测完成
      if (successCount > 0) {
        Taro.showToast({
          title: `评测完成：${successCount}/${uploadResults.length} 成功`,
          icon: 'success',
          duration: 3000
        })
      } else {
        Taro.showToast({
          title: '评测失败，请重试',
          icon: 'none',
          duration: 3000
        })
      }

    } catch (error: any) {
      console.error('❌ 后台异步评测失败:', error)
      console.error('错误详情:', error.message || error)
      Taro.showToast({
        title: '评测失败: ' + (error.message || '未知错误'),
        icon: 'none',
        duration: 3000
      })
    }
  }

  render() {
    const { 
      studentName,
      isStreaming,
      currentAIText,
      isRecording,
      isLoadingConversation,
      recordedMessages,
      isPlayingSpeech,
      isGeneratingSpeech,
      translationText,
      isTranslating,
      exerciseImageUrl
    } = this.state

    return (
      <View 
        className='free-conversation-page'
        style={exerciseImageUrl ? {
          backgroundImage: `url(${exerciseImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        } : undefined}
      >
        {/* 头部 */}
        <View className='header'>
          <View className='header-content'>
            <View className='header-left'>
              <SafeAtIcon value='message' size='32' color='white' />
              <Text className='header-title'>自由对话</Text>
            </View>
            <View className='header-right'>
              <SafeAtButton 
                type='secondary' 
                size='small'
                onClick={this.handleCompleteExercise}
                className='complete-exercise-btn'
                disabled={Object.keys(recordedMessages).length === 0}
              >
                完成练习
              </SafeAtButton>
              <Text className='user-name'>{studentName}</Text>
            </View>
          </View>
        </View>

        {/* 头像（放大3倍，无card） - 使用视频顺序播放与说话动画切换 */}
        <View className='avatar-section'>
          <View className='avatar-video-wrapper'>
            {/* 待机视频A（可见/隐藏覆盖），非循环，靠 onTimeUpdate 与 onEnded 触发切换 */}
            <Video
              id='freeIdleVideoA'
              src={(this.state.videoUrlsCached[0]) || this.state.videoUrls[0]}
              className='avatar-video'
              controls={false}
              muted
              loop={false}
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                opacity: this.state.isSpeaking ? 0 : (this.state.activeIdleIndex === 0 ? 1 : 0)
              }}
              onEnded={() => {
                if (!this.state.isSpeaking && this.state.activeIdleIndex === 0) {
                  this.swapIdleToNext()
                }
              }}
              onTimeUpdate={(e: any) => {
                if (!this.state.isSpeaking && this.state.activeIdleIndex === 0) {
                  const d = e?.detail || {}
                  const cur = Number(d.currentTime || 0)
                  const dur = Number(d.duration || 0)
                  if (dur > 0 && cur >= dur - 0.2) {
                    this.swapIdleToNext()
                  }
                }
              }}
              onPause={() => { this.scheduleEnsureVideoPlaying() }}
              onPlay={() => { this.clearEnsureVideoPlaying() }}
              onWaiting={() => { this.scheduleEnsureVideoPlaying() }}
              onError={() => { this.scheduleEnsureVideoPlaying() }}
            />

            {/* 待机视频B */}
            <Video
              id='freeIdleVideoB'
              src={(this.state.videoUrlsCached[1]) || this.state.videoUrls[1]}
              className='avatar-video'
              controls={false}
              muted
              loop={false}
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                opacity: this.state.isSpeaking ? 0 : (this.state.activeIdleIndex === 1 ? 1 : 0)
              }}
              onEnded={() => {
                if (!this.state.isSpeaking && this.state.activeIdleIndex === 1) {
                  this.swapIdleToNext()
                }
              }}
              onTimeUpdate={(e: any) => {
                if (!this.state.isSpeaking && this.state.activeIdleIndex === 1) {
                  const d = e?.detail || {}
                  const cur = Number(d.currentTime || 0)
                  const dur = Number(d.duration || 0)
                  if (dur > 0 && cur >= dur - 0.2) {
                    this.swapIdleToNext()
                  }
                }
              }}
              onPause={() => { this.scheduleEnsureVideoPlaying() }}
              onPlay={() => { this.clearEnsureVideoPlaying() }}
              onWaiting={() => { this.scheduleEnsureVideoPlaying() }}
              onError={() => { this.scheduleEnsureVideoPlaying() }}
            />

            {/* 说话动画视频（在 isSpeaking 时可见并循环） */}
            <Video
              id='freeSpeakingVideo'
              src={this.state.speakingVideoCachedUrl || this.state.speakingVideoUrl}
              className='avatar-video'
              controls={false}
              muted
              loop={true}
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                opacity: this.state.isSpeaking ? 1 : 0
              }}
              onPause={() => { this.scheduleEnsureVideoPlaying() }}
              onPlay={() => { this.clearEnsureVideoPlaying() }}
              onWaiting={() => { this.scheduleEnsureVideoPlaying() }}
              onError={() => { this.scheduleEnsureVideoPlaying() }}
            />
          </View>
        </View>

        {/* 中间AI回复文字框 */}
        <View className='ai-text-container'>
          <View className='ai-text-box'>
            <Text className='ai-text'>
              {currentAIText || ''}
              {isStreaming && (
                <Text className='streaming-dot'>●</Text>
              )}
            </Text>
            {/* 播放按钮和翻译按钮（居中下方） */}
            {currentAIText && currentAIText.trim() !== '' && (
              <View className='action-buttons-wrapper'>
                {/* 播放按钮 */}
                <View 
                  className={`speech-play-btn ${this.state.isPlayingSpeech ? 'playing' : ''} ${this.state.isGeneratingSpeech ? 'generating' : ''}`}
                  onClick={this.handlePlayAISpeech}
                >
                  {this.state.isGeneratingSpeech ? (
                    <SafeAtActivityIndicator size={20} color='#667eea' />
                  ) : this.state.isPlayingSpeech ? (
                    <SafeAtIcon value='pause' size='24' color='#667eea' />
                  ) : (
                    <SafeAtIcon value='play' size='24' color='#667eea' />
                  )}
                </View>
                {/* 翻译按钮 */}
                <View 
                  className={`translate-btn ${translationText ? 'has-translation' : ''} ${isTranslating ? 'translating' : ''}`}
                  onClick={this.handleTranslate}
                >
                  {isTranslating ? (
                    <SafeAtActivityIndicator size={20} color='#667eea' />
                  ) : translationText ? (
                    <SafeAtIcon value='close' size='24' color='#667eea' />
                  ) : (
                    <SafeAtIcon value='list' size='24' color='#667eea' />
                  )}
                </View>
              </View>
            )}
          </View>
          
          {/* 翻译结果显示区域（在文字框下方） */}
          {translationText && translationText.trim() !== '' && (
            <View className='translation-box'>
              <Text className='translation-text'>{translationText}</Text>
            </View>
          )}
        </View>

        {/* 录音按钮区域（页面底部中间） */}
        <View className='recording-button-section'>
          <SafeAtButton 
            type={isRecording ? 'primary' : 'secondary'}
            size='normal'
            onClick={this.handleRecordButtonClick}
            disabled={false}
            className={`record-button ${isRecording ? 'recording' : ''}`}
          >
            {isRecording ? '停止录音' : '开始录音'}
          </SafeAtButton>
        </View>

        {/* 加载遮罩层 */}
        {isLoadingConversation && (
          <View className='loading-overlay'>
            <View className='loading-content'>
              <Text className='loading-tip'>对话正在加载中...</Text>
              <Text className='loading-subtitle'>请稍候，正在为您生成对话内容</Text>
              <SafeAtActivityIndicator mode='center' size={64} color='#667eea' />
            </View>
          </View>
        )}
      </View>
    )
  }
}
