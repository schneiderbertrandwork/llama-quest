import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { AudioManager } from '../audio/AudioManager'
import { WorldRenderer } from '../renderer/WorldRenderer'
import { HUD } from '../components/HUD'
import { DialogueBox } from '../components/DialogueBox'
import { useGameLoop } from '../hooks/useGameLoop'
import { usePlayerInput } from '../hooks/usePlayerInput'
import { movePlayer } from '../engine/movement'
import { nearestInteractable, makePlayer } from '../engine/entity'
import { tickCritter } from '../engine/critter'
import { OVERWORLD } from '../content/world-data'
import { useGameStore } from '../store/game-store'
import { getEnemiesForAct } from '../content/enemies'
import { SafeAreaWrapper } from '../components/SafeAreaWrapper'
import { TouchDpad } from '../components/TouchDpad'
import type { Entity } from '../engine/entity'

const TILE_SIZE = 64

export default function OverworldScreen() {
  const { width, height } = useWindowDimensions()
  const router = useRouter()
  const { progression, markNPCMet, setPosition } = useGameStore()

  const playerRef = useRef<Entity>(
    makePlayer(progression.position.x, progression.position.y),
  )
  const [playerState, setPlayerState] = useState(playerRef.current)
  const [dialogue, setDialogue] = useState<{ lines: string[]; speaker?: string } | null>(null)
  const [nearbyLabel, setNearbyLabel] = useState<string | null>(null)
  const [critters, setCritters] = useState<Entity[]>(() =>
    OVERWORLD.entities.filter((e) => e.type === 'critter')
  )

  const { input } = usePlayerInput()
  const encounterCooldown = useRef(90)
  const timeRef = useRef(0)

  useEffect(() => {
    AudioManager.play('overworld')
    return () => AudioManager.stop()
  }, [])

  useGameLoop(useCallback((dt) => {
    timeRef.current += dt * 1000
    if (dialogue) return
    const prev = playerRef.current
    const moved = movePlayer(prev, input.current!, OVERWORLD.grid, dt)
    if (moved !== prev) {
      playerRef.current = moved
      setPlayerState(moved)
    }
    setCritters((critterPrev) => critterPrev.map((c) => tickCritter(c, dt, OVERWORLD.grid)))

    const nearby = nearestInteractable(OVERWORLD.entities, moved.x, moved.y)
    setNearbyLabel(nearby ? `[E] ${nearby.type === 'building_entrance' ? 'Enter' : 'Talk'}` : null)

    // Encounter check
    const stepped =
      Math.floor(moved.x) !== Math.floor(prev.x) ||
      Math.floor(moved.y) !== Math.floor(prev.y)
    if (stepped) {
      if (encounterCooldown.current > 0) {
        encounterCooldown.current -= 1
      } else if (Math.random() < 0.06) {
        const enemies = getEnemiesForAct(1)
        const enemy = enemies[Math.floor(Math.random() * enemies.length)]
        if (enemy) {
          encounterCooldown.current = 90
          router.push(`/battle?enemyId=${enemy.id}`)
        }
      }
    }
  }, [dialogue]))

  const handleInteractRef = useRef<() => void>(() => {})

  function handleInteract() {
    const nearby = nearestInteractable(OVERWORLD.entities, playerRef.current.x, playerRef.current.y)
    if (!nearby) return
    if (nearby.type === 'building_entrance') {
      const dest = nearby.data['destination'] as string
      setPosition('llamatown', playerRef.current.x, playerRef.current.y)
      router.push(`/city/${dest}`)
    }
  }
  handleInteractRef.current = handleInteract

  useEffect(() => {
    if (Platform.OS !== 'web') return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E') handleInteractRef.current()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <SafeAreaWrapper style={styles.screen}>
      <WorldRenderer
        grid={OVERWORLD.grid}
        player={playerState}
        entities={[...OVERWORLD.entities.filter((e) => e.type !== 'critter'), ...critters]}
        tileSize={TILE_SIZE}
        screenWidth={width}
        screenHeight={height}
        time={timeRef.current}
      />
      <HUD />
      <TouchDpad
        onInput={(dx, dy) => { input.current!.dx = dx; input.current!.dy = dy }}
        onInteract={handleInteract}
      />
      {nearbyLabel && !dialogue && (
        <TouchableOpacity testID="interact-prompt" style={styles.interactPrompt} onPress={handleInteract}>
          <Text style={styles.interactText}>{nearbyLabel}</Text>
        </TouchableOpacity>
      )}
      {dialogue && (
        <DialogueBox
          lines={dialogue.lines}
          speakerName={dialogue.speaker}
          onClose={() => setDialogue(null)}
        />
      )}
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0d1a' },
  interactPrompt: { position: 'absolute', bottom: 80, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.8)', borderWidth: 2, borderColor: '#c0a060', borderRadius: 4, paddingHorizontal: 16, paddingVertical: 8 },
  interactText: { color: '#c0a060', fontFamily: 'monospace', fontSize: 13 },
})
