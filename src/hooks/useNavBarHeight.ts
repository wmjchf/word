import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'

export const useNavBarHeight = () => {
  const [navBarHeight, setNavBarHeight] = useState(64)

  useEffect(() => {
    const getNavBarHeight = () => {
      try {
        const systemInfo = Taro.getSystemInfoSync()
        let statusBarHeight = systemInfo.statusBarHeight || 20
        let navHeight = 44

        // 微信小程序胶囊按钮信息
        if (process.env.TARO_ENV === 'weapp') {
          try {
            const menuButtonInfo = Taro.getMenuButtonBoundingClientRect()
            const capsuleTop = menuButtonInfo.top
            const capsuleHeight = menuButtonInfo.height
            const capsuleBottom = capsuleTop + capsuleHeight
            
            // 总高度 = 胶囊按钮底部 + 4px边距
            const totalHeight = capsuleBottom + 4
            setNavBarHeight(totalHeight)
            
            console.log('Hook胶囊信息:', {
              capsuleTop,
              capsuleHeight,
              capsuleBottom,
              finalTotalHeight: totalHeight
            })
            
            return // 直接返回，不需要下面的计算
          } catch (error) {
            console.warn('获取胶囊信息失败:', error)
            // 降级方案：使用经验值
            navHeight = 44
          }
        }

        const totalHeight = statusBarHeight + navHeight
        
        console.log('Hook导航栏高度信息:', {
          statusBarHeight,
          navHeight,
          totalHeight,
          env: process.env.TARO_ENV
        })
        
        setNavBarHeight(totalHeight)
      } catch (error) {
        console.error('获取系统信息失败:', error)
      }
    }

    getNavBarHeight()
  }, [])

  return navBarHeight
} 