# TabBar 图标说明

目前项目配置为无图标的文字 tabBar。如果需要添加图标，请按以下步骤操作：

## 需要的图标文件

在此目录下添加以下图标文件（建议尺寸：78px × 78px）：

- `home.png` - 首页图标（未选中状态）
- `home-active.png` - 首页图标（选中状态）
- `camera.png` - 拍照识别图标（未选中状态）
- `camera-active.png` - 拍照识别图标（选中状态）
- `settings.png` - 设置图标（未选中状态）
- `settings-active.png` - 设置图标（选中状态）

## 启用图标

添加图标文件后，在 `src/app.config.ts` 中恢复图标配置：

```typescript
tabBar: {
  color: '#666',
  selectedColor: '#4A90E2',
  backgroundColor: '#fff',
  borderStyle: 'black',
  list: [
    {
      pagePath: 'pages/index/index',
      text: '首页',
      iconPath: 'assets/home.png',
      selectedIconPath: 'assets/home-active.png'
    },
    {
      pagePath: 'pages/camera/index',
      text: '拍照识别',
      iconPath: 'assets/camera.png',
      selectedIconPath: 'assets/camera-active.png'
    },
    {
      pagePath: 'pages/settings/index',
      text: '设置',
      iconPath: 'assets/settings.png',
      selectedIconPath: 'assets/settings-active.png'
    }
  ]
}
```

## 图标设计建议

- 使用简洁的线条图标风格
- 确保在小尺寸下清晰可见
- 选中和未选中状态有明显区别（通常通过颜色或填充区分）
- 保持统一的设计风格 