import { Component } from 'react'
import { View, Text, ScrollView, Image as TaroImage } from '@tarojs/components'
import { AtButton, AtCard, AtProgress, AtTag, AtDivider } from 'taro-ui'
import { AtIcon } from 'taro-ui'

// Safety check for taro-ui components
const SafeAtButton = AtButton || (() => <View>Button not available</View>)
const SafeAtCard = AtCard || (() => <View>Card not available</View>)
const SafeAtProgress = AtProgress || (() => <View>Progress not available</View>)
const SafeAtTag = AtTag || (() => <View>Tag not available</View>)
const SafeAtDivider = AtDivider || (() => <View>Divider not available</View>)
import Taro from '@tarojs/taro'
import './index.scss'

// 导入API服务
import { unitAPI, exerciseAPI, reportAPI, audioAPI } from '../../utils/api_v2'

// 模拟练习数据
const mockExercises = {
  chapter1: [
    { id: 'ex1-1', title: '基础问候', scenario: '你在学校遇到了新同学，需要用英语打招呼并进行简单交流。', isCompleted: true },
    { id: 'ex1-2', title: '自我介绍', scenario: '在英语角活动中，你需要向大家介绍自己的基本情况和兴趣爱好。', isCompleted: true }
    // { id: 'ex1-3', title: '介绍他人', scenario: '你要把你的朋友介绍给新来的外教老师认识。', isCompleted: true },
    // { id: 'ex1-4', title: '道别用语', scenario: '放学时，你需要和同学、老师道别。', isCompleted: false },
    // { id: 'ex1-5', title: '情景对话练习', scenario: '在公园遇到了很久没见的朋友，进行一次完整的对话。', isCompleted: false }
  ]
  // chapter2: [
  //   { id: 'ex2-1', title: '介绍家庭', scenario: '在英语课上，老师让你介绍一下你的家庭成员。', isCompleted: true },
  //   { id: 'ex2-2', title: '描述家人', scenario: '向你的笔友描述你的家人的外貌特征和性格。', isCompleted: false },
  //   { id: 'ex2-3', title: '谈论朋友', scenario: '和同学谈论你最好的朋友以及你们常一起做的事情。', isCompleted: false },
  //   { id: 'ex2-4', title: '家庭活动', scenario: '周末你的家庭计划一起出去活动，讨论具体安排。', isCompleted: false }
  // ],
  // chapter3: [
  //   { id: 'ex3-1', title: '学校设施', scenario: '新同学向你询问学校各设施的位置，你为他介绍。', isCompleted: true },
  //   { id: 'ex3-2', title: '课程描述', scenario: '和你的同桌交流你们最喜欢的课程以及原因。', isCompleted: false },
  //   { id: 'ex3-3', title: '学习习惯', scenario: '向同学分享你的学习习惯和提高英语的方法。', isCompleted: false },
  //   { id: 'ex3-4', title: '师生交流', scenario: '你对作业有疑问，向老师请教。', isCompleted: false },
  //   { id: 'ex3-5', title: '校园活动', scenario: '你想邀请同学参加学校的英语俱乐部活动。', isCompleted: false },
  //   { id: 'ex3-6', title: '考试与评价', scenario: '考试后和同学讨论考试情况和学习计划。', isCompleted: false }
  // ],
  // chapter4: [
  //   { id: 'ex4-1', title: '兴趣爱好表达', scenario: '在英语自我介绍中，详细介绍你的兴趣爱好。', isCompleted: false },
  //   { id: 'ex4-2', title: '体育活动', scenario: '和同学讨论你们喜欢的体育运动和最近的比赛。', isCompleted: false },
  //   { id: 'ex4-3', title: '音乐与艺术', scenario: '向朋友介绍你喜欢的音乐类型和艺术家。', isCompleted: false },
  //   { id: 'ex4-4', title: '阅读与电影', scenario: '推荐一本你最近读过的好书或看过的好电影。', isCompleted: false },
  //   { id: 'ex4-5', title: '业余时间', scenario: '周末你有什么计划？和朋友分享一下。', isCompleted: false }
  // ],
  // chapter5: [
  //   { id: 'ex5-1', title: '购物需求', scenario: '你去商店买东西，向店员说明你的需求。', isCompleted: false },
  //   { id: 'ex5-2', title: '询问价格', scenario: '在超市购物时，询问不同商品的价格。', isCompleted: false },
  //   { id: 'ex5-3', title: '讨价还价', scenario: '在市场购物时，尝试与摊主讨价还价。', isCompleted: false },
  //   { id: 'ex5-4', title: '退换商品', scenario: '你买的衣服不合适，去商店要求退换。', isCompleted: false }
  // ]
}

// 章节信息
const chapterInfo = {
  chapter1: { title: 'Introduction', description: '与朋友打招呼并介绍一下你自己' }
  // chapter2: { title: '第二章: Greetings!', description: '练习如何与别人打招呼' },
}

export default class ExerciseDetail extends Component {
  state = {
    unitId: '',
    exerciseId: '',
    currentExercise: null as any,
    unitData: null as any,
    exercises: [] as any[],
    loading: true,
    studentName: '学生', // 学生姓名
    reportStatus: 'unknown' as 'unknown' | 'generating' | 'completed' | 'empty', // report生成状态
    isPolling: false, // 是否正在轮询
    hasAudio: false, // 是否有is_free=false的音频（用于控制"查看总结"按钮是否可用）
    // 悬浮按钮位置
    floatButtonX: 0, // 按钮X坐标
    floatButtonY: 0, // 按钮Y坐标
    isDragging: false // 是否正在拖动
  }

  // 标记是否是首次加载
  private isFirstLoad = true

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
    
    const instance = Taro.getCurrentInstance()
    const { unitId, exerciseId } = instance?.router?.params || {}
    
    console.log('ExerciseDetail componentDidMount:', { unitId, exerciseId })
    
    this.setState({
      unitId: unitId || '',
      exerciseId: exerciseId || ''
    })
    
    // 加载真实数据
    if (unitId) {
      this.loadExerciseData(unitId, exerciseId || '')
    }
    
    // 初始化悬浮按钮位置（默认在右下角）
    this.initFloatButtonPosition()

    // 如果是从对话页面跳转过来的，检查音频和评测状态
    const currentExerciseId = Taro.getStorageSync('currentExerciseId')
    if (currentExerciseId && exerciseId && String(currentExerciseId) === String(exerciseId)) {
      console.log('📥 从对话页面跳转过来，开始检查音频和评测状态...')
      // 延迟检查，确保数据加载完成
      setTimeout(() => {
        this.checkHasAudio(Number(exerciseId))
        this.checkReportStatus(Number(exerciseId))
      }, 1000)
    }
  }
  
  // 初始化悬浮按钮位置
  initFloatButtonPosition = () => {
    Taro.getSystemInfo({
      success: (res) => {
        const screenWidth = res.windowWidth
        const screenHeight = res.windowHeight
        const pixelRatio = res.pixelRatio || 1
        // 按钮大小：120rpx 转换为 px，rpx到px的转换是除以设备宽度（750rpx = screenWidth）
        const buttonSizePx = (120 * screenWidth) / 750
        const margin = 30
        this.setState({
          floatButtonX: screenWidth - buttonSizePx / 2 - margin,
          floatButtonY: screenHeight - buttonSizePx / 2 - margin
        })
      }
    })
  }
  
  // 拖动开始
  handleFloatButtonTouchStart = (e: any) => {
    this.setState({ isDragging: true })
    this.hasMoved = false // 重置移动标志
    // 记录起始触摸位置（小程序使用pageX/pageY或clientX/clientY）
    const touch = e.touches[0] || e.changedTouches[0]
    this.startX = touch.clientX || touch.pageX || 0
    this.startY = touch.clientY || touch.pageY || 0
    this.buttonStartX = this.state.floatButtonX
    this.buttonStartY = this.state.floatButtonY
  }
  
  // 拖动中
  handleFloatButtonTouchMove = (e: any) => {
    if (!this.state.isDragging) return
    
    const touch = e.touches[0] || e.changedTouches[0]
    const currentX = touch.clientX || touch.pageX || 0
    const currentY = touch.clientY || touch.pageY || 0
    const deltaX = currentX - this.startX
    const deltaY = currentY - this.startY
    
    // 如果移动距离超过阈值，标记为已移动
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      this.hasMoved = true
    }
    
    // 计算新位置
    let newX = this.buttonStartX + deltaX
    let newY = this.buttonStartY + deltaY
    
    // 获取屏幕尺寸
    Taro.getSystemInfo({
      success: (res) => {
        const screenWidth = res.windowWidth
        const screenHeight = res.windowHeight
        const buttonSizePx = (120 * screenWidth) / 750
        const margin = 15
        
        // 限制在屏幕范围内
        newX = Math.max(buttonSizePx / 2 + margin, Math.min(screenWidth - buttonSizePx / 2 - margin, newX))
        newY = Math.max(buttonSizePx / 2 + margin, Math.min(screenHeight - buttonSizePx / 2 - margin, newY))
        
        this.setState({
          floatButtonX: newX,
          floatButtonY: newY
        })
      }
    })
  }
  
  // 拖动结束
  handleFloatButtonTouchEnd = () => {
    this.setState({ isDragging: false })
    
    // 获取屏幕尺寸，将按钮吸附到最近的边缘
    Taro.getSystemInfo({
      success: (res) => {
        const screenWidth = res.windowWidth
        const screenHeight = res.windowHeight
        const buttonSizePx = (120 * screenWidth) / 750
        const margin = 15
        const centerX = screenWidth / 2
        const { floatButtonX, floatButtonY } = this.state
        
        // 判断距离左边缘还是右边缘更近
        let newX = floatButtonX
        if (floatButtonX < centerX) {
          // 吸附到左边缘
          newX = buttonSizePx / 2 + margin
        } else {
          // 吸附到右边缘
          newX = screenWidth - buttonSizePx / 2 - margin
        }
        
        // 限制Y坐标在屏幕范围内
        let newY = Math.max(buttonSizePx / 2 + margin, Math.min(screenHeight - buttonSizePx / 2 - margin, floatButtonY))
        
        this.setState({
          floatButtonX: newX,
          floatButtonY: newY
        })
      }
    })
  }
  
  // 点击悬浮按钮 - 跳转到自由对话练习页面
  handleFloatButtonClick = () => {
    // 如果发生了拖动，不触发点击事件
    if (this.hasMoved) {
      return
    }
    const { unitId } = this.state
    console.log('悬浮按钮被点击，跳转到自由对话练习页面', { unitId })
    Taro.navigateTo({
      url: `/pages/free-conversation/index?unitId=${unitId || ''}`
    })
  }

  // 查看自由练习总结（与teacher页面逻辑一致）
  handleViewFreeReport = () => {
    const studentInfo = Taro.getStorageSync('studentInfo')
    const studentId = studentInfo?.id
    
    if (!studentId) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    
    // 使用unit_id=1（自由对话固定使用unit_id=1）
    const unitId = 1
    
    console.log('查看自由练习报告:', { studentId, unitId })
    
    // 跳转到报告页面，传递 unitId 和 isFree=true 参数（与teacher页面逻辑一致）
    Taro.navigateTo({
      url: `/pages/report/index?unitId=${unitId}&studentId=${studentId}&isFree=true`
    })
  }
  
  // 拖动相关变量
  private startX = 0
  private startY = 0
  private buttonStartX = 0
  private buttonStartY = 0
  private hasMoved = false // 是否发生了拖动

  componentDidShow() {
    console.log('=== ExerciseDetail componentDidShow ===')
    
    // 如果是首次加载，跳过（因为 componentDidMount 已经加载了）
    if (this.isFirstLoad) {
      console.log('首次加载，跳过 componentDidShow 重新加载')
      this.isFirstLoad = false
      return
    }
    
    // 从对话页面返回后，重新加载数据以刷新完成状态
    const { unitId, exerciseId } = this.state
    console.log('从对话页面返回，重新加载数据以刷新完成状态')
    console.log('unitId:', unitId, 'exerciseId:', exerciseId)
    
    if (unitId) {
      this.loadExerciseData(unitId, exerciseId || '')
    }
  }

  loadExerciseData = async (unitId: string, exerciseId: string) => {
    try {
      this.setState({ loading: true })
      
      const unitIdNum = Number(unitId)
      console.log('=== 开始加载练习数据 ===')
      console.log('当前 unitId:', unitIdNum)
      
      // 1. 获取单元详情
      const unitResponse = await unitAPI.getUnitDetail(unitIdNum)
      const unitData = unitResponse.data || unitResponse.result
      console.log('✓ 单元详情获取成功:', unitData)
      
      // 2. 获取该单元的练习列表（严格按 unit_id 过滤）
      console.log(`正在获取 unit_id=${unitIdNum} 的练习列表...`)
      const exercisesResponse = await exerciseAPI.getExerciseList(unitIdNum)
      const exercises = (exercisesResponse.data || exercisesResponse.result) as unknown as any[]
      console.log(`✓ 练习列表获取成功，共 ${exercises?.length || 0} 个练习`)
      
      // 3. 验证所有练习都属于当前 unit
      if (exercises && exercises.length > 0) {
        console.log('=== 练习数据详情 ===')
        exercises.forEach((ex, index) => {
          console.log(`练习 ${index + 1}:`, {
            id: ex.id,
            title: ex.title || ex.name,
            unit_id: ex.unit_id,
            属于当前unit: ex.unit_id === unitIdNum ? '✅ 是' : '❌ 否'
          })
        })
        
        const invalidExercises = exercises.filter(ex => ex.unit_id && ex.unit_id !== unitIdNum)
        if (invalidExercises.length > 0) {
          console.error('⚠️ 警告：发现不属于当前 unit 的练习:', invalidExercises)
          console.error('这些练习的 unit_id 与当前 unit_id 不匹配！')
        }
        
        // 只保留属于当前 unit 的练习
        const validExercises = exercises.filter(ex => !ex.unit_id || ex.unit_id === unitIdNum)
        console.log(`✓ 验证通过，${validExercises.length} 个练习属于 unit_id=${unitIdNum}`)
        
        // 按 ID 从小到大排序（在最开始就排序）
        validExercises.sort((a, b) => a.id - b.id)
        console.log('✓ 练习数据按ID升序排序完成')
        console.log('=== 验证完成 ===\n')
        
        // 4. 检查每个练习是否完成（是否有音频记录）
        console.log('=== 检查练习完成状态 ===')
        const { audioAPI } = await import('../../utils/api_v2')
        const studentInfo = Taro.getStorageSync('studentInfo')
        const studentId = studentInfo?.id
        
        const exercisesWithStatus = await Promise.all(
          validExercises.map(async (exercise) => {
            try {
              // 查询该练习是否有音频记录
              const audioResponse = await audioAPI.getAudioList({
                student_id: studentId,
                exercise_id: exercise.id
              })
              const audioList = audioResponse.data || audioResponse.result
              const isCompleted = audioList && Array.isArray(audioList) && audioList.length > 0
              
              console.log(`练习 ${exercise.id}:`, isCompleted ? '✅ 已完成' : '⭕ 未完成')
              
              return {
                ...exercise,
                isCompleted
              }
            } catch (error) {
              console.error(`检查练习 ${exercise.id} 状态失败:`, error)
              return {
                ...exercise,
                isCompleted: false
              }
            }
          })
        )
        console.log('=== 完成状态检查完毕 ===\n')
        
        // 选择当前练习的逻辑
        let currentExercise
        if (exerciseId) {
          // 如果指定了 exerciseId，找到对应的练习
          currentExercise = exercisesWithStatus.find(ex => ex.id === Number(exerciseId)) || exercisesWithStatus[0]
        } else {
          // 否则，优先选择第一个未完成的练习
          const firstIncomplete = exercisesWithStatus.find(ex => !ex.isCompleted)
          if (firstIncomplete) {
            currentExercise = firstIncomplete
            console.log('✓ 选择第一个未完成的练习:', firstIncomplete.title || firstIncomplete.name)
          } else {
            // 如果全部已完成，选择第一个练习
            currentExercise = exercisesWithStatus[0]
            console.log('✓ 全部练习已完成，选择第一个练习:', currentExercise?.title || currentExercise?.name)
          }
        }
        
        console.log('✓ 当前练习:', currentExercise)
        console.log('=== 数据加载完成 ===')
        
        // 先设置基本数据
        this.setState({
          unitData,
          exercises: exercisesWithStatus,
          currentExercise,
          loading: false
        })
        
        // 然后加载完整的练习详情（包括词汇表）
        if (currentExercise) {
          this.loadFirstExerciseDetail(currentExercise.id)
          
          // 检查该练习是否有is_free=false的音频（用于控制"查看总结"按钮）
          if (currentExercise.isCompleted) {
            this.checkHasAudio(currentExercise.id)
            // 检查该练习的report状态（是否已生成学习建议）
            this.checkReportStatus(currentExercise.id)
          }
        }
      } else {
        console.warn(`⚠️ unit_id=${unitIdNum} 没有练习`)
        this.setState({
          unitData,
          exercises: [],
          currentExercise: null,
          loading: false
        })
        Taro.showToast({
          title: '该单元暂无练习',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('❌ 加载练习数据失败:', error)
      this.setState({ loading: false })
      Taro.showToast({
        title: '加载数据失败',
        icon: 'none'
      })
    }
  }

  // 加载第一个练习的详情
  loadFirstExerciseDetail = async (exerciseId: number) => {
    try {
      const response = await exerciseAPI.getExerciseDetail(exerciseId)
      const exerciseDetail = response.data || response.result
      console.log('✓ 首个练习详情加载成功:', exerciseDetail)
      
      // 保留 currentExercise 的 isCompleted 状态
      const currentExercise = this.state.currentExercise
      this.setState({ 
        currentExercise: {
          ...exerciseDetail,
          isCompleted: currentExercise?.isCompleted || false
        }
      })
    } catch (error) {
      console.error('加载首个练习详情失败:', error)
    }
  }

  /**
   * 检查是否有is_free=false的音频（用于控制"查看总结"按钮是否可用）
   */
  checkHasAudio = async (exerciseId: number) => {
    try {
      console.log('🔍 检查练习', exerciseId, '是否有is_free=false的音频...')
      
      const studentInfo = Taro.getStorageSync('studentInfo')
      const studentId = studentInfo?.id
      
      if (!studentId) {
        console.log('⚠️ 未获取到学生ID')
        this.setState({ hasAudio: false })
        return
      }

      // 检查audio列表（is_free=false）
      const { audioAPI } = await import('../../utils/api_v2')
      const audioListResult = await audioAPI.getAudioList({
        student_id: studentId,
        exercise_id: exerciseId
      })

      let audios: any[] = []
      if (audioListResult.success) {
        if (Array.isArray(audioListResult.data)) {
          audios = audioListResult.data.filter((audio: any) => audio.is_free === false)
        } else if (Array.isArray(audioListResult.result)) {
          audios = audioListResult.result.filter((audio: any) => audio.is_free === false)
        } else if (audioListResult.data?.audios) {
          audios = audioListResult.data.audios.filter((audio: any) => audio.is_free === false)
        } else if (audioListResult.result?.audios) {
          audios = audioListResult.result.audios.filter((audio: any) => audio.is_free === false)
        }
      }

      const hasAudio = audios.length > 0
      console.log(`📊 音频检查结果: ${hasAudio ? '✅ 有音频' : '❌ 无音频'} (共 ${audios.length} 个is_free=false的音频)`)
      
      this.setState({ hasAudio })
    } catch (error) {
      console.error('检查音频失败:', error)
      this.setState({ hasAudio: false })
    }
  }

  /**
   * 检查评测状态（report.content 和所有 audio.evaluation）
   * - 如果没有report或audio：empty
   * - 如果有report但content为空，或audio的evaluation有空值：generating
   * - 如果有report且content有值，且所有audio的evaluation都有值：completed
   */
  checkReportStatus = async (exerciseId: number) => {
    try {
      console.log('🔍 检查练习', exerciseId, '的评测状态...')
      
      const studentInfo = Taro.getStorageSync('studentInfo')
      const studentId = studentInfo?.id
      
      if (!studentId) {
        console.log('⚠️ 未获取到学生ID')
        this.setState({ reportStatus: 'unknown' })
        return
      }

      // 1. 检查report状态
      const reportListResult = await reportAPI.getReportList(exerciseId)
      
      let reports: any[] = []
      if (reportListResult.success) {
        // API可能返回数组或包含reports的对象
        if (Array.isArray(reportListResult.data)) {
          reports = reportListResult.data
        } else if (Array.isArray(reportListResult.result)) {
          reports = reportListResult.result
        } else if (reportListResult.data?.reports) {
          reports = reportListResult.data.reports
        } else if (reportListResult.result?.reports) {
          reports = reportListResult.result.reports
        }
      }

      // 2. 检查audio列表（is_free=false）
      const { audioAPI } = await import('../../utils/api_v2')
      const audioListResult = await audioAPI.getAudioList({
        student_id: studentId,
        exercise_id: exerciseId
      })

      let audios: any[] = []
      if (audioListResult.success) {
        if (Array.isArray(audioListResult.data)) {
          audios = audioListResult.data.filter((audio: any) => audio.is_free === false)
        } else if (Array.isArray(audioListResult.result)) {
          audios = audioListResult.result.filter((audio: any) => audio.is_free === false)
        } else if (audioListResult.data?.audios) {
          audios = audioListResult.data.audios.filter((audio: any) => audio.is_free === false)
        } else if (audioListResult.result?.audios) {
          audios = audioListResult.result.audios.filter((audio: any) => audio.is_free === false)
        }
      }

      console.log(`📊 评测状态检查结果:`)
      console.log(`  - report数量: ${reports.length}`)
      console.log(`  - audio数量: ${audios.length}`)

      // 如果没有report或audio，状态为empty
      if (reports.length === 0 || audios.length === 0) {
        console.log('📝 没有report或audio记录，状态：empty')
        this.setState({ reportStatus: 'empty' })
        return
      }

      const report = reports[0]
      const hasReportContent = report.content && report.content.trim().length > 0
      
      // 检查所有audio的evaluation是否都不为空
      const allAudiosHaveEvaluation = audios.every((audio: any) => {
        return audio.evaluation && audio.evaluation.trim().length > 0
      })

      console.log(`  - report.content有值: ${hasReportContent}`)
      console.log(`  - 所有audio.evaluation都有值: ${allAudiosHaveEvaluation}`)

      // 如果report.content不为空且所有audio的evaluation都不为空，状态为completed
      if (hasReportContent && allAudiosHaveEvaluation) {
        console.log('✅ 评测完成，状态：completed')
        this.setState({ reportStatus: 'completed' })
        this.stopPolling()
      } else {
        // 否则状态为generating，开始轮询
        console.log('⏳ 评测进行中，状态：generating')
        console.log(`  - report.content为空: ${!hasReportContent}`)
        console.log(`  - 有audio.evaluation为空: ${!allAudiosHaveEvaluation}`)
        this.setState({ reportStatus: 'generating' })
        // 开始轮询
        this.startPollingReportStatus(exerciseId, studentId)
      }
    } catch (error) {
      console.error('检查评测状态失败:', error)
      this.setState({ reportStatus: 'unknown' })
    }
  }

  /**
   * 轮询检查评测状态（report.content 和所有 audio.evaluation）
   * 每5秒检查一次，最多检查40次（200秒）
   */
  pollTimer: any = null
  pollCount: number = 0
  maxPollCount: number = 40

  startPollingReportStatus = (exerciseId: number, studentId: number) => {
    const { isPolling } = this.state
    
    if (isPolling) {
      console.log('⚠️  已在轮询中，跳过')
      return
    }
    
    console.log('🔄 开始轮询评测状态...')
    this.setState({ isPolling: true })
    this.pollCount = 0
    
    this.pollTimer = setInterval(async () => {
      this.pollCount++
      console.log(`🔄 轮询第 ${this.pollCount}/${this.maxPollCount} 次...`)
      
      try {
        // 1. 检查report状态
        const reportListResult = await reportAPI.getReportList(exerciseId)
        
        let reports: any[] = []
        if (reportListResult.success) {
          if (Array.isArray(reportListResult.data)) {
            reports = reportListResult.data
          } else if (Array.isArray(reportListResult.result)) {
            reports = reportListResult.result
          } else if (reportListResult.data?.reports) {
            reports = reportListResult.data.reports
          } else if (reportListResult.result?.reports) {
            reports = reportListResult.result.reports
          }
        }

        // 2. 检查audio列表（is_free=false）
        const { audioAPI } = await import('../../utils/api_v2')
        const audioListResult = await audioAPI.getAudioList({
          student_id: studentId,
          exercise_id: exerciseId
        })

        let audios: any[] = []
        if (audioListResult.success) {
          if (Array.isArray(audioListResult.data)) {
            audios = audioListResult.data.filter((audio: any) => audio.is_free === false)
          } else if (Array.isArray(audioListResult.result)) {
            audios = audioListResult.result.filter((audio: any) => audio.is_free === false)
          } else if (audioListResult.data?.audios) {
            audios = audioListResult.data.audios.filter((audio: any) => audio.is_free === false)
          } else if (audioListResult.result?.audios) {
            audios = audioListResult.result.audios.filter((audio: any) => audio.is_free === false)
          }
        }

        // 3. 检查是否都完成
        if (reports.length > 0 && audios.length > 0) {
          const report = reports[0]
          const hasReportContent = report.content && report.content.trim().length > 0
          
          // 检查所有audio的evaluation是否都不为空
          const allAudiosHaveEvaluation = audios.every((audio: any) => {
            return audio.evaluation && audio.evaluation.trim().length > 0
          })

          console.log(`  - report.content有值: ${hasReportContent}`)
          console.log(`  - 所有audio.evaluation都有值: ${allAudiosHaveEvaluation}`)

          // 如果report.content不为空且所有audio的evaluation都不为空，评测完成
          if (hasReportContent && allAudiosHaveEvaluation) {
            console.log('✅ 轮询成功：评测已完成！')
            this.setState({ reportStatus: 'completed', isPolling: false })
            this.stopPolling()
            
            // 提示用户
            Taro.showToast({
              title: '评测完成',
              icon: 'success',
              duration: 2000
            })
            return
          }
        }
        
        // 达到最大轮询次数
        if (this.pollCount >= this.maxPollCount) {
          console.log('⏰ 轮询超时，停止轮询')
          this.setState({ reportStatus: 'generating', isPolling: false })
          this.stopPolling()
        }
      } catch (error) {
        console.error('轮询失败:', error)
      }
    }, 5000) // 每5秒检查一次
  }

  stopPolling = () => {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
      this.pollCount = 0
    }
  }

  componentWillUnmount() {
    // 组件卸载时清除轮询
    this.stopPolling()
  }

  handleExerciseClick = async (exercise: any) => {
    const { unitId } = this.state
    const unitIdNum = Number(unitId)
    
    // 验证选择的练习是否属于当前 unit
    if (exercise.unit_id && exercise.unit_id !== unitIdNum) {
      console.error(`⚠️ 错误：尝试选择不属于当前 unit 的练习！`)
      console.error(`当前 unit_id: ${unitIdNum}, 练习的 unit_id: ${exercise.unit_id}`)
      Taro.showToast({
        title: '练习不属于当前单元',
        icon: 'none'
      })
      return
    }
    
    console.log('✓ 切换到练习:', exercise.name || exercise.title, `(id: ${exercise.id})`)
    console.log('练习完成状态:', exercise.isCompleted ? '✅ 已完成' : '⭕ 未完成')
    
    // 获取完整的练习详情（包括词汇表）
    try {
      const response = await exerciseAPI.getExerciseDetail(exercise.id)
      const exerciseDetail = response.data || response.result
      console.log('练习详情数据:', exerciseDetail)
      
      // 保留 exercise 的 isCompleted 状态
      this.setState({ 
        currentExercise: {
          ...exerciseDetail,
          isCompleted: exercise.isCompleted || false
        }
      })
    } catch (error) {
      console.error('获取练习详情失败:', error)
      // 降级使用列表数据（已包含 isCompleted）
      this.setState({ currentExercise: exercise })
    }
  }

  handleStartExercise = async () => {
    const { unitId, currentExercise } = this.state
    if (!currentExercise) return
    
    try {
      // 如果是重新练习（已完成状态），先删除旧的音频记录
      if (currentExercise.isCompleted) {
        console.log('=== 重新练习：删除旧音频记录 ===')
        
        // 获取学生信息
        const studentInfo = Taro.getStorageSync('studentInfo')
        const studentId = studentInfo?.id
        
        if (studentId && currentExercise.id) {
          Taro.showLoading({ title: '清理旧数据...' })
          
          try {
            console.log('学生ID:', studentId)
            console.log('练习ID:', currentExercise.id)
            console.log('is_free: false (结构化练习)')
            
            // 使用新接口删除该学生在该练习下的所有音频
            const deleteResult = await audioAPI.deleteAudioByStudentExercise(
              studentId,
              currentExercise.id,
              false  // is_free: false = 结构化练习，true = 自由对话
            )
            
            if (deleteResult.success) {
              console.log('✅ 旧音频记录删除成功')
            } else {
              console.log('⚠️  删除旧音频失败，但继续执行:', deleteResult.message)
            }
          } catch (deleteError) {
            console.error('删除旧音频失败:', deleteError)
            console.log('⚠️  忽略删除错误，继续执行')
          }
        }
        
        console.log('=================================\n')
      }
      
      Taro.showLoading({ title: '加载练习中...' })
      
      // 调用练习详情接口获取完整数据
      const response = await exerciseAPI.getExerciseDetail(currentExercise.id)
      const exerciseDetail = response.data || response.result
      
      console.log('练习详情:', exerciseDetail)
      
      Taro.hideLoading()
      
      // 将练习详情数据存储到本地，供对话页面使用
      Taro.setStorageSync('currentExerciseDetail', exerciseDetail)
      
      // 跳转到对话页面
      Taro.navigateTo({
        url: `/pages/conversation/index?unitId=${unitId}&exerciseId=${currentExercise.id}`
      })
    } catch (error) {
      console.error('获取练习详情失败:', error)
      Taro.hideLoading()
      Taro.showToast({
        title: '加载练习失败',
        icon: 'none'
      })
    }
  }

  handleViewSummary = () => {
    const { currentExercise } = this.state
    
    if (!currentExercise || !currentExercise.id) {
      Taro.showToast({
        title: '练习信息不完整',
        icon: 'none'
      })
      return
    }
    
    // 获取学生ID
    const studentInfo = Taro.getStorageSync('studentInfo')
    const studentId = studentInfo?.id
    
    if (!studentId) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    
    console.log('查看总结报告:', { studentId, exerciseId: currentExercise.id })
    
    // 跳转到报告页面（与teacher页面逻辑一致）
    Taro.navigateTo({
      url: `/pages/report/index?exerciseId=${currentExercise.id}&studentId=${studentId}`
    })
  }

  handleBack = () => {
    Taro.navigateBack()
  }

  // 处理自由练习按钮点击
  handleFreePractice = () => {
    const { unitId } = this.state
    
    console.log('点击自由练习', { unitId })
    
    if (!unitId) {
      Taro.showToast({
        title: '缺少单元信息',
        icon: 'none'
      })
      return
    }
    
    // 跳转到对话页面，传递自由对话标识
    Taro.navigateTo({
      url: `/pages/conversation/index?unitId=${unitId}&mode=free`
    })
  }

  render() {
    const { unitId, exerciseId, currentExercise, unitData, exercises, loading } = this.state
    
    if (loading) {
      return (
        <View className='loading-page'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      )
    }

    if (!unitData || !currentExercise) {
      return (
        <View className='loading-page'>
          <Text className='loading-text'>暂无数据</Text>
        </View>
      )
    }

    // 计算完成进度 - 基于实际数据
    const completedCount = exercises.filter(ex => ex.isCompleted).length
    const totalCount = exercises.length
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    
    console.log('=== 单元进度统计 ===')
    console.log('总练习数:', totalCount)
    console.log('已完成数:', completedCount)
    console.log('完成进度:', progress + '%')
    console.log('===================')

    return (
      <View className='exercise-detail-container'>
      <ScrollView className='exercise-detail-page' scrollY>
        <View className='page-content'>
        {/* 顶部导航栏 */}
        <View className='header'>
          <View className='header-content'>
            <View className='header-left'>
              <AtIcon value='list' size='32' color='white' />
              <Text className='header-title'>练习详情</Text>
            </View>
            <View className='header-right'>
              <SafeAtButton 
                type='secondary' 
                size='small'
                onClick={this.handleViewFreeReport}
                className='free-report-btn'
              >
                自由对话练习总结
              </SafeAtButton>
              <Text className='user-name'>{this.state.studentName}</Text>
            </View>
          </View>
        </View>

        {/* 单元信息 */}
        <View className='chapter-info-section'>
          <SafeAtCard className='chapter-info-card'>
            <View className='chapter-info-content'>
              <Text className='chapter-title'>{unitData.title || unitData.name}</Text>
              <Text className='chapter-description'>{unitData.description || '暂无描述'}</Text>
              
              <View className='chapter-progress'>
                <View className='progress-header'>
                  <Text className='progress-label'>单元进度</Text>
                  {/* <Text className='progress-percentage'>{progress}%</Text> */}
                </View>
                <SafeAtProgress 
                  percent={progress} 
                  strokeWidth={8}
                  color='#52c41a'
                  className='progress-bar'
                />
                <Text className='progress-text'>
                  已完成 {completedCount} / {totalCount} 个练习
                </Text>
              </View>
            </View>
          </SafeAtCard>
        </View>

        {/* 当前练习详情 */}
        <View className='current-exercise-section'>
          <SafeAtCard title='当前练习' className='current-exercise-card'>
            <View className='exercise-content'>
              {/* 练习图片 */}
              {currentExercise.image && (
                <View className='exercise-image-container'>
                  <TaroImage 
                    src={currentExercise.image}
                    className='exercise-image'
                    mode='widthFix'
                  />
                </View>
              )}
              
              <View className='exercise-header'>
                <Text className='exercise-title'>{currentExercise.name || currentExercise.title}</Text>
                <SafeAtTag 
                  type={currentExercise.isCompleted ? 'primary' : 'default'}
                  size='small'
                >
                  {currentExercise.isCompleted ? '✓ 已完成' : '未完成'}
                </SafeAtTag>
              </View>
              
              <Text className='exercise-scenario'>{currentExercise.description || '暂无描述'}</Text>
              
              {/* 情景图片 */}
              {currentExercise.scenario_image && (
                <View className='scenario-image-container'>
                  <TaroImage 
                    src={currentExercise.scenario_image}
                    className='scenario-image'
                    mode='widthFix'
                  />
                </View>
              )}
              
              {/* 词汇表 */}
              {/* {currentExercise.vocabs && Array.isArray(currentExercise.vocabs) && currentExercise.vocabs.length > 0 && (
                <View className='vocabs-section'>
                  <Text className='vocabs-title'>📚 关键词汇</Text>
                  <View className='vocabs-list'>
                    {currentExercise.vocabs.map((vocab: string, index: number) => (
                      <SafeAtTag key={index} type='primary' size='small' className='vocab-tag'>
                        {vocab}
                      </SafeAtTag>
                    ))}
                  </View>
                </View>
              )} */}
              
              <View className='exercise-actions'>
                {currentExercise.isCompleted ? (
                  // 已完成状态：显示"查看总结"和"重新练习"按钮
                  <>
                    <View className='action-btn-wrapper'>
                      <SafeAtButton 
                        type='primary' 
                        onClick={this.handleViewSummary}
                        className='action-btn'
                      >
                        查看总结
                      </SafeAtButton>
                    </View>
                    <SafeAtButton 
                      type='secondary' 
                      onClick={this.handleStartExercise}
                      className='action-btn secondary-btn'
                    >
                      重新练习
                    </SafeAtButton>
                  </>
                ) : (
                  // 未完成状态：只显示"开始练习"按钮
                  <SafeAtButton
                    type='primary'
                    onClick={this.handleStartExercise}
                    className='action-btn'
                  >
                    开始练习
                  </SafeAtButton>
                )}
              </View>
            </View>
          </SafeAtCard>
        </View>

        {/* 练习列表 */}
        <View className='exercises-section'>
          <SafeAtCard title='选择练习' className='exercises-card'>
            <View className='exercises-list'>
              {exercises.length > 0 ? exercises.map((exercise, index) => (
                <View 
                  key={exercise.id}
                  className={`exercise-item ${exercise.id === currentExercise.id ? 'active' : ''}`}
                  onClick={() => this.handleExerciseClick(exercise)}
                >
                  <View className='exercise-item-content'>
                    <View className='exercise-item-header'>
                      <Text className='exercise-item-title'>{exercise.name || exercise.title}</Text>
                      <SafeAtTag 
                        type={exercise.isCompleted ? 'primary' : 'default'}
                        size='small'
                      >
                        {exercise.isCompleted ? '✓' : '○'}
                      </SafeAtTag>
                    </View>
                    <Text className='exercise-item-scenario'>{exercise.description || '暂无描述'}</Text>
                  </View>
                </View>
              )) : (
                <View className='empty-exercises'>
                  <Text>暂无练习</Text>
                </View>
              )}
            </View>
          </SafeAtCard>
        </View>

        {/* 学习建议 */}
        {/* <View className='tips-section'>
          <SafeAtCard title='学习建议' className='tips-card'>
            <View className='tips-content'>
              <View className='tip-item'>
                <Text className='tip-icon'>💡</Text>
                <Text className='tip-text'>建议先完成基础练习，再进行情景对话</Text>
              </View>
              <View className='tip-item'>
                <Text className='tip-icon'>🎯</Text>
                <Text className='tip-text'>每个练习都有不同的难度，循序渐进</Text>
              </View>
              <View className='tip-item'>
                <Text className='tip-icon'>📚</Text>
                <Text className='tip-text'>可以重复练习，提高口语流利度</Text>
              </View>
            </View>
          </SafeAtCard>
        </View> */}
        </View>
      </ScrollView>
      
      {/* 可拖动的悬浮按钮 */}
      <View
        className={`float-button ${this.state.isDragging ? 'dragging' : ''}`}
        style={{
          left: `${this.state.floatButtonX}px`,
          top: `${this.state.floatButtonY}px`,
          transform: `translate(-50%, -50%)`
        }}
        onTouchStart={this.handleFloatButtonTouchStart}
        onTouchMove={this.handleFloatButtonTouchMove}
        onTouchEnd={this.handleFloatButtonTouchEnd}
        onClick={this.handleFloatButtonClick}
      >
        <TaroImage
          src='https://t.aix101.com/udata/100728/png/32036005d1f6ed59803ba3e13c80993e_20251105112941.png'
          className='float-button-image'
          mode='aspectFill'
        />
      </View>
      </View>
    )
  }
}

