import { useState } from 'react'
import { View, Text, Button, Swiper, SwiperItem } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { store } from '../../store'
import './index.scss'

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)

  const onboardingSteps = [
    {
      icon: '📱',
      title: '欢迎使用 WordStory Builder',
      description: '通过拍照识别单词，AI智能生成英语故事，让学习更有趣！',
      tips: '一款专为英语学习者设计的智能学习工具'
    },
    {
      icon: '📷',
      title: '拍照识别单词',
      description: '只需拍一张包含英文单词的照片，系统将自动识别所有单词。',
      tips: '支持印刷体和清晰的手写文字识别'
    },
    {
      icon: '✏️',
      title: '编辑单词列表',
      description: '你可以编辑识别结果，添加遗漏的单词或删除不需要的内容。',
      tips: '确保单词列表准确无误，为生成故事做准备'
    },
    {
      icon: '⚙️',
      title: '设置学习难度',
      description: '根据你的年龄和英语水平，设置合适的学习难度。',
      tips: '系统会根据设置调整故事的复杂程度'
    },
    {
      icon: '✨',
      title: 'AI生成故事',
      description: 'AI将根据你的单词列表和难度设置，生成包含所有目标单词的有趣故事。',
      tips: '生成的故事长度在50-150词之间'
    },
    {
      icon: '🎯',
      title: '学习功能',
      description: '查看故事时，目标单词会高亮显示。你还可以点击单词查看释义，或使用语音朗读功能。',
      tips: '多种学习方式帮你更好地掌握单词'
    }
  ]

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    store.completeOnboarding()
    Taro.reLaunch({
      url: '/pages/index/index'
    })
  }

  const handleSwiperChange = (e) => {
    setCurrentStep(e.detail.current)
  }

  return (
    <View className='onboarding'>
      <View className='header'>
        <Button 
          className='skip-btn'
          onClick={handleSkip}
        >
          跳过
        </Button>
      </View>

      <Swiper 
        className='swiper-container'
        current={currentStep}
        onChange={handleSwiperChange}
        circular={false}
        indicatorDots={false}
      >
        {onboardingSteps.map((step, index) => (
          <SwiperItem key={index}>
            <View className='step-content'>
              <View className='step-icon'>{step.icon}</View>
              <Text className='step-title'>{step.title}</Text>
              <Text className='step-description'>{step.description}</Text>
              <Text className='step-tips'>{step.tips}</Text>
            </View>
          </SwiperItem>
        ))}
      </Swiper>

      {/* 指示器 */}
      <View className='indicators'>
        {onboardingSteps.map((_, index) => (
          <View 
            key={index}
            className={`indicator ${index === currentStep ? 'active' : ''}`}
          />
        ))}
      </View>

      {/* 导航按钮 */}
      <View className='navigation'>
        <Button 
          className={`nav-btn prev ${currentStep === 0 ? 'disabled' : ''}`}
          onClick={handlePrev}
          disabled={currentStep === 0}
        >
          上一步
        </Button>
        
        <Button 
          className='nav-btn next primary'
          onClick={handleNext}
        >
          {currentStep === onboardingSteps.length - 1 ? '开始使用' : '下一步'}
        </Button>
      </View>
    </View>
  )
} 