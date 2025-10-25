import React, { useState, useEffect } from 'react'
import { View, Text, Picker } from '@tarojs/components'
import { AtCard, AtButton, AtInput, AtToast, AtList, AtListItem, AtIcon } from 'taro-ui'
import { BasicParams, OptionInfo } from '../../types/smartQuestion'
import { gradeAPI, difficultyAPI } from '../../utils/api'
import Taro from '@tarojs/taro'

interface BasicFilterProps {
  basicParams: BasicParams
  onParamsChange: (params: BasicParams) => void
  onNext: () => void
}

const BasicFilter: React.FC<BasicFilterProps> = ({ basicParams, onParamsChange, onNext }) => {
  const [gradeOptions, setGradeOptions] = useState<OptionInfo[]>([])
  const [difficultyOptions, setDifficultyOptions] = useState<OptionInfo[]>([])
  const [classOptions, setClassOptions] = useState<OptionInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastText, setToastText] = useState('')

  // 初始化班级选项
  useEffect(() => {
    const classOptionsData = [
      '1班', '2班', '3班', '4班', '5班',
      '6班', '7班', '8班', '9班', '10班'
    ].map((className, index) => ({
      label: className,
      value: index + 1
    }))
    setClassOptions(classOptionsData)
  }, [])

  // 获取年级数据
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true)
        const response = await gradeAPI.getGrades()
        if (response.success && response.result) {
          const options = response.result.map((grade: any) => ({ 
            label: grade.name, 
            value: grade.id 
          }))
          setGradeOptions(options)
        }
      } catch (error) {
        console.error('获取年级数据失败:', error)
        showToastMessage('获取年级数据失败')
      } finally {
        setLoading(false)
      }
    }

    fetchGrades()
  }, [])

  // 获取难度数据
  useEffect(() => {
    const fetchDifficulties = async () => {
      try {
        const response = await difficultyAPI.getDifficulties()
        if (response.success && response.result) {
          const options = response.result.map((difficulty: any) => ({ 
            label: difficulty.name, 
            value: difficulty.id 
          }))
          setDifficultyOptions(options)
        }
      } catch (error) {
        console.error('获取难度数据失败:', error)
        showToastMessage('获取难度数据失败')
      }
    }

    fetchDifficulties()
  }, [])

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
    if (key === 'grade') {
      newParams.textbookVersion = { label: '', value: 0 }
      newParams.textbook = { label: '', value: 0 }
      newParams.catalog = { label: '', value: 0 }
    }
    
    onParamsChange(newParams)
  }

  // 验证表单
  const validateForm = () => {
    if (!basicParams.grade?.value) {
      showToastMessage('请选择年级')
      return false
    }
    
    if (!basicParams.class?.value) {
      showToastMessage('请选择班级')
      return false
    }
    
    if (!basicParams.difficulty?.value) {
      showToastMessage('请选择难度')
      return false
    }
    
    if (!basicParams.questionCount || basicParams.questionCount <= 0) {
      showToastMessage('请输入有效的题目数量')
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
    <View className='basic-filter'>
      <AtCard title='基本参数设置' className='filter-card'>
        <View className='filter-content'>
          {/* 年级选择 */}
          <View className='filter-item'>
            <Text className='filter-label'>年级 *</Text>
            <Picker
              mode='selector'
              range={gradeOptions}
              rangeKey='label'
              value={gradeOptions.findIndex(item => item.value === basicParams.grade?.value)}
              onChange={(e) => {
                const selectedGrade = gradeOptions[e.detail.value as number]
                handleParamChange('grade', { 
                  label: selectedGrade?.label || '', 
                  value: selectedGrade?.value 
                })
              }}
            >
              <AtList>
                <AtListItem
                  title={basicParams.grade?.label || '请选择年级'}
                  arrow='right'
                />
              </AtList>
            </Picker>
          </View>

          {/* 班级选择 */}
          <View className='filter-item'>
            <Text className='filter-label'>班级 *</Text>
            <Picker
              mode='selector'
              range={classOptions}
              rangeKey='label'
              value={classOptions.findIndex(item => item.value === basicParams.class?.value)}
              onChange={(e) => {
                const selectedClass = classOptions[e.detail.value as number]
                handleParamChange('class', { 
                  label: selectedClass?.label || '', 
                  value: selectedClass?.value 
                })
              }}
            >
              <AtList>
                <AtListItem
                  title={basicParams.class?.label || '请选择班级'}
                  arrow='right'
                />
              </AtList>
            </Picker>
          </View>

          {/* 难度选择 */}
          <View className='filter-item'>
            <Text className='filter-label'>难度 *</Text>
            <Picker
              mode='selector'
              range={difficultyOptions}
              rangeKey='label'
              value={difficultyOptions.findIndex(item => item.value === basicParams.difficulty?.value)}
              onChange={(e) => {
                const selectedDifficulty = difficultyOptions[e.detail.value as number]
                handleParamChange('difficulty', { 
                  label: selectedDifficulty?.label || '', 
                  value: selectedDifficulty?.value 
                })
              }}
            >
              <AtList>
                <AtListItem
                  title={basicParams.difficulty?.label || '请选择难度'}
                  arrow='right'
                />
              </AtList>
            </Picker>
          </View>

          {/* 题目数量 */}
          <View className='filter-item'>
            <Text className='filter-label'>题目数量 *</Text>
            <AtInput
              type='number'
              placeholder='请输入题目数量'
              value={basicParams.questionCount.toString()}
              onChange={(value) => handleParamChange('questionCount', parseInt(value) || 0)}
              className='question-count-input'
            />
          </View>

          {/* 信息提示 */}
          <View className='info-tip'>
            <AtIcon value='info' size='16' color='#1890ff' />
            <Text className='tip-text'>请完成基本参数设置，然后选择知识点来源</Text>
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

export default BasicFilter
