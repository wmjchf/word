# 401登录过期全局处理方案

## 📋 功能概述

本系统实现了全局的401登录过期自动处理机制，包括：

1. **自动重新登录** - 当检测到401错误时，直接进行微信重新登录
2. **请求队列管理** - 在处理401期间，将其他请求加入队列，避免重复处理
3. **自动重试** - 登录成功后自动重试原始请求
4. **友好提示** - 提供用户友好的错误提示和引导

## 🔧 实现原理

### 1. WebSocket自动重连机制

```typescript
// 在401重新登录成功后，自动重连所有WebSocket
if (reLoginSuccess) {
  // 重连所有WebSocket连接
  reconnectAllWebSockets().catch(err => {
    console.error('重连WebSocket失败:', err)
  })
  
  // 然后重试API请求
  const retryResponse = await makeRequest(config)
}
```

### 2. 请求拦截机制

```typescript
// 在request函数中检测401响应
if (response.statusCode === 401) {
  // 开始401处理流程
  if (isRefreshing) {
    // 如果正在处理，加入队列
    return new Promise((resolve, reject) => {
      requestQueue.push({ resolve, reject, config })
    })
  }
  
  isRefreshing = true
  // 执行重新登录逻辑
}
```

### 2. 重新登录流程

```typescript
// 直接进行重新登录
const reLoginSuccess = await handle401Error()

if (reLoginSuccess) {
  // 登录成功，重试请求
  const newToken = Taro.getStorageSync('accessToken')
  config.header.accessToken = newToken
  return await makeRequest(config)
} else {
  // 登录失败，显示提示
  handleGlobalError.showLoginExpiredDialog()
}
```

### 3. 登录处理流程

```typescript
const handle401Error = async () => {
  // 1. 清除登录状态
  store.logout()
  authService.logout()
  
  // 2. 获取新的微信code
  const loginResult = await Taro.login()
  
  // 3. 调用登录接口
  const result = await authService.wechatLogin(loginResult.code)
  
  // 4. 更新用户状态
  if (result.success) {
    store.setUserInfo(result.data.wechatUser)
    return true
  }
  return false
}
```

## 🎯 使用方式

### 1. 普通API调用

```typescript
import { storyService } from '../services/api'

// 使用时无需额外处理，系统会自动处理401
const generateStory = async () => {
  try {
    const result = await storyService.generateStory(words, difficulty, ageGroup)
    // 处理成功结果
  } catch (error) {
    // 处理失败情况（非401错误）
  }
}
```

### 2. 图片上传

```typescript
import { pictureService } from '../services/api'

const uploadImage = async (imagePath: string) => {
  try {
    const result = await pictureService.uploadPicture(imagePath)
    if (result.success) {
      // 上传成功
      console.log('上传成功:', result.data)
    } else {
      // 上传失败
      console.error('上传失败:', result.message)
    }
  } catch (error) {
    // 处理其他错误
  }
}
```

### 3. WebSocket连接（自动401处理）

```typescript
import { createWebSocketManager } from '../services/api'

// 创建WebSocket管理器（支持自动重连）
const wsManager = createWebSocketManager('wss://wobufang.com/notice/ws/wordlings')

// 设置事件监听器
wsManager.onOpen(() => {
  console.log('WebSocket连接成功')
})

wsManager.onMessage((message) => {
  // 处理消息
})

wsManager.onClose(() => {
  console.log('WebSocket连接关闭')
})

// 建立连接
wsManager.connect()

// 当401重新登录后，WebSocket会自动重连！
// 无需手动处理！
```

## 🛡️ 错误处理机制

### 1. 网络错误处理

```typescript
import { handleGlobalError } from '../services/api'

// 检查是否为401错误
if (handleGlobalError.is401Error(error)) {
  // 401错误会被自动处理，无需手动处理
} else {
  // 显示网络错误提示
  handleGlobalError.showNetworkError(error)
}
```

### 2. 登录过期提示

```typescript
// 当重新登录失败时，会自动显示登录过期对话框
handleGlobalError.showLoginExpiredDialog()
```

## 📊 处理流程图

```
用户发起API请求
        ↓
    执行网络请求
        ↓
    收到401响应？
        ↓ 是
    正在处理401？
        ↓ 否
   设置处理状态为true
        ↓
    直接重新登录
        ↓
    登录成功？
        ↓ 是
   更新token并重试请求
        ↓
      请求成功
        ↓ 否
  显示登录过期对话框
        ↓
    引导用户重新进入
```

## ⚠️ 注意事项

### 1. 避免循环调用

- 在`authService.wechatLogin`中不要使用会触发401处理的request函数
- 登录接口应该直接使用`Taro.request`

### 2. 请求队列管理

- 系统会自动管理请求队列，避免重复处理401
- 队列中的请求会在token更新后自动重试

### 3. 用户体验

- 系统会显示"已重新登录"的提示，告知用户状态变化
- 最终失败时会引导用户重新进入小程序

### 4. 调试信息

- 系统会输出详细的console日志，便于调试
- 可以通过日志跟踪整个401处理流程

## 🔍 测试建议

### 1. 模拟401场景

```typescript
// 可以通过修改token来模拟401
Taro.setStorageSync('accessToken', 'invalid_token')

// 然后调用任意API
const result = await storyService.generateStory(['hello'], 'B1', 'teenagers')
```

### 2. 测试并发请求

```typescript
// 同时发起多个请求，测试队列机制
Promise.all([
  storyService.generateStory(['hello'], 'B1', 'teenagers'),
  userService.getSettings(),
  wordService.getDefinition('hello')
])
```

## 📈 优势特点

1. **透明处理** - 开发者无需关心401处理细节
2. **简化流程** - 去掉refreshToken步骤，直接重新登录
3. **自动重试** - 系统自动重试失败的请求
4. **队列管理** - 避免重复的401处理
5. **用户友好** - 提供清晰的状态提示
6. **统一管理** - 所有401错误都通过统一机制处理
7. **高可靠性** - 简化流程减少了出错的可能性

## 🚀 简化优势

通过去掉refreshToken机制，我们获得了以下优势：

1. **更快的响应** - 直接重新登录，减少一次网络请求
2. **更简单的逻辑** - 减少了复杂的token管理逻辑
3. **更少的错误点** - 简化流程意味着更少的潜在错误
4. **更好的维护性** - 代码更简洁，更容易理解和维护

这套简化的机制确保了应用在面对token过期时能够快速自动恢复，提供流畅的用户体验。