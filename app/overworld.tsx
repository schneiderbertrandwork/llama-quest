import React, { useCallback, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { WorldRenderer } from '../renderer/WorldRenderer'
import { HUD } from '../components/HUD'
import { DialogueBox } from '../components/DialogueBox'
import { useGameLoop } from '../hooks/useGameLoop'
import { usePlayerInput } from '../hooks/usePlayerInput'
import { movePlayer } from '../engine/movement'
import { nearestInteractable, makePlayer } from '../engine/entity'
import { OVERWORLD } from '../content/world-data'
import { useGameStore } from '../store/game-store'
import { getEnemiesForAct } from '../content/enemies'
import type { Entity } from '../engine/entity'

const TILE_SIZE = 32

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

  const { input } = usePlayerInput()
  const encounterCooldown = useRef(90)

  useGameLoop(useCallback((dt) => {
    if (dialogue) return
    const prev = playerRef.current
    const moved = movePlayer(prev, input.current!, OVERWORLD.grid, dt)
    playerRef.current = moved
    setPlayerState({ ...moved })

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

  function handleInteract() {
    const nearby = nearestInteractable(OVERWORLD.entities, playerRef.current.x, playerRef.current.y)
    if (!nearby) return
    if (nearby.type === 'building_entrance') {
      const dest = nearby.data['destination'] as string
      setPosition('llamatown', playerRef.current.x, playerRef.current.y)
      router.push(`/city/${dest}`)
    }
  }

  return (
    <View style={styles.screen}>
      <WorldRenderer
        grid={OVERWORLD.grid}
        player={playerState}
        entities={OVERWORLD.entities}
        tileSize={TILE_SIZE}
        screenWidth={width}
        screenHeight={height}
      />
      <HUD />
      {nearbyLabel && !dialogue && (
        <TouchableOpacity style={styles.interactPrompt} onPress={handleInteract}>
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
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0d1a' },
  interactPrompt: { position: 'absolute', bottom: 80, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.8)', borderWidth: 2, borderColor: '#c0a060', borderRadius: 4, paddingHorizontal: 16, paddingVertical: 8 },
  interactText: { color: '#c0a060', fontFamily: 'monospace', fontSize: 13 },
})
