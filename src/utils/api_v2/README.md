# API v2 接口文档

## 📁 文件结构

```
api_v2/
├── index.ts           # 统一导出
├── request.ts         # 通用请求函数
├── types.ts           # 类型定义
├── course.ts          # 课程接口
├── textbook.ts        # 教材接口
├── knowledge.ts       # 知识点接口
├── chapter.ts         # 章节接口 ✨
├── unit.ts            # 单元接口 ✨
├── exercise.ts        # 练习接口 ✨
├── student.ts         # 学生接口 ✨
├── audio.ts           # 音频接口 ✨
├── report.ts          # 报告接口 ✨
├── soe.ts             # 语音评测接口 ✨
├── voicePack.ts       # 数字人语音接口 ✨
├── content.ts         # AI内容生成接口 ✨
├── file.ts            # 文件上传接口 ✨
└── aiChat.ts          # AI聊天接口 ✨✨
```

## 🎯 接口总览（28个）

### 1. 章节管理 (Chapter) - 4个接口

```typescript
import { chapterAPI } from '@/utils/api_v2'

// 1.1 获取章节列表
const response = await chapterAPI.getChapterList(textbook_id?)
// GET /api/oral_eng/chapter/list

// 1.2 获取章节详情
const response = await chapterAPI.getChapterDetail(id)
// GET /api/oral_eng/chapter/detail

// 1.3 编辑章节
const response = await chapterAPI.editChapter({
  id?: number,           // 有id则编辑，无id则新增
  textbook_id: number,
  name: string,
  description?: string,
  ordinal?: number
})
// POST /api/oral_eng/chapter/edit

// 1.4 删除章节
const response = await chapterAPI.deleteChapter(id)
// DELETE /api/oral_eng/chapter/del
```

### 2. 单元管理 (Unit) - 4个接口

```typescript
import { unitAPI } from '@/utils/api_v2'

// 2.1 获取单元列表
const response = await unitAPI.getUnitList(chapter_id?)
// GET /api/oral_eng/unit/list

// 2.2 获取单元详情
const response = await unitAPI.getUnitDetail(id)
// GET /api/oral_eng/unit/detail

// 2.3 编辑单元
const response = await unitAPI.editUnit({
  id?: number,
  chapter_id: number,
  name: string,
  description?: string,
  ordinal?: number
})
// POST /api/oral_eng/unit/edit

// 2.4 删除单元
const response = await unitAPI.deleteUnit(id)
// DELETE /api/oral_eng/unit/del
```

### 3. 练习管理 (Exercise) - 4个接口

```typescript
import { exerciseAPI } from '@/utils/api_v2'

// 3.1 获取练习列表
const response = await exerciseAPI.getExerciseList(unit_id?)
// GET /api/oral_eng/exercise/list

// 3.2 获取练习详情
const response = await exerciseAPI.getExerciseDetail(id)
// GET /api/oral_eng/exercise/detail

// 3.3 编辑练习
const response = await exerciseAPI.editExercise({
  id?: number,
  unit_id: number,
  name: string,
  description?: string,
  vocabs?: string[],      // 词汇列表
  content?: string[],     // 对话内容（Q&A格式）
  dialogue_num?: number,  // 对话轮数
  ordinal?: number
})
// POST /api/oral_eng/exercise/edit

// 3.4 删除练习
const response = await exerciseAPI.deleteExercise(id)
// DELETE /api/oral_eng/exercise/del
```

### 4. 学生管理 (Student) - 6个接口

```typescript
import { studentAPI } from '@/utils/api_v2'

// 4.1 获取学生列表
const response = await studentAPI.getStudentList()
// GET /api/oral_eng/student/list

// 4.2 获取学生详情
const response = await studentAPI.getStudentDetail(id)
// GET /api/oral_eng/student/detail

// 4.3 通过Key获取学生 ⭐（用于学生登录）
const response = await studentAPI.getStudentByKey(key)
// GET /api/oral_eng/student/by_key

// 4.4 编辑学生
const response = await studentAPI.editStudent({
  id?: number,
  name: string,
  key?: string,     // 4位随机不重复整数，新增时自动生成
  grade?: string,
  class?: string
})
// POST /api/oral_eng/student/edit

// 4.5 删除学生
const response = await studentAPI.deleteStudent(id)
// DELETE /api/oral_eng/student/del

// 4.6 删除学生练习数据 ⭐（用于重新练习时清除旧数据）
const response = await studentAPI.deleteStudentExerciseData(student_id, exercise_id)
// DELETE /api/oral_eng/del_student_exercise_data
// 删除指定学生在指定练习中的所有音频和报告数据（is_free=false）
```

### 5. 音频管理 (Audio) - 4个接口

```typescript
import { audioAPI } from '@/utils/api_v2'

// 5.1 获取音频列表
const response = await audioAPI.getAudioList({
  student_id?: number,
  exercise_id?: number
})
// GET /api/oral_eng/audio/list

// 5.2 获取音频详情
const response = await audioAPI.getAudioDetail(id)
// GET /api/oral_eng/audio/detail

// 5.3 编辑音频
const response = await audioAPI.editAudio({
  id?: number,
  student_id: number,
  exercise_id: number,
  file: string,              // 音频文件URL
  duration?: number,         // 音频时长（秒）
  message_text?: string,     // 对应的消息文本
  is_free?: boolean,         // 是否为自由对话（true: 自由对话, false: 结构化练习）
  evaluation?: string,       // 文字评价
  score?: number,
  feedback?: string
})
// POST /api/oral_eng/audio/edit

// 5.4 删除音频
const response = await audioAPI.deleteAudio(id)
// DELETE /api/oral_eng/audio/del
```

### 6. 报告管理 (Report) - 4个接口

```typescript
import { reportAPI } from '@/utils/api_v2'

// 6.1 获取报告列表
const response = await reportAPI.getReportList(exercise_id?)
// GET /api/oral_eng/report/list

// 6.2 获取报告详情
const response = await reportAPI.getReportDetail(id)
// GET /api/oral_eng/report/detail

// 6.3 编辑报告
const response = await reportAPI.editReport({
  id?: number,
  exercise_id: number,
  name: string,
  audio_ids: number[],  // 音频ID数组
  summary?: string
})
// POST /api/oral_eng/report/edit

// 6.4 删除报告
const response = await reportAPI.deleteReport(id)
// DELETE /api/oral_eng/report/del
```

## 📊 接口统计

| 模块 | GET | POST | DELETE | 合计 |
|------|-----|------|--------|------|
| 章节 (Chapter) | 2 | 1 | 1 | 4 |
| 单元 (Unit) | 2 | 1 | 1 | 4 |
| 练习 (Exercise) | 2 | 1 | 1 | 4 |
| 学生 (Student) | 3 | 1 | 2 | 6 |
| 音频 (Audio) | 2 | 1 | 1 | 4 |
| 报告 (Report) | 2 | 1 | 1 | 4 |
| **总计** | **13** | **6** | **7** | **26** |

## 🔑 认证说明

所有接口都会自动携带 Token，已在 `request.ts` 中配置：

```typescript
const staticToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

## 📝 使用示例

### 完整示例：创建章节、单元、练习的完整流程

```typescript
import { chapterAPI, unitAPI, exerciseAPI } from '@/utils/api_v2'

// 1. 创建章节
const chapterRes = await chapterAPI.editChapter({
  textbook_id: 2931,
  name: '第一章',
  description: '基础对话',
  ordinal: 1
})
const chapterId = chapterRes.data?.id

// 2. 创建单元
const unitRes = await unitAPI.editUnit({
  chapter_id: chapterId,
  name: '问候语',
  description: '日常问候',
  ordinal: 1
})
const unitId = unitRes.data?.id

// 3. 创建练习
const exerciseRes = await exerciseAPI.editExercise({
  unit_id: unitId,
  name: '练习1',
  description: '问候练习',
  vocabs: ['hello', 'hi', 'good morning'],
  content: ['Q: Hello!', 'A: Hi there!', 'Q: How are you?', 'A: I\'m fine, thanks!'],
  dialogue_num: 2,
  ordinal: 1
})

console.log('练习创建成功:', exerciseRes.data?.id)
```

### 学生登录示例

```typescript
import { studentAPI } from '@/utils/api_v2'

// 学生输入4位Key登录
const key = '1234'
const response = await studentAPI.getStudentByKey(key)

if (response.success && response.data?.student) {
  const student = response.data.student
  console.log('登录成功:', student.name)
  // 保存学生信息到本地
  Taro.setStorageSync('student', student)
} else {
  console.log('登录失败，Key不存在')
}
```

### 音频上传和报告生成示例

```typescript
import { audioAPI, reportAPI } from '@/utils/api_v2'

// 1. 上传音频
const audio1 = await audioAPI.editAudio({
  student_id: 1,
  exercise_id: 10,
  file: 'https://example.com/audio1.mp3',
  duration: 30,
  message_text: 'Hello, how are you?',
  is_free: false,  // 结构化练习
  evaluation: '发音标准',
  score: 85
})

const audio2 = await audioAPI.editAudio({
  student_id: 2,
  exercise_id: 10,
  file: 'https://example.com/audio2.mp3',
  duration: 28,
  message_text: 'I am fine, thank you!',
  is_free: false,  // 结构化练习
  evaluation: '流利度好',
  score: 90
})

// 2. 生成报告（汇总多个学生的音频）
const report = await reportAPI.editReport({
  exercise_id: 10,
  name: '练习1汇总报告',
  audio_ids: [audio1.data.id, audio2.data.id],
  summary: '班级平均分：87.5'
})

console.log('报告生成成功:', report.data?.id)
```

## 🎨 TypeScript 类型支持

所有接口都有完整的 TypeScript 类型定义，在 `types.ts` 中：

```typescript
import { 
  Chapter, 
  Unit, 
  Exercise, 
  Student, 
  Audio, 
  Report 
} from '@/utils/api_v2'

// 使用类型
const chapter: Chapter = {
  textbook_id: 2931,
  name: '第一章',
  description: '基础对话'
}
```

## 🚀 快速开始

```typescript
// 1. 导入需要的API
import { chapterAPI, unitAPI, exerciseAPI, studentAPI } from '@/utils/api_v2'

// 2. 直接调用
const chapters = await chapterAPI.getChapterList(2931)
console.log(chapters.data?.chapters)
```

### 14. AI 聊天接口 (AI Chat) - 2个接口 ✨✨

```typescript
import { aiChatAPI } from '@/utils/api_v2'

// 14.1 获取对话主题 ID
const response = await aiChatAPI.topicEdit()
// POST /api/ai/chat/topic_edit
// 返回: { id: number }

// 14.2 AI 对话完成（SSE流式输出）
await aiChatAPI.completions({
  tid: number,                       // 对话主题ID
  text: string,                      // 用户消息文本
  onMessage: (chunk: string) => void, // 接收到消息块的回调
  onComplete: () => void,             // 完成回调
  onError?: (error: any) => void      // 错误回调（可选）
})
// POST /api/ai/chat/completions
// 参数: { tid, text, files: [], agent_id: 5778, ai_config: { agent_id: 5778 } }
// 响应: SSE 流式数据

// 使用示例
const topicResponse = await aiChatAPI.topicEdit()
const tid = topicResponse.data?.id || topicResponse.result?.id

let fullResponse = ''
await aiChatAPI.completions({
  tid,
  text: '你好',
  onMessage: (chunk) => {
    fullResponse += chunk
    console.log('接收到:', chunk)
  },
  onComplete: () => {
    console.log('完成！完整回复:', fullResponse)
  },
  onError: (error) => {
    console.error('错误:', error)
  }
})
```

## ✅ 已完成

- ✅ 28个接口全部实现
- ✅ 完整的 TypeScript 类型定义
- ✅ 自由对话功能（SSE流式输出）
- ✅ 统一的请求/响应处理
- ✅ 自动 Token 认证
- ✅ 错误处理和日志

