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
import { aiChatAPI } from '../../utils/api'

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

// 模拟数字人头像
const avatarImages = [
  "https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=English%20teacher%20avatar%20smiling%20friendly%20female&sign=506cb86e60245d5679d599c7e03fa5a2",
  "https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=English%20teacher%20avatar%20professional%20male&sign=3cdee6b59cd88cccdf71c10f36a37034"
]

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
    preloadedVoiceUrls: {} as Record<number, string> // 预加载的数字人语音URL缓存
  }

  voiceAnimationTimer: any = null // 语音播放动画定时器
  digitalVoiceAnimationTimer: any = null // 数字人语音播放动画定时器
  recorderManager: any = null // 录音管理器实例
  audioContext: any = null // 音频播放器实例（用于播放用户录音）
  digitalVoiceContext: any = null // 数字人语音播放器实例

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
    console.log('✅ 录音管理器初始化完成')
    
    // 初始化音频播放器（用于播放用户录音）
    this.audioContext = Taro.createInnerAudioContext()
    console.log('✅ 音频播放器初始化完成')
    
    // 初始化数字人语音播放器
    this.digitalVoiceContext = Taro.createInnerAudioContext()
    console.log('✅ 数字人语音播放器初始化完成')
    
    const instance = Taro.getCurrentInstance()
    const { unitId, exerciseId } = instance?.router?.params || {}
    this.setState({
      chapterId: unitId || '',  // 兼容旧的chapterId字段
      exerciseId: exerciseId || ''
    })
    
    this.loadExerciseData(exerciseId || '')
    // 首次进入不自动加载对话，等待用户点击生成练习按钮
  }

  loadExerciseData = (exerciseId: string) => {
    try {
      // 从本地存储读取练习详情数据
      const exerciseDetail = Taro.getStorageSync('currentExerciseDetail')
      
      console.log('=== 加载练习数据 ===')
      console.log('练习详情:', exerciseDetail)
      
      if (exerciseDetail) {
        // 使用真实的练习数据
        const currentExercise = {
          id: exerciseDetail.id,
          title: exerciseDetail.title,
          description: exerciseDetail.description,
          scenario: exerciseDetail.description, // 使用description作为scenario
          content: exerciseDetail.content,       // 保存content数组
          dialogue_num: exerciseDetail.dialogue_num
        }
        
        console.log('✓ 练习数据加载成功:', currentExercise)
        this.setState({ currentExercise })
      } else {
        console.warn('⚠️ 未找到练习详情，使用模拟数据')
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

  startConversation = async () => {
    const { chapterId, exerciseId, currentExercise, selectedRole } = this.state
    
    // 如果没有练习信息，使用模拟数据
    if (!currentExercise) {
      console.warn('没有练习信息，使用模拟数据')
      const replies = mockReplies[chapterId as keyof typeof mockReplies]
      if (replies && exerciseId && replies[exerciseId as keyof typeof replies]) {
        const replyTexts = replies[exerciseId as keyof typeof replies] as string[]
        const messages = replyTexts.map((text: string, index: number) => ({
          id: index,
          text,
          isUser: false,
          timestamp: new Date().getTime() + index * 1000
        }))
        this.setState({ messages })
      }
      return
    }
    
    // 如果有真实的 content 数据，直接解析使用
    if (currentExercise.content && Array.isArray(currentExercise.content)) {
      console.log('=== 使用真实练习数据 ===')
      console.log('Content数组:', currentExercise.content)
      console.log('用户角色:', selectedRole === 'questioner' ? '提问者' : '回答者')
      
      const messages: any[] = []
      
      // 解析 content 数组
      currentExercise.content.forEach((item: string, index: number) => {
        const isQuestion = item.startsWith('Q: ')
        const isAnswer = item.startsWith('A: ')
        
        // 去掉 Q: 或 A: 前缀
        let text = item
        if (isQuestion) {
          text = item.substring(3).trim()
        } else if (isAnswer) {
          text = item.substring(3).trim()
        }
        
        // 根据角色决定消息归属
        let isUserMessage = false
        if (selectedRole === 'questioner') {
          // 提问者：Q是用户消息，A是AI消息
          isUserMessage = isQuestion
        } else {
          // 回答者：A是用户消息，Q是AI消息
          isUserMessage = isAnswer
        }
        
        messages.push({
          id: index,
          text: text,
          isUser: isUserMessage,
          timestamp: new Date().getTime() + index * 1000,
          hidden: true // 所有消息初始都隐藏
        })
      })
      
      console.log('=== 解析后的消息列表 ===')
      messages.forEach((msg, index) => {
        console.log(`${index + 1}. ${msg.isUser ? '用户' : 'AI'}: ${msg.text}`)
      })
      
      this.setState({ 
        messages,
        isFirstTime: false,
        isExerciseInfoExpanded: false
      }, () => {
        // 🔥 预加载所有AI消息的数字人语音
        this.preloadAllDigitalVoices(messages)
        
        // 状态更新后，根据角色触发第一条消息的显示
        if (selectedRole === 'answerer') {
          // 回答者：第一条应该是AI消息，需要流式输出
          console.log('回答者角色：开始流式输出第一条AI消息')
          this.startAIResponse()
        } else {
          // 提问者：第一条应该是用户消息，直接显示等待录音
          console.log('提问者角色：显示第一条用户消息，等待录音')
          this.showNextUserMessage()
        }
      })
      
      return
    }

    // 设置加载状态
    this.setState({ isLoadingConversation: true })

    try {
      // 1. 调用 topic_edit 获取 tid
      console.log('调用 topic_edit 接口...')
      const topicResponse: any = await aiChatAPI.topicEdit()
      console.log('topic_edit 响应:', topicResponse)
      
      // 从响应中获取 id 字段作为 tid
      const tid = topicResponse?.data?.id || topicResponse?.id
      
      if (!tid) {
        console.error('topic_edit 响应结构:', JSON.stringify(topicResponse, null, 2))
        throw new Error('未能获取到 tid，响应中没有 id 字段')
      }
      
      this.setState({ tid })
      console.log('获取到 tid:', tid)

      // 2. 调用 completions 获取流式数据
      console.log('调用 completions 接口...')
      
      // 准备请求文本（使用练习场景）
      const requestText = `练习场景：${currentExercise.scenario}。请开始对话。`
      
      // 收集所有流式数据
      let fullResponse = ''
      
      await aiChatAPI.completions({
        tid,
        text: requestText,
        onMessage: (chunk: string) => {
          // 静默收集数据块
          fullResponse += chunk
        },
        onComplete: () => {
          console.log('流式数据接收完成')
          
          // 存储提问和回答的数组
          let questions: string[] = []
          let answers: string[] = []
          let messages: any[] = []
          
          try {
            // 解析 JSON 响应
            const parsedData = JSON.parse(fullResponse)
            console.log('✅ 解析成功')
            
            // 检查是否包含 dialogue 字段
            if (parsedData.dialogue && Array.isArray(parsedData.dialogue)) {
              const dialogue = parsedData.dialogue
              
              // 遍历 dialogue 数组，提取 Q 和 A
              dialogue.forEach((conversation: any) => {
                if (Array.isArray(conversation)) {
                  conversation.forEach((item: string) => {
                    if (item.startsWith('Q: ')) {
                      // 提取问题，去掉 "Q: " 前缀
                      const question = item.substring(3).trim()
                      questions.push(question)
                    } else if (item.startsWith('A: ')) {
                      // 提取回答，去掉 "A: " 前缀
                      const answer = item.substring(3).trim()
                      answers.push(answer)
                    }
                  })
                }
              })
              
              // 打印提问和回答数组
              console.log('📝 AI提问数组:', questions)
              console.log('💬 用户回答数组:', answers)
              
              // 获取用户选择的角色
              const { selectedRole } = this.state
              
              // 打印完整对话（根据角色显示）
              console.log('\n=== 完整对话 ===')
              console.log(`用户角色: ${selectedRole === 'questioner' ? '提问者' : '回答者'}`)
              const maxLength = Math.max(questions.length, answers.length)
              for (let i = 0; i < maxLength; i++) {
                if (i < questions.length) {
                  const speaker = selectedRole === 'questioner' ? '用户' : 'AI'
                  console.log(`${speaker}: ${questions[i]}`)
                }
                if (i < answers.length) {
                  const speaker = selectedRole === 'questioner' ? 'AI' : '用户'
                  console.log(`${speaker}: ${answers[i]}`)
                }
                console.log('---')
              }
              console.log('=== 对话结束 ===\n')
              
              // 将对话转换为消息格式（用于显示）
              // 根据用户选择的角色调整消息顺序
              // 确保消息交替显示：用户-AI-用户-AI 或 AI-用户-AI-用户
              
              const allMessages: any[] = []
              
              // 先收集所有消息
              dialogue.forEach((conversation: any) => {
                if (Array.isArray(conversation)) {
                  conversation.forEach((text: string) => {
                    const isQuestion = text.startsWith('Q: ')
                    const isAnswer = text.startsWith('A: ')
                    
                    // 去掉 Q: 或 A: 前缀
                    let cleanText = text
                    if (isQuestion) {
                      cleanText = text.substring(3).trim()
                    } else if (isAnswer) {
                      cleanText = text.substring(3).trim()
                    }
                    
                    // 根据角色决定消息归属
                    let isUserMessage = false
                    if (selectedRole === 'questioner') {
                      // 提问者：Q是用户消息，A是AI消息
                      isUserMessage = isQuestion
                    } else {
                      // 回答者：A是用户消息，Q是AI消息
                      isUserMessage = isAnswer
                    }
                    
                    allMessages.push({
                      id: allMessages.length,
                      text: cleanText,
                      isUser: isUserMessage,
                      timestamp: new Date().getTime() + allMessages.length * 1000
                    })
                  })
                }
              })
              
              // 重新排序消息，确保交替显示
              const sortedMessages: any[] = []
              const userMessages = allMessages.filter(msg => msg.isUser)
              const aiMessages = allMessages.filter(msg => !msg.isUser)
              
              // 根据角色决定谁先开始
              if (selectedRole === 'questioner') {
                // 提问者先开始：用户-AI-用户-AI
                for (let i = 0; i < Math.max(userMessages.length, aiMessages.length); i++) {
                  if (i < userMessages.length) {
                    sortedMessages.push(userMessages[i])
                  }
                  if (i < aiMessages.length) {
                    sortedMessages.push(aiMessages[i])
                  }
                }
              } else {
                // 回答者先开始：AI-用户-AI-用户
                for (let i = 0; i < Math.max(userMessages.length, aiMessages.length); i++) {
                  if (i < aiMessages.length) {
                    sortedMessages.push(aiMessages[i])
                  }
                  if (i < userMessages.length) {
                    sortedMessages.push(userMessages[i])
                  }
                }
              }
              
              // 所有消息初始都隐藏，稍后根据角色触发显示
              sortedMessages.forEach((msg, index) => {
                messages.push({
                  ...msg,
                  id: messages.length,
                  hidden: true // 所有消息初始都隐藏
                })
              })
            } else {
              throw new Error('响应中没有 dialogue 字段')
            }
          } catch (e) {
            console.error('❌ 解析失败:', e)
            
            // 降级处理：使用默认消息
            messages.push({
              id: 0,
              text: 'Hello! Let\'s start our conversation practice.',
              isUser: false,
              timestamp: new Date().getTime()
            })
          }
          
          // 如果没有有效消息，显示一条默认消息
          if (messages.length === 0) {
            messages.push({
              id: 0,
              text: 'Hello! Let\'s start our conversation practice.',
              isUser: false,
              timestamp: new Date().getTime()
            })
          }
          
          // 更新状态
          this.setState({ 
            messages,
            isLoadingConversation: false,
            isFirstTime: false,
            isExerciseInfoExpanded: false // 加载完成后收起卡片
          }, () => {
            // 状态更新后，根据角色触发第一条消息的显示
            const { selectedRole } = this.state
            if (selectedRole === 'answerer') {
              // 回答者：第一条应该是AI消息，需要流式输出
              console.log('回答者角色：开始流式输出第一条AI消息')
              this.startAIResponse()
            } else {
              // 提问者：第一条应该是用户消息，直接显示等待录音
              console.log('提问者角色：显示第一条用户消息，等待录音')
              this.showNextUserMessage()
            }
          })
        },
        onError: (error: any) => {
          console.error('completions 接口错误:', error)
          
          // 重置加载状态
          this.setState({ isLoadingConversation: false })
        }
      })
      
    } catch (error) {
      console.error('startConversation 错误:', error)
      
      // 重置加载状态
      this.setState({ isLoadingConversation: false })
      
      // 降级使用模拟数据
      console.log('降级使用模拟数据')
      const replies = mockReplies[chapterId as keyof typeof mockReplies]
      if (replies && exerciseId && replies[exerciseId as keyof typeof replies]) {
        const replyTexts = replies[exerciseId as keyof typeof replies] as string[]
        const messages = replyTexts.map((text: string, index: number) => ({
          id: index,
          text,
          isUser: false,
          timestamp: new Date().getTime() + index * 1000
        }))
        this.setState({ messages })
      }
    }
  }

  // 打开录音模态框
  handleOpenRecordingModal = (messageId: number) => {
    const { messages } = this.state
    const message = messages.find(msg => msg.id === messageId)
    
    console.log('=== 打开录音模态框 ===')
    console.log('消息ID:', messageId)
    console.log('消息内容:', message?.text)
    console.log('===================')
    
    this.setState({
      showRecordingModal: true,
      currentRecordingMessageId: messageId
    })
  }

  // 关闭录音模态框
  handleCloseRecordingModal = () => {
    // 如果正在录音，先停止
    if (this.state.isRecording) {
      this.handleModalRecordStop()
    }
    this.setState({
      showRecordingModal: false,
      currentRecordingMessageId: null,
      isRecording: false
    })
  }

  // 模态框内开始录音
  handleModalRecordStart = () => {
    const { currentRecordingMessageId, messages } = this.state
    const message = messages.find(msg => msg.id === currentRecordingMessageId)
    
    console.log('=== 开始录音 ===')
    console.log('消息ID:', currentRecordingMessageId)
    console.log('消息内容:', message?.text)
    console.log('录音格式: mp3')
    console.log('===============')
    
    const startTime = Date.now()
    this.setState({ 
      isRecording: true,
      recordingStartTime: startTime
    })
    
    // 开始录音
    if (this.recorderManager) {
      this.recorderManager.start({
        format: 'wav',              // 音频格式：WAV（无损）
        sampleRate: 16000,          // 采样率：16000Hz
        numberOfChannels: 1,        // 声道：单声道（mono）
        frameSize: 50                // 指定帧大小：50KB
      })
      console.log('🎙️ 录音参数配置:')
      console.log('  - 格式: WAV (无损)')
      console.log('  - 采样率: 16000Hz')
      console.log('  - 采样精度: 16bits')
      console.log('  - 声道: 单声道(mono)')
    }
  }

  // 模态框内停止录音
  handleModalRecordStop = () => {
    const { recordingStartTime, currentRecordingMessageId, recordedMessages, messages } = this.state
    const endTime = Date.now()
    const duration = Math.floor((endTime - recordingStartTime) / 1000) // 计算录音时长（秒）
    const message = messages.find(msg => msg.id === currentRecordingMessageId)
    
    console.log('=== 停止录音 ===')
    console.log('消息ID:', currentRecordingMessageId)
    console.log('消息内容:', message?.text)
    console.log('录音时长:', duration, '秒')
    
    // 停止录音
    if (this.recorderManager) {
      this.recorderManager.stop()
      
      // 监听录音停止事件（只监听一次）
      this.recorderManager.onStop((res: any) => {
        const tempFilePath = res.tempFilePath
        console.log('录音临时文件路径:', tempFilePath)
        
        // 保存录音到本地永久缓存
        // 使用消息ID作为文件名，确保一对一关系
        const savedFileName = `recording_msg_${currentRecordingMessageId}.mp3`
        
        Taro.saveFile({
          tempFilePath: tempFilePath,
          success: (saveRes) => {
            const savedFilePath = saveRes.savedFilePath
            
            console.log('✅ 录音已保存到本地缓存')
            console.log('保存路径:', savedFilePath)
            console.log('文件名:', savedFileName)
            
            // 检查是否覆盖了之前的录音
            if (recordedMessages[currentRecordingMessageId!]) {
              console.log('⚠️  覆盖了之前的录音，保持一对一关系')
              console.log('旧录音路径:', recordedMessages[currentRecordingMessageId!].localFilePath)
            }
            console.log('===============')
            
            // 记录该消息已录音
            if (currentRecordingMessageId !== null) {
              const recordedData = {
                duration,
                voiceUrl: tempFilePath,
                localFilePath: savedFilePath,  // 本地永久缓存路径
                fileName: savedFileName,        // 文件名
                timestamp: endTime,
                messageId: currentRecordingMessageId,
                messageText: message?.text
              }
              
              this.setState({ 
                isRecording: false,
                recordingDuration: duration,
                recordedMessages: {
                  ...recordedMessages,
                  [currentRecordingMessageId]: recordedData  // 如果该消息已有录音，会被覆盖
                }
              })
              
              Taro.showToast({
                title: '录音完成',
                icon: 'success'
              })
              
              // 关闭模态框并触发AI回复
              setTimeout(() => {
                this.setState({
                  showRecordingModal: false,
                  currentRecordingMessageId: null
                })
                
                console.log('=== 录音完成，准备触发AI回复 ===')
                console.log('当前角色:', this.state.selectedRole === 'questioner' ? '提问者' : '回答者')
                console.log('===============================')
                
                // 触发AI回复
                this.startAIResponse()
              }, 500)
            }
          },
          fail: (error) => {
            console.error('❌ 保存录音失败:', error)
            this.setState({ isRecording: false })
            Taro.showToast({
              title: '保存录音失败',
              icon: 'none'
            })
          }
        })
      })
    }
  }

  handleRecordStart = () => {
    const startTime = Date.now()
    this.setState({ 
      isRecording: true,
      recordingStartTime: startTime
    })
    Taro.showToast({
      title: '开始录音...',
      icon: 'none'
    })
  }

  handleRecordStop = () => {
    const { recordingStartTime } = this.state
    const endTime = Date.now()
    const duration = Math.floor((endTime - recordingStartTime) / 1000) // 计算录音时长（秒）
    
    this.setState({ 
      isRecording: false,
      recordingDuration: duration
    })
    Taro.showToast({
      title: '录音完成',
      icon: 'success'
    })
    
    // 添加用户语音气泡
    this.addUserVoiceMessage(duration)
    
    // 模拟AI回复
    setTimeout(() => {
      this.startAIResponse()
    }, 1000)
  }

  addAIMessage = () => {
    const { messages, currentMessageIndex } = this.state
    const { chapterId, exerciseId } = this.state
    const replies = mockReplies[chapterId as keyof typeof mockReplies]
    
    if (replies && exerciseId && replies[exerciseId as keyof typeof replies]) {
      const replyTexts = replies[exerciseId as keyof typeof replies] as string[]
      if (currentMessageIndex < replyTexts.length) {
        const newMessage = {
          id: messages.length,
          text: replyTexts[currentMessageIndex],
          isUser: false,
          timestamp: new Date().getTime()
        }
        
        this.setState({
          messages: [...messages, newMessage],
          currentMessageIndex: currentMessageIndex + 1
        })
      }
    }
  }

  // 添加用户语音消息
  addUserVoiceMessage = (duration: number) => {
    const { messages } = this.state
    const newMessage = {
      id: Date.now(),
      text: '',
      isUser: true,
      isVoice: true,
      voiceUrl: 'mock-voice-url', // 模拟语音URL
      voiceDuration: duration, // 录音时长（秒）
      transcribedText: '', // 转文字结果
      showTranscription: false, // 是否显示转文字
      timestamp: new Date().getTime()
    }
    
    this.setState({
      messages: [...messages, newMessage]
    })
  }

  // 开始AI回复
  startAIResponse = () => {
    const { messages, selectedRole } = this.state
    const visibleMessages = messages.filter(msg => !msg.hidden)
    const hiddenMessages = messages.filter(msg => msg.hidden)
    
    console.log('=== 触发AI回复 ===')
    console.log('当前角色:', selectedRole === 'questioner' ? '提问者' : '回答者')
    console.log('可见消息数:', visibleMessages.length)
    console.log('隐藏消息数:', hiddenMessages.length)
    
    // 检查是否还有隐藏的消息需要显示
    if (hiddenMessages.length === 0) {
      console.log('所有消息都已显示，不需要再回复')
      console.log('================')
      return
    }
    
    // 根据角色判断逻辑
    if (selectedRole === 'questioner') {
      // 提问者角色：用户录音完成后，显示AI的回答
      const nextAIMessage = hiddenMessages.find(msg => !msg.isUser)
      if (!nextAIMessage) {
        console.log('没有下一条AI消息了')
        console.log('================')
        return
      }
      
      console.log('提问者模式 - 显示AI回答:', nextAIMessage.text.substring(0, 50) + '...')
      console.log('================')
      
      this.setState({ isAIResponding: true })
      
      // 模拟AI思考时间
      setTimeout(() => {
        this.startStreamingResponse(nextAIMessage)
      }, 1500)
      
    } else {
      // 回答者角色：用户录音完成后，显示AI的下一个问题
      const nextAIMessage = hiddenMessages.find(msg => !msg.isUser)
      if (!nextAIMessage) {
        console.log('没有下一条AI消息了')
        console.log('================')
        return
      }
      
      console.log('回答者模式 - 显示AI问题:', nextAIMessage.text.substring(0, 50) + '...')
      console.log('================')
      
      this.setState({ isAIResponding: true })
      
      // 模拟AI思考时间
      setTimeout(() => {
        this.startStreamingResponse(nextAIMessage)
      }, 1500)
    }
  }

  // 开始流式输出
  startStreamingResponse = async (aiMessage: any) => {
    const { messages } = this.state
    const messageId = Date.now()
    
    console.log('=== 开始流式输出AI消息 ===')
    console.log('AI消息ID:', aiMessage.id)
    console.log('AI消息内容:', aiMessage.text)
    console.log('========================')
    
    // 语音已在开始对话时批量预加载，这里只需延时1秒
    console.log('⏱️  开始1秒延时（语音已预加载）...')
    
    // 延时1秒后再显示并开始流式输出
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('✅ 延时结束，显示消息并开始流式输出')
    
    // 显示AI消息
    const updatedMessages = messages.map(msg => 
      msg.id === aiMessage.id 
        ? { ...msg, hidden: false, isStreaming: true, text: '' }
        : msg
    )
    
    this.setState({
      messages: updatedMessages,
      isStreaming: true,
      streamingText: '',
      streamingMessageId: messageId,
      scrollIntoViewId: `message-${aiMessage.id}` // 滚动到AI消息
    })
    
    console.log('📜 滚动到AI消息:', `message-${aiMessage.id}`)
    
    // 开始流式输出
    this.streamText(aiMessage.text, aiMessage.id)
  }

  // 流式输出文本
  streamText = (fullText: string, messageId: number) => {
    let currentIndex = 0
    const streamInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        const newText = fullText.substring(0, currentIndex + 1)
        this.setState({
          streamingText: newText
        })
        
        // 更新消息并滚动到当前消息
        const { messages } = this.state
        const updatedMessages = messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, text: newText }
            : msg
        )
        this.setState({ 
          messages: updatedMessages,
          scrollIntoViewId: `message-${messageId}` // 实时滚动到AI消息
        })
        
        currentIndex++
      } else {
        // 流式输出完成
        clearInterval(streamInterval)
        
        console.log('=== AI消息流式输出完成 ===')
        
        this.setState({
          isStreaming: false,
          streamingText: '',
          streamingMessageId: null,
          isAIResponding: false
        })
        
        // 流式输出完成后，直接播放预加载的语音
        console.log('🎵 AI流式输出完成，播放预加载的数字人语音...')
        
        // 使用 setTimeout 确保 state 更新完成后再播放
        setTimeout(() => {
          const { preloadedVoiceUrls } = this.state
          if (preloadedVoiceUrls[messageId]) {
            console.log('✅ 使用预加载的语音，立即播放')
            this.playDigitalVoice(messageId, fullText)
          } else {
            console.log('⚠️  预加载的语音未找到，播放时将实时调用接口（降级方案）')
            // 仍然调用播放方法，它会在内部重新请求
            this.playDigitalVoice(messageId, fullText)
          }
        }, 100)
        
        // AI流式输出完成后，显示下一条用户消息（两种角色逻辑相同）
        const { selectedRole } = this.state
        if (selectedRole === 'answerer') {
          console.log('回答者角色：AI问完问题，显示用户回答消息，等待录音')
        } else {
          console.log('提问者角色：AI回答完成，显示下一条用户问题，等待录音')
        }
        console.log('========================')
        
        // 显示下一条用户消息
        this.showNextUserMessage()
      }
    }, 50) // 每50ms输出一个字符
  }

  // 显示下一条用户消息
  showNextUserMessage = () => {
    const { messages, selectedRole } = this.state
    const hiddenMessages = messages.filter(msg => msg.hidden)
    
    console.log('=== 查找下一条用户消息 ===')
    console.log('当前角色:', selectedRole === 'questioner' ? '提问者' : '回答者')
    console.log('隐藏消息数:', hiddenMessages.length)
    
    // 找到下一条用户消息
    const nextUserMessage = hiddenMessages.find(msg => msg.isUser)
    if (nextUserMessage) {
      console.log('✅ 找到下一条用户消息:', nextUserMessage.text)
      console.log('========================')
      
      // 根据角色决定延迟时间
      const delay = selectedRole === 'answerer' ? 500 : 1000
      
      // 延迟显示下一条用户消息
      setTimeout(() => {
        this.setState((prevState: any) => ({
          messages: prevState.messages.map((msg: any) => 
            msg.id === nextUserMessage.id 
              ? { ...msg, hidden: false, animate: true }
              : msg
          ),
          scrollIntoViewId: `message-${nextUserMessage.id}` // 滚动到新消息
        }))
        console.log('✅ 已显示下一条用户消息，等待录音')
        console.log('📜 滚动到消息:', `message-${nextUserMessage.id}`)
        
        // 动画完成后移除动画类
        setTimeout(() => {
          this.setState((prevState: any) => ({
            messages: prevState.messages.map((msg: any) => 
              msg.id === nextUserMessage.id 
                ? { ...msg, animate: false }
                : msg
            )
          }))
        }, 500)
      }, delay)
    } else {
      console.log('⚠️  没有找到下一条用户消息')
      console.log('隐藏的消息:', hiddenMessages.map(m => ({ id: m.id, isUser: m.isUser, text: m.text.substring(0, 30) })))
      console.log('========================')
    }
  }

  // 转文字功能
  handleTranscribeVoice = (messageId: number) => {
    const { messages } = this.state
    const updatedMessages = messages.map(msg => 
      msg.id === messageId 
        ? { 
            ...msg, 
            showTranscription: !msg.showTranscription,
            transcribedText: msg.transcribedText || 'Hello, how are you today? I hope you are doing well.' // 模拟转文字结果
          }
        : msg
    )
    this.setState({ messages: updatedMessages })
  }

  // 播放语音消息
  handlePlayVoice = (messageId: number) => {
    const { playingVoiceId, playingDigitalVoiceId, recordedMessages } = this.state
    
    // 如果正在播放数字人语音，不允许播放用户录音
    if (playingDigitalVoiceId !== null) {
      console.log('⚠️  数字人语音正在播放，无法播放录音')
      Taro.showToast({
        title: '请等待当前音频播放完成',
        icon: 'none'
      })
      return
    }
    
    // 如果正在播放这条消息，则停止播放
    if (playingVoiceId === messageId) {
      console.log('⏸️  停止播放')
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
      console.warn('⚠️  消息未录音，无法播放')
      Taro.showToast({
        title: '该消息未录音',
        icon: 'none'
      })
      return
    }
    
    const audioPath = recordedData.localFilePath || recordedData.voiceUrl
    const duration = recordedData.duration || 3
    
    console.log('=== 播放录音 ===')
    console.log('消息ID:', messageId)
    console.log('消息内容:', recordedData.messageText)
    console.log('音频路径:', audioPath)
    console.log('录音时长:', duration, '秒')
    console.log('===============')
    
    // 开始播放新的语音
    this.setState({ 
      playingVoiceId: messageId,
      voiceIconIndex: 0
    })
    
    // 启动图标切换动画
    this.startVoiceAnimation()
    
    // 使用真实的音频播放器播放
    if (this.audioContext) {
      this.audioContext.src = audioPath
      this.audioContext.play()
      
      // 监听播放结束
      this.audioContext.onEnded(() => {
        console.log('✅ 录音播放完成')
        this.stopVoicePlayback()
      })
      
      // 监听播放错误
      this.audioContext.onError((error: any) => {
        console.error('❌ 播放录音失败:', error)
        this.stopVoicePlayback()
        Taro.showToast({
          title: '播放失败',
          icon: 'none'
        })
      })
    }
  }

  // 启动语音播放动画
  startVoiceAnimation = () => {
    // 清除之前的定时器
    if (this.voiceAnimationTimer) {
      clearInterval(this.voiceAnimationTimer)
    }
    
    // 每80ms切换一次图标
    this.voiceAnimationTimer = setInterval(() => {
      this.setState((prevState: any) => ({
        voiceIconIndex: (prevState.voiceIconIndex + 1) % 3
      }))
    }, 80)
  }

  // 停止语音播放动画
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
  
  // 停止语音播放（包括音频和动画）
  stopVoicePlayback = () => {
    // 停止音频播放
    if (this.audioContext) {
      this.audioContext.stop()
    }
    
    // 停止动画
    this.stopVoiceAnimation()
  }

  // ====== 数字人语音播放相关方法 ======
  
  // 🔥 批量预加载所有AI消息的数字人语音（在开始对话时调用）
  preloadAllDigitalVoices = async (messages: any[]) => {
    try {
      console.log('=== 🚀 开始批量预加载所有AI消息的数字人语音 ===')
      
      // 1. 筛选出所有AI消息
      const aiMessages = messages.filter(msg => !msg.isUser)
      console.log('AI消息总数:', aiMessages.length)
      
      if (aiMessages.length === 0) {
        console.log('没有AI消息，无需预加载')
        return
      }
      
      // 2. 提取所有AI消息的文本（去掉前缀）
      const aiTexts = aiMessages.map(msg => {
        const cleanText = msg.text.replace(/^[QA]:\s*/, '')
        console.log(`消息ID ${msg.id}: ${cleanText.substring(0, 50)}...`)
        return cleanText
      })
      
      // 3. 批量调用语音生成接口
      console.log('📞 调用批量语音生成接口...')
      const { voicePackAPI } = await import('../../utils/api_v2')
      const response = await voicePackAPI.generate(aiTexts)
      
      if (!response.success) {
        console.error('❌ 批量语音生成失败:', response)
        return
      }
      
      // 4. 获取音频URL数组
      const voiceData = response.result || response.data
      if (!voiceData || !Array.isArray(voiceData) || voiceData.length === 0) {
        console.error('❌ 未获取到语音数据')
        return
      }
      
      console.log('✅ 成功获取', voiceData.length, '个音频URL')
      
      // 5. 构建缓存映射（messageId -> audioUrl）
      const preloadedVoiceUrls: Record<number, string> = {}
      aiMessages.forEach((msg, index) => {
        if (voiceData[index] && voiceData[index].url) {
          preloadedVoiceUrls[msg.id] = voiceData[index].url
          console.log(`✅ 缓存消息 ${msg.id} 的语音URL:`, voiceData[index].url.substring(0, 60) + '...')
        }
      })
      
      // 6. 更新state，缓存所有URL
      this.setState({
        preloadedVoiceUrls
      })
      
      console.log('=== ✅ 批量预加载完成！共缓存', Object.keys(preloadedVoiceUrls).length, '个语音 ===')
    } catch (error) {
      console.error('❌ 批量预加载数字人语音失败:', error)
    }
  }
  
  // 预加载数字人语音（单个，已废弃，保留作为降级方案）
  preloadDigitalVoice = async (messageId: number, messageText: string) => {
    try {
      console.log('🔄 预加载数字人语音 - 消息ID:', messageId)
      
      // 去掉 Q:/A: 前缀
      const cleanText = messageText.replace(/^[QA]:\s*/, '')
      console.log('预加载文本:', cleanText)
      
      // 动态导入 voicePackAPI
      const { voicePackAPI } = await import('../../utils/api_v2')
      
      // 调用数字人语音生成接口
      const response = await voicePackAPI.generate([cleanText])
      
      if (!response.success) {
        console.error('❌ 预加载失败:', response)
        return
      }
      
      // 获取音频URL
      const voiceData = response.result || response.data
      if (!voiceData || voiceData.length === 0) {
        console.error('❌ 未获取到语音数据')
        return
      }
      
      const audioUrl = voiceData[0].url
      console.log('✅ 预加载完成，音频URL:', audioUrl)
      
      // 缓存URL
      this.setState((prevState: any) => ({
        preloadedVoiceUrls: {
          ...prevState.preloadedVoiceUrls,
          [messageId]: audioUrl
        }
      }))
      
      console.log('💾 音频URL已缓存到 state')
    } catch (error) {
      console.error('❌ 预加载数字人语音失败:', error)
    }
  }
  
  // 播放数字人语音
  playDigitalVoice = async (messageId: number, messageText: string) => {
    const { playingDigitalVoiceId, playingVoiceId, preloadedVoiceUrls } = this.state
    
    // 如果正在播放用户录音，不允许播放数字人语音
    if (playingVoiceId !== null) {
      console.log('⚠️  用户录音正在播放，无法播放数字人语音')
      Taro.showToast({
        title: '请等待当前音频播放完成',
        icon: 'none'
      })
      return
    }
    
    // 如果正在播放这条消息，则停止播放
    if (playingDigitalVoiceId === messageId) {
      console.log('⏸️  停止播放数字人语音')
      this.stopDigitalVoicePlayback()
      return
    }
    
    // 停止之前的播放
    if (playingDigitalVoiceId !== null) {
      this.stopDigitalVoicePlayback()
    }
    
    try {
      console.log('=== 播放数字人语音 ===')
      console.log('消息ID:', messageId)
      console.log('消息内容:', messageText)
      
      let audioUrl = preloadedVoiceUrls[messageId]
      
      // 检查是否已有预加载的URL
      if (audioUrl) {
        console.log('✅ 使用预加载的音频URL:', audioUrl)
      } else {
        console.log('⚠️  未找到预加载URL，重新调用接口...')
        
        // 去掉 Q:/A: 前缀
        const cleanText = messageText.replace(/^[QA]:\s*/, '')
        console.log('处理后文本:', cleanText)
        
        // 动态导入 voicePackAPI
        const { voicePackAPI } = await import('../../utils/api_v2')
        
        // 调用数字人语音生成接口
        console.log('调用数字人语音接口...')
        const response = await voicePackAPI.generate([cleanText])
        
        if (!response.success) {
          console.error('❌ 数字人语音生成失败:', response)
          Taro.showToast({
            title: '语音生成失败',
            icon: 'none'
          })
          return
        }
        
        // 获取音频URL
        const voiceData = response.result || response.data
        if (!voiceData || voiceData.length === 0) {
          console.error('❌ 未获取到语音数据')
          return
        }
        
        audioUrl = voiceData[0].url
        console.log('✅ 获取到音频URL:', audioUrl)
        
        // 缓存URL供下次使用
        this.setState((prevState: any) => ({
          preloadedVoiceUrls: {
            ...prevState.preloadedVoiceUrls,
            [messageId]: audioUrl
          }
        }))
        console.log('💾 音频URL已缓存供下次使用')
      }
      
      // 开始播放
      this.setState({ 
        playingDigitalVoiceId: messageId,
        digitalVoiceIconIndex: 0
      })
      
      // 启动图标切换动画
      this.startDigitalVoiceAnimation()
      
      // 使用数字人语音播放器播放
      if (this.digitalVoiceContext) {
        this.digitalVoiceContext.src = audioUrl
        this.digitalVoiceContext.play()
        
        // 监听播放结束
        this.digitalVoiceContext.onEnded(() => {
          console.log('✅ 数字人语音播放完成')
          this.stopDigitalVoicePlayback()
        })
        
        // 监听播放错误
        this.digitalVoiceContext.onError((error: any) => {
          console.error('❌ 播放数字人语音失败:', error)
          this.stopDigitalVoicePlayback()
          Taro.showToast({
            title: '播放失败',
            icon: 'none'
          })
        })
      }
      
      console.log('===============')
    } catch (error) {
      console.error('❌ 播放数字人语音失败:', error)
      Taro.showToast({
        title: '播放失败',
        icon: 'none'
      })
      this.stopDigitalVoicePlayback()
    }
  }
  
  // 启动数字人语音播放动画
  startDigitalVoiceAnimation = () => {
    // 清除之前的定时器
    if (this.digitalVoiceAnimationTimer) {
      clearInterval(this.digitalVoiceAnimationTimer)
    }
    
    // 每80ms切换一次图标
    this.digitalVoiceAnimationTimer = setInterval(() => {
      this.setState((prevState: any) => ({
        digitalVoiceIconIndex: (prevState.digitalVoiceIconIndex + 1) % 3
      }))
    }, 80)
  }
  
  // 停止数字人语音播放动画
  stopDigitalVoiceAnimation = () => {
    if (this.digitalVoiceAnimationTimer) {
      clearInterval(this.digitalVoiceAnimationTimer)
      this.digitalVoiceAnimationTimer = null
    }
    
    this.setState({
      playingDigitalVoiceId: null,
      digitalVoiceIconIndex: 0
    })
  }
  
  // 停止数字人语音播放（包括音频和动画）
  stopDigitalVoicePlayback = () => {
    // 停止音频播放
    if (this.digitalVoiceContext) {
      this.digitalVoiceContext.stop()
    }
    
    // 停止动画（内部会清除播放状态，重新启用所有播放按钮）
    this.stopDigitalVoiceAnimation()
    
    console.log('✅ 播放状态已清除，所有播放按钮已启用')
  }
  
  // 渲染数字人语音图标
  renderDigitalVoiceIcon = (messageId: number) => {
    const { playingDigitalVoiceId, digitalVoiceIconIndex } = this.state
    
    if (playingDigitalVoiceId !== messageId) {
      // 未播放状态：显示静态播放图标
      return '🔊'
    }
    
    // 播放中：显示动画图标
    const icons = ['🔈', '🔉', '🔊']
    return icons[digitalVoiceIconIndex]
  }

  handlePlayMessage = (message: any) => {
    this.setState({ isPlaying: true })
    Taro.showToast({
      title: '播放中...',
      icon: 'none'
    })
    
    // 模拟播放完成
    setTimeout(() => {
      this.setState({ isPlaying: false })
    }, 2000)
  }

  componentWillUnmount() {
    // 组件卸载时清除定时器和音频资源
    this.stopVoiceAnimation()
    this.stopDigitalVoiceAnimation()
    
    // 销毁音频播放器（用户录音）
    if (this.audioContext) {
      this.audioContext.destroy()
      console.log('✅ 音频播放器已销毁')
    }
    
    // 销毁数字人语音播放器
    if (this.digitalVoiceContext) {
      this.digitalVoiceContext.destroy()
      console.log('✅ 数字人语音播放器已销毁')
    }
    
    // 打印所有录音记录
    const { recordedMessages } = this.state
    console.log('=== 页面卸载，录音记录汇总 ===')
    console.log('录音总数:', Object.keys(recordedMessages).length)
    Object.entries(recordedMessages).forEach(([messageId, data]) => {
      console.log(`消息ID ${messageId}:`, {
        消息内容: data.messageText,
        录音时长: data.duration + '秒',
        本地路径: data.localFilePath,
        文件名: data.fileName
      })
    })
    console.log('============================')
  }

  // 渲染语音图标
  renderVoiceIcon = (messageId: number) => {
    const { playingVoiceId, voiceIconIndex } = this.state
    
    // 如果这条消息正在播放，显示动画图标
    if (playingVoiceId === messageId) {
      const icons = ['volume-off', 'volume-minus', 'volume-plus']
      return <AtIcon value={icons[voiceIconIndex]} size='24' color='#667eea' />
    }
    
    // 未播放时显示默认图标 volume-plus
    return <AtIcon value='volume-plus' size='24' color='#667eea' />
  }

  handleBack = () => {
    Taro.navigateBack()
  }

  handleToggleExerciseInfo = () => {
    this.setState((prevState: any) => ({
      isExerciseInfoExpanded: !prevState.isExerciseInfoExpanded
    }))
  }

  // 首次生成练习
  handleGenerateExercise = () => {
    this.startConversation()
  }

  // 选择角色并自动开始对话
  handleRoleSelect = (role: 'questioner' | 'answerer') => {
    this.setState({ selectedRole: role }, () => {
      // 选择角色后自动开始对话
      this.startConversation()
    })
  }

  handleRegenerateConversation = () => {
    // 重新生成对话
    console.log('重新生成对话')
    
    // 确认是否要重新生成
    Taro.showModal({
      title: '重新生成对话',
      content: '确定要重新生成对话吗？当前对话记录将被清空。',
      success: (res) => {
        if (res.confirm) {
          // 清空当前消息
          this.setState({ messages: [] })
          
          // 重新调用 startConversation
          this.startConversation()
        }
      }
    })
  }

  handleComplete = async () => {
    const { recordedMessages, currentExercise } = this.state
    const recordedCount = Object.keys(recordedMessages).length
    
    if (recordedCount === 0) {
      Taro.showToast({
        title: '请先录音',
        icon: 'none'
      })
      return
    }
    
    // 显示上传中提示
    Taro.showLoading({
      title: `上传录音中 0/${recordedCount}`,
      mask: true
    })
    
    try {
      console.log('=== 开始批量上传录音 ===')
      console.log('录音总数:', recordedCount)
      
      // 获取学生信息
      const studentInfo = Taro.getStorageSync('studentInfo')
      const studentId = studentInfo?.id
      
      if (!studentId) {
        throw new Error('未找到学生信息')
      }
      
      // 获取练习ID
      const exerciseId = currentExercise?.id
      
      if (!exerciseId) {
        throw new Error('未找到练习ID')
      }
      
      console.log('学生ID:', studentId)
      console.log('练习ID:', exerciseId)
      
      // 导入所有需要的API
      const { fileAPI, audioAPI, soeAPI, reportAPI, contentAPI, studentAPI } = await import('../../utils/api_v2')
      
      // ====== 步骤1: 删除该学生在该练习的所有旧数据（音频+报告） ======
      console.log('\n========================================')
      console.log('步骤1: 删除旧练习数据（音频+报告）')
      console.log('========================================')
      
      Taro.showLoading({
        title: '清除旧数据...',
        mask: true
      })
      
      try {
        console.log('调用删除接口:')
        console.log('  - student_id =', studentId)
        console.log('  - exercise_id =', exerciseId)
        console.log('  - is_free = false (结构化练习)')
        
        
        const deleteResult = await studentAPI.deleteStudentExerciseData(
          studentId, 
          exerciseId
        )
        
        if (deleteResult.success) {
          console.log('✅ 旧练习数据删除成功（音频+报告）')
        } else {
          console.log('⚠️  删除接口返回失败，但继续执行')
        }
      } catch (deleteError) {
        console.error('删除旧练习数据失败:', deleteError)
        console.log('⚠️  忽略错误，继续上传新数据')
      }
      
      console.log('\n========================================')
      console.log('步骤2: 开始上传新录音')
      console.log('========================================')
      
      let uploadedCount = 0
      const uploadResults: any[] = []
      
      // 批量上传录音文件
      for (const [messageId, recordData] of Object.entries(recordedMessages)) {
        try {
          console.log(`\n========================================`)
          console.log(`上传录音 ${uploadedCount + 1}/${recordedCount}`)
          console.log(`========================================`)
          console.log('📝 消息ID:', messageId)
          console.log('📝 消息内容:', recordData.messageText)
          
          // 更新进度提示
          Taro.showLoading({
            title: `上传录音中 ${uploadedCount + 1}/${recordedCount}`,
            mask: true
          })
          
          // 1. 上传文件
          const audioPath = recordData.localFilePath || recordData.voiceUrl
          console.log('\n📤 步骤1: 上传文件到服务器')
          console.log('   音频路径:', audioPath)
          
          if (!audioPath) {
            throw new Error('音频文件路径为空')
          }
          
          const uploadResult = await fileAPI.uploadFile(audioPath)
          console.log('   上传接口响应:', {
            success: uploadResult.success,
            status: uploadResult.status,
            hasData: !!uploadResult.data,
            hasResult: !!uploadResult.result
          })
          
          if (!uploadResult.success) {
            console.error('   ❌ 上传失败，接口返回:', uploadResult)
            throw new Error('文件上传失败')
          }
          
          // 提取文件URL
          const fileUrl = uploadResult.data?.file?.url || uploadResult.result?.file?.url
          
          if (!fileUrl) {
            console.error('   ❌ 文件URL为空')
            console.error('   响应data.file:', uploadResult.data?.file)
            console.error('   响应result.file:', uploadResult.result?.file)
            throw new Error('文件URL为空')
          }
          
          console.log('   ✅ 文件上传成功')
          console.log('   文件URL:', fileUrl)
          
          // 2. 保存到数据库
          console.log('\n💾 步骤2: 保存音频记录到数据库')
          // 去掉 Q:/A: 前缀作为参考文本
          const refText = recordData.messageText.replace(/^[QA]:\s*/, '')
          const audioData = {
            student_id: studentId,
            exercise_id: exerciseId,
            file: fileUrl,  // 存储到数据库的file字段
            duration: recordData.duration,  // 音频时长（秒）
            message_text: recordData.messageText,  // 保存对应的消息文本（带前缀）
            ref_text: refText,  // 参考文本（去掉前缀，用于SOE评测）
            is_free: false,  // 结构化练习音频
            evaluation: ''  // 评价文本（稍后可通过 SOE 评测结果生成）
          }
          
          console.log('   请求参数:', JSON.stringify(audioData, null, 2))
          
          const saveResult = await audioAPI.editAudio(audioData)
          console.log('   数据库接口响应:', {
            success: saveResult.success,
            status: saveResult.status,
            hasData: !!saveResult.data,
            hasResult: !!saveResult.result
          })
          
          if (!saveResult.success) {
            console.error('   ❌ 保存失败，接口返回:', saveResult)
            throw new Error('保存音频记录失败: ' + (saveResult.message || '未知错误'))
          }
          
          const audioId = saveResult.data?.id || saveResult.result?.id
          console.log('   ✅ 音频记录已保存到数据库')
          console.log('   音频ID:', audioId)
          
          uploadResults.push({
            messageId,
            messageText: recordData.messageText,
            audioUrl: fileUrl,
            audioId: audioId,
            studentId: studentId,
            exerciseId: exerciseId
          })
          
          uploadedCount++
          console.log(`\n✅ 第 ${uploadedCount} 个录音上传并保存成功`)
          
        } catch (error) {
          console.error(`\n❌ 上传消息 ${messageId} 的录音失败:`)
          console.error('   错误详情:', error)
          console.error('   错误消息:', (error as Error).message)
          // 继续上传其他录音，不中断
        }
      }
      
      console.log('\n=== 批量上传完成 ===')
      console.log('成功上传:', uploadedCount, '/', recordedCount)
      console.log('上传结果:', uploadResults)
      console.log('=====================\n')
      
      // ====== 步骤3: 逐个下载音频、评测并生成评价 ======
      if (uploadResults.length > 0) {
        console.log('\n========================================')
        console.log('步骤3: 逐个下载音频、评测并生成评价')
        console.log('========================================')
        
        const allSoeResults: any[] = []  // 收集所有评测结果
        const allEvaluations: string[] = []  // 收集所有音频的 evaluation 内容
        
        try {
          for (let i = 0; i < uploadResults.length; i++) {
            const uploadResult = uploadResults[i]
            console.log(`\n======== 处理音频 ${i + 1}/${uploadResults.length} ========`)
            console.log('音频ID:', uploadResult.audioId)
            console.log('消息文本:', uploadResult.messageText)
            console.log('音频URL:', uploadResult.audioUrl)
            
            try {
              // 3.1 下载音频文件
              console.log('\n📥 步骤3.1: 下载音频文件')
              Taro.showLoading({
                title: `下载音频 ${i + 1}/${uploadResults.length}`,
                mask: true
              })
              
              const downloadResult = await Taro.downloadFile({
                url: uploadResult.audioUrl
              })
              
              if (downloadResult.statusCode !== 200) {
                throw new Error(`下载失败，状态码: ${downloadResult.statusCode}`)
              }
              
              const localFilePath = downloadResult.tempFilePath
              console.log('✅ 下载成功:', localFilePath)
              
              // 3.2 调用 SOE 评测接口
              console.log('\n🎯 步骤3.2: SOE 评测')
              Taro.showLoading({
                title: `评测音频 ${i + 1}/${uploadResults.length}`,
                mask: true
              })
              
              // 去掉 Q:/A: 前缀
              const refText = uploadResult.messageText.replace(/^[QA]:\s*/, '')
              console.log('参考文本:', refText)
              
              const soeResult = await soeAPI.evaluate([localFilePath], [refText])
              
              if (!soeResult.success) {
                throw new Error('SOE 评测失败')
              }
              
              const soeData = Array.isArray(soeResult.data) ? soeResult.data[0] : soeResult.data
              console.log('✅ SOE 评测成功')
              console.log('评测结果:', soeData)
              
              // 保存评测结果供后续使用
              allSoeResults.push(soeData)
              
              console.log('✅ SOE 评测完成，跳过立即生成评价（将在后台生成）')
              
              console.log(`========================================\n`)
              
            } catch (audioError) {
              console.error(`❌ 处理音频 ${i + 1} 失败:`, audioError)
              console.log('继续处理下一个音频...\n')
              // 继续处理其他音频
            }
          }
          
          console.log('\n✅ 所有音频 SOE 评测完成')
          console.log('成功评测音频数量:', allSoeResults.length)
          
          // ====== 步骤4: 保存评测结果到report ======
          console.log('\n========================================')
          console.log('步骤4: 保存评测结果到report表')
          console.log('========================================')
          
          Taro.showLoading({
            title: '保存评测结果...',
            mask: true
          })
          
          try {
            // 收集所有音频ID
            const audioIds = uploadResults.map(result => result.audioId).filter(id => id)
            console.log('练习ID:', exerciseId)
            console.log('音频ID列表:', audioIds)
            console.log('音频ID数量:', audioIds.length)
            console.log('所有评测结果:', allSoeResults)
            
            // 将所有评测结果转为JSON字符串
            const jsonContent = JSON.stringify({
              exercise_id: exerciseId,
              audio_ids: audioIds,
              timestamp: new Date().toISOString(),
              soe_results: allSoeResults  // 保存所有评测结果
            })
            
            console.log('准备保存的JSON内容长度:', jsonContent.length)
            console.log('JSON内容预览:', jsonContent.substring(0, 200) + '...')
            
            // 保存到report表
            const reportData = {
              student_id: studentId,  // 学生ID（必填）
              exercise_id: exerciseId,
              name: `练习评测报告 - ${currentExercise?.title || currentExercise?.name}`,
              audio_ids: audioIds,
              summary: `自动生成的评测报告，包含 ${audioIds.length} 个音频的评测结果`,
              json_content: jsonContent  // 保存所有评测结果
            }
            
            console.log('保存report参数:')
            console.log('  - student_id:', reportData.student_id)
            console.log('  - exercise_id:', reportData.exercise_id)
            console.log('  - name:', reportData.name)
            console.log('  - audio_ids:', reportData.audio_ids)
            console.log('  - summary:', reportData.summary)
            console.log('  - json_content长度:', reportData.json_content.length)
            
            const reportResult = await reportAPI.editReport(reportData)
            
            if (reportResult.success) {
              const reportId = reportResult.data?.id || reportResult.result?.id
              console.log('✅ 评测结果已保存到report表')
              console.log('Report ID:', reportId)
              console.log('保存的数据:')
              console.log('  - 练习ID:', exerciseId)
              console.log('  - 音频ID数组:', audioIds)
              console.log('  - 评测结果数量:', allSoeResults.length)
              
              // ====== 步骤5: 后台异步生成评价和整体AI分析（不阻塞用户） ======
              console.log('\n========================================')
              console.log('步骤5: 后台异步生成评价和整体AI分析')
              console.log('========================================')
              
              // 🔥 不等待生成完成，直接在后台异步执行
              if (reportId && allSoeResults.length > 0) {
                this.generateEvaluationsAndOverallAnalysisInBackground(
                  reportId,
                  studentId,
                  exerciseId,
                  uploadResults,
                  allSoeResults
                )
                console.log('✅ 评价和整体AI分析生成任务已提交到后台')
                console.log('用户可以立即返回，AI分析将在后台生成完成（约1-2分钟）')
              } else {
                console.log('⚠️  无法生成评价和整体AI分析')
                console.log('   - reportId:', reportId)
                console.log('   - SOE结果数量:', allSoeResults.length)
              }
            } else {
              console.log('⚠️  保存评测结果失败:', reportResult.message)
            }
          } catch (reportError) {
            console.error('保存评测结果失败:', reportError)
            console.log('⚠️  忽略错误，继续完成流程')
          }
          
        } catch (soeError) {
          console.error('处理音频失败:', soeError)
          console.log('⚠️  忽略错误，继续完成流程')
        }
      }
      
      Taro.hideLoading()
      
      // 显示完成提示并返回上一页
      Taro.showModal({
        title: '练习完成',
        content: `恭喜你完成了这个练习！\n成功上传 ${uploadedCount}/${recordedCount} 个录音\n\n📝 学习建议正在生成中，预计需要1-2分钟`,
        showCancel: false,
        confirmText: '返回',
        success: (res) => {
          if (res.confirm) {
            // 返回上一页
            console.log('练习完成，返回上一页')
            Taro.navigateBack()
          }
        }
      })
      
    } catch (error) {
      console.error('❌ 完成练习失败:', error)
      Taro.hideLoading()
      Taro.showToast({
        title: (error as Error).message || '上传失败',
        icon: 'none',
        duration: 2000
      })
    }
  }

  /**
   * 后台异步生成所有评价和整体AI分析
   * 不阻塞用户操作，生成完成后自动更新audio和report
   */
  generateEvaluationsAndOverallAnalysisInBackground = async (
    reportId: number,
    studentId: number,
    exerciseId: number,
    uploadResults: any[],
    allSoeResults: any[]
  ) => {
    try {
      console.log('🔄 后台任务：开始生成所有评价和整体AI分析')
      console.log('音频数量:', uploadResults.length)
      console.log('SOE结果数量:', allSoeResults.length)
      
      const { contentAPI, audioAPI, reportAPI } = await import('../../utils/api_v2')
      const allEvaluations: string[] = []
      
      // 步骤1: 逐个生成评价并更新音频记录
      for (let i = 0; i < uploadResults.length; i++) {
        try {
          const uploadResult = uploadResults[i]
          const soeData = allSoeResults[i]
          
          if (!soeData) {
            console.log(`⚠️  后台任务：音频 ${i + 1} 没有SOE结果，跳过`)
            continue
          }
          
          console.log(`\n🔄 后台任务：生成评价 ${i + 1}/${uploadResults.length}`)
          console.log('音频ID:', uploadResult.audioId)
          
          // 调用 generate 接口生成评价
          const soeJsonQuery = JSON.stringify(soeData)
          const contentResult = await contentAPI.generate(5844, soeJsonQuery)
          
          if (!contentResult.success) {
            console.log(`⚠️  后台任务：音频 ${i + 1} 生成评价失败，跳过`)
            continue
          }
          
          const evaluation = contentResult.data?.content || contentResult.result?.content || ''
          console.log(`✅ 后台任务：音频 ${i + 1} 评价生成成功，长度: ${evaluation.length}`)
          
          // 更新音频记录的 evaluation 字段
          const updateRefText = uploadResult.messageText.replace(/^[QA]:\s*/, '')
          const updateAudioData = {
            id: uploadResult.audioId,
            student_id: uploadResult.studentId,
            exercise_id: uploadResult.exerciseId,
            file: uploadResult.audioUrl,
            ref_text: updateRefText,
            is_free: false,
            evaluation: evaluation
          }
          
          const updateResult = await audioAPI.editAudio(updateAudioData)
          
          if (updateResult.success) {
            console.log(`✅ 后台任务：音频 ${i + 1} 记录已更新`)
            allEvaluations.push(evaluation)
          } else {
            console.log(`⚠️  后台任务：音频 ${i + 1} 记录更新失败`)
          }
          
        } catch (error) {
          console.error(`❌ 后台任务：处理音频 ${i + 1} 失败:`, error)
        }
      }
      
      console.log('\n✅ 后台任务：所有评价生成完成')
      console.log('成功生成评价数量:', allEvaluations.length)
      
      // 步骤2: 生成整体AI分析
      if (allEvaluations.length > 0) {
        console.log('\n🔄 后台任务：开始生成整体AI分析')
        
        const combinedEvaluations = allEvaluations.join('\n\n')
        console.log('拼接后的内容长度:', combinedEvaluations.length)
        
        const overallContentResult = await contentAPI.generate(5863, combinedEvaluations)
        
        if (overallContentResult.success) {
          const overallContent = overallContentResult.data?.content || overallContentResult.result?.content || ''
          console.log('✅ 后台任务：整体AI分析生成成功，长度:', overallContent.length)
          
          // 更新 report 的 content 字段（只更新content，其他字段保持不变）
          const audioIds = uploadResults.map(r => r.audioId).filter(id => id)
          const updateReportResult = await reportAPI.editReport({
            id: reportId,
            student_id: studentId,
            exercise_id: exerciseId,
            name: `练习评测报告`,
            audio_ids: audioIds,
            summary: `自动生成的评测报告`,
            content: overallContent
          })
          
          if (updateReportResult.success) {
            console.log('✅ 后台任务：整体AI分析已保存到 report')
          } else {
            console.log('⚠️  后台任务：保存整体AI分析失败')
          }
        } else {
          console.log('⚠️  后台任务：生成整体AI分析失败')
        }
      } else {
        console.log('⚠️  后台任务：没有评价内容，跳过整体AI分析')
      }
      
      console.log('✅ 后台任务：所有生成任务完成')
      
    } catch (error) {
      console.error('❌ 后台任务：生成评价和整体AI分析失败:', error)
    }
  }

  /**
   * 后台异步生成整体AI分析建议
   * 不阻塞用户操作，生成完成后自动更新report
   */
  generateOverallContentInBackground = async (
    reportId: number,
    studentId: number,
    exerciseId: number,
    reportData: any,
    audioIds: number[],
    jsonContent: string,
    allEvaluations: string[]
  ) => {
    try {
      console.log('🔄 后台任务：开始生成整体AI分析建议')
      
      const { contentAPI, reportAPI } = await import('../../utils/api_v2')
      
      // 将所有 evaluation 内容拼接成一个字符串
      const combinedEvaluations = allEvaluations.join('\n\n')
      console.log('🔄 后台任务：所有 evaluation 拼接后的总长度:', combinedEvaluations.length)
      console.log('🔄 后台任务：拼接内容预览:', combinedEvaluations.substring(0, 200) + '...')
      
      // 使用 agent_id=5863 调用 generate 接口
      console.log('🔄 后台任务：调用 generate 接口，agent_id: 5863')
      const overallContentResult = await contentAPI.generate(5863, combinedEvaluations)
      
      if (overallContentResult.success) {
        const overallContent = overallContentResult.data?.content || overallContentResult.result?.content || ''
        console.log('✅ 后台任务：整体AI分析建议生成成功')
        console.log('生成内容长度:', overallContent.length)
        
        // 更新 report 的 content 字段
        const updateReportData = {
          id: reportId,
          student_id: studentId,
          exercise_id: exerciseId,
          name: reportData.name,
          audio_ids: audioIds,
          summary: reportData.summary,
          json_content: jsonContent,
          content: overallContent  // 保存整体AI分析建议
        }
        
        const updateReportResult = await reportAPI.editReport(updateReportData)
        
        if (updateReportResult.success) {
          console.log('✅ 后台任务：整体AI分析建议已保存到 report 的 content 字段')
          console.log('report_id:', reportId)
          console.log('student_id:', studentId)
          console.log('exercise_id:', exerciseId)
        } else {
          console.log('⚠️  后台任务：保存整体AI分析建议失败:', updateReportResult.message)
        }
      } else {
        console.log('⚠️  后台任务：生成整体AI分析建议失败:', overallContentResult.message)
      }
    } catch (overallError) {
      console.error('❌ 后台任务：生成或保存整体AI分析建议失败:', overallError)
    }
  }

  render() {
    const { 
      currentExercise, 
      messages, 
      isRecording, 
      isPlaying,
      isAIResponding,
      isStreaming,
      isExerciseInfoExpanded,
      showRecordingModal,
      recordedMessages,
      isFirstTime,
      selectedRole,
      playingDigitalVoiceId
    } = this.state

    if (!currentExercise) {
      return (
        <View className='loading-page'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      )
    }


    return (
      <View className='conversation-page'>
        <View className='header'>
          <View className='header-content'>
            <View className='header-left'>
              <AtIcon value='message' size='32' color='white' />
              <Text className='header-title'>对话练习</Text>
            </View>
            <View className='header-right'>
              {/* {!isFirstTime && (
                <SafeAtButton 
                  type='secondary' 
                  size='small'
                  onClick={this.handleRegenerateConversation}
                  className='regenerate-btn'
                  disabled={true}
                >
                  重新生成对话
                </SafeAtButton>
              )} */}
              <Text className='user-name'>{this.state.studentName}</Text>
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

        {/* 练习信息 */}
        <View className={`exercise-info-section ${isExerciseInfoExpanded ? 'expanded' : 'collapsed'}`}>
          <SafeAtCard title='当前练习' className='exercise-info-card'>
            <View className='exercise-info-content'>
              {/* 练习标题 */}
              <Text className='exercise-title-text'>{currentExercise.title}</Text>
              
              {/* 练习描述 */}
              <Text className='exercise-scenario'>{currentExercise.scenario}</Text>
            </View>
          </SafeAtCard>
        </View>

        {/* 对话区域 */}
        <ScrollView 
          className={`conversation-area ${isExerciseInfoExpanded ? 'with-expanded-info' : ''} ${isFirstTime ? 'first-time' : ''} ${showRecordingModal ? 'recording-active' : ''}`}
          scrollY 
          scrollIntoView={this.state.scrollIntoViewId}
          scrollWithAnimation
        >
          <View className='messages-container'>
            {/* 显示角色选择（去除生成练习按钮） */}
            {messages.length === 0 && (
              <View className='generate-exercise-container'>
                {/* 角色选择 */}
                <View className='role-selection'>
                  <Text className='role-selection-title'>选择谁来发起对话</Text>
                  <View className='role-buttons'>
                    <SafeAtButton 
                      type={selectedRole === 'questioner' ? 'primary' : 'secondary'}
                      size='normal'
                      onClick={() => this.handleRoleSelect('questioner')}
                      className={`role-btn ${selectedRole === 'questioner' ? 'selected' : ''}`}
                    >
                      你
                    </SafeAtButton>
                    <SafeAtButton 
                      type={selectedRole === 'answerer' ? 'primary' : 'secondary'}
                      size='normal'
                      onClick={() => this.handleRoleSelect('answerer')}
                      className={`role-btn ${selectedRole === 'answerer' ? 'selected' : ''}`}
                    >
                      AI
                    </SafeAtButton>
                  </View>
                  <Text className='role-hint'>点击选择后将自动开始练习</Text>
                </View>
              </View>
            )}
            
            {messages.filter(msg => !msg.hidden).map((message) => (
              <View 
                key={message.id}
                id={`message-${message.id}`}
                className={`message-wrapper ${message.isUser ? 'user-message-wrapper' : 'ai-message-wrapper'} ${this.state.currentRecordingMessageId === message.id ? 'recording-highlight' : ''}`}
              >
                <View className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}>
                  {!message.isUser && (
                    <Image 
                      className='avatar' 
                      src={avatarImages[0]} 
                      mode='aspectFill'
                    />
                  )}
                  
                  <View className='message-content'>
                    {/* 用户消息：先显示录音气泡（如果有），再显示文本消息，然后显示播放数字人语音按钮 */}
                    {message.isUser ? (
                      <>
                        {/* 录音气泡 */}
                        {recordedMessages[message.id] && (
                          <View 
                            className={`voice-bubble ${(this.state.playingDigitalVoiceId !== null || (this.state.playingVoiceId !== null && this.state.playingVoiceId !== message.id)) ? 'disabled' : ''}`}
                            onClick={() => {
                              // 如果有其他音频正在播放，不允许点击
                              if (this.state.playingDigitalVoiceId !== null || (this.state.playingVoiceId !== null && this.state.playingVoiceId !== message.id)) {
                                Taro.showToast({
                                  title: '请等待当前音频播放完成',
                                  icon: 'none'
                                })
                                return
                              }
                              this.handlePlayVoice(message.id)
                            }}
                          >
                            <Text className='voice-duration'>{recordedMessages[message.id].duration || 0}"</Text>
                            <View className='voice-icon-wrapper'>
                              {this.renderVoiceIcon(message.id)}
                            </View>
                          </View>
                        )}
                        
                        {/* 文本消息 */}
                        <View className={`message-bubble ${message.animate ? 'animate-in' : ''}`}>
                          <Text className='message-text'>{message.text}</Text>
                        </View>
                        
                        {/* 播放数字人语音按钮 */}
                        <SafeAtButton 
                          type='secondary' 
                          size='small'
                          onClick={() => this.playDigitalVoice(message.id, message.text)}
                          className='play-btn'
                          disabled={this.state.playingVoiceId !== null || (this.state.playingDigitalVoiceId !== null && this.state.playingDigitalVoiceId !== message.id)}
                        >
                          {this.renderDigitalVoiceIcon(message.id)} 播放
                        </SafeAtButton>
                      </>
                    ) : (
                      /* AI消息：显示消息气泡和重新播放按钮 */
                      <>
                        <View className='message-bubble'>
                          <Text className='message-text'>{message.text}</Text>
                          {message.isStreaming && (
                            <View className='streaming-indicator'>
                              <Text className='streaming-dot'>●</Text>
                            </View>
                          )}
                        </View>
                        
                        {/* AI消息重新播放按钮（流式输出完成后显示） */}
                        {!message.isStreaming && (
                          <SafeAtButton 
                            type='secondary' 
                            size='small'
                            onClick={() => this.playDigitalVoice(message.id, message.text)}
                            className='play-btn'
                            disabled={this.state.playingVoiceId !== null || (this.state.playingDigitalVoiceId !== null && this.state.playingDigitalVoiceId !== message.id)}
                          >
                            {this.renderDigitalVoiceIcon(message.id)} 播放
                          </SafeAtButton>
                        )}
                      </>
                    )}
                  </View>
                </View>
                
                {/* 用户消息下方添加录音按钮 */}
                {message.isUser && (
                  <View className='record-action-btn-wrapper'>
                    <Text 
                      className='record-action-btn'
                      onClick={() => this.handleOpenRecordingModal(message.id)}
                    >
                      {recordedMessages[message.id] ? '重新录音' : '点击开始录音'}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* 完成按钮 - 只在非首次进入时显示 */}
        {!isFirstTime && (() => {
          // 计算用户回答的数量
          const userMessagesCount = messages.filter(msg => msg.isUser).length
          // 计算已录音的数量
          const recordedCount = Object.keys(recordedMessages).length
          // 判断是否所有用户消息都已录音
          const isAllRecorded = userMessagesCount > 0 && recordedCount >= userMessagesCount
          
          return (
            <View className='complete-section'>
              <SafeAtButton 
                type='primary'
                onClick={this.handleComplete}
                className='continue-text'
                disabled={!isAllRecorded}
              >
                完成练习 {!isAllRecorded && `(${recordedCount}/${userMessagesCount})`}
              </SafeAtButton>
            </View>
          )
        })()}

        {/* 录音模态框 */}
        {showRecordingModal && (
          <View className='recording-modal-overlay' onClick={this.handleCloseRecordingModal}>
            <View className='recording-modal-content' onClick={(e) => e.stopPropagation()}>
              <View 
                className={`recording-circle ${isRecording ? 'recording-active' : ''}`}
                onClick={isRecording ? this.handleModalRecordStop : this.handleModalRecordStart}
              >
                <AtIcon 
                  value={isRecording ? 'pause' : 'play'} 
                  size='80' 
                  color='white'
                  className={isRecording ? 'icon-bounce' : ''}
                />
              </View>
              <Text className='recording-modal-text'>
                {isRecording ? '点击停止' : '开始录音'}
              </Text>
            </View>
          </View>
        )}

        {/* 加载遮罩层 */}
        {this.state.isLoadingConversation && (
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
}

