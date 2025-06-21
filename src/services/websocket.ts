import Taro from '@tarojs/taro'

// WebSocket连接状态
export enum WebSocketStatus {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR'
}

// WebSocket事件回调类型
export interface WebSocketCallbacks {
  onOpen?: () => void
  onMessage?: (data: string) => void
  onClose?: () => void
  onError?: (error: any) => void
  onStatusChange?: (status: WebSocketStatus) => void
}

class WebSocketService {
  private socketTask: Taro.SocketTask | null = null
  private status: WebSocketStatus = WebSocketStatus.DISCONNECTED
  private callbacks: WebSocketCallbacks = {}
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private reconnectTimeout: NodeJS.Timeout | null = null
  private receivedData = ''

  // 连接WebSocket
  async connect(url: string, callbacks: WebSocketCallbacks = {}) {
    this.callbacks = callbacks
    this.status = WebSocketStatus.CONNECTING
    this.notifyStatusChange(WebSocketStatus.CONNECTING)

    console.log('WebSocket connecting to:', url)

    try {
      this.socketTask = await Taro.connectSocket({
        url,
        header: {
          'accessToken': Taro.getStorageSync('accessToken')
        }
      })

      this.setupEventHandlers()
    } catch (error) {
      console.error('WebSocket connection error:', error)
      this.handleError(error)
    }
  }

  // 设置事件处理器
  private setupEventHandlers() {
    if (!this.socketTask) return

    // 连接打开
    this.socketTask.onOpen(() => {
      console.log('WebSocket connected')
      this.status = WebSocketStatus.CONNECTED
      this.reconnectAttempts = 0
      this.receivedData = ''
      this.notifyStatusChange(WebSocketStatus.CONNECTED)
      this.callbacks.onOpen?.()
    })

    // 接收消息
    this.socketTask.onMessage((res) => {
      console.log('WebSocket message received:', res.data)
      
      // 拼接接收到的数据
      if (typeof res.data === 'string') {
        this.receivedData += res.data
        this.callbacks.onMessage?.(res.data)
      }
    })

    // 连接关闭
    this.socketTask.onClose((res) => {
      console.log('WebSocket closed:', res)
      this.status = WebSocketStatus.DISCONNECTED
      this.notifyStatusChange(WebSocketStatus.DISCONNECTED)
      this.callbacks.onClose?.()
      
      // 尝试重连
      this.attemptReconnect()
    })

    // 连接错误
    this.socketTask.onError((error) => {
      console.error('WebSocket error:', error)
      this.handleError(error)
    })
  }

  // 发送消息
  send(data: string | object) {
    if (this.status !== WebSocketStatus.CONNECTED || !this.socketTask) {
      console.warn('WebSocket not connected, cannot send message')
      return false
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data)
      this.socketTask.send({
        data: message,
        success: () => {
          console.log('Message sent successfully')
        },
        fail: (error) => {
          console.error('Failed to send message:', error)
        }
      })
      return true
    } catch (error) {
      console.error('Send message error:', error)
      return false
    }
  }

  // 关闭连接
  close() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.socketTask) {
      this.socketTask.close({
        code: 1000,
        reason: 'Normal closure'
      })
      this.socketTask = null
    }

    this.status = WebSocketStatus.DISCONNECTED
    this.notifyStatusChange(WebSocketStatus.DISCONNECTED)
  }

  // 获取当前状态
  getStatus(): WebSocketStatus {
    return this.status
  }

  // 获取完整接收的数据
  getReceivedData(): string {
    return this.receivedData
  }

  // 清空接收的数据
  clearReceivedData() {
    this.receivedData = ''
  }

  // 处理错误
  private handleError(error: any) {
    this.status = WebSocketStatus.ERROR
    this.notifyStatusChange(WebSocketStatus.ERROR)
    this.callbacks.onError?.(error)
  }

  // 通知状态变化
  private notifyStatusChange(status: WebSocketStatus) {
    this.callbacks.onStatusChange?.(status)
  }

  // 尝试重连
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = Math.pow(2, this.reconnectAttempts) * 1000 // 指数退避

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)

    this.reconnectTimeout = setTimeout(() => {
      if (this.status === WebSocketStatus.DISCONNECTED) {
        // 这里需要重新连接的URL，但我们没有保存，所以先不实现自动重连
        console.log('Auto-reconnect not implemented without saved URL')
      }
    }, delay)
  }
}

// 导出单例实例
export const webSocketService = new WebSocketService()

// 创建WebSocket连接的便捷函数
export const createWebSocketConnection = (url: string, callbacks: WebSocketCallbacks = {}) => {
  return webSocketService.connect(url, callbacks)
}

// 流式数据处理器
export class StreamDataProcessor {
  private data = ''
  private onUpdate: (data: string) => void
  private onComplete: (finalData: string) => void

  constructor(onUpdate: (data: string) => void, onComplete: (finalData: string) => void) {
    this.onUpdate = onUpdate
    this.onComplete = onComplete
  }

  // 处理接收到的数据片段
  processChunk(chunk: string) {
    this.data += chunk
    this.onUpdate(this.data)
  }

  // 完成数据接收
  complete() {
    this.onComplete(this.data)
  }

  // 获取当前数据
  getCurrentData(): string {
    return this.data
  }

  // 重置数据
  reset() {
    this.data = ''
  }
} 