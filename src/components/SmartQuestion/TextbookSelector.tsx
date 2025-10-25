import React, { useState, useEffect } from 'react'
import { View, Text, Picker } from '@tarojs/components'
import { AtCard, AtButton, AtToast, AtList, AtListItem, AtIcon } from 'taro-ui'
import { BasicParams, OptionInfo } from '../../types/smartQuestion'
import { textbookAPI } from '../../utils/api_v2'

interface TextbookSelectorProps {
  basicParams: BasicParams
  onParamsChange: (params: BasicParams) => void
  onNext: () => void
}

const TextbookSelector: React.FC<TextbookSelectorProps> = ({ basicParams, onParamsChange, onNext }) => {
  const [textbookVersionOptions, setTextbookVersionOptions] = useState<OptionInfo[]>([])
  const [textbookOptions, setTextbookOptions] = useState<OptionInfo[]>([])
  const [catalogOptions, setCatalogOptions] = useState<OptionInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastText, setToastText] = useState('')

  // 获取教材版本数据
  useEffect(() => {
    const fetchTextbookVersions = async () => {
      // 默认使用英语学科 ID: 3
      // const courseId = basicParams.course?.value || 3
      const courseId = 3
      
      try {
        setLoading(true)
        const response = await textbookAPI.getTextbookVersions(courseId)
        const versions = response.data?.versions || response.result?.versions
        if (response.success && versions) {
          const options = versions.map((version: any) => ({ 
            label: version.name, 
            value: version.id 
          }))
          setTextbookVersionOptions(options)
        }
      } catch (error) {
        console.error('获取教材版本数据失败:', error)
        showToastMessage('获取教材版本数据失败')
      } finally {
        setLoading(false)
      }
    }

    fetchTextbookVersions()
  }, [3])

  // 监听教材版本变化，获取教材数据
  useEffect(() => {
    const versionId = basicParams.textbookVersion?.value
    if (versionId) {
      const fetchTextbooks = async () => {
        try {
          setLoading(true)
          const response = await textbookAPI.getTextbooks(
            3, // 英语学科固定为3
            versionId
          )
          const textbooks = response.data?.textbooks || response.result?.textbooks
          if (response.success && textbooks) {
            const options = textbooks.map((textbook: any) => ({ 
              label: textbook.name, 
              value: textbook.id 
            }))
            setTextbookOptions(options)
          }
        } catch (error) {
          console.error('获取教材数据失败:', error)
          showToastMessage('获取教材数据失败')
        } finally {
          setLoading(false)
        }
      }

      fetchTextbooks()
    } else {
      setTextbookOptions([])
      setCatalogOptions([])
    }
  }, [basicParams.textbookVersion])

  // 监听教材变化，获取章节数据
  useEffect(() => {
    const textbookId = basicParams.textbook?.value
    if (textbookId) {
      const fetchCatalog = async () => {
        try {
          setLoading(true)
          const response = await textbookAPI.getCatalogs(textbookId)
          const catalogs = response.data?.catalogs || response.result?.catalogs
          if (response.success && catalogs) {
            const options = catalogs.map((catalog: any) => ({ 
              label: catalog.name, 
              value: catalog.id 
            }))
            setCatalogOptions(options)
          }
        } catch (error) {
          console.error('获取章节数据失败:', error)
          showToastMessage('获取章节数据失败')
        } finally {
          setLoading(false)
        }
      }

      fetchCatalog()
    } else {
      setCatalogOptions([])
    }
  }, [basicParams.textbook])

  const showToastMessage = (text: string) => {
    setToastText(text)
    setShowToast(true)
  }

  // 处理参数变化
  const handleParamChange = (key: keyof BasicParams, value: any) => {
    const newParams = { 
      ...basicParams,
      [key]: value
    }
    
    // 级联清空逻辑
    if (key === 'textbookVersion') {
      newParams.textbook = { label: '', value: 0 }
      newParams.catalog = { label: '', value: 0 }
    } else if (key === 'textbook') {
      newParams.catalog = { label: '', value: 0 }
    }
    
    onParamsChange(newParams)
  }

  // 验证表单
  const validateForm = () => {
    if (!basicParams.textbookVersion?.value) {
      showToastMessage('请选择教材版本')
      return false
    }
    
    if (!basicParams.textbook?.value) {
      showToastMessage('请选择教材')
      return false
    }
    
    if (!basicParams.catalog?.value) {
      showToastMessage('请选择章节')
      return false
    }
    
    return true
  }

  // 处理下一步
  const handleNext = () => {
    if (validateForm()) {
      onNext()
    }
  }

  return (
    <View className='textbook-selector'>
      <AtCard title='教材选择' className='selector-card'>
        <View className='selector-content'>
          {/* 教材版本选择 */}
          <View className='selector-item'>
            <Text className='selector-label'>教材版本 *</Text>
            <Picker
              mode='selector'
              range={textbookVersionOptions}
              rangeKey='label'
              value={textbookVersionOptions.findIndex(item => item.value === basicParams.textbookVersion?.value)}
              onChange={(e) => {
                const selectedVersion = textbookVersionOptions[e.detail.value as number]
                handleParamChange('textbookVersion', { 
                  label: selectedVersion?.label || '', 
                  value: selectedVersion?.value 
                })
              }}
            >
              <AtList>
                <AtListItem
                  title={basicParams.textbookVersion?.label || '请选择教材版本'}
                  arrow='right'
                />
              </AtList>
            </Picker>
          </View>

          {/* 教材选择 */}
          <View className='selector-item'>
            <Text className='selector-label'>教材 *</Text>
            <Picker
              mode='selector'
              range={textbookOptions}
              rangeKey='label'
              value={textbookOptions.findIndex(item => item.value === basicParams.textbook?.value)}
              onChange={(e) => {
                const selectedTextbook = textbookOptions[e.detail.value as number]
                handleParamChange('textbook', { 
                  label: selectedTextbook?.label || '', 
                  value: selectedTextbook?.value 
                })
              }}
              disabled={!basicParams.textbookVersion?.value}
            >
              <AtList>
                <AtListItem
                  title={basicParams.textbook?.label || (basicParams.textbookVersion?.value ? '请选择教材' : '请先选择教材版本')}
                  arrow='right'
                />
              </AtList>
            </Picker>
          </View>

          {/* 章节选择 */}
          <View className='selector-item'>
            <Text className='selector-label'>章节 *</Text>
            <Picker
              mode='selector'
              range={catalogOptions}
              rangeKey='label'
              value={catalogOptions.findIndex(item => item.value === basicParams.catalog?.value)}
              onChange={(e) => {
                const selectedCatalog = catalogOptions[e.detail.value as number]
                handleParamChange('catalog', { 
                  label: selectedCatalog?.label || '', 
                  value: selectedCatalog?.value 
                })
              }}
              disabled={!basicParams.textbook?.value}
            >
              <AtList>
                <AtListItem
                  title={basicParams.catalog?.label || (basicParams.textbook?.value ? '请选择章节' : '请先选择教材')}
                  arrow='right'
                />
              </AtList>
            </Picker>
          </View>

          {/* 信息提示 */}
          <View className='info-tip'>
            <AtIcon value='info' size='16' color='#1890ff' />
            <Text className='tip-text'>完成教材选择后，可以开始选择知识点</Text>
          </View>

          {/* 操作按钮 */}
          <View className='action-buttons'>
            <AtButton
              type='primary'
              onClick={handleNext}
              className='next-button'
              loading={loading}
            >
              <AtIcon value='check' size='16' color='white' />
              <Text className='button-text'>下一步</Text>
            </AtButton>
          </View>
        </View>
      </AtCard>

      {/* Toast提示 */}
      <AtToast
        isOpened={showToast}
        text={toastText}
        status='error'
        duration={2000}
        onClose={() => setShowToast(false)}
      />
    </View>
  )
}

export default TextbookSelector
