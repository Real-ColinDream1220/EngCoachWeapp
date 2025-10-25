# 🎵 音频参数分析指南

## 快速开始

### 方法1：使用脚本（推荐）

```bash
# 分析单个音频文件
./check_audio.sh path/to/your/audio.mp3
```

**输出示例：**
```
🎵 分析音频文件: recording.mp3
==================================

📊 音频参数:
编码格式: mp3
采样率: 16000Hz
声道数: 1
比特率: 48000bps

✅ 检查结果:
  ✓ 采样率正确: 16000Hz
  ✓ 声道正确: 单声道(mono)

==================================
```

---

## 方法2：命令行工具

### 使用 FFprobe（最准确）

**安装：**
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
# 从 https://ffmpeg.org/download.html 下载
```

**分析命令：**
```bash
# 详细信息
ffprobe -i your_audio.mp3

# 只看音频参数
ffprobe -v error -select_streams a:0 \
  -show_entries stream=sample_rate,channels,bit_rate,codec_name \
  -of default=noprint_wrappers=1 your_audio.mp3
```

### 使用 SoX（Sound eXchange）

**安装：**
```bash
# macOS
brew install sox

# Ubuntu
sudo apt install sox
```

**分析命令：**
```bash
# 查看文件信息
soxi your_audio.mp3

# 输出示例：
# Sample Rate    : 16000
# Channels       : 1
# Bit Rate       : 48.0k
```

---

## 方法3：GUI 工具

### Audacity（免费、跨平台）

1. 下载：https://www.audacityteam.org/
2. 打开音频文件
3. 查看左下角显示的项目频率（采样率）
4. 菜单：`文件` → `属性` 查看详细信息

**查看内容：**
- 采样率（Sample Rate）
- 通道数（Channels）
- 比特率（Bit Rate）

### MediaInfo（免费、跨平台）

1. 下载：https://mediaarea.net/en/MediaInfo
2. 打开音频文件
3. 切换到 "Text" 视图

**显示内容：**
```
Audio
Format                   : MPEG Audio
Sampling rate            : 16.0 kHz
Channel(s)               : 1 channel
Channel layout           : Mono
Bit rate                 : 48.0 kb/s
```

---

## 方法4：在线工具

### 推荐网站：

1. **Get Audio Info**
   - 网址：https://www.get-metadata.com/
   - 特点：支持多种格式，显示详细元数据

2. **Audio Checker**
   - 网址：https://www.checkaudios.com/
   - 特点：简单直观，快速分析

3. **Online Audio Converter**
   - 网址：https://online-audio-converter.com/
   - 特点：不仅可以查看信息，还能转换格式

---

## 方法5：Python 脚本

如果你熟悉 Python，可以使用以下脚本：

```python
#!/usr/bin/env python3
import subprocess
import sys
import json

def analyze_audio(file_path):
    cmd = [
        'ffprobe',
        '-v', 'error',
        '-select_streams', 'a:0',
        '-show_entries', 'stream=sample_rate,channels,bit_rate,codec_name',
        '-of', 'json',
        file_path
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    data = json.loads(result.stdout)
    
    stream = data['streams'][0]
    
    print(f"🎵 音频文件: {file_path}")
    print("=" * 50)
    print(f"编码格式: {stream.get('codec_name', 'N/A')}")
    print(f"采样率: {stream.get('sample_rate', 'N/A')} Hz")
    print(f"声道数: {stream.get('channels', 'N/A')}")
    print(f"比特率: {stream.get('bit_rate', 'N/A')} bps")
    print("=" * 50)
    
    # 检查是否符合要求
    sample_rate = int(stream.get('sample_rate', 0))
    channels = int(stream.get('channels', 0))
    
    print("\n✅ 检查结果:")
    if sample_rate == 16000:
        print("  ✓ 采样率正确: 16000Hz")
    else:
        print(f"  ✗ 采样率错误: {sample_rate}Hz (期望: 16000Hz)")
    
    if channels == 1:
        print("  ✓ 声道正确: 单声道")
    else:
        print(f"  ✗ 声道错误: {channels}声道 (期望: 1声道)")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("使用方法: python3 analyze_audio.py your_audio.mp3")
        sys.exit(1)
    
    analyze_audio(sys.argv[1])
```

**使用：**
```bash
python3 analyze_audio.py your_audio.mp3
```

---

## 验证录音参数的步骤

### 1. 从小程序导出音频

小程序录音后，文件保存在临时目录。你需要：

**在微信开发者工具中：**
1. 打开调试器的 Console
2. 找到打印的文件路径（类似：`wxfile://tmp_xxx.mp3`）
3. 右键 → "在文件夹中显示"
4. 复制文件到你的电脑

**或者在代码中添加上传功能：**
```typescript
// 在 handleModalRecordStop 中
Taro.saveFile({
  tempFilePath: tempFilePath,
  success: (res) => {
    console.log('永久路径:', res.savedFilePath)
    // 可以通过微信开发者工具的存储面板找到这个文件
  }
})
```

### 2. 分析音频

使用上述任意方法分析导出的音频文件。

### 3. 验证参数

确认以下参数：
- ✅ 采样率 = 16000 Hz
- ✅ 声道数 = 1（单声道/mono）
- ✅ 采样精度 = 16 bits（MP3 格式中隐含）

---

## 常见问题

### Q: MP3 文件显示 bits_per_sample = 0？

**A:** 这是正常的。MP3 是有损压缩格式，不直接存储采样精度信息。微信小程序的录音器默认使用 16-bit 采样精度进行编码。

### Q: 如何确认实际的采样精度？

**A:** 
1. 将 MP3 转换为 WAV 格式：
   ```bash
   ffmpeg -i input.mp3 output.wav
   ```
2. 分析 WAV 文件：
   ```bash
   ffprobe output.wav
   ```
3. WAV 文件会显示准确的 `bits_per_sample` 值

### Q: 比特率不是正好 48000？

**A:** 这是正常的。MP3 使用可变比特率（VBR）或恒定比特率（CBR），实际值可能略有浮动（如 47000-49000）。

---

## 参考资料

- FFmpeg 官方文档：https://ffmpeg.org/documentation.html
- FFprobe 参数说明：https://ffmpeg.org/ffprobe.html
- 微信小程序录音 API：https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/RecorderManager.html
- 音频采样基础知识：https://en.wikipedia.org/wiki/Sampling_(signal_processing)

