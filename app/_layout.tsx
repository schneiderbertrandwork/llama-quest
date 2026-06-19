import { useEffect, useState } from 'react'
import { Platform, View, Text, StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Stack } from 'expo-router'

export default function RootLayout() {
  // On web, Skia requires its WASM (CanvasKit) to be loaded before any
  // Canvas renders. Block the navigation stack until it's ready.
  const [skiaReady, setSkiaReady] = useState(Platform.OS !== 'web')

  useEffect(() => {
    if (Platform.OS !== 'web') return
    import('@shopify/react-native-skia/lib/module/web/LoadSkiaWeb').then(
      ({ LoadSkiaWeb }) => LoadSkiaWeb().then(() => setSkiaReady(true)),
    )
  }, [])

  if (!skiaReady) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1a2e' },
  loading: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#c0a060', fontFamily: 'monospace', fontSize: 14 },
})
