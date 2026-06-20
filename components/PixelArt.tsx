import React from 'react'
import { View } from 'react-native'

interface PixelArtProps {
  pixels: string[]
  size: number
  scale: number
  testID?: string
}

export function PixelArt({ pixels, size, scale, testID }: PixelArtProps) {
  const rows: React.ReactElement[] = []
  for (let r = 0; r < size; r++) {
    const cols: React.ReactElement[] = []
    for (let c = 0; c < size; c++) {
      const color = pixels[r * size + c] ?? ''
      cols.push(
        <View
          key={c}
          testID={testID ? 'pa-pixel' : undefined}
          style={{ width: scale, height: scale, backgroundColor: color || 'transparent' }}
        />
      )
    }
    rows.push(<View key={r} style={{ flexDirection: 'row' }}>{cols}</View>)
  }
  return <View testID={testID}>{rows}</View>
}
