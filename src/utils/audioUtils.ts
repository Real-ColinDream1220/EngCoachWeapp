import Taro from '@tarojs/taro'

/**
 * 音频工具函数
 */

/**
 * 将PCM文件转换为WAV格式（添加WAV文件头）
 * @param pcmFilePath PCM文件路径
 * @param sampleRate 采样率（默认16000）
 * @param numberOfChannels 声道数（默认1，单声道）
 * @param bitsPerSample 采样精度（默认16位）
 * @returns Promise<string> 返回WAV文件路径
 */
export async function convertPcmToWav(
  pcmFilePath: string,
  sampleRate: number = 16000,
  numberOfChannels: number = 1,
  bitsPerSample: number = 16
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const fileSystem = Taro.getFileSystemManager()
      
      // 尝试读取PCM文件，如果失败则重试（确保文件已完全写入）
      let pcmData: ArrayBuffer | null = null
      let retryCount = 0
      const maxRetries = 3
      
      while (!pcmData && retryCount < maxRetries) {
        try {
          // 读取PCM文件内容（小程序可能返回ArrayBuffer或base64字符串）
          const pcmDataRaw = fileSystem.readFileSync(pcmFilePath)
          
          if (pcmDataRaw instanceof ArrayBuffer) {
            pcmData = pcmDataRaw
          } else if (typeof pcmDataRaw === 'string') {
            // 如果是base64字符串，需要转换
            // 但小程序readFileSync通常直接返回ArrayBuffer
            throw new Error('不支持base64格式的PCM文件')
          } else {
            // 尝试转换为ArrayBuffer
            pcmData = pcmDataRaw as ArrayBuffer
          }
          
          // 验证文件大小（PCM文件应该至少有几个字节）
          if (pcmData.byteLength === 0) {
            throw new Error('PCM文件为空')
          }
          
          break // 读取成功，退出循环
        } catch (readError: any) {
          retryCount++
          if (retryCount >= maxRetries) {
            reject(new Error('读取PCM文件失败，已重试' + maxRetries + '次: ' + (readError.message || '未知错误')))
            return
          }
          // 等待一段时间后重试（文件可能还在写入中）
          console.log(`⚠️ 读取PCM文件失败，${100 * retryCount}ms后重试 (${retryCount}/${maxRetries})...`)
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount))
        }
      }
      
      if (!pcmData) {
        reject(new Error('无法读取PCM文件'))
        return
      }
      
      // 计算数据大小和文件大小
      const pcmDataLength = pcmData.byteLength
      const totalFileSize = 44 + pcmDataLength // WAV文件总大小：44字节文件头 + PCM数据
      const riffChunkSize = totalFileSize - 8 // RIFF ChunkSize = 文件总大小 - 8 (RIFF标识符4字节 + ChunkSize字段4字节)
      
      // 计算音频参数
      const byteRate = Math.floor(sampleRate * numberOfChannels * bitsPerSample / 8) // 字节率
      const blockAlign = Math.floor(numberOfChannels * bitsPerSample / 8) // 块对齐
      
      console.log('📊 WAV文件头参数:')
      console.log('  - PCM数据大小:', pcmDataLength, '字节')
      console.log('  - 文件总大小:', totalFileSize, '字节')
      console.log('  - RIFF ChunkSize:', riffChunkSize, '字节')
      console.log('  - 采样率:', sampleRate, 'Hz')
      console.log('  - 声道数:', numberOfChannels)
      console.log('  - 位深度:', bitsPerSample, 'bits')
      console.log('  - 字节率:', byteRate)
      console.log('  - 块对齐:', blockAlign)
      
      // 创建WAV文件头（44字节）
      const wavHeader = new ArrayBuffer(44)
      const view = new DataView(wavHeader)
      let offset = 0
      
      // RIFF chunk descriptor (12 bytes)
      writeString(view, offset, 'RIFF') // 0-3: "RIFF"
      offset += 4
      view.setUint32(offset, riffChunkSize, true) // 4-7: ChunkSize (little-endian)
      offset += 4
      writeString(view, offset, 'WAVE') // 8-11: "WAVE"
      offset += 4
      
      // fmt sub-chunk (24 bytes)
      writeString(view, offset, 'fmt ') // 12-15: "fmt "
      offset += 4
      view.setUint32(offset, 16, true) // 16-19: Subchunk1Size = 16 (little-endian)
      offset += 4
      view.setUint16(offset, 1, true) // 20-21: AudioFormat = 1 (PCM, little-endian)
      offset += 2
      view.setUint16(offset, numberOfChannels, true) // 22-23: NumChannels (little-endian)
      offset += 2
      view.setUint32(offset, sampleRate, true) // 24-27: SampleRate (little-endian)
      offset += 4
      view.setUint32(offset, byteRate, true) // 28-31: ByteRate (little-endian)
      offset += 4
      view.setUint16(offset, blockAlign, true) // 32-33: BlockAlign (little-endian)
      offset += 2
      view.setUint16(offset, bitsPerSample, true) // 34-35: BitsPerSample (little-endian)
      offset += 2
      
      // data sub-chunk (8 bytes)
      writeString(view, offset, 'data') // 36-39: "data"
      offset += 4
      view.setUint32(offset, pcmDataLength, true) // 40-43: Subchunk2Size = PCM数据大小 (little-endian)
      
      // 验证offset是否正确
      if (offset + 4 !== 44) {
        console.error('❌ WAV文件头偏移错误，期望44字节，实际:', offset + 4)
      }
      
      // 合并WAV头和数据
      const wavData = new Uint8Array(44 + pcmDataLength)
      wavData.set(new Uint8Array(wavHeader), 0)
      wavData.set(new Uint8Array(pcmData), 44)
      
      // 生成WAV文件路径（使用与原文件相同的目录，但改扩展名为.wav）
      // 如果原文件没有扩展名或扩展名不是.pcm，则添加时间戳确保唯一性
      let wavFilePath: string
      if (pcmFilePath.toLowerCase().endsWith('.pcm')) {
        wavFilePath = pcmFilePath.replace(/\.pcm$/i, '.wav')
      } else {
        // 如果原文件没有.pcm扩展名，添加时间戳
        const timestamp = Date.now()
        const lastDotIndex = pcmFilePath.lastIndexOf('.')
        if (lastDotIndex > 0) {
          wavFilePath = pcmFilePath.substring(0, lastDotIndex) + `_${timestamp}.wav`
        } else {
          wavFilePath = pcmFilePath + `_${timestamp}.wav`
        }
      }
      
      // 写入文件（异步写入）
      // 注意：小程序的writeFile需要ArrayBuffer或base64字符串
      // 使用同步写入确保文件完全写入后才返回
      fileSystem.writeFile({
        filePath: wavFilePath,
        data: wavData.buffer, // ArrayBuffer格式
        success: () => {
          console.log('✅ PCM文件已转换为WAV格式')
          console.log('  原文件:', pcmFilePath)
          console.log('  新文件:', wavFilePath)
          console.log('  采样率:', sampleRate, 'Hz')
          console.log('  声道数:', numberOfChannels)
          console.log('  位深度:', bitsPerSample, 'bits')
          console.log('  文件大小:', wavData.byteLength, 'bytes')
          
          // 验证文件是否写入成功（可选，但建议添加）
          try {
            // 尝试读取文件验证写入是否完整
            const verifyData = fileSystem.readFileSync(wavFilePath)
            if (verifyData instanceof ArrayBuffer && verifyData.byteLength === wavData.byteLength) {
              console.log('✅ 文件写入验证成功，文件大小匹配')
              resolve(wavFilePath)
            } else {
              console.warn('⚠️ 文件大小不匹配，可能写入不完整')
              // 即使大小不匹配，也尝试继续（可能是文件系统延迟）
              setTimeout(() => resolve(wavFilePath), 100)
            }
          } catch (verifyError) {
            console.warn('⚠️ 文件验证失败，但继续:', verifyError)
            // 验证失败不影响流程，文件可能还在写入中
            setTimeout(() => resolve(wavFilePath), 100)
          }
        },
        fail: (err: any) => {
          console.error('❌ 写入WAV文件失败:', err)
          reject(new Error('写入WAV文件失败: ' + (err.errMsg || '未知错误')))
        }
      })
    } catch (error: any) {
      console.error('❌ PCM转WAV失败:', error)
      reject(new Error('PCM转WAV失败: ' + (error.message || '未知错误')))
    }
  })
}

/**
 * 在DataView中写入字符串
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

