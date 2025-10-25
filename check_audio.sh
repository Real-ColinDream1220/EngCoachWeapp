#!/bin/bash

# 音频文件分析脚本
# 使用方法: ./check_audio.sh your_audio.wav

if [ -z "$1" ]; then
    echo "❌ 请提供音频文件路径"
    echo "使用方法: ./check_audio.sh your_audio.wav"
    exit 1
fi

AUDIO_FILE="$1"

if [ ! -f "$AUDIO_FILE" ]; then
    echo "❌ 文件不存在: $AUDIO_FILE"
    exit 1
fi

echo "🎵 分析音频文件: $AUDIO_FILE"
echo "=================================="

# 检查是否安装了 ffprobe
if ! command -v ffprobe &> /dev/null; then
    echo "❌ ffprobe 未安装"
    echo "请运行: brew install ffmpeg"
    exit 1
fi

# 获取音频参数
echo ""
echo "📊 音频参数:"
ffprobe -v error -select_streams a:0 \
    -show_entries stream=sample_rate,channels,bit_rate,codec_name,bits_per_sample \
    -of default=noprint_wrappers=1:nokey=0 "$AUDIO_FILE" | \
    sed 's/codec_name=/编码格式: /' | \
    sed 's/sample_rate=/采样率: /' | sed 's/Hz$//' | sed 's/$/Hz/' | \
    sed 's/channels=/声道数: /' | \
    sed 's/bit_rate=/比特率: /' | sed 's/bps$//' | sed 's/$/bps/' | \
    sed 's/bits_per_sample=/采样精度: /' | sed 's/$/bits/'

echo ""
echo "✅ 检查结果:"
SAMPLE_RATE=$(ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of default=noprint_wrappers=1:nokey=1 "$AUDIO_FILE")
CHANNELS=$(ffprobe -v error -select_streams a:0 -show_entries stream=channels -of default=noprint_wrappers=1:nokey=1 "$AUDIO_FILE")
BITS_PER_SAMPLE=$(ffprobe -v error -select_streams a:0 -show_entries stream=bits_per_sample -of default=noprint_wrappers=1:nokey=1 "$AUDIO_FILE")

if [ "$SAMPLE_RATE" = "16000" ]; then
    echo "  ✓ 采样率正确: 16000Hz"
else
    echo "  ✗ 采样率不正确: ${SAMPLE_RATE}Hz (期望: 16000Hz)"
fi

if [ "$CHANNELS" = "1" ]; then
    echo "  ✓ 声道正确: 单声道(mono)"
else
    echo "  ✗ 声道不正确: ${CHANNELS}声道 (期望: 1声道)"
fi

if [ "$BITS_PER_SAMPLE" = "16" ]; then
    echo "  ✓ 采样精度正确: 16bits"
elif [ -z "$BITS_PER_SAMPLE" ] || [ "$BITS_PER_SAMPLE" = "0" ]; then
    echo "  ⚠ 采样精度: 无法检测 (压缩格式)"
else
    echo "  ✗ 采样精度不正确: ${BITS_PER_SAMPLE}bits (期望: 16bits)"
fi

echo ""
echo "=================================="

