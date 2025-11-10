export default {
  pages: [
    // 主包仅保留必要的首页与登录，降低主包体积
    'pages/login/index',
    'pages/index/index'
  ],
  // 将其他页面拆分到分包，按需加载以降低主包体积
  subPackages: [
    {
      root: 'pages/conversation',
      pages: ['index']
    },
    {
      root: 'pages/free-conversation',
      pages: ['index']
    },
    {
      root: 'pages/exercise-detail',
      pages: ['index']
    },
    {
      root: 'pages/report',
      pages: ['index']
    },
    {
      root: 'pages/teacher',
      pages: ['index']
    },
    {
      root: 'pages/recording-test',
      pages: ['index']
    }
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#667eea',
    navigationBarTitleText: 'EngCoach',
    navigationBarTextStyle: 'white'
  }
};
