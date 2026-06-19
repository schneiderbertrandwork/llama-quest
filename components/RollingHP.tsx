import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface RollingHPProps {
  displayHp: number    // visual value (draining toward playerHp)
  playerHp: number     // actual HP (used for color threshold)
  maxHp: number
}

export function RollingHP({ displayHp, playerHp, maxHp }: RollingHPProps) {
  const ratio = playerHp / maxHp
  const color = ratio > 0.5 ? '#4caf50' : ratio > 0.25 ? '#ff9800' : '#f44336'
  const shown = Math.ceil(displayHp)

  return (
    <View style={styles.container}>
      <Text style={styles.label}>HP</Text>
      <Text style={[styles.value, { color }]}>{shown}</Text>
      <Text style={styles.max}>/{maxHp}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  label: { color: '#aaa', fontFamily: 'monospace', fontSize: 12 },
  value: { fontFamily: 'monospace', fontSize: 22, fontWeight: 'bold' },
  max: { color: '#aaa', fontFamily: 'monospace', fontSize: 12 },
})
