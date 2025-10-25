import { Component, PropsWithChildren } from 'react'
import { View, Text } from '@tarojs/components'
import './app.scss'

class App extends Component<PropsWithChildren> {

  componentDidMount () {}

  componentDidShow () {}

  componentDidHide () {}

  render () {
    return (
      <View className='app'>
        <Text>EngCoach - 英语口语训练助手</Text>
        {this.props.children}
      </View>
    )
  }
}

export default App
