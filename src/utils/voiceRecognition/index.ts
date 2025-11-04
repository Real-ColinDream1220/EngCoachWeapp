/**
 * Taro 小程序语音识别模块
 * 导出所有类型和服务
 */

// 导出类型
export * from './types'

// 导出服务类
// 方案1：使用 RecorderManager 的实时语音识别（推荐）
// 支持实时识别，通过 WebSocket 实时发送音频帧
export { TaroVoiceRecognitionService } from './TaroVoiceRecognitionService'

// 方案2：使用 Taro.startRecord() 的简化版语音识别
// 录音完成后识别，不实时，但更简单，不需要 RecorderManager
export { TaroVoiceRecognitionServiceSimple } from './TaroVoiceRecognitionServiceSimple'

