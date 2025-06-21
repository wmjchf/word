import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './CustomNavBar.scss'

interface CustomNavBarProps {
  title: string
  showBack?: boolean
  backgroundColor?: string
  textColor?: string
  onBack?: () => void
}

export default function CustomNavBar({
  title,
  showBack = false,
  backgroundColor = '#4A90E2',
  textColor = '#ffffff',
  onBack
}: CustomNavBarProps) {
  const [navBarInfo, setNavBarInfo] = useState({
    statusBarHeight: 20,
    navBarHeight: 44,
    totalHeight: 64
  })

  useEffect(() => {
    // 获取系统信息
    const getNavBarInfo = () => {
      try {
        const systemInfo = Taro.getSystemInfoSync()
        let statusBarHeight = systemInfo.statusBarHeight || 20
        let navBarHeight = 44
        
        // 微信小程序胶囊按钮信息
        if (process.env.TARO_ENV === 'weapp') {
          try {
            const menuButtonInfo = Taro.getMenuButtonBoundingClientRect()
            const capsuleTop = menuButtonInfo.top
            const capsuleHeight = menuButtonInfo.height
            const capsuleBottom = capsuleTop + capsuleHeight
            
            // 总高度 = 胶囊按钮底部 + 4px边距
            const totalHeight = capsuleBottom + 4
            navBarHeight = totalHeight - statusBarHeight
            
            console.log('胶囊信息:', {
              capsuleTop,
              capsuleHeight,
              capsuleBottom,
              calculatedTotal: totalHeight,
              finalNavHeight: navBarHeight
            })
          } catch (error) {
            console.warn('获取胶囊信息失败:', error)
            // 降级方案：使用经验值
            navBarHeight = 44
          }
        }

        const totalHeight = statusBarHeight + navBarHeight

        console.log('导航栏高度信息:', {
          statusBarHeight,
          navBarHeight,
          totalHeight,
          env: process.env.TARO_ENV
        })

        setNavBarInfo({
          statusBarHeight,
          navBarHeight,
          totalHeight
        })
      } catch (error) {
        console.error('获取系统信息失败:', error)
      }
    }

    getNavBarInfo()
  }, [])

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      Taro.navigateBack()
    }
  }

  return (
    <View 
      className='custom-nav-bar'
      style={{
        height: `${navBarInfo.totalHeight}px`,
        paddingTop: `${navBarInfo.statusBarHeight}px`,
        backgroundColor
      }}
    >
      <View 
        className='nav-bar-content'
        style={{
          height: `${navBarInfo.navBarHeight}px`,
          color: textColor
        }}
      >
        {/* 左侧返回按钮区域 */}
        <View className='nav-left'>
          {showBack && (
            <View className='back-button' onClick={handleBack}>
              <Text className='back-icon' style={{ color: textColor }}>‹</Text>
              <Text className='back-text' style={{ color: textColor }}>返回</Text>
            </View>
          )}
        </View>

        {/* 中间标题 */}
        <View className='nav-center'>
          <Text className='nav-title' style={{ color: textColor }}>
            {title}
          </Text>
        </View>

        {/* 右侧占位区域（避开胶囊按钮） */}
        <View 
          className='nav-right'
          style={{
            width: process.env.TARO_ENV === 'weapp' ? '87px' : '20px'
          }}
        />
      </View>
    </View>
  )
} 