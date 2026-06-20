import React from 'react'
import { Platform, Pressable, Text, View, StyleSheet } from 'react-native'

interface TouchDpadProps {
  onInput: (dx: number, dy: number) => void
  onInteract: () => void
}

export function TouchDpad({ onInput, onInteract }: TouchDpadProps): React.ReactElement | null {
  if (Platform.OS === 'web') return null

  return (
    <View style={styles.container} accessibilityLabel="D-pad controls">
      {/* Up row */}
      <View style={styles.row}>
        <Pressable
          testID="dpad-up"
          accessibilityRole="button"
          style={styles.btn}
          onPressIn={() => onInput(0, -1)}
          onPressOut={() => onInput(0, 0)}
        >
          <Text style={styles.btnText}>▲</Text>
        </Pressable>
      </View>

      {/* Middle row: left, interact, right */}
      <View style={styles.row}>
        <Pressable
          testID="dpad-left"
          accessibilityRole="button"
          style={styles.btn}
          onPressIn={() => onInput(-1, 0)}
          onPressOut={() => onInput(0, 0)}
        >
          <Text style={styles.btnText}>◀</Text>
        </Pressable>

        <Pressable
          testID="dpad-interact"
          accessibilityRole="button"
          style={[styles.btn, styles.interactBtn]}
          onPress={onInteract}
        >
          <Text style={styles.btnText}>E</Text>
        </Pressable>

        <Pressable
          testID="dpad-right"
          accessibilityRole="button"
          style={styles.btn}
          onPressIn={() => onInput(1, 0)}
          onPressOut={() => onInput(0, 0)}
        >
          <Text style={styles.btnText}>▶</Text>
        </Pressable>
      </View>

      {/* Down row */}
      <View style={styles.row}>
        <Pressable
          testID="dpad-down"
          accessibilityRole="button"
          style={styles.btn}
          onPressIn={() => onInput(0, 1)}
          onPressOut={() => onInput(0, 0)}
        >
          <Text style={styles.btnText}>▼</Text>
        </Pressable>
      </View>
    </View>
  )
}

const BTN_SIZE = 64
const GAP = 8

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    zIndex: 100,
    gap: GAP,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
    justifyContent: 'center',
  },
  btn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interactBtn: {
    backgroundColor: 'rgba(192,160,96,0.25)',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'monospace',
  },
})
