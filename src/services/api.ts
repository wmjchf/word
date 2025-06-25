import Taro from '@tarojs/taro'
import { store } from '../store'

// 配置API基础地址
const BASE_URL = 'https://wobufang.com'

// WebSocket连接管理器
class WebSocketManager {
  private url: string
  private options: any
  private socketTask: Taro.SocketTask | null = null
  private listeners: {
    onMessage?: (data: any) => void
    onOpen?: () => void
    onClose?: () => void
    onError?: (error: any) => void
  } = {}
  private isConnecting = false
  private shouldReconnect = true
  
  constructor(url: string, options: any = {}) {
    this.url = url
    this.options = options
  }
  
  // 连接WebSocket
  async connect(): Promise<Taro.SocketTask> {
    if (this.isConnecting) {
      throw new Error('Already connecting')
    }
    
    if (this.socketTask) {
      this.socketTask.close()
      this.socketTask = null
    }
    
    this.isConnecting = true
    
    try {
      const token = Taro.getStorageSync('accessToken')
      console.log('WebSocket连接使用token:', token)
      
      const socketTask = await Taro.connectSocket({
        url: this.url,
        header: {
          accessToken: token,
          ...this.options.header
        },
        ...this.options
      })
      
      this.socketTask = socketTask
      this.setupListeners()
      
      return socketTask
    } finally {
      this.isConnecting = false
    }
  }
  
  // 设置监听器
  private setupListeners() {
    if (!this.socketTask) return
    
    this.socketTask.onOpen(() => {
      console.log('WebSocket连接成功')
      this.listeners.onOpen?.()
    })
    
    this.socketTask.onMessage((messageRes) => {
      this.listeners.onMessage?.(messageRes)
    })
    
    this.socketTask.onClose(() => {
      console.log('WebSocket连接关闭')
      this.socketTask = null
      this.listeners.onClose?.()
      
      // 如果需要重连且不是手动关闭，尝试重连
      if (this.shouldReconnect) {
        setTimeout(() => {
          console.log('尝试重新连接WebSocket')
          this.connect().catch(err => {
            console.error('WebSocket重连失败:', err)
          })
        }, 3000)
      }
    })
    
    this.socketTask.onError((error) => {
      console.error('WebSocket错误:', error)
      this.listeners.onError?.(error)
    })
  }
  
  // 设置事件监听器
  onMessage(callback: (data: any) => void) {
    this.listeners.onMessage = callback
  }
  
  onOpen(callback: () => void) {
    this.listeners.onOpen = callback
  }
  
  onClose(callback: () => void) {
    this.listeners.onClose = callback
  }
  
  onError(callback: (error: any) => void) {
    this.listeners.onError = callback
  }
  
  // 重新连接（用于token更新后）
  async reconnectWithNewToken(): Promise<void> {
    console.log('检测到token更新，重新连接WebSocket')
    await this.connect()
  }
  
  // 关闭连接
  close() {
    this.shouldReconnect = false
    if (this.socketTask) {
      this.socketTask.close()
      this.socketTask = null
    }
  }
  
  // 获取连接状态
  isConnected(): boolean {
    return this.socketTask !== null
  }
}

// 全局WebSocket管理器存储
const globalWebSocketManagers: WebSocketManager[] = []

// 创建WebSocket连接管理器
export const createWebSocketManager = (url: string, options: any = {}): WebSocketManager => {
  const manager = new WebSocketManager(url, options)
  globalWebSocketManagers.push(manager)
  return manager
}

// 全局WebSocket重连函数（在token更新后调用）
export const reconnectAllWebSockets = async (): Promise<void> => {
  console.log(`开始重连所有WebSocket连接，共${globalWebSocketManagers.length}个`)
  
  const reconnectPromises = globalWebSocketManagers.map(manager => {
    return manager.reconnectWithNewToken().catch(err => {
      console.error('WebSocket重连失败:', err)
    })
  })
  
  await Promise.all(reconnectPromises)
  console.log('所有WebSocket重连完成')
}

// 保持向后兼容的旧接口
export const createWebSocketConnection = (url: string, options: any = {}) => {
  const manager = createWebSocketManager(url, options)
  
  return {
    connect: () => manager.connect(),
    getCurrentToken: () => Taro.getStorageSync('accessToken'),
    manager // 返回管理器实例以便高级使用
  }
}

// 全局错误处理工具
export const handleGlobalError = {
  // 显示网络错误提示
  showNetworkError: (error: any) => {
    console.error('网络请求错误:', error)
    
    if (error.errMsg) {
      if (error.errMsg.includes('timeout')) {
        Taro.showToast({
          title: '网络超时，请重试',
          icon: 'error',
          duration: 2000
        })
      } else if (error.errMsg.includes('fail')) {
        Taro.showToast({
          title: '网络异常，请检查网络',
          icon: 'error',
          duration: 2000
        })
      } else {
        Taro.showToast({
          title: '请求失败，请重试',
          icon: 'error',
          duration: 2000
        })
      }
    } else {
      Taro.showToast({
        title: '网络错误，请重试',
        icon: 'error',
        duration: 2000
      })
    }
  },
  
  // 显示登录过期对话框
  showLoginExpiredDialog: () => {
    Taro.showModal({
      title: '登录过期',
      content: '登录已过期，请重新进入小程序',
      showCancel: false,
      confirmText: '重新进入',
      success: () => {
        Taro.reLaunch({
          url: '/pages/index/index'
        })
      }
    })
  },
  
  // 检查是否为401错误
  is401Error: (error: any): boolean => {
    return error && (
      error.statusCode === 401 || 
      error.code === 401 ||
      error.message === 'TOKEN_EXPIRED'
    )
  }
}

// 请求队列，用于存储401期间的请求
let isRefreshing = false
let requestQueue: Array<{
  resolve: (value: any) => void
  reject: (reason: any) => void
  config: any
}> = []

// 处理401错误，尝试刷新token或重新登录
const handle401Error = async () => {
  console.log('检测到401错误，开始处理登录过期')
  
  // 清除用户登录状态
  store.logout()
  authService.logout()
  
  try {
    // 尝试重新进行微信登录
    const loginResult = await Taro.login()
    
    if (loginResult.code) {
      console.log('重新获取微信code成功，开始自动登录')
      
      const result = await authService.wechatLogin(loginResult.code)
      
      if (result.success) {
        console.log('自动重新登录成功')
        store.setUserInfo(result.data.wechatUser)
        
        // 显示重新登录成功提示
        Taro.showToast({
          title: '已重新登录',
          icon: 'success',
          duration: 2000
        })
        
        return true
      } else {
        console.error('自动重新登录失败:', result.message)
        return false
      }
    } else {
      console.error('重新获取微信code失败')
      return false
    }
  } catch (error) {
    console.error('处理401错误时发生异常:', error)
    return false
  }
}

// 处理请求队列
const processRequestQueue = (error: any = null, token: string | null = null) => {
  requestQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error)
    } else {
      // 更新token并重试请求
      if (token) {
        config.header = {
          ...config.header,
          'accessToken': token
        }
      }
      resolve(makeRequest(config))
    }
  })
  
  requestQueue = []
}

// 实际发送请求的函数
const makeRequest = async (config: any) => {
  try {
    const response = await Taro.request(config)
    return response
  } catch (error) {
    throw error
  }
}

// 通用请求封装
const request = async (url: string, options: any = {}) => {
  const token = Taro.getStorageSync('accessToken')
  
  const config = {
    url: `${BASE_URL}${url}`,
    method: 'GET',
    header: {
      'Content-Type': 'application/json',
      ...(token && { 'accessToken': token }),
      ...options.header
    },
    ...options
  }

  try {
    const response = await makeRequest(config)
    console.log('response111', response)
    // 检查响应状态码
    if (response.statusCode === 401) {
      console.log('收到401响应，token可能已过期')
      
      // 如果正在刷新token，将请求加入队列
      if (isRefreshing) {
        console.log('正在刷新token，将请求加入队列')
        return new Promise((resolve, reject) => {
          requestQueue.push({ resolve, reject, config })
        })
      }
      
      isRefreshing = true
      
      try {
        // 直接进行重新登录
        console.log('检测到401错误，开始重新登录')
        const reLoginSuccess = await handle401Error()
        
        if (reLoginSuccess) {
          console.log('重新登录成功，重试原始请求')
          const newToken = Taro.getStorageSync('accessToken')
          
          // 重连所有WebSocket连接
          reconnectAllWebSockets().catch(err => {
            console.error('重连WebSocket失败:', err)
          })
          
          // 处理队列中的请求
          processRequestQueue(null, newToken)
          
          // 重试当前请求
          config.header.accessToken = newToken
          const retryResponse = await makeRequest(config)
          
          if (retryResponse.statusCode >= 200 && retryResponse.statusCode < 300) {
            return retryResponse.data
          } else {
            throw new Error(`Retry request failed with status ${retryResponse.statusCode}`)
          }
        } else {
          // 重新登录失败
          console.log('重新登录失败')
          const error = new Error('登录已过期，请重新进入小程序')
          processRequestQueue(error)
          
          handleGlobalError.showLoginExpiredDialog()
          
          throw error
        }
      } finally {
        isRefreshing = false
      }
    } else if (response.statusCode >= 200 && response.statusCode < 300) {
      return response.data
    } else {
      throw new Error(`Request failed with status ${response.statusCode}`)
    }
  } catch (error) {
    // 如果不是401错误，则显示网络错误提示
    if (!handleGlobalError.is401Error(error)) {
      handleGlobalError.showNetworkError(error)
    }
    
    throw error
  }
}

// 登录相关接口（需要在request函数之前声明，因为request函数会用到）
export const authService = {
  // 微信登录
  wechatLogin: async (code: string) => {
    try {
      const response = await request('/sso/login/wechat', {
        method: 'GET',
        url: `${BASE_URL}/sso/login/wechat?code=${code}&appName=wordlings`
      })
      
      if (response.code === 200) {
        // 保存token和用户信息
        Taro.setStorageSync('accessToken', response.data.accessToken)
        Taro.setStorageSync('refreshToken', response.data.refreshToken)
        Taro.setStorageSync('userInfo', response.data.wechatUser)
        
        return {
          success: true,
          data: response.data
        }
      } else {
        return {
          success: false,
          message: response.msg || '登录失败'
        }
      }
    } catch (error) {
      console.error('登录失败:', error)
      return {
        success: false,
        message: '网络错误，请稍后重试'
      }
    }
  },
  
  // 刷新token
  refreshToken: async () => {
    try {
      const refreshToken = Taro.getStorageSync('refreshToken')
      if (!refreshToken) {
        throw new Error('No refresh token')
      }
      
      const response = await request('/sso/login/refreshToken', {
        method: 'GET',
        url: `${BASE_URL}/sso/login/refreshToken?refreshToken=${refreshToken}`
      })
      
      if (response.code === 200) {
        Taro.setStorageSync('accessToken', response.data.accessToken)
        return true
      }
      return false
    } catch (error) {
      console.error('刷新token失败:', error)
      return false
    }
  },
  
  // 登出
  logout: () => {
    Taro.removeStorageSync('accessToken')
    Taro.removeStorageSync('refreshToken')
    Taro.removeStorageSync('userInfo')
  },
  
  // 获取当前用户信息
  getCurrentUser: () => {
    return Taro.getStorageSync('userInfo')
  },
  
  // 检查是否已登录
  isLoggedIn: () => {
    return !!Taro.getStorageSync('accessToken')
  }
}

// OCR识别接口
export const ocrService = {
  // 上传图片并识别文字
  recognizeWords: async (imageFile: string) => {
    return request('/api/ocr/recognize', {
      method: 'POST',
      data: {
        image: imageFile
      }
    })
  }
}

// AI故事生成接口
export const storyService = {
  // 生成故事
  generateStory: async (words: string[], difficulty: string, ageGroup: string) => {
    return request('/api/story/generate', {
      method: 'POST',
      data: {
        words,
        difficulty,
        ageGroup
      }
    })
  },
  
  // 重新生成故事
  regenerateStory: async (words: string[], difficulty: string, ageGroup: string, excludeIds?: string[]) => {
    return request('/api/story/regenerate', {
      method: 'POST',
      data: {
        words,
        difficulty,
        ageGroup,
        excludeIds
      }
    })
  }
}

// 单词定义接口
export const wordService = {
  // 获取单词定义
  getDefinition: async (word: string, language: string = 'zh') => {
    return request(`/api/word/definition?word=${encodeURIComponent(word)}&lang=${language}`)
  }
}

// TTS语音接口
export const ttsService = {
  // 获取语音文件URL
  getAudioUrl: async (text: string, speed: 'normal' | 'slow' = 'normal') => {
    return request('/api/tts/generate', {
      method: 'POST',
      data: {
        text,
        speed
      }
    })
  }
}

// 用户设置接口
export const userService = {
  // 保存用户设置
  saveSettings: async (settings: {
    ageGroup: string
    difficulty: string
    language: string
  }) => {
    return request('/api/user/settings', {
      method: 'POST',
      data: settings
    })
  },
  
  // 获取用户设置
  getSettings: async () => {
    return request('/api/user/settings')
  },
  
  // 保存生成历史
  saveHistory: async (historyItem: {
    words: string[]
    story: string
    difficulty: string
    ageGroup: string
    createdAt: string
  }) => {
    return request('/api/user/history', {
      method: 'POST',
      data: historyItem
    })
  },
  
  // 获取生成历史
  getHistory: async (page: number = 1, limit: number = 10) => {
    return request(`/api/user/history?page=${page}&limit=${limit}`)
  }
}

// 导出功能接口
export const exportService = {
  // 导出为图片
  exportAsImage: async (story: string, words: string[]) => {
    return request('/api/export/image', {
      method: 'POST',
      data: {
        story,
        words
      }
    })
  }
}

// 图片上传接口
export const pictureService = {
  // 上传图片（支持401重试）
  uploadPicture: async (imagePath: string): Promise<{success: boolean, data?: any, message?: string}> => {
    const attemptUpload = async (): Promise<{success: boolean, data?: any, message?: string}> => {
      try {
        const token = Taro.getStorageSync('accessToken')
        const response = await Taro.uploadFile({
          url: `${BASE_URL}/wordlings/picture/upHandStreamWs`,
          filePath: imagePath,
          name: 'picture',
          header: {
            'accessToken': token
          }
        })
        
        if (response.statusCode === 401) {
          console.log('图片上传收到401响应，token可能已过期')
          throw new Error('TOKEN_EXPIRED')
        }
        
        if (response.statusCode === 200) {
          const data = JSON.parse(response.data)
          if (data.code === 200) {
            return {
              success: true,
              data: data.data
            }
          } else {
            return {
              success: false,
              message: data.msg || '上传失败'
            }
          }
        } else {
          return {
            success: false,
            message: `上传失败，状态码: ${response.statusCode}`
          }
        }
      } catch (error) {
        if (error.message === 'TOKEN_EXPIRED') {
          throw error // 重新抛出TOKEN_EXPIRED错误
        }
        console.error('图片上传失败:', error)
        return {
          success: false,
          message: '上传过程中发生错误'
        }
      }
    }

    try {
      // 第一次尝试上传
      return await attemptUpload()
    } catch (error) {
      if (error.message === 'TOKEN_EXPIRED') {
        console.log('图片上传遇到401，开始处理token过期')
        
        try {
          // 直接尝试重新登录
          console.log('图片上传检测到401，开始重新登录')
          const reLoginSuccess = await handle401Error()
          
          if (reLoginSuccess) {
            console.log('重新登录成功，重试图片上传')
            
            // 重连所有WebSocket连接
            reconnectAllWebSockets().catch(err => {
              console.error('重连WebSocket失败:', err)
            })
            
            return await attemptUpload()
          } else {
            console.log('重新登录失败')
            handleGlobalError.showLoginExpiredDialog()
            
            return {
              success: false,
              message: '登录已过期，请重新进入小程序'
            }
          }
        } catch (retryError) {
          console.error('处理登录过期时发生错误:', retryError)
          return {
            success: false,
            message: '重新登录失败，请重试'
          }
        }
      } else {
        // 其他错误直接返回
        return {
          success: false,
          message: '上传过程中发生错误'
        }
      }
    }
  }
} 