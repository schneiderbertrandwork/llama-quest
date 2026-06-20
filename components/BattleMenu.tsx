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
      <TouchableOpacity
        style={[styles.btn, styles.psi, disabled && styles.disabled]}
        onPress={() => withHaptic(onPSI)}
        disabled={disabled}
      >
        <Text style={styles.btnText}>⚡ PSI</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, styles.guard, disabled && styles.disabled]}
        onPress={() => withHaptic(onGuard)}
        disabled={disabled}
      >
        <Text style={styles.btnText}>🛡 Guard</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, styles.run, disabled && styles.disabled]}
        onPress={() => withHaptic(onRun)}
        disabled={disabled}
      >
        <Text style={styles.btnText}>💨 Run</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 8, minWidth: 140 },
  btn: { borderRadius: 6, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 2, alignItems: 'center' },
  psi: { backgroundColor: '#1a1240', borderColor: '#a06bff' },
  guard: { backgroundColor: '#0d1f2d', borderColor: '#4fe0cf' },
  run: { backgroundColor: '#1f1208', borderColor: '#c0a060' },
  disabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold' },
})
