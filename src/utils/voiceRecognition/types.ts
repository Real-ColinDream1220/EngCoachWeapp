/**
 * 语音识别回调类型
 */
export interface VoiceRecognitionCallbacks {
  onResult: (text: string, isFinal: boolean) => void
  onError?: (error: string) => void
  onStarted?: () => void
  onStopped?: () => void
  onAutoStop?: () => void
  onDestroy?: (type: 'internalDestroy' | 'destroy') => void
}

/**
 * 语音识别配置类型
 */
export interface VoiceRecognitionConfig {
  socketUrl?: string
  token?: string
  appKey?: string
  autoStopDelay?: number
  gain?: number // 音频增益值，默认0.05
  // 录音配置
  format?: 'pcm' | 'wav' | 'mp3' // 录音格式，默认 'pcm'
  sampleRate?: number // 采样率，默认16000
  numberOfChannels?: number // 声道数，默认1（单声道）
  frameSize?: number // 帧大小，单位KB，默认50
}

