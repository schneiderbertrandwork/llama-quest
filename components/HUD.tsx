import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useGameStore } from '../store/game-store'

export function HUD() {
  const { player } = useGameStore()
  const hpPercent = player.hp / player.maxHp

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.row}>
        <Text style={styles.name}>{player.name || 'LLAMA'}</Text>
        <Text style={styles.level}>Lv.{player.level}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>HP</Text>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${hpPercent * 100}%` as any, backgroundColor: hpPercent > 0.5 ? '#4caf50' : hpPercent > 0.25 ? '#ff9800' : '#f44336' }]} />
        </View>
        <Text style={styles.hpText}>{player.hp}/{player.maxHp}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>XP</Text>
        <Text style={styles.xpText}>{player.xp}/120</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: 8, borderWidth: 2, borderColor: '#c0a060', minWidth: 160 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  name: { color: '#f5c518', fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', flex: 1 },
  level: { color: '#aaa', fontFamily: 'monospace', fontSize: 10 },
  label: { color: '#aaa', fontFamily: 'monospace', fontSize: 10, width: 24 },
  barBg: { flex: 1, height: 8, backgroundColor: '#333', borderRadius: 4, overflow: 'hidden', marginHorizontal: 4 },
  barFill: { height: '100%', borderRadius: 4 },
  hpText: { color: '#fff', fontFamily: 'monospace', fontSize: 10, width: 48, textAlign: 'right' },
  xpText: { color: '#7ec8e3', fontFamily: 'monospace', fontSize: 10 },
})
