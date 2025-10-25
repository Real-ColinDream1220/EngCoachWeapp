import React, { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { AtCard, AtButton, AtToast, AtIcon, AtInput, AtList, AtListItem } from 'taro-ui'
import { QuestionConfig, QuestionType, OptionInfo } from '../../types/smartQuestion'
import { questionTypeAPI } from '../../utils/api'

interface QuestionConfigProps {
  questionConfig: QuestionConfig
  onConfigChange: (config: QuestionConfig) => void
  onNext: () => void
}

const QuestionConfigComponent: React.FC<QuestionConfigProps> = ({ 
  questionConfig, 
  onConfigChange, 
  onNext 
}) => {
  const [questionTypeOptions, setQuestionTypeOptions] = useState<OptionInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastText, setToastText] = useState('')

  // 获取题型配置数据
  useEffect(() => {
    const fetchQuestionTypes = async () => {
      try {
        setLoading(true)
        const response = await questionTypeAPI.getQuestionTypes(3) // 英语学科固定为3
        if (response.success && response.result) {
          const options = response.result.map((type: any) => ({ 
            label: type.name, 
            value: type.id 
          }))
          setQuestionTypeOptions(options)
        }
      } catch (error) {
        console.error('获取题型配置数据失败:', error)
        showToastMessage('获取题型配置数据失败')
      } finally {
        setLoading(false)
      }
    }

    fetchQuestionTypes()
  }, [])

  const showToastMessage = (text: string) => {
    setToastText(text)
    setShowToast(true)
  }

  // 处理配置模式变化
  const handleModeChange = (mode: 'auto' | 'manual') => {
    onConfigChange({
      ...questionConfig,
      mode
    })
  }

  // 添加题型
  const handleAddQuestionType = (typeId: string) => {
    // 从API数据中查找对应的题型信息
    let targetQuestionType: QuestionType | null = null
    if (questionTypeOptions.length > 0) {
      const typeData = questionTypeOptions.find(opt => opt.value === typeId)
      if (typeData) {
        targetQuestionType = {
          course_id: 3, // 英语学科固定为3
          parent_id: '',
          id: typeId,
          name: typeData.label,
          objective: true,
          ordinal: 0,
          count: 1
        }
      }
    }

    if (targetQuestionType && !questionConfig.questionTypes.find(qt => qt.id === typeId)) {
      onConfigChange({
        ...questionConfig,
        questionTypes: [...questionConfig.questionTypes, targetQuestionType]
      })
    }
  }

  // 移除题型
  const handleRemoveQuestionType = (typeId: string) => {
    onConfigChange({
      ...questionConfig,
      questionTypes: questionConfig.questionTypes.filter(qt => qt.id !== typeId)
    })
  }

  // 修改题型数量
  const handleQuestionTypeCountChange = (typeId: string, count: number) => {
    onConfigChange({
      ...questionConfig,
      questionTypes: questionConfig.questionTypes.map(qt => 
        qt.id === typeId ? { ...qt, count } : qt
      )
    })
  }

  // 验证表单
  const validateForm = () => {
    if (questionConfig.mode === 'manual' && questionConfig.questionTypes.length === 0) {
      showToastMessage('请至少选择一种题型')
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
    <View className='question-config'>
      <AtCard title='题型配置' className='config-card'>
        <View className='config-content'>
          {/* 配置模式选择 */}
          <View className='mode-selection'>
            <Text className='mode-title'>配置模式</Text>
            <View className='mode-buttons'>
              <AtButton
                type={questionConfig.mode === 'auto' ? 'primary' : 'secondary'}
                onClick={() => handleModeChange('auto')}
                className='mode-button'
              >
                <AtIcon value='setting' size='16' color={questionConfig.mode === 'auto' ? 'white' : '#1890ff'} />
                <Text className='button-text'>自动配置</Text>
              </AtButton>
              <AtButton
                type={questionConfig.mode === 'manual' ? 'primary' : 'secondary'}
                onClick={() => handleModeChange('manual')}
                className='mode-button'
              >
                <AtIcon value='user' size='16' color={questionConfig.mode === 'manual' ? 'white' : '#1890ff'} />
                <Text className='button-text'>手动选择</Text>
              </AtButton>
            </View>
          </View>

          {/* 手动选择题型配置 */}
          {questionConfig.mode === 'manual' && (
            <View className='manual-config'>
              <Text className='config-title'>选择题型</Text>
              <View className='type-selection'>
                {questionTypeOptions.map((type: OptionInfo) => {
                  const isSelected = questionConfig.questionTypes.some(qt => qt.id === type.value)
                  return (
                    <AtButton
                      key={type.value}
                      type={isSelected ? "primary" : "secondary"}
                      size='small'
                      onClick={() => handleAddQuestionType(type.value)}
                      disabled={isSelected}
                      className='type-button'
                    >
                      <AtIcon value='edit' size='14' color={isSelected ? 'white' : '#1890ff'} />
                      <Text className='button-text'>{type.label}</Text>
                    </AtButton>
                  )
                })}
              </View>

              {/* 已选择的题型 */}
              {questionConfig.questionTypes.length > 0 && (
                <View className='selected-types'>
                  <Text className='selected-title'>已选择的题型</Text>
                  <View className='type-list'>
                    {questionConfig.questionTypes.map((type) => (
                      <View key={type.id} className='type-item'>
                        <View className='type-info'>
                          <AtIcon value='edit' size='16' color='#1890ff' />
                          <Text className='type-name'>{type.name}</Text>
                        </View>
                        <View className='type-controls'>
                          <Text className='count-label'>数量:</Text>
                          <AtInput
                            type='number'
                            value={type.count?.toString() || '1'}
                            onChange={(value) => handleQuestionTypeCountChange(type.id, parseInt(value) || 1)}
                            className='count-input'
                          />
                          <AtButton
                            type='secondary'
                            size='small'
                            onClick={() => handleRemoveQuestionType(type.id)}
                            className='remove-btn'
                          >
                            <AtIcon value='close' size='12' color='#ff4d4f' />
                          </AtButton>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* 自动配置提示 */}
          {questionConfig.mode === 'auto' && (
            <View className='auto-config-tip'>
              <AtIcon value='info' size='16' color='#1890ff' />
              <Text className='tip-text'>系统将根据您的基本参数和知识点自动配置题型分布</Text>
            </View>
          )}

          {/* 操作按钮 */}
          <View className='action-buttons'>
            <AtButton
              type='primary'
              onClick={handleNext}
              className='next-button'
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

export default QuestionConfigComponent
