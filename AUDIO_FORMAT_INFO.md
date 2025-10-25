# 🎵 音频格式说明

## 当前配置

项目使用 **WAV 格式**进行录音，配置如下：

### 录音参数

```typescript
{
  format: 'wav',          // 音频格式：WAV（无损）
  sampleRate: 16000,      // 采样率：16000Hz
  numberOfChannels: 1,    // 声道：单声道（mono）
  frameSize: 50           // 指定帧大小：50KB
}
```

### 参数详解

| 参数 | 值 | 说明 |
|------|-----|------|
| **格式** | WAV | 无损音频格式，便于分析和处理 |
| **采样率** | 16000 Hz | 标准语音识别采样率 |
| **采样精度** | 16 bits | WAV 默认 16-bit 精度（无损） |
| **声道** | 1 (单声道) | 减少文件大小，满足语音识别需求 |

---

## WAV vs MP3 对比

### ✅ WAV 格式优势

1. **无损音质**
   - 保留原始音频数据
   - 采样精度直接可见（16-bit）
   - 适合后续音频分析

2. **参数清晰**
   - `ffprobe` 可以直接看到 `bits_per_sample=16`
   - 不需要转换就能查看所有参数

3. **兼容性好**
   - 所有音频处理工具都支持
   - 便于后续处理和转换

4. **精确分析**
   ```bash
   $ ffprobe recording.wav
   
   编码格式: pcm_s16le (PCM 16-bit little-endian)
   采样率: 16000 Hz
   声道数: 1
   采样精度: 16 bits  ← 直接可见！
   ```

### ⚠️ WAV 格式劣势

1. **文件较大**
   - WAV 文件大小 ≈ MP3 的 10 倍
   - 1分钟录音约 1.9 MB（WAV）vs 0.2 MB（MP3）

2. **存储和传输**
   - 占用更多存储空间
   - 上传时间更长

---

## 文件大小估算

### WAV 格式

```
文件大小 = 采样率 × 采样精度 × 声道数 × 时长 / 8

示例（1分钟录音）：
= 16000 Hz × 16 bits × 1 声道 × 60 秒 / 8
= 1,920,000 bytes
≈ 1.9 MB
```

### MP3 格式（48 kbps）

```
文件大小 = 比特率 × 时长 / 8

示例（1分钟录音）：
= 48000 bps × 60 秒 / 8
= 360,000 bytes
≈ 0.36 MB
```

---

## 验证音频参数

### 使用分析脚本

```bash
# 在项目根目录运行
./check_audio.sh path/to/recording.wav
```

**期望输出：**
```
🎵 分析音频文件: recording.wav
==================================

📊 音频参数:
编码格式: pcm_s16le
采样率: 16000Hz
声道数: 1
采样精度: 16bits        ← WAV 格式可以直接看到！
比特率: 256000bps

✅ 检查结果:
  ✓ 采样率正确: 16000Hz
  ✓ 声道正确: 单声道(mono)
  ✓ 采样精度正确: 16bits

==================================
```

### 使用 FFprobe

```bash
# 简洁输出
ffprobe -v error -select_streams a:0 \
  -show_entries stream=sample_rate,channels,bits_per_sample,codec_name \
  -of default=noprint_wrappers=1 recording.wav

# 输出：
# codec_name=pcm_s16le
# sample_rate=16000
# channels=1
# bits_per_sample=16     ← 直接可见！
```

---

## 如何切换回 MP3

如果需要切换回 MP3 格式（例如节省存储空间），只需修改：

**文件：** `src/pages/conversation/index.tsx`

```typescript
// 找到 this.recorderManager.start() 方法
this.recorderManager.start({
  format: 'mp3',           // 改为 mp3
  sampleRate: 16000,
  numberOfChannels: 1,
  encodeBitRate: 48000,    // MP3 需要添加比特率
  frameSize: 50
})
```

---

## 推荐的工作流程

### 开发/测试阶段（当前）

✅ **使用 WAV**
- 便于验证录音参数
- 音质无损，方便调试
- 可以清晰看到所有参数

### 生产阶段（可选）

⚠️ **考虑切换到 MP3**
- 减少服务器存储成本
- 加快上传速度
- 降低用户流量消耗

**权衡建议：**
- 如果服务器存储充足 → 继续用 WAV
- 如果需要节省成本 → 切换到 MP3
- 可以在服务端进行 WAV → MP3 转换

---

## 常见问题

### Q: WAV 文件太大怎么办？

**A:** 有几种方案：

1. **前端保持 WAV，服务端转换**
   ```bash
   # 服务端接收 WAV 后转为 MP3
   ffmpeg -i input.wav -codec:a libmp3lame -b:a 48k output.mp3
   ```

2. **使用 AAC 格式**（折中方案）
   ```typescript
   format: 'aac'  // 比 WAV 小，比 MP3 音质好
   ```

3. **降低采样率**（不推荐）
   ```typescript
   sampleRate: 8000  // 文件减半，但音质下降
   ```

### Q: 如何验证采样精度？

**A:** WAV 格式可以直接查看：

```bash
# 方法1：使用脚本
./check_audio.sh recording.wav

# 方法2：直接用 ffprobe
ffprobe -show_entries stream=bits_per_sample recording.wav

# 方法3：用 Audacity 打开
# 底部显示 "32-bit float" 或 "16-bit"
```

### Q: 能同时录制 WAV 和 MP3 吗？

**A:** 不能。微信小程序 `RecorderManager` 一次只能录制一种格式。

建议方案：
1. 录制 WAV
2. 上传到服务器
3. 服务器转换为 MP3（如需）
4. 保存两个版本或只保存 MP3

---

## 技术参考

- 微信小程序录音 API：https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/RecorderManager.html
- WAV 格式规范：https://en.wikipedia.org/wiki/WAV
- FFmpeg 音频转换：https://ffmpeg.org/ffmpeg.html#Audio-Options

