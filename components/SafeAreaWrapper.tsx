import React from 'react'
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface Props {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  testID?: string
}

export function SafeAreaWrapper({ children, style, testID }: Props) {
  const insets = useSafeAreaInsets()
  return (
    <View
      testID={testID}
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }, style]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})
