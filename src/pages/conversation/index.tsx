import { Component } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import { AtButton, AtCard, AtTag, AtDivider, AtToast, AtIcon, AtActivityIndicator } from 'taro-ui'

// Safety check for taro-ui components
const SafeAtButton = AtButton || (() => <View>Button not available</View>)
const SafeAtCard = AtCard || (() => <View>Card not available</View>)
const SafeAtTag = AtTag || (() => <View>Tag not available</View>)
const SafeAtDivider = AtDivider || (() => <View>Divider not available</View>)
const SafeAtToast = AtToast || (() => <View>Toast not available</View>)
const SafeAtActivityIndicator = AtActivityIndicator || (() => <View>Loading...</View>)

import Taro from '@tarojs/taro'
import './index.scss'
import { aiChatAPI } from '../../utils/api_v2/aiChat'
import { TaroVoiceRecognitionService } from '../../utils/voiceRecognition/TaroVoiceRecognitionService'
import { nlsAPI } from '../../utils/api_v2/nls'
import { contentAPI } from '../../utils/api_v2/content'

// 模拟练习数据
const mockExercises = {
  chapter1: [
    { id: 'ex1-1', title: '基础问候', scenario: '你在学校遇到了新同学，需要用英语打招呼并进行简单交流。' },
    { id: 'ex1-2', title: '自我介绍', scenario: '在英语角活动中，你需要向大家介绍自己的基本情况和兴趣爱好。' }
    // { id: 'ex1-3', title: '介绍他人', scenario: '你要把你的朋友介绍给新来的外教老师认识。' },
    // { id: 'ex1-4', title: '道别用语', scenario: '放学时，你需要和同学、老师道别。' },
    // { id: 'ex1-5', title: '情景对话练习', scenario: '在公园遇到了很久没见的朋友，进行一次完整的对话。' }
  ]
  // chapter2: [
  //   { id: 'ex2-1', title: '介绍家庭', scenario: '在英语课上，老师让你介绍一下你的家庭成员。' },
  //   { id: 'ex2-2', title: '描述家人', scenario: '向你的笔友描述你的家人的外貌特征和性格。' },
  //   { id: 'ex2-3', title: '谈论朋友', scenario: '和同学谈论你最好的朋友以及你们常一起做的事情。' },
  //   { id: 'ex2-4', title: '家庭活动', scenario: '周末你的家庭计划一起出去活动，讨论具体安排。' }
  // ],
  // chapter3: [
  //   { id: 'ex3-1', title: '学校设施', scenario: '新同学向你询问学校各设施的位置，你为他介绍。' },
  //   { id: 'ex3-2', title: '课程描述', scenario: '和你的同桌交流你们最喜欢的课程以及原因。' },
  //   { id: 'ex3-3', title: '学习习惯', scenario: '向同学分享你的学习习惯和提高英语的方法。' },
  //   { id: 'ex3-4', title: '师生交流', scenario: '你对作业有疑问，向老师请教。' },
  //   { id: 'ex3-5', title: '校园活动', scenario: '你想邀请同学参加学校的英语俱乐部活动。' },
  //   { id: 'ex3-6', title: '考试与评价', scenario: '考试后和同学讨论考试情况和学习计划。' }
  // ],
  // chapter4: [
  //   { id: 'ex4-1', title: '兴趣爱好表达', scenario: '在英语自我介绍中，详细介绍你的兴趣爱好。' },
  //   { id: 'ex4-2', title: '体育活动', scenario: '和同学讨论你们喜欢的体育运动和最近的比赛。' },
  //   { id: 'ex4-3', title: '音乐与艺术', scenario: '向朋友介绍你喜欢的音乐类型和艺术家。' },
  //   { id: 'ex4-4', title: '阅读与电影', scenario: '推荐一本你最近读过的好书或看过的好电影。' },
  //   { id: 'ex4-5', title: '业余时间', scenario: '周末你有什么计划？和朋友分享一下。' }
  // ],
  // chapter5: [
  //   { id: 'ex5-1', title: '购物需求', scenario: '你去商店买东西，向店员说明你的需求。' },
  //   { id: 'ex5-2', title: '询问价格', scenario: '在超市购物时，询问不同商品的价格。' },
  //   { id: 'ex5-3', title: '讨价还价', scenario: '在市场购物时，尝试与摊主讨价还价。' },
  //   { id: 'ex5-4', title: '退换商品', scenario: '你买的衣服不合适，去商店要求退换。' }
  // ]
}

// 模拟对话回复
const mockReplies = {
  chapter1: {
    'ex1-1': [
      "Hello! Nice to meet you. My name is Emma. What's your name?",
      "I'm from London. How about you? Where are you from?",
      "That's interesting! Do you like studying here?",
      "What's your favorite subject?",
      "It was nice talking to you! See you later!"
    ],
    'ex1-2': [
      "Hi everyone! My name is Emma. I'm very happy to be here today.",
      "I'm 28 years old and I come from London, England.",
      "I've been teaching English for 5 years now.",
      "In my free time, I enjoy reading, traveling, and listening to music.",
      "I'm looking forward to getting to know all of you better!"
    ],
    'ex1-3': [
      "Hello! I'm Emma. It's very nice to meet you.",
      "Thank you for the introduction. John sounds like a great student.",
      "I'm excited to be teaching here and getting to know everyone.",
      "Is John interested in any particular subjects or activities?",
      "It was nice meeting you. Let's catch up again soon!"
    ],
    'ex1-4': [
      "Goodbye! Have a nice day!",
      "See you tomorrow! Don't forget your homework.",
      "Take care! It was nice talking to you.",
      "Have a great weekend! See you on Monday.",
      "Bye for now! Stay safe."
    ],
    'ex1-5': [
      "Oh my goodness! Is that really you? It's been so long!",
      "How have you been? You look great!",
      "What have you been up to lately?",
      "We should definitely meet up more often!",
      "It was wonderful catching up with you!"
    ]
  }
  // chapter2: {
  //   'ex2-1': [
  //     "I'd love to tell you about my family!",
  //     "I have a wonderful family with my parents and two siblings.",
  //     "My father is a teacher and my mother is a nurse.",
  //     "I have an older brother and a younger sister.",
  //     "We all get along very well and enjoy spending time together."
  //   ],
  //   'ex2-2': [
  //     "Let me describe my family members for you.",
  //     "My father is tall and has brown hair. He's very kind and patient.",
  //     "My mother is shorter and has blonde hair. She's very caring and funny.",
  //     "My brother is athletic and loves playing sports.",
  //     "My sister is creative and enjoys drawing and painting."
  //   ],
  //   'ex2-3': [
  //     "I have a best friend named Sarah. We've known each other for years.",
  //     "Sarah is very funny and always makes me laugh.",
  //     "We often go to the movies together and share our secrets.",
  //     "She's also very supportive and helps me with my problems.",
  //     "I'm really lucky to have such a great friend!"
  //   ],
  //   'ex2-4': [
  //     "This weekend, my family is planning a fun day out.",
  //     "We're thinking about going to the park for a picnic.",
  //     "My dad wants to play football with us.",
  //     "My mom is going to prepare some delicious sandwiches.",
  //     "It should be a wonderful family day!"
  //   ]
  // },
  // chapter3: {
  //   'ex3-1': [
  //     "I'd be happy to show you around our school!",
  //     "The library is on the second floor, next to the computer lab.",
  //     "The cafeteria is on the first floor, near the main entrance.",
  //     "The gymnasium is behind the main building.",
  //     "The teachers' office is on the third floor."
  //   ],
  //   'ex3-2': [
  //     "My favorite subject is English because I love reading stories.",
  //     "I also enjoy science because the experiments are so interesting.",
  //     "Math can be challenging, but I like solving problems.",
  //     "History is fascinating because I learn about the past.",
  //     "What about you? What's your favorite subject?"
  //   ],
  //   'ex3-3': [
  //     "I have some good study habits that help me learn better.",
  //     "I always review my notes after each class.",
  //     "I try to do my homework in a quiet place.",
  //     "I ask questions when I don't understand something.",
  //     "I also practice speaking English with my friends."
  //   ],
  //   'ex3-4': [
  //     "Excuse me, teacher. I have a question about the homework.",
  //     "Could you please explain this problem again?",
  //     "I'm not sure I understand the instructions.",
  //     "Thank you for your help. That makes much more sense now.",
  //     "I'll make sure to follow your advice."
  //   ],
  //   'ex3-5': [
  //     "Hey! I wanted to invite you to join our English club.",
  //     "We meet every Tuesday after school.",
  //     "We practice speaking English and have fun activities.",
  //     "It's a great way to improve your English skills.",
  //     "Would you like to come and check it out?"
  //   ],
  //   'ex3-6': [
  //     "How did you do on the test? I think I did okay.",
  //     "The questions were quite challenging this time.",
  //     "I need to study more for the next exam.",
  //     "Maybe we can study together next time.",
  //     "Good luck with your studies!"
  //   ]
  // },
  // chapter4: {
  //   'ex4-1': [
  //     "I have many hobbies that I enjoy in my free time.",
  //     "I love reading books, especially mystery novels.",
  //     "I also enjoy playing the piano and singing.",
  //     "Sports are important to me too - I play basketball.",
  //     "I'm always looking for new hobbies to try!"
  //   ],
  //   'ex4-2': [
  //     "I really enjoy playing basketball with my friends.",
  //     "We have a game every Saturday at the school gym.",
  //     "Last week's match was really exciting!",
  //     "I also like watching professional basketball games.",
  //     "What sports do you like to play?"
  //   ],
  //   'ex4-3': [
  //     "I love listening to different types of music.",
  //     "My favorite genre is pop music, but I also like jazz.",
  //     "I play the guitar and sometimes write my own songs.",
  //     "I also enjoy going to concerts when I can.",
  //     "Music really helps me relax and feel happy."
  //   ],
  //   'ex4-4': [
  //     "I just finished reading a great book called 'The Great Gatsby'.",
  //     "It's a classic American novel with an interesting story.",
  //     "I also watched a wonderful movie called 'Inception'.",
  //     "The plot was very complex but really engaging.",
  //     "Do you have any book or movie recommendations?"
  //   ],
  //   'ex4-5': [
  //     "This weekend, I'm planning to relax and have fun.",
  //     "On Saturday, I'll probably go shopping with my friends.",
  //     "On Sunday, I might visit my grandparents.",
  //     "I also want to finish reading my current book.",
  //     "What are your plans for the weekend?"
  //   ]
  // },
  // chapter5: {
  //   'ex5-1': [
  //     "Hello! I'm looking for a new pair of shoes.",
  //     "I need something comfortable for walking.",
  //     "Do you have any recommendations?",
  //     "Could you show me what you have in size 8?",
  //     "Thank you for your help!"
  //   ],
  //   'ex5-2': [
  //     "Excuse me, how much does this shirt cost?",
  //     "Is there a discount if I buy two?",
  //     "What about this one? How much is it?",
  //     "Are there any sales going on today?",
  //     "Thank you for the information!"
  //   ],
  //   'ex5-3': [
  //     "This is a bit expensive for me.",
  //     "Could you give me a better price?",
  //     "What's your best offer?",
  //     "I can pay cash if that helps.",
  //     "Thank you for the discount!"
  //   ],
  //   'ex5-4': [
  //     "I'd like to return this item, please.",
  //     "It doesn't fit me properly.",
  //     "Do you have a return policy?",
  //     "Could I exchange it for a different size?",
  //     "Thank you for your help!"
  //   ]
  // }
}

// 已移除头像图片，所有消息使用气泡样式

export default class Conversation extends Component {
  state = {
    chapterId: '',
    exerciseId: '',
    currentExercise: null as any,
    messages: [] as any[],
    isRecording: false,
    isPlaying: false,
    currentMessageIndex: 0,
    showToast: false,
    toastText: '',
    isAIResponding: false, // AI是否正在回复
    isStreaming: false, // 是否正在流式输出
    streamingText: '', // 流式输出的文本
    streamingMessageId: null as number | null, // 正在流式输出的消息ID
    recordingStartTime: 0, // 录音开始时间
    recordingDuration: 0, // 录音时长（秒）
    playingVoiceId: null as number | null, // 正在播放的语音消息ID
    voiceIconIndex: 0, // 当前显示的音量图标索引 (0: volume-off, 1: volume-minus, 2: volume-plus)
    isLoadingConversation: false, // 是否正在加载对话
    tid: null as number | null, // 对话主题ID
    isExerciseInfoExpanded: true, // 练习信息卡片是否展开（默认展开）
    showRecordingModal: false, // 是否显示录音模态框
    currentRecordingMessageId: null as number | null, // 当前正在录音的消息ID
    recordedMessages: {} as Record<number, any>, // 已录音的消息记录
    isFirstTime: true, // 是否首次进入
    selectedRole: 'answerer' as 'questioner' | 'answerer', // 选择谁来发起对话：你(questioner) 或 AI(answerer)
    studentName: '学生', // 学生姓名
    scrollIntoViewId: '' as string, // 需要滚动到的消息ID
    playingDigitalVoiceId: null as number | null, // 正在播放的数字人语音消息ID
    digitalVoiceIconIndex: 0, // 数字人语音图标索引
    preloadedVoiceUrls: {} as Record<number, string>, // 预加载的数字人语音URL缓存
    showInitialRecordButton: true, // 是否显示初始录音按钮（在开始对话前）
    // 评测相关状态
    evaluationStatus: {
      isEvaluating: false, // 是否正在评测中
      totalTasks: 0, // 总任务数（单个评价 + 整体分析）
      completedTasks: 0, // 已完成任务数
      evaluationTasksStatus: {} as Record<number, 'pending' | 'processing' | 'completed' | 'failed'>, // 单个评价任务状态
      overallTaskStatus: 'pending' as 'pending' | 'processing' | 'completed' | 'failed', // 整体分析任务状态
      allTasksCompleted: false, // 所有任务是否完成
      currentProgressText: '' // 当前进度提示文本
    },
    showReportButton: false // 是否显示"查看总结报告"按钮
  }

  voiceAnimationTimer: any = null // 语音播放动画定时器
  digitalVoiceAnimationTimer: any = null // 数字人语音播放动画定时器
  recorderManager: any = null // 录音管理器实例
  audioContext: any = null // 音频播放器实例（用于播放用户录音）
  digitalVoiceContext: any = null // 数字人语音播放器实例
  voiceRecognitionService: TaroVoiceRecognitionService | null = null // NLS语音识别服务实例
  recognizedText: string = '' // 当前识别文本
  audio2TextPromiseResolve: ((text: string) => void) | null = null // audio2text完成回调
  audio2TextPromiseReject: ((error: Error) => void) | null = null // audio2text失败回调

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
    this.recorderManager = Taro.getRecorderManager()
    
    // 初始化音频播放器（用于播放用户录音）
    this.audioContext = Taro.createInnerAudioContext()
    
    // 初始化数字人语音播放器
    this.digitalVoiceContext = Taro.createInnerAudioContext()
    
    const instance = Taro.getCurrentInstance()
    const { unitId, exerciseId } = instance?.router?.params || {}
    this.setState({
      chapterId: unitId || '',  // 兼容旧的chapterId字段
      exerciseId: exerciseId || ''
    })
    
    this.loadExerciseData(exerciseId || '')
    // 首次进入不自动加载对话，等待用户点击生成练习按钮
  }

  loadExerciseData = async (exerciseId: string) => {
    try {
      // 从本地存储读取练习详情数据
      const exerciseDetail = Taro.getStorageSync('currentExerciseDetail')
      
      if (exerciseDetail) {
        // 使用真实的练习数据
        const currentExercise = {
          id: exerciseDetail.id,
          title: exerciseDetail.title,
          description: exerciseDetail.description,
          scenario: exerciseDetail.description, // 使用description作为scenario
          content: exerciseDetail.content,       // 保存content数组
          dialogue_num: exerciseDetail.dialogue_num,
          vocabs: exerciseDetail.vocabs || []   // 保存vocabs数组
        }
        
        this.setState({ currentExercise }, () => {
          // 数据加载完成后，自动发送vocabs作为首条消息
          if (currentExercise.vocabs && currentExercise.vocabs.length > 0) {
            this.startConversation()
          }
        })
      } else {
        // 降级使用模拟数据
        const exercises = mockExercises['chapter1']
        if (exercises) {
          const mockExercise = exercises.find(ex => ex.id === exerciseId)
          this.setState({ currentExercise: mockExercise })
        }
      }
    } catch (error) {
      console.error('加载练习数据失败:', error)
    }
  }

  /**
   * 切换练习信息卡片展开/折叠
   */
  handleToggleExerciseInfo = () => {
    this.setState((prev: any) => ({
      isExerciseInfoExpanded: !prev.isExerciseInfoExpanded
    }))
  }

  startConversation = async () => {
    // --- 新vocabs流式AI逻辑 ---
    const state = this.state as any;
    const chapterId = state.chapterId;
    const exerciseId = state.exerciseId;
    const currentExercise = state.currentExercise;
    if (!currentExercise) {
      const replies = mockReplies[chapterId as keyof typeof mockReplies];
      if (replies && exerciseId && replies[exerciseId as keyof typeof replies]) {
        const replyTexts = replies[exerciseId as keyof typeof replies] as string[];
        const messages = replyTexts.map((text: string, index: number) => ({
          id: index,
          text,
          isUser: false,
          timestamp: new Date().getTime() + index * 1000
        }));
        this.setState({ messages });
      }
      return;
    }
    this.setState({ isLoadingConversation: true })
    try {
      // 1. 获取新tid（ApiResponse<{id:number}>）
      const topicResponse = await aiChatAPI.topicEdit();
      const tid = (topicResponse && typeof topicResponse.data === 'object' && 'id' in topicResponse.data) ? topicResponse.data.id : undefined;
      if (!tid) throw new Error('未能获取到tid');
      this.setState({ tid, messages: [] }); // 清空旧消息
      // 2. vocabs作为首条text，直接用数组格式
      const vocabsArr = (currentExercise.vocabs || []);
      if (!Array.isArray(vocabsArr) || vocabsArr.length === 0) {
        throw new Error('当前练习缺少vocabs');
      }
      let fullResponse = '';
      const streamingMessageId = Date.now();
      
      // 先添加AI消息占位符到消息列表（流式更新）
      this.setState((prev: any) => ({
        messages: [...(prev.messages || []), {
          id: streamingMessageId,
          text: '',
          isUser: false,
          timestamp: Date.now(),
          isStreaming: true
        }],
        streamingMessageId
      }))
      
      // 滚动到最新消息
      this.scrollToLatestMessage()
      
      await aiChatAPI.completions({
        tid,
        text: JSON.stringify({ vocabs: vocabsArr }),
        agent_id: 6217,  // 明确指定agent_id为6217
        onMessage: (chunk: string) => {
          fullResponse += chunk;
          // 实时更新消息列表中的AI消息文本（强制立即更新）
          this.setState((prev: any) => {
            const updatedMessages = prev.messages.map((msg: any) => 
              msg.id === streamingMessageId 
                ? { ...msg, text: fullResponse, isStreaming: true }
                : msg
            );
            return {
              isStreaming: true,
              streamingText: fullResponse,
              messages: updatedMessages
            };
          }, () => {
            // setState完成后的回调，确保UI已更新
            this.scrollToLatestMessage();
          });
        },
        onComplete: () => {
          // 更新AI消息为最终内容（移除流式标记）
          this.setState((prev: any) => ({
            isStreaming: false,
            streamingText: '',
            streamingMessageId: null,
            messages: prev.messages.map((msg: any) => 
              msg.id === streamingMessageId 
                ? { ...msg, text: fullResponse, isStreaming: false }
                : msg
            )
          }));
          // 滚动到底部
          this.scrollToLatestMessage()
        },
        onError: (err: any) => {
          // 移除流式消息或更新为错误状态
          this.setState((prev: any) => ({
            isStreaming: false, 
            streamingText: '',
            streamingMessageId: null,
            messages: prev.messages.filter((msg: any) => msg.id !== streamingMessageId)
          }))
          Taro.showToast({ title: 'AI对话出错', icon: 'none' })
        }
      });
    } catch (e: any) {
      this.setState({ isLoadingConversation: false });
      Taro.showToast({ title: e.message || '对话初始化失败', icon: 'none' });
    }
    this.setState({ isLoadingConversation: false });
    
    /*
    // --- 旧逻辑已废弃，留档注释 ---
    // 原有基于content数组自动填充对话、分角色展示等所有流程伪代码结构示例：
    // const ... = this.state
    // if (!currentExercise) [ ...return ... ]
    // if (currentExercise.content && Array.isArray(...)) [ ...content消息流程... setState ... return ... ]
    // this.setState([isLoadingConversation: true])
    // try [
    //   // topic_edit 获取 tid
    //   ...
    //   // completions流式接口 + Q/A消息填充
    //   ...
    //   // 旧气泡和流式展示
    // ] catch(e) [ ... ]
    // this.setState([isLoadingConversation: false])
    // --- 旧逻辑已废弃，留档注释 ---
    */
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
        // 等待后重试（指数退避）
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }
    return { success: false, error: '未知错误' }
  }

  /**
   * 更新评测进度
   */
  updateEvaluationProgress = (
    completed: number,
    total: number,
    progressText: string
  ) => {
    this.setState((prev: any) => ({
      evaluationStatus: {
        ...prev.evaluationStatus,
        completedTasks: completed,
        totalTasks: total,
        currentProgressText: progressText
      }
    }))
  }

  /**
   * 完成练习按钮处理逻辑
   * 修改为：上传完成后立即跳转，评测在后台异步进行
   */
  handleCompleteExercise = async () => {
    const { recordedMessages, currentExercise } = this.state as any
    const studentInfo = Taro.getStorageSync('studentInfo')
    const studentId = studentInfo?.id

    if (!studentId) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    if (!currentExercise || !currentExercise.id) {
      Taro.showToast({ title: '练习信息不完整', icon: 'none' })
      return
    }

    const exerciseId = currentExercise.id
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

      // 步骤0: 删除学生在该练习的所有旧数据（音频和报告）
      const { studentAPI } = await import('../../utils/api_v2')
      try {
        const deleteResult = await studentAPI.deleteStudentExerciseData(studentId, exerciseId, false)
        if (deleteResult.success) {
          console.log('✅ 旧数据删除成功')
        } else {
          console.warn('⚠️ 删除旧数据失败，但继续执行:', deleteResult.message)
        }
      } catch (deleteError) {
        console.error('删除旧数据失败:', deleteError)
        console.warn('⚠️ 忽略删除错误，继续执行')
      }

      // 步骤1: 上传所有录音文件并创建audio记录（同步，evaluation为空，is_free=false）
      const { fileAPI, audioAPI } = await import('../../utils/api_v2')
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

              // 创建audio记录（is_free: false，evaluation为空）
              const audioData = {
                student_id: studentId,
                exercise_id: exerciseId,
                file: fileUrl,
                duration: recordData.duration,
                ref_text: recordData.ref_text, // 从audio2text识别获取的文本
                is_free: false, // 对话练习，全部为false
                evaluation: '' // 暂时为空，后台异步评测后更新
              }

              const saveResult = await audioAPI.editAudio(audioData)
              if (!saveResult.success) {
                throw new Error('保存音频记录失败')
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
          // 忽略单个录音处理失败，继续处理其他录音
        }
      }

      Taro.hideLoading()

      if (uploadResults.length === 0) {
        throw new Error('没有成功上传的录音文件')
      }

      // 步骤2: 创建Report记录（同步，content为空）
      const { reportAPI } = await import('../../utils/api_v2')
      const audioIds = uploadResults.map(r => r.audioId)

      const jsonContent = JSON.stringify({
        exercise_id: exerciseId,
        audio_ids: audioIds,
        timestamp: new Date().toISOString(),
        soe_results: [] // 暂时为空，后台异步评测后更新
      })

      const reportData = {
        student_id: studentId,
        exercise_id: exerciseId,
        name: `练习评测报告 - ${currentExercise.title || currentExercise.name}`,
        audio_ids: audioIds,
        summary: `自动生成的评测报告，包含 ${audioIds.length} 个音频的评测结果`,
        json_content: jsonContent,
        content: '' // 暂时为空，后台异步评测后更新
      }

      const reportResult = await reportAPI.editReport(reportData)
      if (!reportResult.success) {
        throw new Error('创建报告失败')
      }

      const reportId = reportResult.data?.id || reportResult.result?.id

      // 保存reportId和exerciseId到本地，用于后台评测
      Taro.setStorageSync('currentReportId', reportId)
      Taro.setStorageSync('currentExerciseId', exerciseId)

      // 步骤3: 后台异步开始评测
      console.log('🚀 准备启动后台评测任务...')
      console.log('参数检查:', {
        studentId,
        exerciseId,
        uploadResultsCount: uploadResults.length,
        reportId
      })
      
      // 立即启动后台评测任务（不等待，异步执行）
      if (exerciseId && reportId && uploadResults.length > 0) {
        // 使用setTimeout确保在下一个事件循环中执行
        setTimeout(() => {
          console.log('🚀 开始执行后台评测任务...')
          this.startBackgroundEvaluation(studentId, exerciseId, uploadResults, reportId, reportData)
            .catch((error) => {
              console.error('❌ 后台评测任务启动失败:', error)
            })
        }, 100) // 100ms后执行，确保当前代码执行完成
      } else {
        console.error('❌ 缺少必要参数，无法启动后台评测', {
          exerciseId,
          reportId,
          uploadResultsCount: uploadResults.length
        })
      }

      // 显示上传成功提示
      Taro.showToast({
        title: '上传成功，评测进行中...',
        icon: 'success',
        duration: 2000
      })

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
   * 2. SOE返回的JSON数据 → generate接口(agentId=5844)处理 → content字段为总结内容 → 存入audios.evaluation
   * 3. 所有音频的总结 → generate接口(agentId=5863) → 整体总结 → 存入report.content
   */
  startBackgroundEvaluation = async (
    studentId: number,
    exerciseId: number,
    uploadResults: any[],
    reportId: number,
    reportData: any
  ) => {
    console.log('🚀 后台异步评测开始...')
    console.log(`📊 共 ${uploadResults.length} 个音频需要评测`)
    console.log('参数详情:', {
      studentId,
      exerciseId,
      reportId,
      uploadResultsCount: uploadResults.length
    })

    try {
      const { soeAPI, contentAPI, audioAPI, reportAPI } = await import('../../utils/api_v2')
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

          // 步骤3: 更新audio记录的evaluation字段 = content（is_free=false）
          console.log(`💾 步骤3: 更新audio记录的evaluation字段...`)
          await this.retryTask(
            async () => {
              const updateData = {
                id: uploadResult.audioId,
                student_id: studentId,
                exercise_id: exerciseId,
                file: uploadResult.fileUrl,
                ref_text: uploadResult.recordData.ref_text,
                is_free: false, // 确保为false
                evaluation: evaluation // 保存生成的评价内容
              }

              console.log(`📤 更新audio记录，audioId: ${uploadResult.audioId}`)
              const updateResult = await audioAPI.editAudio(updateData)
              if (!updateResult.success) {
                throw new Error('更新音频记录失败')
              }
              console.log(`✅ audio记录更新成功`)
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
          // 继续处理其他音频，不中断整个流程
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
          // 步骤5: 更新report记录的content字段和json_content
          console.log(`💾 更新report记录的content字段和json_content...`)
          await this.retryTask(
            async () => {
              // 更新json_content，包含SOE结果
              const jsonContent = JSON.stringify({
                exercise_id: exerciseId,
                audio_ids: uploadResults.map(r => r.audioId),
                timestamp: new Date().toISOString(),
                soe_results: allSoeResults
              })

              const updateData = {
                id: reportId,
                ...reportData,
                json_content: jsonContent,
                content: overallResult.data // 保存整体报告内容
              }

              console.log(`📤 更新report记录，reportId: ${reportId}`)
              const updateResult = await reportAPI.editReport(updateData)
              if (!updateResult.success) {
                throw new Error('更新报告失败')
              }
              console.log(`✅ report记录更新成功`)
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
        console.error(`  - 成功评价数: ${allEvaluations.length}`)
        console.error(`  - 总音频数: ${uploadResults.length}`)
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

  /**
   * 跳转到报告页
   */
  handleViewReport = () => {
    const reportId = Taro.getStorageSync('currentReportId')
    if (reportId) {
      Taro.navigateTo({
        url: `/pages/report/index?reportId=${reportId}`
      })
    } else {
      Taro.showToast({
        title: '报告ID不存在',
        icon: 'none'
      })
    }
  }

  /**
   * 处理录音按钮点击（开始/停止录音）
   */
  handleRecordButtonClick = () => {
    const { isRecording } = this.state as any
    if (isRecording) {
      this.handleStopRecording()
    } else {
      this.handleStartRecording()
    }
  }

  /**
   * 初始化语音识别服务（使用后端API）
   */
  initVoiceRecognitionService = async () => {
    try {
      // 创建语音识别服务（不再需要NLS Token和AppKey）
      this.voiceRecognitionService = new TaroVoiceRecognitionService(
        {}, // 配置为空，因为不再需要NLS相关配置
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
      // 等待资源清理
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // 重新初始化服务（确保每次都是新的连接）
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

    // 启动录音（会在停止时自动调用API进行识别）
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
    const { recordingStartTime, tid } = this.state as any
    const endTime = Date.now()
    const duration = Math.floor((endTime - recordingStartTime) / 1000)
    
    this.setState({ isRecording: false })

    // 停止录音（会触发onStop回调，在回调中调用API进行识别）
    if (this.voiceRecognitionService) {
      // 清空之前的识别文本
      this.recognizedText = ''
      
      // 创建Promise等待audio2text结果
      const audio2TextPromise = new Promise<string>((resolve, reject) => {
        // 设置超时
        const timeout = setTimeout(() => {
          reject(new Error('audio2text识别超时'))
        }, 30000) // 30秒超时
        
        // 保存resolve和reject，供onResult回调使用
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
      
      // 步骤1: 等待audio2text识别完成（不使用轮询，直接等待结果）
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

      // 保存录音信息到recordedMessages
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
            // 异步任务，等待结果（不使用轮询追踪，直接等待）
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
          // 如果处理失败，使用原始文本
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

      // 先保存录音信息
      this.setState((prev: any) => ({
        recordedMessages: {
          ...prev.recordedMessages,
          [messageId]: recordData
        }
      }))

      // 立即添加用户语音气泡（无论识别文本是否为空）
      const userMessage = {
        id: messageId,
        text: '', // 用户消息不显示文本，只显示语音气泡
        isUser: true,
        timestamp: Date.now()
      }

      this.setState((prev: any) => ({
        messages: [...prev.messages, userMessage]
      }))

      // 滚动到最新消息
      this.scrollToLatestMessage()

      // 发送给智能体的消息（使用处理后的文本）
      console.log('📤 发送给智能体的消息（处理后的文本）:', textToSend || '(空文本)')
      
      // 使用处理后的文本发送给AI
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

      // 确保userText是字符串类型（即使为空也要发送）
      const trimmedText = (userText || '').trim()
      
      let fullResponse = ''
      const streamingMessageId = Date.now()
      const aiMessageId = streamingMessageId + 1

      // 先添加AI消息占位符（流式更新）
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

      // 滚动到最新消息
      this.scrollToLatestMessage()

      await aiChatAPI.completions({
        tid,
        text: trimmedText, // 使用trim后的文本（来自audio2text识别结果）
        agent_id: 6217, // 明确指定agent_id为6217
        onMessage: (chunk: string) => {
          fullResponse += chunk
          // 智能体的流式消息
          console.log('📝 智能体流式消息:', chunk)
          // 实时更新消息列表中的AI消息文本（强制立即更新）
          this.setState((prev: any) => {
            const updatedMessages = prev.messages.map((msg: any) => 
              msg.id === aiMessageId 
                ? { ...msg, text: fullResponse, isStreaming: true }
                : msg
            );
            return {
              isStreaming: true,
              streamingText: fullResponse,
              messages: updatedMessages
            };
          }, () => {
            // setState完成后的回调，确保UI已更新
            this.scrollToLatestMessage();
          });
        },
        onComplete: () => {
          // 智能体的最终拼接结果
          console.log('✅ 智能体最终拼接结果:', fullResponse)
          // 更新AI消息为最终内容（移除流式标记）
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
          // 滚动到底部
          this.scrollToLatestMessage()
        },
        onError: (err: any) => {
          // 移除流式消息或更新为错误状态
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
    const { messages } = this.state as any
    if (messages.length > 0) {
      const latestMessageId = messages[messages.length - 1].id
      this.setState({
        scrollIntoViewId: `message-${latestMessageId}`
      })
    }
  }

  /**
   * 播放语音消息
   */
  handlePlayVoice = (messageId: number) => {
    const { playingVoiceId, recordedMessages } = this.state as any

    // 如果正在播放这条消息，则停止播放
    if (playingVoiceId === messageId) {
      this.stopVoicePlayback()
      return
    }

    // 停止之前的播放
    if (playingVoiceId !== null) {
      this.stopVoicePlayback()
    }

    // 获取该消息的录音数据
    const recordedData = recordedMessages[messageId]
    if (!recordedData) {
      Taro.showToast({
        title: '该消息未录音',
        icon: 'none'
      })
      return
    }

    const audioPath = recordedData.pcmFilePath
    const duration = recordedData.duration || 3

    if (!audioPath || audioPath.trim() === '') {
      Taro.showToast({
        title: '音频文件路径不存在',
        icon: 'none'
      })
      return
    }

    // 开始播放新的语音
    this.setState({ 
      playingVoiceId: messageId,
      voiceIconIndex: 0
    })

    // 启动图标切换动画
    this.startVoiceAnimation()

    // 使用真实的音频播放器播放
    if (!this.audioContext) {
      this.audioContext = Taro.createInnerAudioContext()
    }

    try {
      // 停止之前的播放（如果存在）
      try {
        this.audioContext.stop()
      } catch (e) {
        // 忽略停止错误
      }

      // 清除之前的监听器（避免重复绑定）
      this.audioContext.offEnded()
      this.audioContext.offError()

      // 设置新的音频源
      this.audioContext.src = audioPath
      
      // 监听播放结束
      this.audioContext.onEnded(() => {
        this.stopVoicePlayback()
      })

      // 监听播放错误
      this.audioContext.onError((error: any) => {
        this.stopVoicePlayback()
        Taro.showToast({
          title: '播放失败: ' + (error.errMsg || '未知错误'),
          icon: 'none',
          duration: 2000
        })
      })
      
      // 播放音频
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

    // 每80ms切换一次图标
    this.voiceAnimationTimer = setInterval(() => {
      this.setState((prev: any) => ({
        voiceIconIndex: (prev.voiceIconIndex + 1) % 3
      }))
    }, 80)
  }

  /**
   * 停止语音播放动画
   */
  stopVoiceAnimation = () => {
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
   * 停止语音播放（包括音频和动画）
   */
  stopVoicePlayback = () => {
    // 停止音频播放
    if (this.audioContext) {
      try {
        this.audioContext.stop()
      } catch (e) {
        // 忽略停止错误
      }
    }

    // 停止动画
    this.stopVoiceAnimation()
  }

  /**
   * 渲染语音图标
   */
  renderVoiceIcon = (messageId: number) => {
    const { playingVoiceId, voiceIconIndex } = this.state as any

    // 如果这条消息正在播放，显示动画图标
    if (playingVoiceId === messageId) {
      const icons = ['volume-off', 'volume-minus', 'volume-plus']
      return <AtIcon value={icons[voiceIconIndex]} size='24' color='white' />
    }

    // 未播放时显示默认图标 volume-plus
    return <AtIcon value='volume-plus' size='24' color='white' />
  }

  render() {
    const { 
      currentExercise,
      messages,
      studentName,
      evaluationStatus,
      showReportButton,
      isStreaming,
      streamingText,
      isRecording,
      isExerciseInfoExpanded,
      isLoadingConversation
    } = this.state as any

    if (!currentExercise) {
      return (
        <View className='loading-page'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      )
    }

    return (
      <View className='conversation-page'>
        {/* 头部 */}
        <View className='header'>
          <View className='header-content'>
            <View className='header-left'>
              <AtIcon value='message' size='32' color='white' />
              <Text className='header-title'>对话练习</Text>
            </View>
            <View className='header-right'>
              {evaluationStatus.isEvaluating && (
                <Text className='evaluation-progress-text'>
                  {evaluationStatus.completedTasks}/{evaluationStatus.totalTasks}
                </Text>
              )}
              {showReportButton && (
                <SafeAtButton 
                  type='secondary' 
                  size='small'
                  onClick={this.handleViewReport}
                  className='view-report-btn'
                >
                  查看总结报告
                </SafeAtButton>
              )}
              <SafeAtButton 
                type='secondary' 
                size='small'
                onClick={this.handleCompleteExercise}
                className='complete-exercise-btn'
                disabled={evaluationStatus.isEvaluating || Object.keys((this.state as any).recordedMessages || {}).length === 0}
              >
                完成练习
              </SafeAtButton>
              <Text className='user-name'>{studentName}</Text>
            </View>
          </View>
        </View>

        {/* 展开/折叠按钮 */}
        <View className='toggle-exercise-btn' onClick={this.handleToggleExerciseInfo}>
          <AtIcon 
            value={isExerciseInfoExpanded ? 'chevron-up' : 'chevron-down'} 
            size='24' 
            color='#667eea' 
          />
        </View>

        {/* 练习信息卡片 */}
        <View className={`exercise-info-section ${isExerciseInfoExpanded ? 'expanded' : 'collapsed'}`}>
          <SafeAtCard title='当前练习' className='exercise-info-card'>
            <View className='exercise-info-content'>
              <Text className='exercise-title-text'>{currentExercise.title}</Text>
              <Text className='exercise-scenario'>{currentExercise.description || currentExercise.scenario}</Text>
              {currentExercise.vocabs && currentExercise.vocabs.length > 0 && (
                <View className='vocabs-section'>
                  <Text className='vocabs-label'>词汇列表：</Text>
                  <View className='vocabs-tags'>
                    {currentExercise.vocabs.map((vocab: string, index: number) => (
                      <SafeAtTag key={index} size='small' type='primary'>{vocab}</SafeAtTag>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </SafeAtCard>
        </View>

        {/* 进度提示 */}
        {evaluationStatus.isEvaluating && (
          <View className='evaluation-progress-overlay'>
            <View className='evaluation-progress-content'>
              <SafeAtActivityIndicator mode='center' size={48} color='#667eea' />
              <Text className='progress-text'>{evaluationStatus.currentProgressText}</Text>
              <Text className='progress-count'>
                {evaluationStatus.completedTasks} / {evaluationStatus.totalTasks}
              </Text>
            </View>
          </View>
        )}

        {/* 消息列表包装器 - 根据card展开状态动态调整 */}
        <View className={`messages-wrapper ${isExerciseInfoExpanded ? 'with-expanded-card' : ''}`}>
          <ScrollView 
            className='messages-container' 
            scrollY
            scrollIntoView={(this.state as any).scrollIntoViewId}
            scrollWithAnimation
          >
            {messages.map((message: any) => (
            <View 
              key={message.id}
              id={`message-${message.id}`}
              className={`message-wrapper ${message.isUser ? 'user-message-wrapper' : 'ai-message-wrapper'}`}
            >
              <View className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}>
                <View className='message-content'>
                  {message.isUser ? (
                    // 用户消息：只显示语音气泡（可点击播放）
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
                    // AI消息：显示文本（实时流式拼接）
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
          </ScrollView>
        </View>

        {/* 录音按钮区域（页面底部中间） */}
        <View className='recording-button-section'>
          <SafeAtButton 
            type={isRecording ? 'primary' : 'secondary'}
            size='normal'
            onClick={this.handleRecordButtonClick}
            className={`record-button ${isRecording ? 'recording' : ''}`}
            disabled={evaluationStatus.isEvaluating}
          >
            {isRecording ? '停止录音' : '开始录音'}
          </SafeAtButton>
        </View>

        {/* 加载遮罩层 */}
        {isLoadingConversation && (
          <View className='loading-overlay'>
            <View className='loading-content'>
              <Text className='loading-tip'>练习正在加载中...</Text>
              <Text className='loading-subtitle'>请稍候，正在为您生成对话内容</Text>
              <SafeAtActivityIndicator mode='center' size={64} color='#667eea' />
            </View>
          </View>
        )}
      </View>
    )
  }
} // 补齐 Conversation 类结尾