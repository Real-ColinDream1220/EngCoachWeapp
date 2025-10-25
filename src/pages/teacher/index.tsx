import { Component } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { AtButton, AtCard, AtProgress, AtTag, AtIcon, AtAccordion } from 'taro-ui'

// Safety check for taro-ui components
const SafeAtButton = AtButton || (() => <View>Button not available</View>)
const SafeAtCard = AtCard || (() => <View>Card not available</View>)
const SafeAtProgress = AtProgress || (() => <View>Progress not available</View>)
const SafeAtTag = AtTag || (() => <View>Tag not available</View>)
const SafeAtAccordion = AtAccordion || (() => <View>Accordion not available</View>)

import Taro from '@tarojs/taro'
import './index.scss'

interface StudentProgress {
  studentId: number
  studentName: string
  totalExercises: number
  completedExercises: number
  progress: number
  exercises: Array<{
    id: number
    title: string
    unitName: string
    isCompleted: boolean
  }>
}

export default class TeacherPage extends Component {
  state = {
    loading: true,
    students: [] as StudentProgress[],
    expandedStudentId: null as number | null
  }

  componentDidMount() {
    console.log('Teacher 页面加载')
    this.loadStudentsData()
  }

  loadStudentsData = async () => {
    try {
      this.setState({ loading: true })

      // 动态导入 API
      const { studentAPI, unitAPI, exerciseAPI, audioAPI } = await import('../../utils/api_v2')

      console.log('=== 开始加载学生数据 ===')

      // 1. 获取所有学生
      const studentsResponse = await studentAPI.getStudentList()
      const students = studentsResponse.data || studentsResponse.result
      console.log('学生列表:', students)

      if (!students || students.length === 0) {
        console.log('没有学生数据')
        this.setState({ loading: false, students: [] })
        return
      }

      // 2. 获取所有单元（chapter_id = 1）
      const unitsResponse = await unitAPI.getUnitList(1)
      const units = (unitsResponse.data || unitsResponse.result) as unknown as any[]
      console.log('单元列表:', units)
      console.log('单元数量:', units?.length || 0)

      // 3. 为每个学生计算进度
      const studentsWithProgress = await Promise.all(
        students.map(async (student: any) => {
          try {
            const studentId = student.id
            const studentName = student.name || `学生${studentId}`

            console.log(`\n=== 计算学生 ${studentName} 的进度 ===`)

            let totalExercises = 0
            let completedExercises = 0
            const exercisesList: any[] = []

            // 遍历所有单元获取练习
            for (const unit of units) {
              try {
                // 获取该单元的所有练习
                const exercisesResponse = await exerciseAPI.getExerciseList(unit.id)
                const exercises = (exercisesResponse.data || exercisesResponse.result) as unknown as any[]

                console.log(`单元 ${unit.title || unit.name} (ID: ${unit.id}) 的练习数量:`, exercises?.length || 0)

                if (exercises && exercises.length > 0) {
                  // 过滤掉无效练习（unit_id 为空或与当前单元不匹配）
                  const validExercises = exercises.filter(ex => !ex.unit_id || ex.unit_id === unit.id)
                  // 按ID升序排序
                  validExercises.sort((a, b) => a.id - b.id)
                  
                  console.log(`单元 ${unit.title || unit.name} 有效练习数量:`, validExercises.length)

                  // 查询每个练习的完成状态
                  for (const exercise of validExercises) {
                    totalExercises++

                    // 查询该学生是否完成了这个练习
                    const audioResponse = await audioAPI.getAudioList({
                      student_id: studentId,
                      exercise_id: exercise.id
                    })
                    const audioList = audioResponse.data || audioResponse.result
                    const isCompleted = audioList && Array.isArray(audioList) && audioList.length > 0

                    if (isCompleted) {
                      completedExercises++
                    }

                    exercisesList.push({
                      id: exercise.id,
                      title: exercise.title || exercise.name,
                      unitName: unit.title || unit.name,
                      unitId: unit.id,  // 添加 unitId 用于排序
                      isCompleted
                    })
                  }
                }
              } catch (error) {
                console.error(`获取单元 ${unit.id} 的练习失败:`, error)
              }
            }

            // 练习列表排序：先按单元ID排序，再按练习ID排序
            exercisesList.sort((a, b) => {
              if (a.unitId !== b.unitId) {
                return a.unitId - b.unitId  // 先按单元ID升序
              }
              return a.id - b.id  // 再按练习ID升序
            })
            console.log('✓ 练习列表已按单元和练习ID排序')

            const progress = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0

            console.log(`学生 ${studentName} 最终统计:`)
            console.log(`  - 总练习数: ${totalExercises}`)
            console.log(`  - 已完成: ${completedExercises}`)
            console.log(`  - 进度: ${progress}%`)

            return {
              studentId,
              studentName,
              totalExercises,
              completedExercises,
              progress,
              exercises: exercisesList
            }
          } catch (error) {
            console.error(`处理学生 ${student.id} 数据失败:`, error)
            return {
              studentId: student.id,
              studentName: student.name || `学生${student.id}`,
              totalExercises: 0,
              completedExercises: 0,
              progress: 0,
              exercises: []
            }
          }
        })
      )

      console.log('=== 所有学生数据加载完成 ===')
      console.log('学生进度:', studentsWithProgress)

      // 学生列表按ID排序（从小到大）
      studentsWithProgress.sort((a, b) => a.studentId - b.studentId)
      console.log('✓ 学生列表已按ID排序')

      this.setState({
        students: studentsWithProgress,
        loading: false
      })
    } catch (error) {
      console.error('加载学生数据失败:', error)
      this.setState({ loading: false })
      Taro.showToast({
        title: '加载数据失败',
        icon: 'none'
      })
    }
  }

  handleStudentClick = (studentId: number) => {
    const { expandedStudentId } = this.state
    // 点击已展开的学生，收起；点击未展开的学生，展开
    this.setState({
      expandedStudentId: expandedStudentId === studentId ? null : studentId
    })
  }

  handleViewReport = (studentId: number, exerciseId: number) => {
    console.log('查看总结报告:', { studentId, exerciseId })
    
    // 跳转到报告页面
    Taro.navigateTo({
      url: `/pages/report/index?exerciseId=${exerciseId}&studentId=${studentId}`
    })
  }

  handleBack = () => {
    Taro.reLaunch({
      url: '/pages/login/index'
    })
  }

  render() {
    const { loading, students, expandedStudentId } = this.state

    if (loading) {
      return (
        <View className='teacher-page'>
          <View className='loading-container'>
            <Text className='loading-text'>正在加载学生数据...</Text>
          </View>
        </View>
      )
    }

    return (
      <View className='teacher-page'>
        {/* 顶部导航栏 */}
        <View className='header'>
          <View className='header-content'>
            <View className='header-left'>
              <AtIcon value='user' size='32' color='white' />
              <Text className='header-title'>学生管理</Text>
            </View>
            <View className='header-right'>
              <SafeAtButton
                type='secondary'
                size='small'
                onClick={this.handleBack}
                className='back-btn'
              >
                退出登录
              </SafeAtButton>
            </View>
          </View>
        </View>

        <ScrollView className='page-content' scrollY>
          {/* 统计信息 */}
          <View className='stats-section'>
            <SafeAtCard className='stats-card'>
              <View className='stats-content'>
                <View className='stat-item'>
                  <Text className='stat-label'>学生总数</Text>
                  <Text className='stat-value'>{students.length}</Text>
                </View>
                <View className='stat-item'>
                  <Text className='stat-label'>总练习数</Text>
                  <Text className='stat-value'>
                    {students.length > 0 ? students[0].totalExercises : 0}
                  </Text>
                </View>
              </View>
            </SafeAtCard>
          </View>

          {/* 学生列表 */}
          <View className='students-section'>
            <Text className='section-title'>学生列表</Text>
            {students.length > 0 ? (
              students.map((student) => (
                <SafeAtCard key={student.studentId} className='student-card'>
                  <View
                    className='student-header'
                    onClick={() => this.handleStudentClick(student.studentId)}
                  >
                    <View className='student-info'>
                      <View className='student-name-row'>
                        <Text className='student-name'>{student.studentName}</Text>
                        <SafeAtTag
                          type={student.progress === 100 ? 'primary' : 'default'}
                          size='small'
                        >
                          {student.progress}%
                        </SafeAtTag>
                      </View>
                      <Text className='student-stats'>
                        已完成 {student.completedExercises} / {student.totalExercises} 个练习
                      </Text>
                    </View>
                    <AtIcon
                      value={expandedStudentId === student.studentId ? 'chevron-up' : 'chevron-down'}
                      size='20'
                      color='#667eea'
                    />
                  </View>

                  <SafeAtProgress
                    percent={student.progress}
                    strokeWidth={8}
                    color='#52c41a'
                    className='student-progress'
                  />

                  {/* 展开的练习列表 */}
                  {expandedStudentId === student.studentId && (
                    <View className='exercises-detail'>
                      <View className='exercises-header'>
                        <Text className='exercises-title'>练习详情</Text>
                      </View>
                      {student.exercises.length > 0 ? (
                        student.exercises.map((exercise) => (
                          <View key={exercise.id} className='exercise-item'>
                            <View className='exercise-info'>
                              <View className='exercise-name-row'>
                                <SafeAtTag
                                  type={exercise.isCompleted ? 'primary' : 'default'}
                                  size='small'
                                >
                                  {exercise.isCompleted ? '✓' : '○'}
                                </SafeAtTag>
                                <Text className='exercise-title'>{exercise.title}</Text>
                              </View>
                              <Text className='exercise-unit'>{exercise.unitName}</Text>
                            </View>
                            {exercise.isCompleted && (
                              <SafeAtButton
                                type='secondary'
                                size='small'
                                onClick={() => this.handleViewReport(student.studentId, exercise.id)}
                                className='report-btn'
                              >
                                查看报告
                              </SafeAtButton>
                            )}
                          </View>
                        ))
                      ) : (
                        <Text className='no-exercises'>暂无练习</Text>
                      )}
                    </View>
                  )}
                </SafeAtCard>
              ))
            ) : (
              <SafeAtCard className='empty-card'>
                <View className='empty-content'>
                  <Text className='empty-text'>暂无学生数据</Text>
                </View>
              </SafeAtCard>
            )}
          </View>
        </ScrollView>
      </View>
    )
  }
}

