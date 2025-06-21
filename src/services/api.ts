import Taro from '@tarojs/taro'

// 配置API基础地址
const BASE_URL = 'https://wobufang.com'

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
    const response = await Taro.request(config)
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return response.data
    } else {
      throw new Error(`Request failed with status ${response.statusCode}`)
    }
  } catch (error) {
    console.error('Request error:', error)
    throw error
  }
}

// 登录相关接口
export const authService = {
  // 微信登录
  wechatLogin: async (code: string) => {
    try {
      const response = await request('/wordlings/sso/wechat/login', {
        method: 'GET',
        url: `${BASE_URL}/wordlings/sso/wechat/login?code=${code}`
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
      
      const response = await request('/wordlings/sso/refreshToken', {
        method: 'GET',
        url: `${BASE_URL}/wordlings/sso/refreshToken?refreshToken=${refreshToken}`
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
  // 上传图片
  uploadPicture: async (imagePath: string) => {
    try {
      const response = await Taro.uploadFile({
        url: `${BASE_URL}/wordlings/picture/upHandStreamWs`,
        filePath: imagePath,
        name: 'picture',
        header: {
          'accessToken': Taro.getStorageSync('accessToken')
        }
      })
      
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
          message: '网络错误'
        }
      }
    } catch (error) {
      console.error('图片上传失败:', error)
      return {
        success: false,
        message: '上传过程中发生错误'
      }
    }
  }
} 