import { useState, useEffect } from 'react'
import { View, Text, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { store } from '../../store'
import CustomNavBar from '../../components/CustomNavBar'
import { useNavBarHeight } from '../../hooks/useNavBarHeight'
import './index.scss'

export default function Index() {
  const [userSettings, setUserSettings] = useState(store.getUserSettings())
  const [currentStory, setCurrentStory] = useState(store.getCurrentStory())
  const [currentWords, setCurrentWords] = useState(store.getCurrentWords())
  const navBarHeight = useNavBarHeight()

  useEffect(() => {
    // 检查是否是首次使用，如果是则跳转到引导页
    if (store.isFirstTimeUser()) {
      Taro.navigateTo({
        url: '/pages/onboarding/index'
      })
    }
  }, [])

  const handleStartPhotoRecognition = () => {
    Taro.switchTab({
      url: '/pages/camera/index'
    })
  }

  const handleViewCurrentStory = () => {
    if (currentStory) {
      Taro.navigateTo({
        url: '/pages/story/index'
      })
    }
  }

  const handleSettings = () => {
    Taro.switchTab({
      url: '/pages/settings/index'
    })
  }

  const handleContinueWithWords = () => {
    if (currentWords.length > 0) {
      Taro.navigateTo({
        url: '/pages/wordList/index'
      })
    }
  }

  return (
    <View className='index'>
      <CustomNavBar title='WordStory Builder' />
      
      <View 
        className='main-content'
        style={{ paddingTop: `${navBarHeight}px` }}
      >
        <View className='header'>
          <Text className='title'>WordStory Builder</Text>
          <Text className='subtitle'>从照片到故事，让英语学习更有趣</Text>
        </View>

        <View className='content-wrapper'>
          {/* 快速开始 */}
          <View className='quick-start'>
            <Text className='section-title'>开始创作</Text>
            <Button 
              className='start-btn primary'
              onClick={handleStartPhotoRecognition}
            >
              📷 拍照识别单词
            </Button>
          </View>

          {/* 当前进度 */}
          {(currentWords.length > 0 || currentStory) && (
            <View className='current-progress'>
              <Text className='section-title'>当前进度</Text>
              
              {currentWords.length > 0 && !currentStory && (
                <View className='progress-item'>
                  <Text className='progress-text'>
                    已识别 {currentWords.length} 个单词
                  </Text>
                  <Button 
                    className='continue-btn'
                    onClick={handleContinueWithWords}
                  >
                    继续编辑单词
                  </Button>
                </View>
              )}

              {currentStory && (
                <View className='progress-item'>
                  <Text className='progress-text'>
                    已生成故事
                  </Text>
                  <Button 
                    className='continue-btn'
                    onClick={handleViewCurrentStory}
                  >
                    查看故事
                  </Button>
                </View>
              )}
            </View>
          )}

          {/* 功能介绍 */}
          <View className='features'>
            <Text className='section-title'>功能特色</Text>
            <View className='feature-list'>
              <View className='feature-item'>
                <Text className='feature-icon'>📖</Text>
                <View className='feature-text'>
                  <Text className='feature-title'>智能识别</Text>
                  <Text className='feature-desc'>拍照快速识别印刷体和手写单词</Text>
                </View>
              </View>
              
              <View className='feature-item'>
                <Text className='feature-icon'>✨</Text>
                <View className='feature-text'>
                  <Text className='feature-title'>AI生成故事</Text>
                  <Text className='feature-desc'>根据难度自动生成包含目标单词的故事</Text>
                </View>
              </View>
              
              <View className='feature-item'>
                <Text className='feature-icon'>🎯</Text>
                <View className='feature-text'>
                  <Text className='feature-title'>个性化学习</Text>
                  <Text className='feature-desc'>根据年龄和英语水平调整内容难度</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 设置入口 */}
          <View className='settings-section'>
            <Button 
              className='settings-btn secondary'
              onClick={handleSettings}
            >
              ⚙️ 学习设置
            </Button>
            <Text className='settings-info'>
              当前设置：{getDifficultyLabel(userSettings.difficulty)} | {getAgeGroupLabel(userSettings.ageGroup)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}

// 工具函数
const getDifficultyLabel = (difficulty: string): string => {
  const labels = {
    'A1': '入门级',
    'A2': '初级', 
    'B1': '中级',
    'B2': '中高级',
    'C1': '高级',
    'C2': '精通级'
  }
  return labels[difficulty] || difficulty
}

const getAgeGroupLabel = (ageGroup: string): string => {
  const labels = {
    'children': '儿童',
    'teenagers': '青少年',
    'adults': '成人'
  }
  return labels[ageGroup] || ageGroup
}
