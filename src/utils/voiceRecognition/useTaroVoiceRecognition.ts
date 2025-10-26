import { useState, useRef, useCallback, useEffect } from 'react'
import Taro from '@tarojs/taro'

/**
 * Taro 语音识别 Hook（简化版）
 * 
 * 由于 Taro 小程序限制，这里使用录音完成后识别的方式
 * 而非实时流式识别
 */

interface UseTaroVoiceRecognitionOptions {
  onResult?: (text: string) => void
  onError?: (error: string) => void
  onStart?: () => void
  onStop?: () => void
}

interface UseTaroVoiceRecognitionReturn {
  isRecognizing: boolean
  recognizedText: string
  startRecognition: () => void
  stopRecognition: () => void
  clearText: () => void
}

export const useTaroVoiceRecognition = (
  options: UseTaroVoiceRecognitionOptions = {}
): UseTaroVoiceRecognitionReturn => {
  const { onResult, onError, onStart, onStop } = options

  const [isRecognizing, setIsRecognizing] = useState(false)
  const [recognizedText, setRecognizedText] = useState('')
  
  const recorderManager = useRef<any>(null)
  const startTimeRef = useRef<number>(0)

  // 初始化录音管理器
  useEffect(() => {
    if (!recorderManager.current) {
      recorderManager.current = Taro.getRecorderManager()
      
      // 监听录音开始
      recorderManager.current.onStart(() => {
        console.log('✅ 录音开始')
        setIsRecognizing(true)
        onStart?.()
      })

      // 监听录音停止
      recorderManager.current.onStop((res: any) => {
        console.log('✅ 录音停止', res)
        setIsRecognizing(false)
        onStop?.()
        
        // 处理录音文件
        handleRecordingFile(res.tempFilePath, res.duration)
      })

      // 监听录音错误
      recorderManager.current.onError((err: any) => {
        console.error('❌ 录音错误:', err)
        setIsRecognizing(false)
        const errorMsg = err.errMsg || '录音失败'
        onError?.(errorMsg)
        Taro.showToast({
          title: errorMsg,
          icon: 'none'
        })
      })
    }

    return () => {
      // 清理
      if (recorderManager.current) {
        recorderManager.current.onStart(null)
        recorderManager.current.onStop(null)
        recorderManager.current.onError(null)
      }
    }
  }, [onStart, onStop, onError])

  // 处理录音文件（使用微信小程序的语音识别）
  const handleRecordingFile = useCallback(async (tempFilePath: string, duration: number) => {
    try {
      console.log('🎤 开始语音识别...')
      
      // 使用微信小程序的 AI 语音识别接口
      const result: any = await Taro.getAIManager().asr({
        filePath: tempFilePath,
        engine: 'baidu',  // 使用百度引擎
        format: 'mp3',
        lang: 'en_US'     // 英文识别
      })
      
      console.log('✅ 识别成功:', result)
      
      if (result.result) {
        const text = result.result
        setRecognizedText(text)
        onResult?.(text)
      } else {
        throw new Error('识别结果为空')
      }
    } catch (error: any) {
      console.error('❌ 语音识别失败:', error)
      const errorMsg = error.errMsg || '语音识别失败'
      onError?.(errorMsg)
      
      Taro.showToast({
        title: errorMsg,
        icon: 'none'
      })
    }
  }, [onResult, onError])

  // 开始录音识别
  const startRecognition = useCallback(() => {
    if (isRecognizing) {
      console.log('⚠️  正在录音中，无法重复开始')
      return
    }

    try {
      startTimeRef.current = Date.now()
      
      // 开始录音
      recorderManager.current?.start({
        duration: 60000,  // 最长60秒
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitRate: 48000,
        format: 'mp3'
      })
    } catch (error: any) {
      console.error('❌ 启动录音失败:', error)
      onError?.(error.errMsg || '启动录音失败')
    }
  }, [isRecognizing, onError])

  // 停止录音识别
  const stopRecognition = useCallback(() => {
    if (!isRecognizing) {
      console.log('⚠️  未在录音中，无需停止')
      return
    }

    try {
      recorderManager.current?.stop()
    } catch (error: any) {
      console.error('❌ 停止录音失败:', error)
      onError?.(error.errMsg || '停止录音失败')
    }
  }, [isRecognizing, onError])

  // 清空识别文本
  const clearText = useCallback(() => {
    setRecognizedText('')
  }, [])

  return {
    isRecognizing,
    recognizedText,
    startRecognition,
    stopRecognition,
    clearText
  }
}

