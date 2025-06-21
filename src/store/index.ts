import Taro from '@tarojs/taro'

// 用户设置类型
export interface UserSettings {
  ageGroup: 'children' | 'teenagers' | 'adults'
  difficulty: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  language: 'zh' | 'en'
  isFirstTime: boolean
}

// 微信用户信息类型
export interface WechatUser {
  avatarUrl: string
  city: string
  country: string
  createTime: string
  gender: number
  id: number
  nickName: string
  openId: string
  province: string
  sessionKey: string
  updateTime: string
}

// 故事数据类型
export interface StoryData {
  id: string
  content: string
  words: string[]
  difficulty: string
  ageGroup: string
  createdAt: string
}

// 全局状态
class Store {
  private userSettings: UserSettings = {
    ageGroup: 'teenagers',
    difficulty: 'B1',
    language: 'zh',
    isFirstTime: true
  }

  private currentWords: string[] = []
  private currentStory: StoryData | null = null
  private storyHistory: StoryData[] = []
  private userInfo: WechatUser | null = null
  private isLoggedIn: boolean = false

  // 初始化用户登录状态
  initUserState(): void {
    const accessToken = Taro.getStorageSync('accessToken')
    const userInfo = Taro.getStorageSync('userInfo')
    
    this.isLoggedIn = !!accessToken
    this.userInfo = userInfo || null
  }

  // 设置用户登录信息
  setUserInfo(userInfo: WechatUser): void {
    this.userInfo = userInfo
    this.isLoggedIn = true
  }

  // 获取用户信息
  getUserInfo(): WechatUser | null {
    if (!this.userInfo) {
      const userInfo = Taro.getStorageSync('userInfo')
      this.userInfo = userInfo || null
    }
    return this.userInfo
  }

  // 检查是否已登录
  checkLoginStatus(): boolean {
    if (!this.isLoggedIn) {
      const accessToken = Taro.getStorageSync('accessToken')
      this.isLoggedIn = !!accessToken
    }
    return this.isLoggedIn
  }

  // 用户登出
  logout(): void {
    this.userInfo = null
    this.isLoggedIn = false
  }

  // 获取用户设置
  getUserSettings(): UserSettings {
    try {
      const settings = Taro.getStorageSync('userSettings')
      if (settings) {
        this.userSettings = { ...this.userSettings, ...settings }
      }
    } catch (error) {
      console.error('Failed to get user settings:', error)
    }
    return this.userSettings
  }

  // 保存用户设置
  saveUserSettings(settings: Partial<UserSettings>): void {
    this.userSettings = { ...this.userSettings, ...settings }
    try {
      Taro.setStorageSync('userSettings', this.userSettings)
    } catch (error) {
      console.error('Failed to save user settings:', error)
    }
  }

  // 设置当前单词列表
  setCurrentWords(words: string[]): void {
    this.currentWords = words
    try {
      Taro.setStorageSync('currentWords', words)
    } catch (error) {
      console.error('Failed to save current words:', error)
    }
  }

  // 获取当前单词列表
  getCurrentWords(): string[] {
    try {
      const words = Taro.getStorageSync('currentWords')
      if (words) {
        this.currentWords = words
      }
    } catch (error) {
      console.error('Failed to get current words:', error)
    }
    return this.currentWords
  }

  // 设置当前故事
  setCurrentStory(story: StoryData): void {
    this.currentStory = story
    try {
      Taro.setStorageSync('currentStory', story)
    } catch (error) {
      console.error('Failed to save current story:', error)
    }
  }

  // 获取当前故事
  getCurrentStory(): StoryData | null {
    try {
      const story = Taro.getStorageSync('currentStory')
      if (story) {
        this.currentStory = story
      }
    } catch (error) {
      console.error('Failed to get current story:', error)
    }
    return this.currentStory
  }

  // 添加到历史记录
  addToHistory(story: StoryData): void {
    this.storyHistory.unshift(story)
    // 只保留最近20条记录
    if (this.storyHistory.length > 20) {
      this.storyHistory = this.storyHistory.slice(0, 20)
    }
    try {
      Taro.setStorageSync('storyHistory', this.storyHistory)
    } catch (error) {
      console.error('Failed to save story history:', error)
    }
  }

  // 获取历史记录
  getStoryHistory(): StoryData[] {
    try {
      const history = Taro.getStorageSync('storyHistory')
      if (history) {
        this.storyHistory = history
      }
    } catch (error) {
      console.error('Failed to get story history:', error)
    }
    return this.storyHistory
  }

  // 清除历史记录
  clearHistory(): void {
    this.storyHistory = []
    try {
      Taro.removeStorageSync('storyHistory')
    } catch (error) {
      console.error('Failed to clear story history:', error)
    }
  }

  // 完成新手引导
  completeOnboarding(): void {
    this.saveUserSettings({ isFirstTime: false })
  }

  // 检查是否是首次使用
  isFirstTimeUser(): boolean {
    const settings = this.getUserSettings()
    return settings.isFirstTime
  }
}

// 导出单例实例
export const store = new Store()

// 工具函数
export const getDifficultyLabel = (difficulty: string): string => {
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

export const getAgeGroupLabel = (ageGroup: string): string => {
  const labels = {
    'children': '儿童 (6-12岁)',
    'teenagers': '青少年 (13-18岁)',
    'adults': '成人 (18岁以上)'
  }
  return labels[ageGroup] || ageGroup
} 