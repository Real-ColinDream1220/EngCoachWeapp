import { useState, useRef, useCallback, useEffect } from 'react'
import { TaroVoiceRecognitionService } from './TaroVoiceRecognitionService'

interface UseTaroVoiceServiceConfig {
  token: string
  appKey: string
  socketUrl?: string
  autoStopDelay?: number
}

interface UseTaroVoiceServiceCallbacks {
  onResult: (text: string, isFinal: boolean) => void
  onError?: (error: string) => void
  onStarted?: () => void
  onStopped?: () => void
}

interface UseTaroVoiceServiceReturn {
  isRecognizing: boolean
  startRecognition: () => Promise<void>
  stopRecognition: () => void
  getCurrentText: () => string
  destroy: () => void
}

export const useTaroVoiceService = (
  config: UseTaroVoiceServiceConfig,
  callbacks: UseTaroVoiceServiceCallbacks
): UseTaroVoiceServiceReturn => {
  const [isRecognizing, setIsRecognizing] = useState(false)
  const serviceRef = useRef<TaroVoiceRecognitionService | null>(null)
  const callbacksRef = useRef(callbacks)

  // 更新 callbacks ref
  useEffect(() => {
    callbacksRef.current = callbacks
  }, [callbacks])

  // 创建服务实例
  const createService = useCallback(() => {
    // 销毁旧实例
    if (serviceRef.current) {
      serviceRef.current.destroy()
    }

    // 创建新实例
    serviceRef.current = new TaroVoiceRecognitionService(
      config,
      {
        onResult: (text: string, isFinal: boolean) => {
          callbacksRef.current.onResult(text, isFinal)
        },
        onError: (error: string) => {
          setIsRecognizing(false)
          callbacksRef.current.onError?.(error)
        },
        onStarted: () => {
          setIsRecognizing(true)
          callbacksRef.current.onStarted?.()
        },
        onStopped: () => {
          setIsRecognizing(false)
          callbacksRef.current.onStopped?.()
        }
      }
    )

    return serviceRef.current
  }, [config])

  // 开始识别
  const startRecognition = useCallback(async () => {
    try {
      const service = createService()
      await service.start()
    } catch (error: any) {
      console.error('❌ 启动识别失败:', error)
      setIsRecognizing(false)
      callbacksRef.current.onError?.(error.message || '启动识别失败')
    }
  }, [createService])

  // 停止识别
  const stopRecognition = useCallback(() => {
    serviceRef.current?.stop()
  }, [])

  // 获取当前文本
  const getCurrentText = useCallback(() => {
    return serviceRef.current?.getCurrentText() || ''
  }, [])

  // 销毁服务
  const destroy = useCallback(() => {
    serviceRef.current?.destroy()
    serviceRef.current = null
    setIsRecognizing(false)
  }, [])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      destroy()
    }
  }, [destroy])

  return {
    isRecognizing,
    startRecognition,
    stopRecognition,
    getCurrentText,
    destroy
  }
}

