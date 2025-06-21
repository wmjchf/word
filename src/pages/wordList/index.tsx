import { useState, useEffect } from 'react'
import { View, Text, Button, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { store } from '../../store'
import './index.scss'

export default function WordList() {
  const [words, setWords] = useState<string[]>([])
  const [newWord, setNewWord] = useState('')
  const [editingIndex, setEditingIndex] = useState<number>(-1)
  const [editingValue, setEditingValue] = useState('')

  useEffect(() => {
    // 获取当前单词列表
    const currentWords = store.getCurrentWords()
    setWords(currentWords)
  }, [])

  // 添加新单词
  const handleAddWord = () => {
    const word = newWord.trim().toLowerCase()
    if (word && !words.includes(word)) {
      const newWords = [...words, word]
      setWords(newWords)
      setNewWord('')
      store.setCurrentWords(newWords)
      
      Taro.showToast({
        title: '添加成功',
        icon: 'success',
        duration: 1000
      })
    } else if (word && words.includes(word)) {
      Taro.showToast({
        title: '单词已存在',
        icon: 'error'
      })
    }
  }

  // 删除单词
  const handleDeleteWord = (index: number) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除单词 "${words[index]}" 吗？`,
      success: (res) => {
        if (res.confirm) {
          const newWords = words.filter((_, i) => i !== index)
          setWords(newWords)
          store.setCurrentWords(newWords)
          
          Taro.showToast({
            title: '删除成功',
            icon: 'success',
            duration: 1000
          })
        }
      }
    })
  }

  // 开始编辑单词
  const startEditWord = (index: number) => {
    setEditingIndex(index)
    setEditingValue(words[index])
  }

  // 保存编辑
  const saveEdit = () => {
    const word = editingValue.trim().toLowerCase()
    if (word && word !== words[editingIndex]) {
      if (words.includes(word)) {
        Taro.showToast({
          title: '单词已存在',
          icon: 'error'
        })
        return
      }
      
      const newWords = [...words]
      newWords[editingIndex] = word
      setWords(newWords)
      store.setCurrentWords(newWords)
      
      Taro.showToast({
        title: '修改成功',
        icon: 'success',
        duration: 1000
      })
    }
    
    setEditingIndex(-1)
    setEditingValue('')
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingIndex(-1)
    setEditingValue('')
  }

  // 继续生成故事
  const handleGenerateStory = () => {
    if (words.length === 0) {
      Taro.showToast({
        title: '请先添加单词',
        icon: 'error'
      })
      return
    }

    // 检查用户设置
    const settings = store.getUserSettings()
    if (settings.isFirstTime || !settings.difficulty) {
      Taro.showModal({
        title: '设置学习难度',
        content: '为了生成合适的故事，请先设置您的年龄和英语水平。',
        confirmText: '去设置',
        cancelText: '稍后',
        success: (res) => {
          if (res.confirm) {
            Taro.switchTab({
              url: '/pages/settings/index'
            })
          }
        }
      })
      return
    }

    store.setCurrentWords(words)
    Taro.navigateTo({
      url: '/pages/story/index'
    })
  }

  // 清空所有单词
  const handleClearAll = () => {
    if (words.length === 0) return

    Taro.showModal({
      title: '清空确认',
      content: '确定要清空所有单词吗？此操作不可撤销。',
      confirmText: '清空',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          setWords([])
          store.setCurrentWords([])
          
          Taro.showToast({
            title: '已清空',
            icon: 'success',
            duration: 1000
          })
        }
      }
    })
  }

  return (
    <View className='word-list'>
      <View className='header'>
        <Text className='title'>编辑单词列表</Text>
        <Text className='subtitle'>
          {words.length > 0 ? `已添加 ${words.length} 个单词` : '还没有添加单词'}
        </Text>
      </View>

      {/* 添加单词 */}
      <View className='add-section'>
        <View className='input-group'>
          <Input
            className='word-input'
            placeholder='输入英文单词'
            value={newWord}
            onInput={(e) => setNewWord(e.detail.value)}
            onConfirm={handleAddWord}
          />
          <Button 
            className='add-btn'
            onClick={handleAddWord}
            disabled={!newWord.trim()}
          >
            添加
          </Button>
        </View>
      </View>

      {/* 单词列表 */}
      <View className='words-section'>
        {words.length > 0 ? (
          <View className='words-container'>
            {words.map((word, index) => (
              <View key={index} className='word-item'>
                {editingIndex === index ? (
                  /* 编辑模式 */
                  <View className='edit-mode'>
                    <Input
                      className='edit-input'
                      value={editingValue}
                      onInput={(e) => setEditingValue(e.detail.value)}
                      onConfirm={saveEdit}
                      focus
                    />
                    <Button className='save-btn' onClick={saveEdit}>保存</Button>
                    <Button className='cancel-btn' onClick={cancelEdit}>取消</Button>
                  </View>
                ) : (
                  /* 显示模式 */
                  <View className='display-mode'>
                    <Text className='word-text'>{word}</Text>
                    <View className='word-actions'>
                      <Button 
                        className='edit-btn'
                        onClick={() => startEditWord(index)}
                      >
                        编辑
                      </Button>
                      <Button 
                        className='delete-btn'
                        onClick={() => handleDeleteWord(index)}
                      >
                        删除
                      </Button>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View className='empty-state'>
            <Text className='empty-icon'>📝</Text>
            <Text className='empty-text'>还没有添加任何单词</Text>
            <Text className='empty-tip'>添加一些英文单词来开始创作故事吧！</Text>
          </View>
        )}
      </View>

      {/* 底部操作 */}
      <View className='bottom-actions'>
        {words.length > 0 && (
          <Button 
            className='clear-btn secondary'
            onClick={handleClearAll}
          >
            清空所有
          </Button>
        )}
        
        <Button 
          className={`generate-btn primary ${words.length === 0 ? 'disabled' : ''}`}
          onClick={handleGenerateStory}
          disabled={words.length === 0}
        >
          生成故事 ({words.length > 0 ? words.length : 0}个单词)
        </Button>
      </View>

      {/* 使用提示 */}
      <View className='tips-section'>
        <Text className='tips-title'>💡 使用提示</Text>
        <View className='tips-list'>
          <Text className='tip-item'>• 建议添加3-10个单词，效果更佳</Text>
          <Text className='tip-item'>• 单词将自动转换为小写格式</Text>
          <Text className='tip-item'>• 重复的单词会被自动过滤</Text>
          <Text className='tip-item'>• 点击单词可以进行编辑或删除</Text>
        </View>
      </View>
    </View>
  )
} 