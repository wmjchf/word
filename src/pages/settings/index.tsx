import { useState, useEffect } from 'react'
import { View, Text, Button, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { store, UserSettings, getDifficultyLabel, getAgeGroupLabel } from '../../store'
import { userService } from '../../services/api'
import CustomNavBar from '../../components/CustomNavBar'
import { useNavBarHeight } from '../../hooks/useNavBarHeight'
import './index.scss'

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>(store.getUserSettings())
  const [loading, setLoading] = useState(false)
  const navBarHeight = useNavBarHeight()

  const ageGroups = [
    { value: 'children', label: '儿童 (6-12岁)' },
    { value: 'teenagers', label: '青少年 (13-18岁)' },
    { value: 'adults', label: '成人 (18岁以上)' }
  ]

  const difficultyLevels = [
    { value: 'A1', label: 'A1 - 入门级', desc: '能理解和使用日常用语和基础词汇' },
    { value: 'A2', label: 'A2 - 初级', desc: '能理解简单的句子和常用词汇' },
    { value: 'B1', label: 'B1 - 中级', desc: '能理解清晰的标准语言的主要内容' },
    { value: 'B2', label: 'B2 - 中高级', desc: '能理解复杂文本的主要内容' },
    { value: 'C1', label: 'C1 - 高级', desc: '能理解各种较难的长篇文本' },
    { value: 'C2', label: 'C2 - 精通级', desc: '能够轻松理解几乎所有听到或读到的内容' }
  ]

  const languages = [
    { value: 'zh', label: '中文' },
    { value: 'en', label: 'English' }
  ]

  useEffect(() => {
    // 从本地存储获取设置
    const currentSettings = store.getUserSettings()
    setSettings(currentSettings)
  }, [])

  // 保存设置
  const handleSaveSettings = async () => {
    setLoading(true)
    
    try {
      // 本地保存
      store.saveUserSettings(settings)
      
      // 同步到服务器（如果有网络）
      try {
        await userService.saveSettings({
          ageGroup: settings.ageGroup,
          difficulty: settings.difficulty,
          language: settings.language
        })
      } catch (error) {
        console.log('网络同步失败，但本地设置已保存')
      }

      Taro.showToast({
        title: '设置已保存',
        icon: 'success',
        duration: 2000
      })

      // 延迟导航，让用户看到成功提示
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)

    } catch (error) {
      console.error('保存设置失败:', error)
      Taro.showToast({
        title: '保存失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // 重置为默认设置
  const handleReset = () => {
    Taro.showModal({
      title: '重置设置',
      content: '确定要重置为默认设置吗？',
      success: (res) => {
        if (res.confirm) {
          const defaultSettings: UserSettings = {
            ageGroup: 'teenagers',
            difficulty: 'B1',
            language: 'zh',
            isFirstTime: false
          }
          setSettings(defaultSettings)
        }
      }
    })
  }

  const handleAgeGroupChange = (e) => {
    const value = ageGroups[e.detail.value].value as 'children' | 'teenagers' | 'adults'
    setSettings({ ...settings, ageGroup: value })
  }

  const handleDifficultyChange = (e) => {
    const value = difficultyLevels[e.detail.value].value as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
    setSettings({ ...settings, difficulty: value })
  }

  const handleLanguageChange = (e) => {
    const value = languages[e.detail.value].value as 'zh' | 'en'
    setSettings({ ...settings, language: value })
  }

  const currentAgeGroupIndex = ageGroups.findIndex(item => item.value === settings.ageGroup)
  const currentDifficultyIndex = difficultyLevels.findIndex(item => item.value === settings.difficulty)
  const currentLanguageIndex = languages.findIndex(item => item.value === settings.language)

  return (
    <View className='settings'>
      <CustomNavBar title='学习设置' />

      <View 
        className='settings-content'
        style={{ paddingTop: `${navBarHeight}px` }}
      >
        <View className='content-wrapper'>
          {/* 年龄组设置 */}
          <View className='setting-group'>
            <Text className='group-title'>年龄组</Text>
            <Text className='group-desc'>请选择您的年龄组，以便调整故事的内容风格</Text>
            
            <Picker
              mode='selector'
              range={ageGroups.map(item => item.label)}
              value={currentAgeGroupIndex}
              onChange={handleAgeGroupChange}
            >
              <View className='picker-item'>
                <Text className='picker-label'>当前选择</Text>
                <Text className='picker-value'>{getAgeGroupLabel(settings.ageGroup)}</Text>
                <Text className='picker-arrow'>›</Text>
              </View>
            </Picker>
          </View>

          {/* 英语水平设置 */}
          <View className='setting-group'>
            <Text className='group-title'>英语水平</Text>
            <Text className='group-desc'>选择您的英语水平，AI将生成相应难度的故事</Text>
            
            <Picker
              mode='selector'
              range={difficultyLevels.map(item => item.label)}
              value={currentDifficultyIndex}
              onChange={handleDifficultyChange}
            >
              <View className='picker-item'>
                <Text className='picker-label'>当前水平</Text>
                <Text className='picker-value'>{getDifficultyLabel(settings.difficulty)}</Text>
                <Text className='picker-arrow'>›</Text>
              </View>
            </Picker>
            
            <View className='difficulty-desc'>
              <Text className='desc-text'>
                {difficultyLevels.find(item => item.value === settings.difficulty)?.desc}
              </Text>
            </View>
          </View>

          {/* 语言设置 */}
          <View className='setting-group'>
            <Text className='group-title'>界面语言</Text>
            <Text className='group-desc'>选择应用界面显示的语言</Text>
            
            <Picker
              mode='selector'
              range={languages.map(item => item.label)}
              value={currentLanguageIndex}
              onChange={handleLanguageChange}
            >
              <View className='picker-item'>
                <Text className='picker-label'>当前语言</Text>
                <Text className='picker-value'>{languages[currentLanguageIndex].label}</Text>
                <Text className='picker-arrow'>›</Text>
              </View>
            </Picker>
          </View>

          {/* 预览设置 */}
          <View className='preview-section'>
            <Text className='preview-title'>设置预览</Text>
            <View className='preview-content'>
              <View className='preview-item'>
                <Text className='preview-label'>年龄组：</Text>
                <Text className='preview-value'>{getAgeGroupLabel(settings.ageGroup)}</Text>
              </View>
              <View className='preview-item'>
                <Text className='preview-label'>英语水平：</Text>
                <Text className='preview-value'>{getDifficultyLabel(settings.difficulty)}</Text>
              </View>
              <View className='preview-item'>
                <Text className='preview-label'>界面语言：</Text>
                <Text className='preview-value'>{languages.find(l => l.value === settings.language)?.label}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 底部操作按钮 */}
      <View className='bottom-actions'>
        <Button 
          className='reset-btn secondary'
          onClick={handleReset}
        >
          重置默认
        </Button>
        
        <Button 
          className='save-btn primary'
          onClick={handleSaveSettings}
          loading={loading}
        >
          {loading ? '保存中...' : '保存设置'}
        </Button>
      </View>
    </View>
  )
} 