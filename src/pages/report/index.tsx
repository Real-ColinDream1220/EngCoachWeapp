import { Component } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { AtIcon, AtCard, AtDivider } from 'taro-ui'
import Taro from '@tarojs/taro'
import './index.scss'

// Safety check for taro-ui components
const SafeAtCard = AtCard || (() => <View>Card not available</View>)
const SafeAtDivider = AtDivider || (() => <View>Divider not available</View>)

export default class Report extends Component {
  state = {
    exerciseId: null as number | null,
    studentId: null as number | null,
    exerciseTitle: '',
    exerciseDescription: '',
    audioList: [] as any[],
    reportData: null as any,
    reportContent: '',  // report 的 content 字段
    playingAudioId: null as number | null,
    audioIconIndex: 0,
    studentName: '学生',
    isLoading: true
  }

  audioContext: any = null
  audioAnimationTimer: any = null

  async componentDidMount() {
    // 检查登录状态
    const isLoggedIn = Taro.getStorageSync('isLoggedIn')
    if (!isLoggedIn) {
      Taro.reLaunch({
        url: '/pages/login/index'
      })
      return
    }

    // 初始化音频播放器
    this.audioContext = Taro.createInnerAudioContext()
    console.log('✅ 音频播放器初始化完成')

    // 获取路由参数
    const instance = Taro.getCurrentInstance()
    const { exerciseId, studentId } = instance?.router?.params || {}

    if (exerciseId) {
      let finalStudentId = studentId ? Number(studentId) : null
      let studentName = '学生'

      // 如果没有从路由参数获取到 studentId（学生端），使用 passcode 查询
      if (!finalStudentId) {
        try {
          console.log('=== 使用 passcode 查询学生信息 ===')
          const passcode = Taro.getStorageSync('passcode')
          console.log('Passcode:', passcode)

          if (passcode) {
            // 导入 studentAPI
            const { studentAPI } = await import('../../utils/api_v2')

            // 使用 passcode 查询学生信息
            const studentResult = await studentAPI.getStudentByKey(passcode)
            console.log('学生查询响应:', studentResult)

            if (studentResult.success) {
              const student = studentResult.data || studentResult.result
              if (student) {
                finalStudentId = student.id
                studentName = student.name || '学生'
                console.log('✅ 查询到学生:', { id: finalStudentId, name: studentName })
              } else {
                console.error('未找到对应的学生')
              }
            } else {
              console.error('查询学生失败:', studentResult.message)
            }
          } else {
            console.error('未找到 passcode')
          }
        } catch (error) {
          console.error('使用 passcode 查询学生信息失败:', error)
        }
      }

      // 读取学生信息（如果有）
      const studentInfo = Taro.getStorageSync('studentInfo')
      if (studentInfo && studentInfo.name && !studentId) {
        studentName = studentInfo.name
      }

      this.setState({ 
        exerciseId: Number(exerciseId),
        studentId: finalStudentId,
        studentName
      }, () => {
        this.loadReportData()
      })
    } else {
      console.error('未获取到 exerciseId')
      Taro.showToast({
        title: '缺少练习ID',
        icon: 'none'
      })
    }
  }

  componentWillUnmount() {
    // 清理资源
    this.stopAudioPlayback()
    if (this.audioContext) {
      this.audioContext.destroy()
      console.log('✅ 音频播放器已销毁')
    }
  }

  // 加载报告数据
  loadReportData = async () => {
    const { exerciseId, studentId } = this.state

    console.log('=== 加载报告数据 ===')
    console.log('练习ID:', exerciseId)
    console.log('学生ID:', studentId)

    if (!studentId) {
      console.error('缺少学生ID')
      Taro.hideLoading()
      Taro.showToast({
        title: '缺少学生ID',
        icon: 'none'
      })
      this.setState({ isLoading: false })
      return
    }

    try {
      Taro.showLoading({
        title: '加载中...',
        mask: true
      })

      // 导入API
      const { audioAPI, exerciseAPI, studentAPI, reportAPI } = await import('../../utils/api_v2')

      // 1. 获取练习详情
      const exerciseDetail = await exerciseAPI.getExerciseDetail(exerciseId!)
      console.log('练习详情:', exerciseDetail)

      const exerciseData = exerciseDetail.data || exerciseDetail.result
      const exerciseTitle = exerciseData?.title || '练习详情'
      const exerciseDescription = exerciseData?.description || ''

      this.setState({ 
        exerciseTitle,
        exerciseDescription
      })

      // 2. 获取学生信息（如果是从教师端进入）
      try {
        const studentDetail = await studentAPI.getStudentDetail(studentId)
        const studentData = studentDetail.data || studentDetail.result
        if (studentData && studentData.name) {
          this.setState({ studentName: studentData.name })
        }
      } catch (error) {
        console.error('获取学生信息失败:', error)
        // 忽略错误，使用默认学生名称
      }

      // 3. 获取 report 数据
      console.log('\n=== 获取 report 数据 ===')
      try {
        const reportListResult = await reportAPI.getReportList(exerciseId!)
        console.log('报告列表响应:', reportListResult)

        if (reportListResult.success) {
          // API可能返回数组或包含items的对象
          let reports = []
          if (Array.isArray(reportListResult.data)) {
            reports = reportListResult.data
          } else if (Array.isArray(reportListResult.result)) {
            reports = reportListResult.result
          } else if (reportListResult.data?.items) {
            reports = reportListResult.data.items
          } else if (reportListResult.result?.items) {
            reports = reportListResult.result.items
          }
          
          console.log('解析后的报告列表:', reports)
          console.log('报告数量:', reports.length)
          
          if (reports.length > 0) {
            const reportData = reports[0]
            console.log('报告数据:', reportData)
            console.log('报告字段:', Object.keys(reportData))
            
            // 提取 content 字段
            const reportContent = reportData.content || ''
            console.log('报告内容长度:', reportContent.length)
            console.log('报告内容预览:', reportContent.substring(0, 100))

            this.setState({ 
              reportData,
              reportContent
            })
          } else {
            console.log('暂无报告数据')
          }
        } else {
          console.error('获取报告列表失败:', reportListResult.message)
        }
      } catch (reportError) {
        console.error('获取报告数据失败:', reportError)
        // 忽略错误，继续执行
      }

      // 2. 根据 student_id 和 exercise_id 获取音频列表
      console.log('\n=== 获取音频列表 ===')
      const audioListResult = await audioAPI.getAudioList({
        student_id: studentId!,
        exercise_id: exerciseId!
      })

      console.log('音频列表响应:', audioListResult)

      if (audioListResult.success) {
        // API 返回的 data 就是数组
        const audioData = Array.isArray(audioListResult.data) 
          ? audioListResult.data 
          : (Array.isArray(audioListResult.result) ? audioListResult.result : [])
        
        console.log('音频数据:', audioData)
        console.log('录音数量:', audioData.length)
        
        // 解析音频数据，提取需要的信息
        const audioList = audioData.map((audio: any, index: number) => {
          console.log(`\n=== 音频 ${index + 1} ===`)
          console.log('原始数据:', audio)
          console.log('ID:', audio.id)
          console.log('duration字段:', audio.duration)
          console.log('duration类型:', typeof audio.duration)
          console.log('duration值:', audio.duration)
          console.log('file:', audio.file)
          console.log('message_text:', audio.message_text)
          
          const parsedDuration = Number(audio.duration) || 0
          console.log('解析后的duration:', parsedDuration)
          console.log('Math.floor后:', Math.floor(parsedDuration))
          
          return {
            id: audio.id,
            file: audio.file,  // 音频文件URL
            duration: parsedDuration,
            messageText: audio.message_text || '',  // 对应的消息文本
            createdAt: audio.created_at || audio.createdAt
          }
        })

        console.log('解析后的音频列表:', audioList)

        // 按创建时间排序
        audioList.sort((a, b) => {
          if (!a.createdAt) return 1
          if (!b.createdAt) return -1
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        })

        console.log('排序后的音频列表:', audioList)

        this.setState({ 
          audioList,
          isLoading: false
        })
      } else {
        console.error('获取音频列表失败:', audioListResult.message)
        this.setState({ isLoading: false })
        
        Taro.showToast({
          title: audioListResult.message || '获取音频失败',
          icon: 'none'
        })
      }

      Taro.hideLoading()
    } catch (error) {
      console.error('加载报告数据失败:', error)
      Taro.hideLoading()
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setState({ isLoading: false })
    }
  }

  // 播放音频
  handlePlayAudio = (audioId: number, audioUrl: string) => {
    const { playingAudioId } = this.state

    console.log('=== 播放音频 ===')
    console.log('音频ID:', audioId)
    console.log('音频URL:', audioUrl)

    // 如果正在播放这条音频，则停止播放
    if (playingAudioId === audioId) {
      console.log('⏸️  停止播放')
      this.stopAudioPlayback()
      return
    }

    // 停止之前的播放
    if (playingAudioId !== null) {
      this.stopAudioPlayback()
    }

    // 开始播放新的音频
    this.setState({
      playingAudioId: audioId,
      audioIconIndex: 0
    })

    // 启动图标切换动画
    this.startAudioAnimation()

    // 使用音频播放器播放
    if (this.audioContext) {
      this.audioContext.src = audioUrl
      this.audioContext.play()

      // 监听播放结束
      this.audioContext.onEnded(() => {
        console.log('✅ 音频播放完成')
        this.stopAudioPlayback()
      })

      // 监听播放错误
      this.audioContext.onError((error: any) => {
        console.error('❌ 播放音频失败:', error)
        this.stopAudioPlayback()
        Taro.showToast({
          title: '播放失败',
          icon: 'none'
        })
      })
    }

    console.log('===============')
  }

  // 启动音频播放动画
  startAudioAnimation = () => {
    // 清除之前的定时器
    if (this.audioAnimationTimer) {
      clearInterval(this.audioAnimationTimer)
    }

    // 每80ms切换一次图标
    this.audioAnimationTimer = setInterval(() => {
      this.setState((prevState: any) => ({
        audioIconIndex: (prevState.audioIconIndex + 1) % 3
      }))
    }, 80)
  }

  // 停止音频播放动画
  stopAudioAnimation = () => {
    if (this.audioAnimationTimer) {
      clearInterval(this.audioAnimationTimer)
      this.audioAnimationTimer = null
    }

    this.setState({
      playingAudioId: null,
      audioIconIndex: 0
    })
  }

  // 停止音频播放（包括音频和动画）
  stopAudioPlayback = () => {
    // 停止音频播放
    if (this.audioContext) {
      this.audioContext.stop()
    }

    // 停止动画
    this.stopAudioAnimation()
  }

  // 渲染音频图标
  renderAudioIcon = (audioId: number) => {
    const { playingAudioId, audioIconIndex } = this.state

    if (playingAudioId !== audioId) {
      // 未播放状态：显示静态播放图标（紫色，与 conversation 一致）
      return <AtIcon value='volume-plus' size='24' color='#667eea' />
    }

    // 播放中：显示动画图标（紫色）
    const icons = ['volume-off', 'volume-minus', 'volume-plus']
    return <AtIcon value={icons[audioIconIndex]} size='24' color='#667eea' />
  }

  handleBack = () => {
    Taro.navigateBack()
  }

  render() {
    const { exerciseTitle, exerciseDescription, audioList, studentName, isLoading, reportContent } = this.state

    return (
      <View className='report-page'>
        {/* Header */}
        <View className='header'>
          <View className='header-content'>
            <View className='header-left'>
              <AtIcon value='playlist' size='32' color='white' className='header-icon' />
              <Text className='header-title'>练习总结</Text>
            </View>
            <View className='header-right'>
              <Text className='user-name'>{studentName}</Text>
            </View>
          </View>
        </View>

        {/* 主内容区域 */}
        <ScrollView className='content-area' scrollY>
          {/* 练习信息卡片 */}
          <View className='section'>
            <SafeAtCard className='info-card'>
              <View className='card-header'>
                <AtIcon value='bookmark' size='24' color='#667eea' />
                <Text className='card-title'>练习信息</Text>
              </View>
              <SafeAtDivider lineColor='#e5e5e5' />
              <View className='info-content'>
                <View className='info-row'>
                  <Text className='info-label'>练习标题</Text>
                  <Text className='info-value'>{exerciseTitle}</Text>
                </View>
                {exerciseDescription && (
                  <View className='info-row'>
                    <Text className='info-label'>练习描述</Text>
                    <Text className='info-value description'>{exerciseDescription}</Text>
                  </View>
                )}
                <View className='info-row'>
                  <Text className='info-label'>录音数量</Text>
                  <Text className='info-value highlight'>{audioList.length} 个</Text>
                </View>
              </View>
            </SafeAtCard>
          </View>

          {/* 录音列表 */}
          <View className='section'>
            <SafeAtCard className='audio-card'>
              <View className='card-header'>
                <AtIcon value='sound' size='24' color='#667eea' />
                <Text className='card-title'>录音列表</Text>
              </View>
              <SafeAtDivider lineColor='#e5e5e5' />
              
              {isLoading ? (
                <View className='loading-container'>
                  <Text className='loading-text'>加载中...</Text>
                </View>
              ) : audioList.length === 0 ? (
                <View className='empty-container'>
                  <AtIcon value='inbox' size='80' color='#ccc' />
                  <Text className='empty-text'>暂无录音数据</Text>
                  <Text className='empty-hint'>完成练习后可查看录音</Text>
                </View>
              ) : (
                <View className='audio-list'>
                  {audioList.map((audio, index) => {
                    const displayDuration = Math.floor(Number(audio.duration) || 0)
                    console.log(`渲染音频 ${index + 1}:`, {
                      id: audio.id,
                      duration: audio.duration,
                      durationDisplay: displayDuration,
                      durationString: `${displayDuration}"`
                    })
                    
                    return (
                    <View key={audio.id} className='audio-item'>
                      {/* 音频序号 */}
                      <View className='audio-header'>
                        <View className='audio-badge'>
                          <Text className='badge-text'>{index + 1}</Text>
                        </View>
                      </View>

                      {/* 音频气泡 */}
                      <View
                        className={`voice-bubble ${this.state.playingAudioId === audio.id ? 'playing' : ''}`}
                        onClick={() => this.handlePlayAudio(audio.id, audio.file)}
                      >
                        <Text className='voice-duration'>{displayDuration}"</Text>
                        <View className='voice-icon-wrapper'>
                          {this.renderAudioIcon(audio.id)}
                        </View>
                      </View>

                      {/* 消息文本 */}
                      {audio.messageText && (
                        <View className='message-bubble'>
                          <Text className='message-text'>{audio.messageText}</Text>
                        </View>
                      )}
                    </View>
                    )
                  })}
                </View>
              )}
            </SafeAtCard>
          </View>

          {/* 学习建议 */}
          <View className='section'>
            <SafeAtCard className='summary-card'>
              <View className='card-header'>
                <AtIcon value='analytics' size='24' color='#667eea' />
                <Text className='card-title'>学习建议</Text>
              </View>
              <SafeAtDivider lineColor='#e5e5e5' />
              <View className='summary-content'>
                {reportContent ? (
                  <Text className='summary-text'>{reportContent}</Text>
                ) : (
                  <View className='summary-empty'>
                    <Text className='summary-empty-text'>暂无学习建议</Text>
                  </View>
                )}
              </View>
            </SafeAtCard>
          </View>
        </ScrollView>

        {/* 返回按钮 */}
        <View className='back-btn' onClick={this.handleBack}>
          <AtIcon value='chevron-left' size='20' color='white' />
          <Text className='back-text'>返回</Text>
        </View>
      </View>
    )
  }
}

