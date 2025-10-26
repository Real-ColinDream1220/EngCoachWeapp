import { Component } from 'react'
import { View, Text, Image, ScrollView, Picker } from '@tarojs/components'
import { AtButton, AtCard, AtProgress, AtForm, AtInput, AtDivider, AtList, AtListItem, AtToast, AtAccordion, AtActivityIndicator } from 'taro-ui'
import { AtIcon } from 'taro-ui'

// Safety check for taro-ui components
const SafeAtButton = AtButton || (() => <View>Button not available</View>)
const SafeAtCard = AtCard || (() => <View>Card not available</View>)
const SafeAtProgress = AtProgress || (() => <View>Progress not available</View>)
const SafeAtList = AtList || (() => <View>List not available</View>)
const SafeAtListItem = AtListItem || (() => <View>ListItem not available</View>)
const SafeAtToast = AtToast || (() => <View>Toast not available</View>)
const SafeAtAccordion = AtAccordion || (() => <View>Accordion not available</View>)
const SafeAtActivityIndicator = AtActivityIndicator || (() => <View>Loading not available</View>)

// 导入自定义图标组件
import Icon from '../../components/Icon'
import Taro from '@tarojs/taro'
import './index.scss'

// 导入API服务
import { gradeAPI } from '../../utils/api'
import { textbookAPI, knowledgeAPI, unitAPI, exerciseAPI } from '../../utils/api_v2'

// 选项信息接口
interface OptionInfo {
  label: string
  value: any
  disabled?: boolean
}

// 知识点接口
interface KnowledgePoint {
  id: number
  name: string
  catalogId: number
  kpointId: number
}

// 模拟章节数据
const mockChapters = [
  {
    id: 'chapter1',
    title: '第一章：日常问候与介绍',
    description: '学习如何用英语进行日常问候和自我介绍',
    progress: 60,
    exercises: 5,
    completed: 3,
    image: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=English%20conversation%20greeting%20people%20casual%20chat%20illustration&sign=a54f2fc0387f888ae74e04bd4b50d13d'
  }
  // {
  //   id: 'chapter2',
  //   title: '第二章：谈论家庭与朋友',
  //   description: '练习描述家庭成员和朋友的情况',
  //   progress: 40,
  //   exercises: 4,
  //   completed: 1,
  //   image: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=Family%20members%20friends%20conversation%20illustration&sign=6cb5fa6025fd393bfd9f3d823c15d8d6'
  // },
  // {
  //   id: 'chapter3',
  //   title: '第三章：学校生活',
  //   description: '学习关于学校生活和学习的英语表达',
  //   progress: 20,
  //   exercises: 6,
  //   completed: 1,
  //   image: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=School%20life%20classroom%20study%20conversation%20illustration&sign=2e9fb9ca71f5c16d74a89f8a530be665'
  // },
  // {
  //   id: 'chapter4',
  //   title: '第四章：兴趣与爱好',
  //   description: '练习谈论个人兴趣爱好的英语表达',
  //   progress: 0,
  //   exercises: 5,
  //   completed: 0,
  //   image: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=Hobbies%20interests%20conversation%20illustration&sign=ccee13e76883cd91b9f8fe209d853ee8'
  // },
  // {
  //   id: 'chapter5',
  //   title: '第五章：购物与消费',
  //   description: '学习购物场景中的英语对话',
  //   progress: 0,
  //   exercises: 4,
  //   completed: 0,
  //   image: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=Shopping%20conversation%20store%20mall%20illustration&sign=f6b86b635ffbc7cdaf8878081db98e50'
  // }
]

// 章节练习数据
const mockExercises = {
  chapter1: [
    { id: 'ex1-1', title: '基础问候', isCompleted: true },
    { id: 'ex1-2', title: '自我介绍', isCompleted: true },
    { id: 'ex1-3', title: '介绍他人', isCompleted: true },
    { id: 'ex1-4', title: '道别用语', isCompleted: false },
    { id: 'ex1-5', title: '情景对话练习', isCompleted: false }
  ]
  // chapter2: [
  //   { id: 'ex2-1', title: '介绍家庭', isCompleted: true },
  //   { id: 'ex2-2', title: '描述家人', isCompleted: false },
  //   { id: 'ex2-3', title: '谈论朋友', isCompleted: false },
  //   { id: 'ex2-4', title: '家庭活动', isCompleted: false }
  // ],
  // chapter3: [
  //   { id: 'ex3-1', title: '学校设施', isCompleted: true },
  //   { id: 'ex3-2', title: '课程描述', isCompleted: false },
  //   { id: 'ex3-3', title: '学习习惯', isCompleted: false },
  //   { id: 'ex3-4', title: '师生交流', isCompleted: false },
  //   { id: 'ex3-5', title: '校园活动', isCompleted: false },
  //   { id: 'ex3-6', title: '考试与评价', isCompleted: false }
  // ],
  // chapter4: [
  //   { id: 'ex4-1', title: '兴趣爱好表达', isCompleted: false },
  //   { id: 'ex4-2', title: '体育活动', isCompleted: false },
  //   { id: 'ex4-3', title: '音乐与艺术', isCompleted: false },
  //   { id: 'ex4-4', title: '阅读与电影', isCompleted: false },
  //   { id: 'ex4-5', title: '业余时间', isCompleted: false }
  // ],
  // chapter5: [
  //   { id: 'ex5-1', title: '购物需求', isCompleted: false },
  //   { id: 'ex5-2', title: '询问价格', isCompleted: false },
  //   { id: 'ex5-3', title: '讨价还价', isCompleted: false },
  //   { id: 'ex5-4', title: '退换商品', isCompleted: false }
  // ]
}

interface FormState {
  grade: OptionInfo | null
  textbookVersion: OptionInfo | null
  textbook: OptionInfo | null
  catalog: OptionInfo | null
  section: OptionInfo | null
}

export default class ChapterList extends Component {
  state = {
    // 表单数据 - 使用硬编码的默认值
    formData: {
      grade: { label: '一年级', value: 3 }, // course_id = 3
      textbookVersion: { label: '加载中...', value: 571 }, // version_id = 571
      textbook: { label: '加载中...', value: 2931 }, // textbook_id = 2931
      catalog: null, // 将从接口获取第一个章节
      section: null
    } as FormState,
    
    // 选项数据
    gradeOptions: [] as OptionInfo[],
    textbookVersionOptions: [] as OptionInfo[],
    textbookOptions: [] as OptionInfo[],
    catalogOptions: [] as OptionInfo[],
    sectionOptions: [] as OptionInfo[],
    
    // 知识点数据
    selectedKnowledgePoints: [] as KnowledgePoint[],
    catalogKpointGroupedData: {} as {[key: number]: KnowledgePoint[]},
    
    // 单元数据（用于展示课程章节卡片）
    units: [] as any[],
    
    // UI状态
    hasFiltered: false,
    showToast: false,
    toastText: '',
    showSuccessModal: false,
    isAccordionOpen: true,
    loading: false,
    knowledgeSectionCollapsed: false,
    chapterCollapsedStates: {} as Record<number, boolean>,
    studentName: '学生' // 学生姓名
  }

  // 标记是否是首次加载
  private isFirstLoad = true

  // 组件挂载时初始化数据
  componentDidMount() {
    console.log('组件挂载，开始初始化数据...')
    
    // 检查登录状态
    const isLoggedIn = Taro.getStorageSync('isLoggedIn')
    if (!isLoggedIn) {
      console.log('未登录，跳转到登录页')
      Taro.reLaunch({
        url: '/pages/login/index'
      })
      return
    }
    
    // 读取学生信息
    const studentInfo = Taro.getStorageSync('studentInfo')
    if (studentInfo && studentInfo.name) {
      console.log('学生信息:', studentInfo)
      this.setState({ studentName: studentInfo.name })
    }
    
    // 设置静态token
    const staticToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBZG1MdiI6MCwiQXBwaWQiOiIiLCJBdXRob3JpdHlJZCI6IiIsIkJpZCI6MSwiSUQiOjY5MCwiTWFwQ2xhaW1zIjpudWxsLCJSb2xlIjoiUCIsIlN0YWZmSWQiOjAsIlN1YiI6IiIsIlRlc3RlciI6MCwiVVVJRCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsIlVpZEhhc2giOiIxMDA2OTAiLCJleHAiOjE3NjMwMjkxMzAsIm9yaWdfaWF0IjoxNzYwNDM3MTMwfQ.Qzo74V7KHk1KfRre3RFPVW1QvSuqYaCa5WlALvpVCnw'
    
    try {
      Taro.setStorageSync('token', staticToken)
      console.log('已设置静态token')
      
      // 验证token是否设置成功
      const savedToken = Taro.getStorageSync('token')
      console.log('验证token设置:', savedToken ? savedToken.substring(0, 20) + '...' : '设置失败')
    } catch (error) {
      console.error('设置token失败:', error)
    }
    
    this.initializeData()
  }

  componentDidShow() {
    console.log('=== ChapterList componentDidShow ===')
    
    // 如果是首次加载，跳过（因为 componentDidMount 已经加载了）
    if (this.isFirstLoad) {
      console.log('首次加载，跳过 componentDidShow 重新加载')
      this.isFirstLoad = false
      return
    }
    
    // 从练习详情页返回后，如果已经筛选过课程，重新加载单元数据以刷新进度
    const { hasFiltered } = this.state
    console.log('从练习详情页返回，hasFiltered:', hasFiltered)
    
    if (hasFiltered) {
      console.log('重新加载单元数据以刷新进度')
      this.fetchUnits(1)
    }
  }

  // 初始化数据
  initializeData = async () => {
    console.log('开始初始化数据...')
    try {
      this.setState({ loading: true })
      
      // 硬编码的值
      const COURSE_ID = 3
      const VERSION_ID = 571
      const TEXTBOOK_ID = 2931
      
      console.log('使用硬编码参数初始化:', { COURSE_ID, VERSION_ID, TEXTBOOK_ID })
      
      // 1. 获取教材版本列表
      console.log('1. 获取教材版本列表...')
      const versionsResponse = await textbookAPI.getTextbookVersions(COURSE_ID)
      const versions = versionsResponse.data?.versions || versionsResponse.result?.versions
      if (versions && versions.length > 0) {
        const versionOptions = versions.map((v: any) => ({
          label: v.name,
          value: v.id
        }))
        this.setState({ textbookVersionOptions: versionOptions })
        
        // 找到对应的版本并更新 formData
        const selectedVersion = versions.find((v: any) => v.id === VERSION_ID)
        if (selectedVersion) {
          const currentFormData = this.state.formData
          this.setState({
            formData: {
              ...currentFormData,
              textbookVersion: { label: selectedVersion.name, value: VERSION_ID }
            }
          })
        }
        console.log('✓ 教材版本列表获取成功')
      }
      
      // 2. 获取教材列表
      console.log('2. 获取教材列表...')
      const textbooksResponse = await textbookAPI.getTextbooks(COURSE_ID, VERSION_ID)
      const textbooks = textbooksResponse.data?.textbooks || textbooksResponse.result?.textbooks
      if (textbooks && textbooks.length > 0) {
        const textbookOptions = textbooks.map((t: any) => ({
          label: t.name,
          value: t.id
        }))
        this.setState({ textbookOptions })
        
        // 找到对应的教材并更新 formData
        const selectedTextbook = textbooks.find((t: any) => t.id === TEXTBOOK_ID)
        if (selectedTextbook) {
          const currentFormData = this.state.formData
          this.setState({
            formData: {
              ...currentFormData,
              textbook: { label: selectedTextbook.name, value: TEXTBOOK_ID }
            }
          })
        }
        console.log('✓ 教材列表获取成功')
      }
      
      // 3. 获取目录列表
      console.log('3. 获取目录列表...')
      const catalogsResponse = await textbookAPI.getCatalogs(TEXTBOOK_ID)
      const catalogs = catalogsResponse.data?.catalogs || catalogsResponse.result?.catalogs
      if (catalogs && catalogs.length > 0) {
        const catalogOptions = catalogs.map((c: any) => ({
          label: c.name,
          value: c.id
        }))
        this.setState({ catalogOptions })
        
        // 自动选择第一个章节
        const firstCatalog = catalogs[0]
        const currentFormData = this.state.formData
        this.setState({
          formData: {
            ...currentFormData,
            catalog: { label: firstCatalog.name, value: firstCatalog.id }
          }
        })
        console.log('✓ 目录列表获取成功，自动选择第一个章节:', firstCatalog.name)
        
        // 4. 获取第一个章节的知识点
        console.log('4. 获取第一个章节的知识点...')
        await this.fetchKnowledgePoints(TEXTBOOK_ID, VERSION_ID)
        console.log('✓ 知识点获取成功')
      }
      
      // 5. 获取单元列表（chapter_id 硬编码为 1）
      console.log('5. 获取单元列表，chapter_id: 1')
      await this.fetchUnits(1)
      console.log('✓ 单元列表获取成功')
      
      // 初始化节选项（静态数据）
      console.log('初始化节选项...')
      const sectionOptions = [
        { value: 'section1', label: '第一节' },
        { value: 'section2', label: '第二节' },
        { value: 'section3', label: '第三节' },
        { value: 'section4', label: '第四节' },
        { value: 'section5', label: '第五节' },
        { value: 'section6', label: '第六节' }
      ]
      this.setState({ sectionOptions })
      
      console.log('✅ 数据初始化完成')
      
    } catch (error) {
      console.error('❌ 初始化数据失败:', error)
      this.showToastMessage('初始化数据失败: ' + ((error as Error).message || '未知错误'))
    } finally {
      this.setState({ loading: false })
    }
  }

  // 获取年级数据
  fetchGrades = async () => {
    try {
      console.log('调用年级API...')
      console.log('gradeAPI对象:', gradeAPI)
      console.log('getGrades方法:', gradeAPI.getGrades)
      
      const response = await gradeAPI.getGrades()
      console.log('年级API响应:', response)
      
      if (response && response.success && response.result) {
        const options = response.result.map((grade: any) => ({ 
          label: grade.name, 
          value: grade.id 
        }))
        console.log('处理后的年级选项:', options)
        this.setState({ gradeOptions: options })
      } else if (response && response.success && response.data) {
        // 兼容不同的数据格式
        const options = response.data.map((grade: any) => ({ 
          label: grade.name, 
          value: grade.id 
        }))
        console.log('处理后的年级选项(data格式):', options)
        this.setState({ gradeOptions: options })
      } else {
        console.warn('年级API返回数据格式不正确:', response)
        // 使用备用静态数据
        this.loadFallbackGradeData()
      }
    } catch (error) {
      console.error('获取年级数据失败:', error)
      console.log('使用备用年级数据...')
      this.loadFallbackGradeData()
    }
  }

  // 加载备用年级数据
  loadFallbackGradeData = () => {
    const fallbackGrades = [
      { value: 1, label: '一年级' },
      { value: 2, label: '二年级' },
      { value: 3, label: '三年级' },
      { value: 4, label: '四年级' },
      { value: 5, label: '五年级' },
      { value: 6, label: '六年级' },
      { value: 7, label: '七年级' },
      { value: 8, label: '八年级' },
      { value: 9, label: '九年级' },
      { value: 10, label: '高一' },
      { value: 11, label: '高二' },
      { value: 12, label: '高三' }
    ]
    console.log('使用备用年级数据:', fallbackGrades)
    this.setState({ gradeOptions: fallbackGrades })
    
    // 设置默认的教材版本选项
    const fallbackVersions = [
      { value: 1, label: '人教版' },
      { value: 2, label: '沪教版' },
      { value: 3, label: '苏教版' },
      { value: 4, label: '外研版' },
      { value: 5, label: '北师大版' },
      { value: 6, label: '冀教版' },
      { value: 7, label: '粤教版' },
      { value: 8, label: '湘教版' }
    ]
    this.setState({ textbookVersionOptions: fallbackVersions })
    
    // 设置默认的教材选项
    const fallbackTextbooks = [
      { value: 1, label: '牛津上海版1年级第一学期' },
      { value: 2, label: '牛津上海版1年级第二学期' }
    ]
    this.setState({ textbookOptions: fallbackTextbooks })
    
    // 设置默认的章节选项
    const fallbackCatalogs = [
      { value: 1, label: 'Module 1： Introduction' },
      { value: 2, label: 'Module 2： My family' },
      { value: 3, label: 'Module 3： Places and activities' }
    ]
    this.setState({ catalogOptions: fallbackCatalogs })
    
    this.showToastMessage('使用本地数据')
  }

  // 获取教材版本数据
  fetchTextbookVersions = async () => {
    try {
      console.log('调用教材版本API，课程ID: 3（英语学科）')
      const response = await textbookAPI.getTextbookVersions(3) // 英语学科固定为3
      console.log('教材版本API响应:', response)
      
      const versions = response.data?.versions || response.result?.versions
      if (response && response.success && versions) {
        const options = versions.map((version: any) => ({ 
          label: version.name, 
          value: version.id 
        }))
        console.log('处理后的教材版本选项:', options)
        this.setState({ textbookVersionOptions: options })
      } else {
        console.warn('教材版本API返回数据格式不正确:', response)
        this.loadFallbackTextbookVersionData()
      }
    } catch (error) {
      console.error('获取教材版本数据失败:', error)
      console.log('使用备用教材版本数据...')
      this.loadFallbackTextbookVersionData()
    }
  }

  // 加载备用教材版本数据
  loadFallbackTextbookVersionData = () => {
    const fallbackVersions = [
      { value: 1, label: '人教版' },
      { value: 2, label: '外研版' },
      { value: 3, label: '牛津版' },
      { value: 4, label: '沪教版' },
      { value: 5, label: '苏教版' },
      { value: 6, label: '北京版' },
      { value: 7, label: '粤教版' },
      { value: 8, label: '湘教版' }
    ]
    console.log('使用备用教材版本数据:', fallbackVersions)
    this.setState({ textbookVersionOptions: fallbackVersions })
    this.showToastMessage('使用本地教材版本数据')
  }

  // 获取教材数据
  fetchTextbooks = async (versionId: number) => {
    try {
      console.log('获取教材列表，课程ID: 3（英语学科），版本ID:', versionId)
      const response = await textbookAPI.getTextbooks(3, versionId) // 英语学科固定为3
      const textbooks = response.data?.textbooks || response.result?.textbooks
      if (response.success && textbooks) {
        const options = textbooks.map((textbook: any) => ({ 
          label: textbook.name, 
          value: textbook.id 
        }))
        this.setState({ textbookOptions: options })
      }
    } catch (error) {
      console.error('获取教材数据失败:', error)
      this.showToastMessage('获取教材数据失败')
    }
  }

  // 获取章节数据
  fetchCatalog = async (textbookId: number) => {
    try {
      const response = await textbookAPI.getCatalogs(textbookId)
      const catalogs = response.data?.catalogs || response.result?.catalogs
      if (response.success && catalogs) {
        const options = catalogs.map((catalog: any) => ({ 
          label: catalog.name, 
          value: catalog.id 
        }))
        this.setState({ catalogOptions: options })
      }
    } catch (error) {
      console.error('获取章节数据失败:', error)
      this.showToastMessage('获取章节数据失败')
    }
  }

  // 获取知识点数据
  fetchKnowledgePoints = async (textbookId: number, versionId: number) => {
    try {
      // 1. 先获取所有目录
      const catalogsResponse = await textbookAPI.getCatalogs(textbookId)
      const catalogs = catalogsResponse.data?.catalogs || catalogsResponse.result?.catalogs
      
      if (!catalogs || catalogs.length === 0) {
        this.setState({ catalogKpointGroupedData: {} })
        return
      }
      
      // 2. 对每个目录获取知识点
      const groupedByCatalog: any = {}
      
      await Promise.all(
        catalogs.map(async (catalog: any) => {
          try {
            const kpResponse = await knowledgeAPI.getKnowledgePoints(catalog.id)
            const knowledgePoints = kpResponse.data?.knowledge_points || kpResponse.result?.knowledge_points
            
            if (knowledgePoints && knowledgePoints.length > 0) {
              groupedByCatalog[catalog.id] = knowledgePoints.map((kp: any) => ({
                id: kp.id,
                name: kp.name,
                catalogId: catalog.id,
                kpointId: kp.id
              }))
            }
          } catch (error) {
            console.error(`获取目录 ${catalog.id} 的知识点失败:`, error)
          }
        })
      )
      
      this.setState({ catalogKpointGroupedData: groupedByCatalog })
    } catch (error) {
      console.error('获取知识点数据失败:', error)
      this.showToastMessage('获取知识点数据失败')
    }
  }

  // 获取单元数据（用于展示课程章节卡片）
  fetchUnits = async (chapterId: number = 1) => {
    try {
      console.log('开始获取单元数据，chapterId:', chapterId)
      const response = await unitAPI.getUnitList(chapterId)
      console.log('单元接口返回完整数据:', response)
      console.log('response.data:', response.data)
      console.log('response.result:', response.result)
      
      // 数据直接在 data 或 result 数组中，不是在 units 字段下
      let units = (response.data || response.result) as unknown as any[]
      console.log('提取的units数据:', units)
      console.log('units数组长度:', units?.length)
      
      // 按 ID 从小到大排序（在最开始就排序）
      if (units && units.length > 0) {
        units = units.sort((a, b) => a.id - b.id)
        console.log('✓ 单元数据按ID升序排序完成')
      }
      
      // 默认封面图片列表
      const defaultImages = [
        'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=English%20conversation%20greeting%20people%20casual%20chat%20illustration&sign=a54f2fc0387f888ae74e04bd4b50d13d',
        'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=Family%20members%20friends%20conversation%20illustration&sign=6cb5fa6025fd393bfd9f3d823c15d8d6',
        'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=School%20life%20classroom%20study%20conversation%20illustration&sign=2e9fb9ca71f5c16d74a89f8a530be665',
        'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=Hobbies%20interests%20conversation%20illustration&sign=ccee13e76883cd91b9f8fe209d853ee8',
        'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=Shopping%20conversation%20store%20mall%20illustration&sign=f6b86b635ffbc7cdaf8878081db98e50'
      ]
      
      if (units && units.length > 0) {
        console.log('处理单元数据，数量:', units.length)
        
        // 获取学生信息
        const studentInfo = Taro.getStorageSync('studentInfo')
        const studentId = studentInfo?.id
        
        if (!studentId) {
          console.warn('⚠️ 未找到学生ID，无法查询完成状态')
          // 如果没有学生ID，使用默认数据
          const unitsWithMockData = units.map((unit: any, index: number) => ({
            id: unit.id,
            title: unit.title,
            description: unit.description || '暂无描述',
            image: defaultImages[index % defaultImages.length],
            progress: 0,
            exercises: 0,
            completed: 0
          }))
          
          this.setState({ units: unitsWithMockData })
          return
        }
        
        // 动态导入 API
        const { audioAPI } = await import('../../utils/api_v2')
        
        console.log('=== 开始计算单元实际进度 ===')
        
        // 并发查询所有单元的练习和完成状态
        const unitsWithRealData = await Promise.all(
          units.map(async (unit: any, index: number) => {
            try {
              // 1. 获取该单元的所有练习
              const exercisesResponse = await exerciseAPI.getExerciseList(unit.id)
              const exercises = (exercisesResponse.data || exercisesResponse.result) as unknown as any[]
              
              if (!exercises || exercises.length === 0) {
                console.log(`单元 ${unit.id} (${unit.title}): 无练习`)
                return {
                  id: unit.id,
                  title: unit.title,
                  description: unit.description || '暂无描述',
                  image: defaultImages[index % defaultImages.length],
                  progress: 0,
                  exercises: 0,
                  completed: 0
                }
              }
              
              // 2. 查询每个练习的完成状态
              const exercisesWithStatus = await Promise.all(
                exercises.map(async (exercise) => {
                  const audioResponse = await audioAPI.getAudioList({
                    student_id: studentId,
                    exercise_id: exercise.id
                  })
                  const audioList = audioResponse.data || audioResponse.result
                  const isCompleted = audioList && Array.isArray(audioList) && audioList.length > 0
                  return { ...exercise, isCompleted }
                })
              )
              
              // 3. 计算完成数量和进度
              const totalExercises = exercisesWithStatus.length
              const completedCount = exercisesWithStatus.filter(ex => ex.isCompleted).length
              const progress = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0
              
              console.log(`单元 ${unit.id} (${unit.title}): ${completedCount}/${totalExercises} = ${progress}%`)
              
              return {
                id: unit.id,
                title: unit.title,
                description: unit.description || '暂无描述',
                image: defaultImages[index % defaultImages.length],
                progress: progress,
                exercises: totalExercises,
                completed: completedCount
              }
            } catch (error) {
              console.error(`获取单元 ${unit.id} 的练习数据失败:`, error)
              return {
                id: unit.id,
                title: unit.title,
                description: unit.description || '暂无描述',
                image: defaultImages[index % defaultImages.length],
                progress: 0,
                exercises: 0,
                completed: 0
              }
            }
          })
        )
        
        console.log('=== 单元进度计算完成 ===')
        console.log('处理后的单元数据:', unitsWithRealData)
        
        this.setState({ units: unitsWithRealData }, () => {
          console.log('setState完成后的state.units:', this.state.units)
        })
      } else {
        console.warn('⚠️ 单元数据为空或不存在')
        this.setState({ units: [] })
      }
    } catch (error) {
      console.error('❌ 获取单元数据失败:', error)
      this.showToastMessage('获取单元数据失败')
    }
  }

  // 计算总体进度（基于实际数据）
  getOverallProgress = () => {
    const { units } = this.state
    
    if (!units || units.length === 0) {
      return 0
    }
    
    // 汇总所有单元的练习数和完成数
    const totalExercises = units.reduce((sum, unit) => sum + (unit.exercises || 0), 0)
    const completedExercises = units.reduce((sum, unit) => sum + (unit.completed || 0), 0)
    
    const progress = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0
    
    console.log('=== 总体进度统计 ===')
    console.log('总练习数:', totalExercises)
    console.log('已完成数:', completedExercises)
    console.log('总体进度:', progress + '%')
    console.log('==================')
    
    return progress
  }
  
  // 获取总练习数
  getTotalExercises = () => {
    const { units } = this.state
    return units.reduce((sum, unit) => sum + (unit.exercises || 0), 0)
  }
  
  // 获取已完成练习数
  getCompletedExercises = () => {
    const { units } = this.state
    return units.reduce((sum, unit) => sum + (unit.completed || 0), 0)
  }

  // 表单处理函数 - 实现级联选择逻辑
  handleFormChange = async (field: keyof FormState, value: any) => {
    const newFormData = { 
        ...this.state.formData,
        [field]: value
    }
    
    // 级联清空逻辑
    if (field === 'grade') {
      // 年级改变时，清空所有后续选择并获取教材版本
      newFormData.textbookVersion = null
      newFormData.textbook = null
      newFormData.catalog = null
      newFormData.section = null
      
      // 清空相关选项数据
      this.setState({
        textbookVersionOptions: [],
        textbookOptions: [],
        catalogOptions: [],
        catalogKpointGroupedData: {},
        selectedKnowledgePoints: []
      })
      
      // 获取教材版本数据
      if (value?.value) {
        await this.fetchTextbookVersions()
      }
      
    } else if (field === 'textbookVersion') {
      // 教材版本改变时，清空教材和章节选择
      newFormData.textbook = null
      newFormData.catalog = null
      newFormData.section = null
      
      // 清空相关选项数据
      this.setState({
        textbookOptions: [],
        catalogOptions: [],
        catalogKpointGroupedData: {},
        selectedKnowledgePoints: []
      })
      
      // 获取教材数据
      if (value?.value) {
        await this.fetchTextbooks(value.value)
      }
      
    } else if (field === 'textbook') {
      // 教材改变时，清空章节选择
      newFormData.catalog = null
      newFormData.section = null
      
      // 清空相关选项数据
      this.setState({
        catalogOptions: [],
        catalogKpointGroupedData: {},
        selectedKnowledgePoints: []
      })
      
      // 获取章节数据
      if (value?.value) {
        await this.fetchCatalog(value.value)
      }
      
    } else if (field === 'catalog') {
      // 章节改变时，清空节选择
      newFormData.section = null
      
      // 获取知识点数据
      if (value?.value && this.state.formData.textbook?.value && this.state.formData.textbookVersion?.value) {
        await this.fetchKnowledgePoints(this.state.formData.textbook.value, this.state.formData.textbookVersion.value)
      }
    }
    
    this.setState({ formData: newFormData })
  }

  validateForm = () => {
    if (!this.state.formData.grade) {
      this.showToastMessage('请选择年级')
      return false
    }
    
    if (!this.state.formData.textbookVersion) {
      this.showToastMessage('请选择教材版本')
      return false
    }
    
    if (!this.state.formData.textbook) {
      this.showToastMessage('请选择教材')
      return false
    }
    
    if (!this.state.formData.catalog) {
      this.showToastMessage('请选择章节')
      return false
    }
    
    return true
  }

  // 显示Toast消息
  showToastMessage = (text: string) => {
    this.setState({
      showToast: true,
      toastText: text
    })
  }

  handleFormSubmit = async () => {
    if (!this.validateForm()) {
      return
    }
    
    console.log('表单提交:', this.state.formData)
    
    try {
      this.setState({ loading: true })
      
      // 获取单元列表（chapter_id 硬编码为 1）
      console.log('获取单元列表，chapter_id: 1')
      await this.fetchUnits(1)
      
      // 标记已经筛选过，显示学习进度和单元
      this.setState({
        hasFiltered: true,
        showSuccessModal: true
      })
      
      // 0.5秒后自动隐藏成功modal
      setTimeout(() => {
        this.setState({ showSuccessModal: false })
      }, 500)
    } catch (error) {
      console.error('加载课程失败:', error)
      this.showToastMessage('加载课程失败')
    } finally {
      this.setState({ loading: false })
    }
  }

  // 知识点选择相关方法
  handleAddKnowledgePoint = (kpointId: number) => {
    // 从所有章节中查找对应的知识点信息
    let targetKnowledgePoint: KnowledgePoint | null = null
    for (const chapterPoints of Object.values(this.state.catalogKpointGroupedData)) {
      const foundPoint = chapterPoints.find(kp => kp.kpointId === kpointId)
      if (foundPoint) {
        targetKnowledgePoint = foundPoint
        break
      }
    }

    if (!targetKnowledgePoint) {
      this.showToastMessage('未找到知识点信息')
      return
    }

    // 添加到已选择的知识点列表
    const newPoints = [...this.state.selectedKnowledgePoints]
    if (!newPoints.find(p => p.kpointId === kpointId)) {
      newPoints.push(targetKnowledgePoint)
      this.setState({ selectedKnowledgePoints: newPoints })
      this.showToastMessage('知识点已添加')
    }
  }

  handleRemoveKnowledgePoint = (kpointId: number) => {
    const newPoints = this.state.selectedKnowledgePoints.filter(point => point.kpointId !== kpointId)
    this.setState({ selectedKnowledgePoints: newPoints })
    this.showToastMessage('知识点已移除')
  }

  handleAddAllKnowledgePoints = (knowledgePoints: KnowledgePoint[]) => {
    const newPoints = [...this.state.selectedKnowledgePoints]
    const newPointsToAdd = knowledgePoints.filter(kp => !newPoints.find(p => p.id === kp.kpointId))
    newPoints.push(...newPointsToAdd)
    this.setState({ selectedKnowledgePoints: newPoints })
    this.showToastMessage(`已添加 ${knowledgePoints.length} 个知识点`)
  }

  handleClearAllKnowledgePoints = () => {
    Taro.showModal({
      title: '确认清空',
      content: '确定要清空所有已选择的知识点吗？',
      success: (res) => {
        if (res.confirm) {
          this.setState({ selectedKnowledgePoints: [] })
          this.showToastMessage('已清空所有知识点')
        }
      }
    })
  }

  // 切换知识点选择部分的折叠状态
  toggleKnowledgeSection = () => {
    this.setState({ knowledgeSectionCollapsed: !this.state.knowledgeSectionCollapsed })
  }

  // 切换章节的折叠状态
  toggleChapterCollapse = (catalogId: number) => {
    this.setState({
      chapterCollapsedStates: {
        ...this.state.chapterCollapsedStates,
        [catalogId]: !this.state.chapterCollapsedStates[catalogId]
      }
    })
  }

  resetForm = () => {
    this.setState({
      formData: {
        grade: null,
        textbookVersion: null,
        textbook: null,
        catalog: null,
        section: null
      },
      textbookVersionOptions: [],
      textbookOptions: [],
      catalogOptions: [],
      catalogKpointGroupedData: {},
      selectedKnowledgePoints: []
    })
  }

  handleChapterClick = async (unitId: number) => {
    console.log('handleChapterClick called with unitId:', unitId)
    
    try {
      // 调用真实API获取练习列表
      const response = await exerciseAPI.getExerciseList(unitId)
      const exercises = (response.data || response.result) as unknown as any[]
      console.log('获取到的练习列表:', exercises)
      
      if (exercises && exercises.length > 0) {
        // 跳转到练习详情页，传递unitId
        const url = `/pages/exercise-detail/index?unitId=${unitId}`
        console.log('Navigating to:', url)
        
        Taro.navigateTo({
          url: url
        }).then(() => {
          console.log('Navigation successful')
        }).catch((error) => {
          console.error('Navigation failed:', error)
        })
      } else {
        console.warn('该单元没有练习')
        Taro.showToast({
          title: '该单元暂无练习',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('获取练习列表失败:', error)
      Taro.showToast({
        title: '获取练习失败',
        icon: 'none'
      })
    }
  }

  render() {
    const { 
      formData, 
      hasFiltered, 
      showToast, 
      toastText, 
      isAccordionOpen, 
      loading,
      selectedKnowledgePoints,
      catalogKpointGroupedData,
      knowledgeSectionCollapsed,
      gradeOptions,
      textbookVersionOptions,
      textbookOptions,
      catalogOptions
    } = this.state
    
    // 调试信息
    console.log('渲染状态:', {
      loading,
      gradeOptions: gradeOptions.length,
      textbookVersionOptions: textbookVersionOptions.length,
      textbookOptions: textbookOptions.length,
      catalogOptions: catalogOptions.length,
      formData
    })
    
    const overallProgress = this.getOverallProgress()
    const totalExercises = this.getTotalExercises()
    const completedExercises = this.getCompletedExercises()

    return (
      <View className='chapter-list-page'>
        <ScrollView className='page-content' scrollY>
        {/* 顶部导航栏 */}
        <View className='header'>
          <View className='header-content'>
            <View className='header-left'>
              <AtIcon value='tags' size='32' color='white' />
              <Text className='header-title'>学习章节</Text>
            </View>
            <View className='header-right'>
              {/* <SafeAtButton
                type='secondary'
                size='small'
                onClick={() => Taro.navigateTo({ url: '/pages/smart-question/index' })}
                className='smart-question-btn'
              >
                <AtIcon value='bulb' size='16' color='#667eea' />
                <Text className='btn-text'>智能出题</Text>
              </SafeAtButton> */}
              <Text className='user-name'>{this.state.studentName}</Text>
            </View>
          </View>
        </View>

                {/* 课程筛选折叠面板 */}
                <View className='filter-section'>
                  <SafeAtAccordion
                    open={isAccordionOpen}
                    onClick={() => this.setState({ isAccordionOpen: !isAccordionOpen })}
                    title='课程筛选'
                    className='filter-accordion'
                  >
                      {/* 当前教材信息 */}
                      {/* <SafeAtCard className='textbook-card'>
                        <View className='textbook-info'>
                          <AtIcon value="bookmark" size='40' color='#667eea' />
                          <View className='textbook-details'>
                            <Text className='textbook-label'>当前教材:</Text>
                            <Text className='textbook-name'>牛津上海版1年级第一学期</Text>
                          </View>
                        </View>
                      </SafeAtCard> */}

                      {/* 加载状态显示 */}
                      {loading && (
                        <View className='loading-section'>
                          <SafeAtActivityIndicator mode='center' content='加载中...' />
                          <Text className='loading-text'>正在加载数据，请稍候...</Text>
                        </View>
                      )}

                      {/* 筛选选项列表 */}
                      <SafeAtList className='filter-list'>
                        {/* 年级选择 */}
                        <Picker
                          mode='selector'
                          range={this.state.gradeOptions}
                          rangeKey='label'
                          value={this.state.gradeOptions.findIndex(item => item.value === formData.grade?.value)}
                          onChange={(e) => {
                            const selectedGrade = this.state.gradeOptions[e.detail.value as number]
                            this.handleFormChange('grade', { label: selectedGrade?.label || '', value: selectedGrade?.value })
                          }}
                        >
                          <SafeAtListItem
                            title='年级'
                            note={formData.grade?.label || '请选择年级'}
                            arrow='right'
                          />
                        </Picker>
                        
                        {/* 教材版本选择 */}
                        <Picker
                          mode='selector'
                          range={this.state.textbookVersionOptions}
                          rangeKey='label'
                          value={this.state.textbookVersionOptions.findIndex(item => item.value === formData.textbookVersion?.value)}
                          onChange={(e) => {
                            const selectedVersion = this.state.textbookVersionOptions[e.detail.value as number]
                            this.handleFormChange('textbookVersion', { label: selectedVersion?.label || '', value: selectedVersion?.value })
                          }}
                          disabled={!formData.grade?.value}
                        >
                          <SafeAtListItem
                            title='教材版本'
                            note={formData.textbookVersion?.label || (formData.grade?.value ? '请选择教材版本' : '请先选择年级')}
                            arrow='right'
                          />
                        </Picker>
                        
                        {/* 教材选择 */}
                        <Picker
                          mode='selector'
                          range={this.state.textbookOptions}
                          rangeKey='label'
                          value={this.state.textbookOptions.findIndex(item => item.value === formData.textbook?.value)}
                          onChange={(e) => {
                            const selectedTextbook = this.state.textbookOptions[e.detail.value as number]
                            this.handleFormChange('textbook', { label: selectedTextbook?.label || '', value: selectedTextbook?.value })
                          }}
                          disabled={!formData.textbookVersion?.value}
                        >
                          <SafeAtListItem
                            title='教材'
                            note={formData.textbook?.label || (formData.textbookVersion?.value ? '请选择教材' : '请先选择教材版本')}
                            arrow='right'
                          />
                        </Picker>
                        
                        {/* 章节选择 */}
                        {/* <Picker
                          mode='selector'
                          range={this.state.catalogOptions}
                          rangeKey='label'
                          value={this.state.catalogOptions.findIndex(item => item.value === formData.catalog?.value)}
                          onChange={(e) => {
                            const selectedCatalog = this.state.catalogOptions[e.detail.value as number]
                            this.handleFormChange('catalog', { label: selectedCatalog?.label || '', value: selectedCatalog?.value })
                          }}
                          disabled={!formData.textbook?.value}
                        >
                          <SafeAtListItem
                            title='章节'
                            note={formData.catalog?.label || (formData.textbook?.value ? '请选择章节' : '请先选择教材')}
                            arrow='right'
                          />
                        </Picker> */}
                        
                        {/* <Picker
                          mode='selector'
                          range={this.state.sectionOptions}
                          rangeKey='label'
                          value={this.state.sectionOptions.findIndex(item => item.value === formData.section?.value)}
                          onChange={(e) => {
                            const selectedSection = this.state.sectionOptions[e.detail.value as number]
                            this.handleFormChange('section', { label: selectedSection?.label || '', value: selectedSection?.value })
                          }}
                          disabled={!formData.catalog?.value}
                        >
                          <SafeAtListItem
                            title='节'
                            note={formData.section?.label || (formData.catalog?.value ? '请选择节' : '请先选择章节')}
                            arrow='right'
                          />
                        </Picker> */}
                      </SafeAtList>

                      {/* 操作按钮 */}
                      <View className='action-buttons'>
                        <SafeAtButton
                          type='primary'
                          onClick={this.handleFormSubmit}
                          className='submit-button'
                        >
                          <AtIcon value="search" size='20' color='white' />
                          <Text className='button-text'>查找课程</Text>
                        </SafeAtButton>
                        {/* 隐藏重置按钮
                        <SafeAtButton
                          onClick={this.resetForm}
                          className='reset-button'
                        >
                          <AtIcon value="reload" size='20' color='#667eea' />
                          <Text className='button-text'>重置</Text>
                        </SafeAtButton>
                        */}
                      </View>

                  </SafeAtAccordion>
                </View>

        {/* 显示学习进度和单元 */}
        {(() => {
          console.log('渲染检查 - hasFiltered:', hasFiltered)
          console.log('渲染检查 - units:', this.state.units)
          console.log('渲染检查 - units.length:', this.state.units?.length)
          return null
        })()}
        {hasFiltered && (
          <>
            {/* 进度卡片 */}
            <View className='progress-section'>
              <SafeAtCard title='学习进度' className='progress-card'>
                <View className='progress-header'>
                  <Text className='progress-title'>总体进度</Text>
                  {/* <Text className='progress-percentage'>{overallProgress}%</Text> */}
                </View>
                
                <SafeAtProgress 
                  percent={overallProgress} 
                  strokeWidth={8}
                  color='#52c41a'
                  className='progress-bar'
                />
                
                <Text className='progress-text'>
                  已完成 {completedExercises} / {totalExercises} 个练习
                </Text>
              </SafeAtCard>
            </View>

            {/* 单元列表（显示为课程章节） */}
            <View className='chapters-section'>
              <Text className='section-title'>课程章节</Text>
              {(() => {
                console.log('单元渲染 - units数组:', this.state.units)
                console.log('单元渲染 - 数组长度:', this.state.units?.length)
                console.log('单元渲染 - 条件判断:', this.state.units.length > 0)
                return null
              })()}
              <View className='chapters-grid'>
                {this.state.units.length > 0 ? (
                  this.state.units.map((unit) => (
                    <SafeAtCard 
                      key={unit.id}
                      className='chapter-card'
                      title={unit.title}
                      extra={`${unit.progress}%`}
                      onClick={() => this.handleChapterClick(unit.id)}
                    >
                      <View className='chapter-content'>
                        <Image 
                          src={unit.image} 
                          className='chapter-image' 
                          mode='aspectFill'
                        />
                        <Text className='chapter-description'>{unit.description}</Text>
                        
                        <SafeAtProgress 
                          percent={unit.progress} 
                          strokeWidth={6}
                          color='#52c41a'
                          className='chapter-progress-bar'
                        />

                        <View className='chapter-meta'>
                          <Text className='chapter-stats'>
                            {unit.completed} / {unit.exercises} 个练习
                          </Text>
                          <Text className='chapter-status'>
                            {unit.completed > 0 ? '已开始' : '未开始'}
                          </Text>
                        </View>

                        <SafeAtButton 
                          type='primary' 
                          size='small'
                          className='continue-btn'
                          onClick={(e) => {
                            e.stopPropagation()
                            this.handleChapterClick(unit.id)
                          }}
                        >
                          <Text className='continue-text'>继续学习</Text>
                        </SafeAtButton>
                      </View>
                    </SafeAtCard>
                  ))
                ) : (
                  <View className='empty-chapters'>
                    <Text>加载单元中...</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {/* 如果还没有筛选，显示提示信息 */}
        {!hasFiltered && (
          <View className='empty-section'>
            <SafeAtCard className='empty-card'>
              <View className='empty-content'>
                <Icon name="Filter" size={80} className='empty-icon' />
                <Text className='empty-title'>请先筛选课程</Text>
                <Text className='empty-description'>
                  使用上方的筛选表单选择年级、教材版本、章节等信息，然后点击"筛选课程"按钮来查看相应的学习内容。
                </Text>
              </View>
            </SafeAtCard>
          </View>
        )}

        </ScrollView>
        
        {/* 页脚 */}
        <View className='footer'>
          <Text className='footer-text'>
            © 2025 EngCoach 英语口语训练助手 | 让每一次练习都有价值
          </Text>
        </View>
        
        {/* Toast 提示 */}
        <SafeAtToast
          isOpened={showToast}
          text={toastText}
          status='error'
          duration={2000}
          onClose={() => this.setState({ showToast: false })}
        />
        
        {/* 成功提示 Modal */}
        {this.state.showSuccessModal && (
          <View className='success-modal'>
            <View className='success-modal-content'>
              <Text className='success-icon'>✓</Text>
              <Text className='success-text'>课程加载成功</Text>
            </View>
          </View>
        )}
      </View>
    )
  }
}