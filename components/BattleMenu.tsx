// components/BattleMenu.tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import * as Haptics from 'expo-haptics'

interface BattleMenuProps {
  onPSI: () => void
  onGuard: () => void
  onRun: () => void
  disabled: boolean
}

export function BattleMenu({ onPSI, onGuard, onRun, disabled }: BattleMenuProps) {
  function withHaptic(fn: () => void) {
    if (Platform.OS !== 'web') Haptics.selectionAsync()
    fn()
  }

  return (
    <View style={styles.container}>
      {[
        { label: '⚡ PSI', style: styles.psi, onPress: onPSI },
        { label: '🛡 Guard', style: styles.guard, onPress: onGuard },
        { label: '💨 Run', style: styles.run, onPress: onRun },
      ].map(({ label, style, onPress }) => (
        <TouchableOpacity
          key={label}
          style={[styles.btn, style, disabled && styles.disabled]}
          onPress={() => withHaptic(onPress)}
          disabled={disabled}
        >
          <View style={[styles.bevel, styles.bevelTop]} />
          <View style={[styles.bevel, styles.bevelLeft]} />
          <Text style={styles.btnText}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 8, minWidth: 140 },
  btn: { borderRadius: 0, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 2, alignItems: 'center' },
  psi: { backgroundColor: '#1a1240', borderColor: '#a06bff' },
  guard: { backgroundColor: '#0d1f2d', borderColor: '#4fe0cf' },
  run: { backgroundColor: '#1f1208', borderColor: '#c0a060' },
  disabled: { opacity: 0.4 },
  btnText: { color: '#ffffff', fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold' },
  bevel: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.18)' },
  bevelTop: { top: 0, left: 0, right: 0, height: 1 },
  bevelLeft: { top: 0, left: 0, bottom: 0, width: 1 },
})
