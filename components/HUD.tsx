import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useGameStore } from '../store/game-store'

export function HUD() {
  const { player } = useGameStore()
  const hpPercent = player.hp / player.maxHp
  const hpBarColor = hpPercent > 0.5 ? '#4caf50' : hpPercent > 0.25 ? '#ff9800' : '#f44336'

  return (
    <View style={styles.outerBorder} pointerEvents="none">
      <View style={styles.gap}>
        <View style={styles.innerBorder}>
          <View style={styles.row}>
            <Text style={styles.name}>{player.name || 'LLAMA'}</Text>
            <Text style={styles.level}>Lv.{player.level}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>HP</Text>
            <View style={styles.barOuter}>
              <View style={[styles.barFill, { width: `${hpPercent * 100}%` as any, backgroundColor: hpBarColor }]} />
            </View>
            <Text style={styles.hpText}>{player.hp}/{player.maxHp}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>XP</Text>
            <Text style={styles.xpText}>{player.xp}/120</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outerBorder: { position: 'absolute', top: 8, left: 8, minWidth: 160, borderWidth: 2, borderColor: '#c0a060', backgroundColor: '#000000' },
  gap: { padding: 2, backgroundColor: '#000000' },
  innerBorder: { borderWidth: 2, borderColor: '#c0a060', backgroundColor: '#0a0826', padding: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  name: { color: '#f5c518', fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', flex: 1 },
  level: { color: '#aaaaaa', fontFamily: 'monospace', fontSize: 10 },
  label: { color: '#aaaaaa', fontFamily: 'monospace', fontSize: 10, width: 24 },
  barOuter: { flex: 1, height: 8, backgroundColor: '#333333', borderRadius: 0, borderWidth: 1, borderColor: '#000000', overflow: 'hidden', marginHorizontal: 4 },
  barFill: { height: '100%', borderRadius: 0 },
  hpText: { color: '#ffffff', fontFamily: 'monospace', fontSize: 10, width: 48, textAlign: 'right' },
  xpText: { color: '#7ec8e3', fontFamily: 'monospace', fontSize: 10 },
})
