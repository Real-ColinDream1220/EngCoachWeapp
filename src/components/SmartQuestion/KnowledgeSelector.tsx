import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { AtCard, AtButton, AtToast, AtIcon, AtAccordion } from 'taro-ui'
import Taro from '@tarojs/taro'
import { BasicParams, KnowledgePoint } from '../../types/smartQuestion'
import { textbookAPI, knowledgeAPI } from '../../utils/api_v2'

interface KnowledgeSelectorProps {
  basicParams: BasicParams
  selectedKnowledgePoints: KnowledgePoint[]
  onKnowledgePointsChange: (points: KnowledgePoint[]) => void
  onNext: () => void
}

const KnowledgeSelector: React.FC<KnowledgeSelectorProps> = ({ 
  basicParams, 
  selectedKnowledgePoints, 
  onKnowledgePointsChange, 
  onNext 
}) => {
  const [catalogKpointGroupedData, setCatalogKpointGroupedData] = useState<{[key: number]: KnowledgePoint[]}>({})
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<number[]>([])
  const [chapterCollapsedStates, setChapterCollapsedStates] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastText, setToastText] = useState('')

  // 获取章节知识点映射数据
  useEffect(() => {
    if (basicParams.textbook?.value) {
      const fetchCatalogKpointMap = async () => {
        try {
          setLoading(true)
          
          // 1. 先获取所有目录
          const catalogsResponse = await textbookAPI.getCatalogs(basicParams.textbook.value)
          const catalogs = catalogsResponse.data?.catalogs || catalogsResponse.result?.catalogs
          
          if (!catalogs || catalogs.length === 0) {
            setCatalogKpointGroupedData({})
            return
          }
          
          // 2. 对每个目录获取知识点
          const groupedByCatalog: {[key: number]: KnowledgePoint[]} = {}
          
          await Promise.all(
            catalogs.map(async (catalog: any) => {
              try {
                const kpResponse = await knowledgeAPI.getKnowledgePoints(catalog.id)
                const knowledgePoints = kpResponse.data?.knowledge_points || kpResponse.result?.knowledge_points
                
                if (knowledgePoints && knowledgePoints.length > 0) {
                  groupedByCatalog[catalog.id] = knowledgePoints.map((kp: any) => ({
                    id: kp.id,
                    name: kp.name,
                    catalogId: catalog.id,
                    kpointId: kp.id
                  }))
                }
              } catch (error) {
                console.error(`获取目录 ${catalog.id} 的知识点失败:`, error)
              }
            })
          )
          
          setCatalogKpointGroupedData(groupedByCatalog)
        } catch (error) {
          console.error('获取知识点数据失败:', error)
          showToastMessage('获取知识点数据失败')
        } finally {
          setLoading(false)
        }
      }

      fetchCatalogKpointMap()
    }
  }, [basicParams.textbook])

  const showToastMessage = (text: string) => {
    setToastText(text)
    setShowToast(true)
  }

  // 添加知识点
  const handleAddKnowledgePoint = (kpointId: number) => {
    // 从所有章节中查找对应的知识点信息
    let targetKnowledgePoint: KnowledgePoint | null = null
    for (const chapterPoints of Object.values(catalogKpointGroupedData)) {
      const foundPoint = chapterPoints.find(kp => kp.kpointId === kpointId)
      if (foundPoint) {
        targetKnowledgePoint = foundPoint
        break
      }
    }

    if (!targetKnowledgePoint) {
      showToastMessage('未找到知识点信息')
      return
    }

    // 更新选中的目录ID
    setSelectedCatalogIds(prev => {
      if (!prev.includes(kpointId)) {
        return [...prev, kpointId]
      }
      return prev
    })

    // 添加到已选择的知识点列表
    const newPoints = [...selectedKnowledgePoints]
    if (!newPoints.find(p => p.kpointId === kpointId)) {
      newPoints.push(targetKnowledgePoint)
      onKnowledgePointsChange(newPoints)
    }

    showToastMessage('知识点已添加')
  }

  // 添加所有知识点
  const handleAddAllKnowledgePoints = (knowledgePoints: KnowledgePoint[]) => {
    // 更新选中的目录ID
    setSelectedCatalogIds(prev => {
      const newIds = knowledgePoints.map(kp => kp.kpointId).filter(id => !prev.includes(id))
      return [...prev, ...newIds]
    })

    // 添加到知识点列表
    const newPoints = [...selectedKnowledgePoints]
    const newPointsToAdd = knowledgePoints.filter(kp => !newPoints.find(p => p.id === kp.kpointId))
    newPoints.push(...newPointsToAdd)
    onKnowledgePointsChange(newPoints)

    showToastMessage(`已添加 ${knowledgePoints.length} 个知识点`)
  }

  // 添加本书所有知识点
  const handleAddAllBookKnowledgePoints = () => {
    // 获取所有章节的所有知识点
    const allKnowledgePoints = Object.values(catalogKpointGroupedData).flat()
    
    // 更新选中的目录ID
    setSelectedCatalogIds(prev => {
      const newIds = allKnowledgePoints.map(kp => kp.kpointId).filter(id => !prev.includes(id))
      return [...prev, ...newIds]
    })

    // 添加到知识点列表
    const newPoints = [...selectedKnowledgePoints]
    const newPointsToAdd = allKnowledgePoints.filter(kp => !newPoints.find(p => p.id === kp.kpointId))
    newPoints.push(...newPointsToAdd)
    onKnowledgePointsChange(newPoints)

    showToastMessage(`已添加本书所有 ${allKnowledgePoints.length} 个知识点`)
  }

  // 切换章节的折叠状态
  const toggleChapterCollapse = (catalogId: number) => {
    setChapterCollapsedStates(prev => ({
      ...prev,
      [catalogId]: !prev[catalogId]
    }))
  }

  // 移除知识点
  const handleRemoveKnowledgePoint = (kpointId: number) => {
    // 从已选择的知识点列表中移除
    const newPoints = selectedKnowledgePoints.filter(point => point.kpointId !== kpointId)
    onKnowledgePointsChange(newPoints)
    
    // 从选中的目录ID列表中移除
    setSelectedCatalogIds(prev => prev.filter(id => id !== kpointId))
    
    showToastMessage('知识点已移除')
  }

  // 清空所有知识点
  const handleClearAllKnowledgePoints = () => {
    Taro.showModal({
      title: '确认清空',
      content: '确定要清空所有已选择的知识点吗？',
      success: (res) => {
        if (res.confirm) {
          onKnowledgePointsChange([])
          setSelectedCatalogIds([])
          showToastMessage('已清空所有知识点')
        }
      }
    })
  }

  // 验证表单
  const validateForm = () => {
    if (selectedKnowledgePoints.length === 0) {
      showToastMessage('请至少选择一个知识点')
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
    <View className='knowledge-selector'>
      <AtCard title='知识点选择' className='selector-card'>
        <View className='selector-content'>
          {/* 提示信息 */}
          <View className='info-tip'>
            <AtIcon value='bulb' size='16' color='#faad14' />
            <Text className='tip-text'>可以通过章节筛选添加更多知识点</Text>
          </View>

          {loading ? (
            <View className='loading-container'>
              <AtIcon value='loading' size='32' color='#1890ff' />
              <Text className='loading-text'>加载知识点中...</Text>
            </View>
          ) : (
            <ScrollView className='knowledge-content' scrollY>
              {Object.keys(catalogKpointGroupedData).length > 0 ? (
                Object.entries(catalogKpointGroupedData).map(([catalogId, knowledgePoints], index) => (
                  <View key={catalogId} className='chapter-section'>
                    <AtAccordion
                      open={!chapterCollapsedStates[Number(catalogId)]}
                      onClick={() => toggleChapterCollapse(Number(catalogId))}
                      title={`章节 ${index + 1}`}
                      className='chapter-accordion'
                    >
                      <View className='chapter-header'>
                        <AtButton
                          type='primary'
                          size='small'
                          onClick={() => handleAddAllKnowledgePoints(knowledgePoints)}
                          disabled={knowledgePoints.every(kp => selectedCatalogIds.includes(kp.kpointId))}
                          className='add-all-btn'
                        >
                          <AtIcon value='plus' size='14' color='white' />
                          <Text className='btn-text'>添加本章所有知识点</Text>
                        </AtButton>
                      </View>
                      
                      {/* 知识点列表 */}
                      <View className='knowledge-points'>
                        {knowledgePoints.map((knowledgePoint) => (
                          <View key={knowledgePoint.kpointId} className='knowledge-point'>
                            <Text className='point-name'>{knowledgePoint.name}</Text>
                            <AtButton
                              type='secondary'
                              size='small'
                              onClick={() => handleAddKnowledgePoint(knowledgePoint.kpointId)}
                              disabled={selectedCatalogIds.includes(knowledgePoint.kpointId)}
                              className='add-point-btn'
                            >
                              <AtIcon value='plus' size='12' color='#1890ff' />
                              <Text className='btn-text'>
                                {selectedCatalogIds.includes(knowledgePoint.kpointId) ? '已添加' : '添加'}
                              </Text>
                            </AtButton>
                          </View>
                        ))}
                      </View>
                    </AtAccordion>
                  </View>
                ))
              ) : (
                <View className='empty-state'>
                  <AtIcon value='file' size='48' color='#d9d9d9' />
                  <Text className='empty-text'>暂无知识点数据</Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* 已选择的知识点 */}
          {selectedKnowledgePoints.length > 0 && (
            <View className='selected-points'>
              <View className='selected-header'>
                <Text className='selected-title'>已选择的知识点 ({selectedKnowledgePoints.length})</Text>
                <AtButton
                  type='secondary'
                  size='small'
                  onClick={handleClearAllKnowledgePoints}
                  className='clear-btn'
                >
                  <AtIcon value='close' size='12' color='#ff4d4f' />
                  <Text className='btn-text'>清空</Text>
                </AtButton>
              </View>
              
              <ScrollView className='selected-list' scrollY>
                {selectedKnowledgePoints.map((point, index) => (
                  <View key={point.kpointId} className='selected-point'>
                    <Text className='point-name'>{point.name}</Text>
                    <AtButton
                      type='secondary'
                      size='small'
                      onClick={() => handleRemoveKnowledgePoint(point.kpointId)}
                      className='remove-btn'
                    >
                      <AtIcon value='close' size='12' color='#ff4d4f' />
                    </AtButton>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* 操作按钮 */}
          <View className='action-buttons'>
            <AtButton
              type='primary'
              onClick={handleNext}
              className='next-button'
              disabled={selectedKnowledgePoints.length === 0}
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

export default KnowledgeSelector
