export default {
  pages: [
    'pages/index/index',
    'pages/onboarding/index',
    'pages/camera/index',
    'pages/wordList/index',
    'pages/settings/index',
    'pages/story/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationStyle: 'custom',
    backgroundColor: '#4A90E2'
  },
  tabBar: {
    color: '#666',
    selectedColor: '#4A90E2',
    backgroundColor: '#fff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页'
      },
      {
        pagePath: 'pages/camera/index',
        text: '拍照识别'
      },
      {
        pagePath: 'pages/settings/index',
        text: '设置'
      }
    ]
  }
}
