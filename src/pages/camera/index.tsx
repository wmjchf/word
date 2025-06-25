import { useState, useEffect, useRef } from 'react'
import { View, Text, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { pictureService } from '../../services/api'
import { store } from '../../store'
import CustomNavBar from '../../components/CustomNavBar'
import { useNavBarHeight } from '../../hooks/useNavBarHeight'
import './index.scss'

export default function Camera() {
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState('')
  const [wsConnected, setWsConnected] = useState(false)
  const [streamData, setStreamData] = useState('')
  const [isReceivingData, setIsReceivingData] = useState(false)
  const navBarHeight = useNavBarHeight()
  
  // 使用ref来避免在websocket回调中访问状态导致的依赖问题
  const isReceivingDataRef = useRef(false)
  const socketTaskRef = useRef<Taro.SocketTask | null>(null)
  
  // 同步状态到ref
  useEffect(() => {
    isReceivingDataRef.current = isReceivingData
  }, [isReceivingData])

  // 页面加载时连接WebSocket
  useEffect(() => {
    Taro.connectSocket({
      url: 'wss://wobufang.com//notice/ws/wordlings',
      header: {
        // 可带token等
        accessToken: `${Taro.getStorageSync('accessToken')}`
      }
    }).then(res => {
      socketTaskRef.current = res
      
      res.onMessage((messageRes) => {
        console.log(messageRes, 'messageRes')
        
        // 只有在接收数据状态时才处理消息
        if (isReceivingDataRef.current && messageRes.data) {
          const data = typeof messageRes.data === 'string' ? messageRes.data : JSON.stringify(messageRes.data)
          setStreamData(prev => prev + data)
        }
      })
      
      res.onClose(() => {
        console.log('WebSocket closed')
        setWsConnected(false)
        setIsReceivingData(false)
      })
      
      res.onError((err) => {
        console.log('WebSocket error', err)
        setWsConnected(false)
        setError('WebSocket连接失败')
      })
      
      res.onOpen(() => {
        console.log('WebSocket opened')
        setWsConnected(true)
        setError('')
      })
    }).catch(err => {
      console.error('WebSocket连接失败:', err)
      setError('无法建立WebSocket连接')
    })
    
    // 清理WebSocket连接
    return () => {
      if (socketTaskRef.current) {
        // socketTaskRef.current.close()
      }
    }
  }, [])

  // 拍照
  const handleTakePhoto = () => {
    Taro.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        setImageUrl(tempFilePath)
        setError('')
        setUploadSuccess(false)
        // 自动开始上传
        startUpload(tempFilePath)
      },
      fail: (err) => {
        console.error('拍照失败:', err)
        Taro.showToast({
          title: '拍照失败',
          icon: 'error'
        })
      }
    })
  }

  // 从相册选择
  const handleChooseFromAlbum = () => {
    Taro.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        setImageUrl(tempFilePath)
        setError('')
        setUploadSuccess(false)
        // 自动开始上传
        startUpload(tempFilePath)
      },
      fail: (err) => {
        console.error('选择图片失败:', err)
        Taro.showToast({
          title: '选择图片失败',
          icon: 'error'
        })
      }
    })
  }

  // 开始上传图片
  const startUpload = async (imagePath: string) => {
    setLoading(true)
    setError('')
    
    try {
      // 调用图片上传接口
      const result = await pictureService.uploadPicture(imagePath)
      
      if (result.success) {
        setUploadSuccess(true)
        console.log('图片上传成功:', result.data)
        
        Taro.showToast({
          title: '图片上传成功',
          icon: 'success',
          duration: 2000
        })

        // 图片上传成功后，开始接收数据
        setIsReceivingData(true)
        setStreamData('')
      } else {
        setError(result.message || '图片上传失败')
        Taro.showToast({
          title: result.message || '上传失败',
          icon: 'error'
        })
      }
    } catch (err) {
      console.error('图片上传失败:', err)
      setError('上传失败，请检查网络连接或重新尝试')
      
      Taro.showToast({
        title: '上传失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // 重新拍照
  const handleRetake = () => {
    setImageUrl('')
    setUploadSuccess(false)
    setError('')
    setLoading(false)
    setIsReceivingData(false)
    setStreamData('')
  }

  // 继续到单词编辑
  const handleContinue = () => {
    if (uploadSuccess) {
      // 解析识别到的文字为单词列表
      if (streamData) {
        try {
          const words = streamData.split(/\s+/).filter(word => word.trim().length > 0)
          if (words.length > 0) {
            store.setCurrentWords(words)
          }
        } catch (parseError) {
          console.error('解析单词失败:', parseError)
        }
      }
      
      Taro.navigateTo({
        url: '/pages/wordList/index'
      })
    }
  }

  // 手动输入单词
  const handleManualInput = () => {
    Taro.navigateTo({
      url: '/pages/wordList/index'
    })
  }

  // 获取WebSocket状态文本
  const getWebSocketStatusText = (): string => {
    if (wsConnected) {
      return '已连接'
    } else {
      return '未连接'
    }
  }

  return (
    <View className='camera'>
      <CustomNavBar title='拍照上传图片' />
      
      <View 
        className='camera-content'
        style={{ paddingTop: `${navBarHeight}px` }}
      >
        {!imageUrl ? (
          /* 拍照界面 */
          <View className='camera-interface'>
            <View className='camera-header'>
              <Text className='title'>拍照上传图片</Text>
              <Text className='subtitle'>请拍摄包含英文单词的图片</Text>
            </View>

            <View className='camera-tips'>
              <View className='tip-item'>
                <Text className='tip-icon'>💡</Text>
                <Text className='tip-text'>确保文字清晰可见</Text>
              </View>
              <View className='tip-item'>
                <Text className='tip-icon'>📝</Text>
                <Text className='tip-text'>支持印刷体和手写文字</Text>
              </View>
              <View className='tip-item'>
                <Text className='tip-icon'>📤</Text>
                <Text className='tip-text'>图片将自动上传到服务器</Text>
              </View>
              <View className='tip-item'>
                <Text className='tip-icon'>🔗</Text>
                <Text className='tip-text'>连接状态: {getWebSocketStatusText()}</Text>
              </View>
            </View>

            <View className='camera-actions'>
              <Button 
                className='action-btn primary'
                onClick={handleTakePhoto}
              >
                📷 拍照上传
              </Button>
              
              <Button 
                className='action-btn secondary'
                onClick={handleChooseFromAlbum}
              >
                🖼️ 从相册选择
              </Button>

              <Button 
                className='action-btn tertiary'
                onClick={handleManualInput}
              >
                ✏️ 手动输入单词
              </Button>
            </View>
          </View>
        ) : (
          /* 识别结果界面 */
          <View className='recognition-result'>
            <View className='image-preview'>
              <Image 
                src={imageUrl}
                mode='aspectFit'
                className='preview-image'
              />
            </View>

            {loading ? (
              <View className='loading-section'>
                <View className='loading-spinner'></View>
                <Text className='loading-text'>正在上传中...</Text>
                <Text className='loading-tip'>请稍候，系统正在上传图片</Text>
              </View>
            ) : (
              <View className='result-section'>
                {error && (
                  <View className='error-message'>
                    <Text className='error-icon'>⚠️</Text>
                    <Text className='error-text'>{error}</Text>
                  </View>
                )}

                {uploadSuccess && (
                  <View className='success-message'>
                    <Text className='success-icon'>✅</Text>
                    <Text className='success-text'>图片上传成功！</Text>
                    {isReceivingData ? (
                      <Text className='success-tip'>正在接收识别结果...</Text>
                    ) : (
                      <Text className='success-tip'>现在可以继续编辑单词列表</Text>
                    )}
                  </View>
                )}

                {isReceivingData && (
                  <View className='stream-data-section'>
                    <Text className='stream-title'>实时识别结果：</Text>
                    <View className='stream-content'>
                      <Text className='stream-text'>{streamData || '等待数据...'}</Text>
                    </View>
                  </View>
                )}

                <View className='result-actions'>
                  <Button 
                    className='action-btn secondary'
                    onClick={handleRetake}
                  >
                    重新拍照
                  </Button>
                  
                  {(uploadSuccess && !isReceivingData) && (
                    <Button 
                      className='action-btn primary'
                      onClick={handleContinue}
                    >
                      继续编辑
                    </Button>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  )
} 