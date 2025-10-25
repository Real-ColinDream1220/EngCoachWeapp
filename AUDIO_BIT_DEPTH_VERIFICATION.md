# 🎙️ 音频采样精度（16-bit）验证指南

## 当前配置

### 录音参数

```typescript
// src/pages/conversation/index.tsx
this.recorderManager.start({
  format: 'wav',              // 音频格式：WAV（无损）
  sampleRate: 16000,          // 采样率：16000Hz
  numberOfChannels: 1,        // 声道：单声道（mono）
  frameSize: 50               // 指定帧大小：50KB
})
```

## ✅ 为什么是 16 位？

### 微信小程序 WAV 格式规范

根据微信小程序官方文档，`RecorderManager` 使用 **WAV** 格式时：

- **编码方式**：PCM（脉冲编码调制）
- **采样精度**：**固定为 16-bit** (2 字节)
- **数据格式**：`pcm_s16le` (16-bit signed little-endian)

**重要：** 微信小程序的 WAV 录音**不支持**其他采样精度（如 8-bit、24-bit、32-bit），只能是 **16-bit**。

---

## 🔍 如何验证音频是 16 位？

### 方法 1：使用 FFprobe（推荐）

```bash
# 查看采样精度
ffprobe -v error -select_streams a:0 \
  -show_entries stream=bits_per_sample \
  -of default=noprint_wrappers=1:nokey=1 \
  recording.wav

# 应该输出：16
```

**完整信息：**
```bash
ffprobe -v error -select_streams a:0 \
  -show_entries stream=codec_name,sample_rate,channels,bits_per_sample \
  -of default=noprint_wrappers=1 \
  recording.wav

# 期望输出：
# codec_name=pcm_s16le        ← 16-bit PCM
# sample_rate=16000
# channels=1
# bits_per_sample=16          ← 16 位！
```

---

### 方法 2：使用分析脚本

项目中已提供 `check_audio.sh` 脚本：

```bash
./check_audio.sh recording.wav
```

**期望输出：**
```
🎵 分析音频文件: recording.wav
==================================

📊 音频参数:
编码格式: pcm_s16le
采样率: 16000Hz
声道数: 1
采样精度: 16bits          ← ✅ 确认是 16 位

✅ 检查结果:
  ✓ 采样率正确: 16000Hz
  ✓ 声道正确: 单声道(mono)
  ✓ 采样精度正确: 16bits   ← ✅ 验证通过

==================================
```

---

### 方法 3：使用 SoXI

```bash
# 安装 SoX
brew install sox

# 查看音频信息
soxi recording.wav

# 输出示例：
# Sample Rate    : 16000
# Channels       : 1
# Precision      : 16-bit        ← ✅ 16 位
# Duration       : 00:00:05.00
```

---

### 方法 4：使用 MediaInfo（GUI）

1. 下载 MediaInfo：https://mediaarea.net/en/MediaInfo
2. 打开 WAV 文件
3. 查看 **Bit depth** 字段

```
Audio
Format                   : PCM
Format settings          : Little / Signed
Codec ID                 : 1
Bit rate mode            : Constant
Bit rate                 : 256 kb/s
Channel(s)               : 1 channel
Sampling rate            : 16.0 kHz
Bit depth                : 16 bits       ← ✅ 16 位
Stream size              : 156 KiB
```

---

### 方法 5：使用 Audacity

1. 打开 Audacity
2. 导入 WAV 文件
3. 点击左侧音轨名称旁边的下拉菜单
4. 查看 **Format** 显示 `16-bit PCM`

或者：
- 菜单：`文件` → `属性`
- 查看 **Sample Format**: `16-bit`

---

## 📐 技术细节

### PCM 16-bit 数据范围

- **最小值**：-32768 (`-2^15`)
- **最大值**：32767 (`2^15 - 1`)
- **动态范围**：约 96 dB
- **量化级别**：65536 (2^16)

### WAV 文件结构

```
RIFF Header
├── fmt chunk
│   ├── Audio Format: 1 (PCM)
│   ├── Num Channels: 1
│   ├── Sample Rate: 16000
│   ├── Bits Per Sample: 16    ← ✅ 在这里定义
│   └── Byte Rate: 32000
└── data chunk
    └── PCM samples (16-bit)
```

### 文件大小计算

```
文件大小 = 采样率 × 采样精度(字节) × 声道数 × 时长(秒) + 头部

示例（10秒录音）：
= 16000 Hz × 2 bytes × 1 channel × 10 s + 44 bytes (WAV头)
= 320,000 + 44
= 320,044 bytes
≈ 312 KB
```

---

## 🧪 测试脚本

创建一个测试脚本来验证所有录音文件：

```bash
#!/bin/bash
# test_all_recordings.sh

echo "开始验证所有录音文件..."
echo ""

failed_count=0
passed_count=0

for file in *.wav; do
    if [ -f "$file" ]; then
        echo "检查: $file"
        
        bits=$(ffprobe -v error -select_streams a:0 \
               -show_entries stream=bits_per_sample \
               -of default=noprint_wrappers=1:nokey=1 "$file")
        
        if [ "$bits" = "16" ]; then
            echo "  ✅ 通过 (16-bit)"
            ((passed_count++))
        else
            echo "  ❌ 失败 (${bits}-bit)"
            ((failed_count++))
        fi
        echo ""
    fi
done

echo "=================================="
echo "总计: $((passed_count + failed_count)) 个文件"
echo "通过: $passed_count"
echo "失败: $failed_count"
echo "=================================="

if [ $failed_count -eq 0 ]; then
    echo "✅ 所有文件都是 16-bit！"
    exit 0
else
    echo "❌ 有 $failed_count 个文件不是 16-bit"
    exit 1
fi
```

**使用方法：**
```bash
chmod +x test_all_recordings.sh
./test_all_recordings.sh
```

---

## 🎯 关键保证

### 1. 微信小程序层面

✅ **WAV 格式强制使用 16-bit PCM**
- 无法配置为其他位数
- 系统自动保证

### 2. 参数配置

```typescript
format: 'wav'  // ✅ 使用 WAV 格式 = 自动 16-bit
```

**注意：** 如果使用 `mp3` 或 `aac` 格式，采样精度信息会丢失（压缩格式）。

### 3. 上传到服务器

WAV 文件上传后，服务器接收到的文件**保持原始的 16-bit 编码**。

### 4. SOE 评测接口

```typescript
voiceFormat: 'wav'  // SOE 接口要求 WAV 格式
```

SOE 接口接收 WAV 格式的音频，会正确识别 16-bit 采样精度。

---

## ⚠️ 常见问题

### Q: 如何确保 100% 是 16 位？

**A:** 使用 WAV 格式即可保证。微信小程序的 WAV 录音只支持 16-bit PCM，无法更改。

### Q: 如果需要其他位数怎么办？

**A:** 微信小程序不支持。如需其他位数：
1. 录制 16-bit WAV
2. 使用工具转换（不推荐，会损失精度或增加文件大小）

```bash
# 示例：转为 24-bit（不推荐）
ffmpeg -i input_16bit.wav -sample_fmt s32 output_24bit.wav
```

### Q: MP3 格式也是 16 位吗？

**A:** MP3 是有损压缩格式，没有明确的"位深度"概念。如果要求必须是 16-bit，请使用 **WAV 格式**。

### Q: 如何在代码中验证？

**A:** 可以在小程序中添加文件信息检查（虽然无法直接读取位深度）：

```typescript
// 在录音完成后
Taro.getFileInfo({
  filePath: savedFilePath,
  success: (res) => {
    console.log('📊 文件信息:')
    console.log('  大小:', res.size, 'bytes')
    
    // 通过文件大小估算采样精度
    const duration = recordData.duration  // 秒
    const expectedSize = 16000 * 2 * 1 * duration + 44  // 16000Hz × 2bytes × 1channel × duration + header
    const actualSize = res.size
    const sizeDiff = Math.abs(actualSize - expectedSize)
    
    if (sizeDiff < 1000) {  // 允许误差
      console.log('  ✅ 文件大小符合 16-bit WAV 预期')
    } else {
      console.log('  ⚠️  文件大小异常')
    }
  }
})
```

---

## 📚 参考资料

- 微信小程序 RecorderManager API：https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/RecorderManager.html
- WAV 文件格式规范：http://soundfile.sapp.org/doc/WaveFormat/
- PCM 编码说明：https://en.wikipedia.org/wiki/Pulse-code_modulation
- FFprobe 文档：https://ffmpeg.org/ffprobe.html

---

## ✅ 结论

**当前配置已经 100% 保证音频数据的采样位数为 16 位：**

1. ✅ 使用 WAV 格式
2. ✅ 微信小程序 WAV 录音固定为 16-bit PCM
3. ✅ 无法配置为其他位数
4. ✅ 可以通过多种工具验证

**你不需要做任何额外配置，当前设置已经完全满足要求！** 🎉

