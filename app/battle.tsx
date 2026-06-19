// app/battle.tsx
import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native'
import { Canvas, Rect } from '@shopify/react-native-skia'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useBattle } from '../hooks/useBattle'
import { RollingHP } from '../components/RollingHP'
import { BattleMenu } from '../components/BattleMenu'
import { PSIAttack } from '../components/PSIAttack'
import { ENEMIES, BOSSES } from '../content/enemies'
import { useGameStore } from '../store/game-store'
import type { CityId } from '../store/game-store'

const CITY_SPAWN: Record<string, { x: number; y: number }> = {
  overworld: { x: 6, y: 14 },
  llamatown: { x: 9, y: 12 },
  forge: { x: 5, y: 10 },
  vale: { x: 11, y: 14 },
  ridge: { x: 5, y: 12 },
}

export default function BattleScreen() {
  const { enemyId } = useLocalSearchParams<{ enemyId: string }>()
  const { width, height } = useWindowDimensions()
  const router = useRouter()
  const { player, progression, setPlayerHp, setPosition } = useGameStore()
  const [psiResult, setPsiResult] = useState<'none' | 'correct' | 'wrong'>('none')
  const resolvedRef = useRef(false)

  const allEnemies = [...ENEMIES, ...BOSSES]
  const enemy = allEnemies.find(e => e.id === enemyId) ?? null

  // If enemy not found, go back immediately
  useEffect(() => {
    if (!enemy) {
      router.back()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const resolvedEnemy = enemy ?? ENEMIES[0]!
  const battle = useBattle(resolvedEnemy, player.hp, player.maxHp)
  const { state } = battle

  // Victory / defeat resolution
  useEffect(() => {
    if (resolvedRef.current) return
    if (state.phase === 'victory') {
      resolvedRef.current = true
      setTimeout(() => router.back(), 2000)
    }
    if (state.phase === 'defeat') {
      resolvedRef.current = true
      const spawn = CITY_SPAWN[progression.currentCity] ?? { x: 5, y: 5 }
      setPlayerHp(1)
      setPosition(progression.currentCity as CityId, spawn.x, spawn.y)
      setTimeout(() => router.back(), 2000)
    }
  }, [state.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  function handlePSI() {
    setPsiResult('none')
    battle.choosePSI()
  }

  function handleAnswer(idx: 0 | 1 | 2 | 3) {
    const wasCorrect = idx === state.pendingQuestion?.c
    setPsiResult(wasCorrect ? 'correct' : 'wrong')
    setTimeout(() => {
      battle.answer(idx)
      setPsiResult('none')
    }, 1200)
  }

  function handleRun() {
    const { escaped } = battle.chooseRun()
    if (escaped) {
      setTimeout(() => router.back(), 800)
    }
  }

  const enemyHpRatio = state.enemyMaxHp > 0 ? state.enemyHp / state.enemyMaxHp : 0
  const enemyBarColor = enemyHpRatio > 0.5 ? '#f44336' : enemyHpRatio > 0.25 ? '#ff9800' : '#aaa'
  const isPlayerTurn = state.phase === 'player-turn'
  const isPsiPhase = state.phase === 'psi-question'
  const menuDisabled = !isPlayerTurn

  return (
    <View style={styles.screen}>
      {/* Skia background */}
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Rect x={0} y={0} width={width} height={height} color="#0d0d1a" />
        <Rect x={0} y={0} width={width} height={height * 0.45} color="#120d28" />
        {/* Enemy rect placeholder */}
        <Rect x={width / 2 - 40} y={60} width={80} height={80} color="#2a2150" />
      </Canvas>

      {/* Enemy area */}
      <View style={[styles.enemyArea, { width }]}>
        <Text style={styles.enemyName}>{resolvedEnemy.name}</Text>
        <View style={styles.hpBarBg}>
          <View
            style={[
              styles.hpBarFill,
              { width: `${enemyHpRatio * 100}%` as `${number}%`, backgroundColor: enemyBarColor },
            ]}
          />
        </View>
        <Text style={styles.enemyHpText}>{state.enemyHp}/{state.enemyMaxHp}</Text>
      </View>

      {/* Battle log */}
      <View style={styles.logArea}>
        {state.log.map((msg, i) => (
          <Text key={i} style={styles.logText}>{msg}</Text>
        ))}
        {state.phase === 'victory' && <Text style={styles.victoryText}>Victory!</Text>}
        {state.phase === 'defeat' && <Text style={styles.defeatText}>Defeated…</Text>}
      </View>

      {/* Player + menu area */}
      <View style={styles.bottomArea}>
        {/* Player rect + rolling HP */}
        <View style={styles.playerSection}>
          <View style={styles.playerRect} />
          <RollingHP displayHp={state.displayHp} playerHp={state.playerHp} maxHp={state.playerMaxHp} />
        </View>

        {/* Action menu */}
        <View style={styles.menuSection}>
          {isPsiPhase && state.pendingQuestion ? (
            <PSIAttack
              question={state.pendingQuestion}
              onAnswer={handleAnswer}
              result={psiResult}
            />
          ) : (
            <BattleMenu
              onPSI={handlePSI}
              onGuard={battle.chooseGuard}
              onRun={handleRun}
              disabled={menuDisabled}
            />
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0d1a' },
  enemyArea: { paddingTop: 155, alignItems: 'center', paddingHorizontal: 24, gap: 6 },
  enemyName: { color: '#ece9ff', fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold' },
  hpBarBg: { width: '60%', height: 10, backgroundColor: '#333', borderRadius: 5, overflow: 'hidden' },
  hpBarFill: { height: '100%', borderRadius: 5 },
  enemyHpText: { color: '#aaa', fontFamily: 'monospace', fontSize: 11 },
  logArea: { paddingHorizontal: 20, paddingVertical: 12, minHeight: 70, justifyContent: 'flex-end' },
  logText: { color: '#c0a060', fontFamily: 'monospace', fontSize: 11, marginBottom: 2 },
  victoryText: { color: '#4caf50', fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  defeatText: { color: '#f44336', fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  bottomArea: { flex: 1, flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 24, gap: 16, alignItems: 'flex-end' },
  playerSection: { gap: 12, alignItems: 'center' },
  playerRect: { width: 48, height: 48, backgroundColor: '#4a3f8c', borderRadius: 4 },
  menuSection: { flex: 1, justifyContent: 'flex-end' },
})
