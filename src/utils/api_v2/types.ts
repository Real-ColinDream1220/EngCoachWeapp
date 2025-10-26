// 通用类型定义

// 章节类型
export interface Chapter {
  id?: number
  textbook_id: number
  name: string
  description?: string
  ordinal?: number
  created_at?: string
  updated_at?: string
}

// 单元类型
export interface Unit {
  id?: number
  chapter_id: number
  name: string
  description?: string
  ordinal?: number
  created_at?: string
  updated_at?: string
}

// 练习类型
export interface Exercise {
  id?: number
  unit_id: number
  name: string
  description?: string
  vocabs?: string[]
  content?: string[]
  dialogue_num?: number
  ordinal?: number
  created_at?: string
  updated_at?: string
}

// 学生类型
export interface Student {
  id?: number
  name: string
  key?: string  // 4位随机不重复整数，新增时自动生成
  grade?: string
  class?: string
  created_at?: string
  updated_at?: string
}

// 音频类型
export interface Audio {
  id?: number
  student_id: number
  exercise_id: number
  file: string  // 数据库字段名为 file，存储音频文件URL
  duration?: number  // 音频时长（秒）
  message_text?: string  // 对应的消息文本
  ref_text?: string  // 参考文本（用于SOE评测）
  is_free?: boolean  // 是否为自由对话音频（true: 自由对话, false: 结构化练习）
  evaluation?: string  // 文字评价
  score?: number
  feedback?: string
  created_at?: string
  updated_at?: string
}

// 报告类型
export interface Report {
  id?: number
  student_id: number  // 学生ID（必填）
  exercise_id: number
  name: string
  audio_ids: number[]  // 音频ID数组
  summary?: string
  json_content?: string  // SOE评测结果的JSON字符串
  content?: string  // 学习建议内容
  created_at?: string
  updated_at?: string
}

// 列表返回数据
export interface ChapterListData {
  chapters: Chapter[]
}

export interface UnitListData {
  units: Unit[]
}

export interface ExerciseListData {
  exercises: Exercise[]
}

export interface StudentListData {
  students: Student[]
}

export interface AudioListData {
  audios: Audio[]
}

export interface ReportListData {
  reports: Report[]
}

// 详情返回数据
export interface ChapterDetailData {
  chapter: Chapter
}

export interface UnitDetailData {
  unit: Unit
}

export interface ExerciseDetailData {
  exercise: Exercise
}

export interface StudentDetailData {
  student: Student
}

export interface AudioDetailData {
  audio: Audio
}

export interface ReportDetailData {
  report: Report
}

// 编辑返回数据
export interface EditResponse {
  id: number
  message?: string
}

// 删除返回数据
export interface DeleteResponse {
  success: boolean
  message?: string
}

// 文件上传相关类型
export interface FileUploadResponse {
  coze_file_id: string
  document: {
    name: string
    file_type: string
    word_count: number
    size: number
    content: string
    channel: string
    version: number
    knowledge_id: number
    dify_id: string
    volc_doc_id: string
    creator_uid: number
    editor_uid: number
    file_id: number
    file_url: string
    description: string
    bid: number
    id: number
    created_at: string
    updated_at: string
  }
  file: {
    uuid: string
    type_id: number
    cloud_type: number
    file_type: number
    domain: string
    user_space: string
    uid: number
    from: string
    name: string
    url: string
    tag: string
    key: string
    temp_exist: boolean
    other: {
      size: number
      ext: string
    }
    content: string
    cover: string
    status: string
    path: string
    author: string
    file_id: number
    url_enc: string
    id: number
    created_at: string
    updated_at: string
  }
}

// SOE（语音评测）请求参数
export interface SoeParams {
  refText: string        // 参考文本（去掉QA后的消息文字）
  engineType: string     // 引擎类型，固定为 "16k_en"
  scoreCoeff: string     // 评分系数，固定为 "1.0"
  evalMode: string       // 评估模式，固定为 "1"
  recMode: string        // 识别模式，固定为 "0"
  voiceFormat: string    // 音频格式，固定为 "wav"
  file: string[]         // 音频文件URL数组
}

// SOE（语音评测）响应数据
export interface SoeResponse {
  // 根据实际返回数据调整类型
  [key: string]: any
}

// 数字人语音生成请求参数
export interface VoicePackParams {
  text_list: string[]    // 需要转语音的文本列表（去掉QA前缀）
  voice: string          // 语音类型，固定为 "longxiaochun_v2"
  speech_rate: number    // 语速，固定为 5
  pitch_rate: number     // 音调，固定为 5
}

// 数字人语音生成响应数据
export interface VoicePackItem {
  text: string           // 文本内容
  url: string            // 音频URL
}

export interface VoicePackResponse {
  data?: VoicePackItem[]
  result?: VoicePackItem[]
  status?: string
  success: boolean
}

