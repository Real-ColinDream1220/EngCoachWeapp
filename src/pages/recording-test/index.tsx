import { Component } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { TaroVoiceRecognitionService } from '../../utils/voiceRecognition'
import { fileAPI } from '../../utils/api_v2'
import './index.scss'

interface RecordingTestState {
  isRecording: boolean
  recordingDuration: number
  fileUrl: string
  recognitionText: string
  uploading: boolean
  recognizing: boolean
}

export default class RecordingTest extends Component<{}, RecordingTestState> {
  private voiceRecognitionService: TaroVoiceRecognitionService | null = null
  private recordingTimer: any = null
  private startTime: number = 0

  state: RecordingTestState = {
    isRecording: false,
    recordingDuration: 0,
    fileUrl: '',
    recognitionText: '',
    uploading: false,
    recognizing: false
  }

  componentDidMount() {
    this.initVoiceRecognitionService()
  }

  componentWillUnmount() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer)
    }
    if (this.voiceRecognitionService) {
      this.voiceRecognitionService.destroy()
    }
  }

  initVoiceRecognitionService = () => {
    try {
      this.voiceRecognitionService = new TaroVoiceRecognitionService(
        {
          // 使用WebSocket方案（阿里云NLS实时识别）
          // token和appKey会在服务内部自动获取
        },
        {
          onResult: (text: string, isFinal: boolean) => {
            console.log('语音识别结果:', text, '是否最终结果:', isFinal)
            // 实时更新识别结果（WebSocket方案会实时返回）
            this.setState({ 
              recognitionText: text,
              recognizing: !isFinal  // 如果是最终结果，则不再显示识别中状态
            })
          },
          onError: (error: string) => {
            console.error('语音识别错误:', error)
            this.setState({ recognizing: false })
            Taro.showToast({ title: error, icon: 'none' })
          },
          onStarted: () => {
            console.log('录音开始（WebSocket实时识别）')
            this.setState({ recognizing: true })
          },
          onStopped: () => {
            console.log('录音停止')
            // 保持识别中状态，等待最终结果
          }
        }
      )
    } catch (error: any) {
      console.error('初始化语音识别服务失败:', error)
      Taro.showToast({ title: '初始化失败', icon: 'none' })
    }
  }

  // 开始录音
  handleStartRecording = async () => {
    if (!this.voiceRecognitionService) {
      await this.initVoiceRecognitionService()
    }

    try {
      this.startTime = Date.now()
      this.setState({ 
        isRecording: true, 
        recordingDuration: 0,
        fileUrl: '',
        recognitionText: ''
      })
      
      // 开始录音计时
      this.recordingTimer = setInterval(() => {
        const duration = Math.floor((Date.now() - this.startTime) / 1000)
        this.setState({ recordingDuration: duration })
      }, 1000)

      await this.voiceRecognitionService!.start()
    } catch (error: any) {
      console.error('开始录音失败:', error)
      this.setState({ isRecording: false })
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer)
        this.recordingTimer = null
      }
      Taro.showToast({ title: '开始录音失败', icon: 'none' })
    }
  }

  // 停止录音并处理
  handleStopRecording = async () => {
    if (!this.voiceRecognitionService) {
      return
    }

    try {
      // 停止录音（stop 方法是同步的）
      this.voiceRecognitionService.stop()
      
      // 清除计时器
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer)
        this.recordingTimer = null
      }

      this.setState({ isRecording: false })

      // 等待录音处理和识别完成（WebSocket方案会实时返回结果，这里等待最终结果）
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 获取录音文件路径
      const wavFilePath = this.voiceRecognitionService.getPcmFilePath()
      
      if (!wavFilePath) {
        Taro.showToast({ title: '未获取到录音文件', icon: 'none' })
        return
      }

      console.log('录音文件路径:', wavFilePath)

      // 1. 上传文件
      await this.handleUploadFile(wavFilePath)
      
    } catch (error: any) {
      console.error('停止录音失败:', error)
      Taro.showToast({ title: '停止录音失败', icon: 'none' })
    }
  }

  // 上传文件
  handleUploadFile = async (filePath: string) => {
    try {
      this.setState({ uploading: true })
      
      Taro.showLoading({ title: '上传文件中...' })

      const response = await fileAPI.uploadFile(filePath)
      
      Taro.hideLoading()

      if (response.success) {
        const url = response.data?.file?.url || response.result?.file?.url || ''
        if (url) {
          this.setState({ fileUrl: url })
          Taro.showToast({ title: '上传成功', icon: 'success' })
        } else {
          Taro.showToast({ title: '未获取到文件URL', icon: 'none' })
        }
      } else {
        Taro.showToast({ title: response.message || '上传失败', icon: 'none' })
      }
    } catch (error: any) {
      Taro.hideLoading()
      console.error('上传文件失败:', error)
      Taro.showToast({ title: '上传失败: ' + (error.message || '未知错误'), icon: 'none' })
    } finally {
      this.setState({ uploading: false })
    }
  }

  // 复制URL
  handleCopyUrl = () => {
    const { fileUrl } = this.state
    if (!fileUrl) {
      Taro.showToast({ title: '没有可复制的URL', icon: 'none' })
      return
    }

    Taro.setClipboardData({
      data: fileUrl,
      success: () => {
        Taro.showToast({ title: '已复制到剪贴板', icon: 'success' })
      },
      fail: () => {
        Taro.showToast({ title: '复制失败', icon: 'none' })
      }
    })
  }

  render() {
    const { isRecording, recordingDuration, fileUrl, recognitionText, uploading, recognizing } = this.state

    return (
      <View className='recording-test'>
        <View className='test-card'>
          <Text className='test-title'>录音测试</Text>

          {/* 录音控制按钮 */}
          <View className='recording-controls'>
            {!isRecording ? (
              <Button
                className='record-btn start-btn'
                onClick={this.handleStartRecording}
                disabled={uploading || recognizing}
              >
                <Text className='btn-text'>开始录音</Text>
              </Button>
            ) : (
              <Button
                className='record-btn stop-btn'
                onClick={this.handleStopRecording}
              >
                <Text className='btn-text'>停止录音</Text>
              </Button>
            )}
          </View>

          {/* 录音时长显示 */}
          {isRecording && (
            <View className='recording-status'>
              <Text className='status-text'>录音中...</Text>
              <Text className='duration-text'>{recordingDuration}秒</Text>
            </View>
          )}

          {/* 上传状态 */}
          {uploading && (
            <View className='status-info'>
              <Text className='status-text'>正在上传文件...</Text>
            </View>
          )}

          {/* 识别状态 */}
          {recognizing && (
            <View className='status-info'>
              <Text className='status-text'>正在识别语音...</Text>
            </View>
          )}

          {/* 文件URL显示 */}
          <View className='url-section'>
            <Text className='section-label'>文件URL:</Text>
            <Input
              className='url-input'
              value={fileUrl}
              placeholder='录音上传后，URL将显示在这里'
              disabled
            />
            <Button
              className='copy-btn'
              onClick={this.handleCopyUrl}
              disabled={!fileUrl}
            >
              <Text className='btn-text'>复制URL</Text>
            </Button>
          </View>

          {/* 语音识别结果 */}
          <View className='recognition-section'>
            <Text className='section-label'>语音识别结果:</Text>
            <Input
              className='recognition-input'
              value={recognitionText}
              placeholder='语音识别结果将显示在这里'
              disabled
            />
          </View>
        </View>
      </View>
    )
  }
}

