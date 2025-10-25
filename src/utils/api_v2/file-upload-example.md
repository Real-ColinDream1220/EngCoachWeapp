# 文件上传接口使用示例

## 接口信息
- **接口路径**: `/api/file/upload`
- **请求方式**: `POST`
- **Content-Type**: `multipart/form-data`
- **字段名**: `file`

## 使用示例

### 1. 基本用法

```typescript
import { fileAPI } from '@/utils/api_v2'
import Taro from '@tarojs/taro'

// 选择文件并上传
const handleFileUpload = async () => {
  try {
    // 1. 选择文件
    const res = await Taro.chooseMessageFile({
      count: 1,
      type: 'file'
    })
    
    if (res.tempFiles && res.tempFiles.length > 0) {
      const filePath = res.tempFiles[0].path
      
      // 2. 上传文件
      Taro.showLoading({ title: '上传中...' })
      const uploadResult = await fileAPI.uploadFile(filePath)
      Taro.hideLoading()
      
      // 3. 处理上传结果
      if (uploadResult.success) {
        const fileUrl = uploadResult.data?.file.url || uploadResult.result?.file.url
        console.log('文件上传成功，URL:', fileUrl)
        
        Taro.showToast({
          title: '上传成功',
          icon: 'success'
        })
        
        return fileUrl
      }
    }
  } catch (error) {
    console.error('文件上传失败:', error)
    Taro.hideLoading()
    Taro.showToast({
      title: '上传失败',
      icon: 'none'
    })
  }
}
```

### 2. 录音文件上传示例

```typescript
import { fileAPI } from '@/utils/api_v2'
import Taro from '@tarojs/taro'

// 录音并上传
const handleRecordAndUpload = async () => {
  try {
    // 1. 开始录音
    const recorderManager = Taro.getRecorderManager()
    
    recorderManager.start({
      format: 'mp3'
    })
    
    // 2. 停止录音后自动上传
    recorderManager.onStop(async (res) => {
      const tempFilePath = res.tempFilePath
      
      // 3. 上传录音文件
      Taro.showLoading({ title: '上传录音中...' })
      const uploadResult = await fileAPI.uploadFile(tempFilePath)
      Taro.hideLoading()
      
      if (uploadResult.success) {
        const audioUrl = uploadResult.data?.file.url || uploadResult.result?.file.url
        console.log('录音上传成功，URL:', audioUrl)
        
        // 4. 保存音频URL到服务器或本地
        // 例如：保存到音频记录表
        
        Taro.showToast({
          title: '录音上传成功',
          icon: 'success'
        })
      }
    })
    
    // 停止录音（比如3秒后）
    setTimeout(() => {
      recorderManager.stop()
    }, 3000)
    
  } catch (error) {
    console.error('录音上传失败:', error)
    Taro.showToast({
      title: '操作失败',
      icon: 'none'
    })
  }
}
```

### 3. 图片上传示例

```typescript
import { fileAPI } from '@/utils/api_v2'
import Taro from '@tarojs/taro'

// 选择图片并上传
const handleImageUpload = async () => {
  try {
    // 1. 选择图片
    const res = await Taro.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera']
    })
    
    if (res.tempFilePaths && res.tempFilePaths.length > 0) {
      const filePath = res.tempFilePaths[0]
      
      // 2. 上传图片
      Taro.showLoading({ title: '上传中...' })
      const uploadResult = await fileAPI.uploadFile(filePath)
      Taro.hideLoading()
      
      // 3. 处理上传结果
      if (uploadResult.success) {
        const imageUrl = uploadResult.data?.file.url || uploadResult.result?.file.url
        console.log('图片上传成功，URL:', imageUrl)
        
        Taro.showToast({
          title: '上传成功',
          icon: 'success'
        })
        
        return imageUrl
      }
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    Taro.hideLoading()
    Taro.showToast({
      title: '上传失败',
      icon: 'none'
    })
  }
}
```

## 返回数据结构

```typescript
interface FileUploadResponse {
  coze_file_id: string
  document: {
    name: string
    file_type: string
    word_count: number
    size: number
    content: string
    // ... 其他字段
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
    name: string          // 文件名，例如："hb1g5-7p18o.mp3"
    url: string           // 文件访问URL
    tag: string
    key: string           // OSS存储路径
    temp_exist: boolean
    other: {
      size: number        // 文件大小（字节）
      ext: string         // 文件扩展名，例如：".mp3"
    }
    content: string
    cover: string
    status: string
    path: string
    author: string
    file_id: number
    url_enc: string       // 加密的URL
    id: number            // 文件ID
    created_at: string
    updated_at: string
  }
}
```

## 常用字段说明

- **file.url**: 文件的公开访问URL（推荐使用）
- **file.name**: 上传后的文件名
- **file.other.size**: 文件大小（字节）
- **file.other.ext**: 文件扩展名
- **file.id**: 文件在系统中的唯一ID
- **file.key**: 文件在OSS中的存储路径

## 注意事项

1. 上传前会自动带上 Authorization token
2. 支持的文件类型取决于后端配置
3. 文件大小限制取决于后端配置
4. 上传成功后可以从 `data.file.url` 或 `result.file.url` 获取文件URL
5. 推荐在上传前后添加加载提示，提升用户体验

