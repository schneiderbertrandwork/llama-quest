import React, { useCallback, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { WorldRenderer } from '../../renderer/WorldRenderer'
import { HUD } from '../../components/HUD'
import { DialogueBox } from '../../components/DialogueBox'
import { useGameLoop } from '../../hooks/useGameLoop'
import { usePlayerInput } from '../../hooks/usePlayerInput'
import { movePlayer } from '../../engine/movement'
import { nearestInteractable, makePlayer } from '../../engine/entity'
import { getCityDef } from '../../content/world-data'
import { useGameStore } from '../../store/game-store'
import type { Entity } from '../../engine/entity'

const TILE_SIZE = 32

export default function CityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { width, height } = useWindowDimensions()
  const router = useRouter()
  const { progression, markNPCMet, setPosition } = useGameStore()

  const cityDef = getCityDef(id as any)
  const spawn = cityDef.playerSpawn

  const playerRef = useRef<Entity>(makePlayer(spawn.x, spawn.y))
  const [playerState, setPlayerState] = useState(playerRef.current)
  const [dialogue, setDialogue] = useState<{ lines: string[]; speaker?: string } | null>(null)
  const [nearbyEntity, setNearbyEntity] = useState<Entity | null>(null)

  const { input } = usePlayerInput()

  useGameLoop(useCallback((dt) => {
    if (dialogue) return
    const moved = movePlayer(playerRef.current, input.current!, cityDef.grid, dt)
    playerRef.current = moved
    setPlayerState({ ...moved })
    setNearbyEntity(nearestInteractable(cityDef.entities, moved.x, moved.y))
  }, [dialogue, cityDef]))

  function handleInteract() {
    if (!nearbyEntity) return
    if (nearbyEntity.type === 'npc') {
      const lines = nearbyEntity.data['lines'] as string[]
      const name = nearbyEntity.data['name'] as string
      markNPCMet(nearbyEntity.id)
      setDialogue({ lines, speaker: name })
    } else if (nearbyEntity.type === 'building_entrance') {
      const dest = nearbyEntity.data['destination'] as string
      setPosition(id as any, playerRef.current.x, playerRef.current.y)
      router.push(`/building/${dest}`)
    } else if (nearbyEntity.type === 'gate') {
      const dest = nearbyEntity.data['destination'] as string
      if (dest === 'overworld') router.push('/overworld')
      else router.push(`/city/${dest}`)
    }
  }

  const interactLabel = nearbyEntity
    ? nearbyEntity.type === 'npc' ? `[E] Talk to ${nearbyEntity.data['name']}` : '[E] Enter'
    : null

  return (
    <View style={styles.screen}>
      <WorldRenderer
        grid={cityDef.grid}
        player={playerState}
        entities={cityDef.entities}
        tileSize={TILE_SIZE}
        screenWidth={width}
        screenHeight={height}
      />
      <HUD />
      {interactLabel && !dialogue && (
        <TouchableOpacity style={styles.prompt} onPress={handleInteract}>
          <Text style={styles.promptText}>{interactLabel}</Text>
        </TouchableOpacity>
      )}
      {dialogue && (
        <DialogueBox lines={dialogue.lines} speakerName={dialogue.speaker} onClose={() => setDialogue(null)} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0d1a' },
  prompt: { position: 'absolute', bottom: 80, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.8)', borderWidth: 2, borderColor: '#c0a060', borderRadius: 4, paddingHorizontal: 16, paddingVertical: 8 },
  promptText: { color: '#c0a060', fontFamily: 'monospace', fontSize: 13 },
})
