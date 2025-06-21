import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import { authService } from './services/api'
import { store } from './store'

import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.')
    
    // 初始化用户状态
    store.initUserState()
    
    // 执行微信登录
    handleWechatLogin()
  })

  // 处理微信登录
  const handleWechatLogin = async () => {
    try {
      // 检查是否已经登录
      if (store.checkLoginStatus()) {
        console.log('用户已登录')
        return
      }

      // 获取微信登录code
      const loginResult = await Taro.login()
      
      if (loginResult.code) {
        console.log('获取到微信code:', loginResult.code)
        
        // 调用后端登录接口
        const result = await authService.wechatLogin(loginResult.code)
        
        if (result.success) {
          console.log('登录成功:', result.data)
          
          // 更新store中的用户信息
          store.setUserInfo(result.data.wechatUser)
          
          // 显示登录成功提示
          Taro.showToast({
            title: '登录成功',
            icon: 'success',
            duration: 2000
          })
        } else {
          console.error('登录失败:', result.message)
          
          // 登录失败，但不影响使用（可以提供游客模式）
          Taro.showToast({
            title: '登录失败，将以游客模式使用',
            icon: 'none',
            duration: 3000
          })
        }
      } else {
        console.error('获取微信code失败:', loginResult.errMsg)
      }
    } catch (error) {
      console.error('登录过程发生错误:', error)
      
      // 登录失败，但不影响使用
      Taro.showToast({
        title: '网络异常，将以游客模式使用',
        icon: 'none',
        duration: 3000
      })
    }
  }

  // children 是将要会渲染的页面
  return children
}

export default App
