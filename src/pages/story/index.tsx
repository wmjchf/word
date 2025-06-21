import { useState, useEffect } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { store, StoryData } from '../../store'
import { storyService, ttsService, wordService, userService } from '../../services/api'
import './index.scss'

export default function Story() {
  const [words, setWords] = useState<string[]>([])
  const [story, setStory] = useState<StoryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedWord, setSelectedWord] = useState('')
  const [wordDefinition, setWordDefinition] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const currentWords = store.getCurrentWords()
    const currentStory = store.getCurrentStory()
    
    setWords(currentWords)
    
    if (currentStory) {
      setStory(currentStory)
    } else if (currentWords.length > 0) {
      // 如果有单词但没有故事，自动生成故事
      generateStory()
    } else {
      setError('没有可用的单词，请先添加单词')
    }
  }, [])

  // 生成故事
  const generateStory = async () => {
    if (words.length === 0) {
      setError('请先添加单词')
      return
    }

    setLoading(true)
    setError('')

    try {
      const settings = store.getUserSettings()
      const result = await storyService.generateStory(
        words,
        settings.difficulty,
        settings.ageGroup
      )

      if (result.success && result.story) {
        const newStory: StoryData = {
          id: Date.now().toString(),
          content: result.story,
          words: words,
          difficulty: settings.difficulty,
          ageGroup: settings.ageGroup,
          createdAt: new Date().toISOString()
        }

        setStory(newStory)
        store.setCurrentStory(newStory)
        store.addToHistory(newStory)

        // 同步到服务器
        try {
          await userService.saveHistory({
            words: newStory.words,
            story: newStory.content,
            difficulty: newStory.difficulty,
            ageGroup: newStory.ageGroup,
            createdAt: newStory.createdAt
          })
        } catch (saveError) {
          console.log('历史记录同步失败，但本地已保存')
        }
      } else {
        throw new Error(result.message || '生成故事失败')
      }
    } catch (generateError) {
      console.error('生成故事失败:', generateError)
      setError('生成故事失败，请检查网络连接或重试')
      
      // 模拟故事生成（开发阶段）
      const mockStory: StoryData = {
        id: Date.now().toString(),
        content: `Once upon a time, there was a magical ${words[0] || 'world'} where ${words[1] || 'story'} came to life. Every day, children would ${words[2] || 'learning'} new things and discover the power of ${words[3] || 'english'}. The ${words[4] || 'hello'} echoed through the valley, bringing joy and wisdom to all who heard it.`,
        words: words,
        difficulty: store.getUserSettings().difficulty,
        ageGroup: store.getUserSettings().ageGroup,
        createdAt: new Date().toISOString()
      }
      
      setStory(mockStory)
      store.setCurrentStory(mockStory)
    } finally {
      setLoading(false)
    }
  }

  // 重新生成故事
  const regenerateStory = async () => {
    Taro.showModal({
      title: '重新生成',
      content: '确定要重新生成故事吗？当前故事将被替换。',
      success: (res) => {
        if (res.confirm) {
          generateStory()
        }
      }
    })
  }

  // 点击单词查看释义
  const handleWordClick = async (word: string) => {
    if (selectedWord === word) {
      // 如果点击的是同一个单词，关闭释义
      setSelectedWord('')
      setWordDefinition('')
      return
    }

    setSelectedWord(word)
    setWordDefinition('加载中...')

    try {
      const result = await wordService.getDefinition(word, 'zh')
      if (result.success && result.definition) {
        setWordDefinition(result.definition)
      } else {
        setWordDefinition('未找到该单词的释义')
      }
    } catch (defError) {
      console.error('获取单词释义失败:', defError)
      // 模拟释义（开发阶段）
      const mockDefinitions = {
        'hello': 'n. 问候，招呼\nv. 向...问好',
        'world': 'n. 世界，地球；领域',
        'story': 'n. 故事，小说；情况',
        'learning': 'n. 学习，学问\nv. 学习',
        'english': 'n. 英语\nadj. 英国的'
      }
      setWordDefinition(mockDefinitions[word.toLowerCase()] || '这是一个英文单词')
    }
  }

  // 语音朗读
  const handlePlayAudio = async (speed: 'normal' | 'slow' = 'normal') => {
    if (!story) return

    setIsPlaying(true)

    try {
      const result = await ttsService.getAudioUrl(story.content, speed)
      
      if (result.success && result.audioUrl) {
        // 播放音频
        const audioContext = Taro.createInnerAudioContext()
        audioContext.src = result.audioUrl
        
        audioContext.onPlay(() => {
          console.log('开始播放')
        })
        
        audioContext.onEnded(() => {
          setIsPlaying(false)
          console.log('播放结束')
        })
        
        audioContext.onError((audioErr) => {
          setIsPlaying(false)
          console.error('播放失败:', audioErr)
          Taro.showToast({
            title: '播放失败',
            icon: 'error'
          })
        })
        
        audioContext.play()
      } else {
        throw new Error('获取音频失败')
      }
    } catch (audioError) {
      setIsPlaying(false)
      console.error('语音朗读失败:', audioError)
      Taro.showToast({
        title: '朗读功能暂不可用',
        icon: 'error'
      })
    }
  }

  // 导出故事
  const handleExport = () => {
    if (!story) return

    Taro.showActionSheet({
      itemList: ['复制文本', '分享图片'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 复制文本
          Taro.setClipboardData({
            data: story.content,
            success: () => {
              Taro.showToast({
                title: '已复制到剪贴板',
                icon: 'success'
              })
            }
          })
        } else if (res.tapIndex === 1) {
          // 分享图片（这里可以调用生成图片的接口）
          Taro.showToast({
            title: '图片生成功能开发中',
            icon: 'none'
          })
        }
      }
    })
  }

  // 渲染带高亮的故事文本
  const renderHighlightedStory = (content: string) => {
    if (!content || words.length === 0) {
      return <Text className='story-text'>{content}</Text>
    }

    const parts: JSX.Element[] = []
    let lastIndex = 0
    const regex = new RegExp(`\\b(${words.join('|')})\\b`, 'gi')
    let match

    while ((match = regex.exec(content)) !== null) {
      // 添加高亮前的文本
      if (match.index > lastIndex) {
        parts.push(
          <Text key={`text-${lastIndex}`} className='story-text'>
            {content.substring(lastIndex, match.index)}
          </Text>
        )
      }

      // 添加高亮的单词
      parts.push(
        <Text
          key={`word-${match.index}`}
          className={`highlighted-word ${selectedWord === match[0].toLowerCase() ? 'selected' : ''}`}
          onClick={() => handleWordClick(match[0].toLowerCase())}
        >
          {match[0]}
        </Text>
      )

      lastIndex = regex.lastIndex
    }

    // 添加剩余的文本
    if (lastIndex < content.length) {
      parts.push(
        <Text key={`text-${lastIndex}`} className='story-text'>
          {content.substring(lastIndex)}
        </Text>
      )
    }

    return <View className='story-content'>{parts}</View>
  }

  return (
    <View className='story'>
      <View className='header'>
        <Text className='title'>AI 生成的故事</Text>
        <Text className='subtitle'>
          {words.length > 0 ? `包含 ${words.length} 个目标单词` : ''}
        </Text>
      </View>

      {loading ? (
        <View className='loading-section'>
          <View className='loading-spinner'></View>
          <Text className='loading-text'>AI正在创作故事...</Text>
          <Text className='loading-tip'>请稍候，这可能需要几秒钟</Text>
        </View>
      ) : error ? (
        <View className='error-section'>
          <Text className='error-icon'>😔</Text>
          <Text className='error-text'>{error}</Text>
          <Button 
            className='retry-btn primary'
            onClick={generateStory}
          >
            重试生成
          </Button>
        </View>
      ) : story ? (
        <View className='story-section'>
          {/* 故事内容 */}
          <View className='story-container'>
            {renderHighlightedStory(story.content)}
          </View>

          {/* 单词释义 */}
          {selectedWord && (
            <View className='definition-section'>
              <Text className='definition-title'>📖 {selectedWord}</Text>
              <Text className='definition-content'>{wordDefinition}</Text>
            </View>
          )}

          {/* 控制按钮 */}
          <View className='controls'>
            <Button 
              className='control-btn secondary'
              onClick={() => handlePlayAudio('normal')}
              loading={isPlaying}
            >
              🔊 {isPlaying ? '播放中...' : '朗读'}
            </Button>
            
            <Button 
              className='control-btn secondary'
              onClick={() => handlePlayAudio('slow')}
              disabled={isPlaying}
            >
              🐌 慢速朗读
            </Button>
            
            <Button 
              className='control-btn secondary'
              onClick={handleExport}
            >
              📤 导出
            </Button>
          </View>

          {/* 底部操作 */}
          <View className='bottom-actions'>
            <Button 
              className='action-btn secondary'
              onClick={regenerateStory}
            >
              🔄 重新生成
            </Button>
            
            <Button 
              className='action-btn primary'
              onClick={() => Taro.navigateBack()}
            >
              ✅ 完成学习
            </Button>
          </View>

          {/* 学习提示 */}
          <View className='tips-section'>
            <Text className='tips-title'>💡 学习提示</Text>
            <View className='tips-list'>
              <Text className='tip-item'>• 点击蓝色高亮单词查看中文释义</Text>
              <Text className='tip-item'>• 使用朗读功能练习听力和发音</Text>
              <Text className='tip-item'>• 可以重新生成不同的故事内容</Text>
              <Text className='tip-item'>• 故事已自动保存到学习历史中</Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  )
} 