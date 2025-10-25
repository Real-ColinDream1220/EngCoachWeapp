import { Component } from 'react'
import { View, Text, Input } from '@tarojs/components'
import { AtButton } from 'taro-ui'
import Taro from '@tarojs/taro'
import './index.scss'
import { studentAPI } from '../../utils/api_v2'

const SafeAtButton = AtButton || (() => <View>Button not available</View>)

export default class Login extends Component {
  state = {
    passcode: '',
    loading: false,
    errorMessage: ''
  }

  handleInput = (e: any) => {
    this.setState({ 
      passcode: e.detail.value,
      errorMessage: '' 
    })
  }

  handleLogin = async () => {
    const { passcode } = this.state

    if (!passcode || !passcode.trim()) {
      this.setState({ errorMessage: '请输入秘钥' })
      return
    }

    this.setState({ loading: true, errorMessage: '' })

    try {
      const trimmedPasscode = passcode.trim()
      
      // 检查是否是教师秘钥
      if (trimmedPasscode === '1234') {
        console.log('教师秘钥验证成功，跳转到 teacher 页面')
        Taro.setStorageSync('isTeacher', true)
        Taro.reLaunch({
          url: '/pages/teacher/index'
        })
        return
      }

      // 普通学生验证
      console.log('开始验证学生秘钥:', trimmedPasscode)
      const response = await studentAPI.getStudentByKey(trimmedPasscode)
      console.log('验证响应:', response)

      if (response.success) {
        const studentData = response.data || response.result
        console.log('登录成功，学生信息:', studentData)

        // 存储学生信息和 passcode 到本地
        Taro.setStorageSync('studentInfo', studentData)
        Taro.setStorageSync('passcode', trimmedPasscode)  // ✅ 保存 passcode
        Taro.setStorageSync('isLoggedIn', true)
        Taro.setStorageSync('isTeacher', false)

        console.log('已保存 passcode 到本地:', trimmedPasscode)

        // 跳转到首页
        Taro.reLaunch({
          url: '/pages/index/index'
        })
      } else {
        this.setState({ 
          errorMessage: '验证失败，请重试',
          loading: false 
        })
      }
    } catch (error: any) {
      console.error('登录失败:', error)
      
      // 处理404错误
      if (error.errorCode === 404 || error.statusCode === 404) {
        this.setState({ 
          errorMessage: '学生不存在，请检查秘钥是否正确',
          loading: false 
        })
      } else {
        this.setState({ 
          errorMessage: error.errorMessage || '验证失败，请重试',
          loading: false 
        })
      }
    }
  }

  render() {
    const { passcode, loading, errorMessage } = this.state

    return (
      <View className='login-page'>
        <View className='login-container'>
          <View className='logo-section'>
            <Text className='app-title'>EngCoach</Text>
            <Text className='app-subtitle'>英语口语训练助手</Text>
          </View>

          <View className='form-section'>
            <Text className='form-label'>请输入您的学习秘钥</Text>
            
            <Input
              className='passcode-input'
              type='text'
              placeholder='请输入秘钥'
              value={passcode}
              onInput={this.handleInput}
              disabled={loading}
            />

            {errorMessage && (
              <Text className='error-message'>{errorMessage}</Text>
            )}

            <SafeAtButton
              type='primary'
              className='login-btn'
              onClick={this.handleLogin}
              loading={loading}
              disabled={loading}
            >
              {loading ? '验证中...' : '确认登录'}
            </SafeAtButton>
          </View>

          <View className='footer-section'>
            <Text className='footer-text'>让每一次练习都有价值</Text>
          </View>
        </View>
      </View>
    )
  }
}

