// 选项信息接口
export interface OptionInfo {
  label: string
  value: any
  disabled?: boolean
  childrens?: OptionInfo[]
}

// 基本参数接口
export interface BasicParams {
  grade: OptionInfo | null        // 年级
  class: OptionInfo | null        // 班级
  difficulty: OptionInfo | null   // 难度
  textbookVersion: OptionInfo | null // 教材版本
  textbook: OptionInfo | null     // 教材
  catalog: OptionInfo | null      // 章节
  questionCount: number          // 题目数量
}

// 知识点接口
export interface KnowledgePoint {
  id: number
  name: string
  catalogId: number
  kpointId: number
}

// 题型接口
export interface QuestionType {
  course_id: number
  parent_id: string
  name: string
  id: string
  objective: boolean
  ordinal: number
  count?: number
}

// 题型配置接口
export interface QuestionConfig {
  mode: 'auto' | 'manual'
  questionTypes: QuestionType[]
}

// 年级接口
export interface Grade {
  name: string
  id: number
  ordinal: number
}

// 难度接口
export interface Difficulty {
  ceiling: number
  flooring: number
  name: string
  id: number
}

// 教材版本接口
export interface TextbookVersion {
  course_id: number
  year: number
  name: string
  id: number
  ordinal: number
}

// 教材接口
export interface Textbook {
  volume: string
  course_id: number
  grade_id: number
  name: string
  term: string
  id: number
  version_id: number
  ordinal: number
}

// 章节接口
export interface CatalogItem {
  update_time: string
  create_time: string
  textbook_id: number
  parent_id: number
  name: string
  id: number
  type: string
  ordinal: number
  children_ids: number[]
}

// 章节知识点映射接口
export interface CatalogKpointMap {
  catalog_id: number
  kpoint_id: number
  kpoint_name: string
  direction: string
}

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  result?: T
  message?: string
  status?: string
}

// 智能出题参数接口
export interface SmartQuestionParams {
  grade_id: number
  class_id: number
  course_id: number
  difficulty_id: number
  question_count: number
  knowledge_points: number[]
  question_types?: string[]
  mode: 'auto' | 'manual'
}

// 组件状态接口
export interface SmartQuestionState {
  // 基本参数状态
  basicParams: BasicParams
  
  // 知识点选择状态
  selectedKnowledgePoints: KnowledgePoint[]
  selectedCatalogIds: number[]
  catalogKpointGroupedData: {[key: number]: KnowledgePoint[]}
  
  // 折叠状态管理
  knowledgeSectionCollapsed: boolean
  chapterCollapsedStates: Record<number, boolean>
  
  // 选项数据状态
  gradeOptions: OptionInfo[]
  classOptions: OptionInfo[]
  difficultyOptions: OptionInfo[]
  textbookVersionOptions: OptionInfo[]
  textbookOptions: OptionInfo[]
  catalogOptions: OptionInfo[]
  questionTypeOptions: OptionInfo[]
  
  // 题型配置状态
  questionConfig: QuestionConfig
  
  // UI状态
  showKnowledgeSection: boolean
  showQuestionConfig: boolean
  showInfoTip: boolean
  loading: boolean
}

// 班级选项接口
export interface ClassOption {
  label: string
  value: number
}

// 筛选表单数据接口
export interface FilterFormData {
  grade: string
  class: string
  difficulty: string
  textbookVersion: string
  textbook: string
  catalog: string
  questionCount: number
}
