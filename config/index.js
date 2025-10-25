module.exports = {
  projectName: 'engcoach',
  date: '2025-9-28',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {
    ENABLE_INNER_HTML: 'false',
    ENABLE_CLONE_NODE: 'false',
    ENABLE_CONTAINS: 'false',
    ENABLE_MUTATION_OBSERVER: 'false',
    ENABLE_SIZE_APIS: 'false',
    ENABLE_TEMPLATE_CONTENT: 'false',
    ENABLE_ADJACENT_NODE: 'false',
    ENABLE_SCROLL_BEHAVIOR: 'false'
  },
  copy: {
    patterns: [],
    options: {}
  },
  framework: 'react',
  compiler: 'vite',
  cache: {
    enable: false // Webpack 持久化缓存配置，建议开启。默认配置请参考：https://docs.taro.zone/docs/config-detail#cache
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {}
      },
      url: {
        enable: true,
        config: {
          limit: 1024 // 设定转换尺寸上限
        }
      },
      cssModules: {
        enable: false // 默认为 false，如需使用 css modules 功能，则设为 true
      }
    }
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: {
        enable: true,
        config: {}
      },
      cssModules: {
        enable: false // 默认为 false，如需使用 css modules 功能，则设为 true
      }
    }
  }
}
