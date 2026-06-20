import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AudioManager, TrackId } from '../../audio/AudioManager'
import { WorldRenderer } from '../../renderer/WorldRenderer'
import { HUD } from '../../components/HUD'
import { DialogueBox } from '../../components/DialogueBox'
import { useGameLoop } from '../../hooks/useGameLoop'
import { usePlayerInput } from '../../hooks/usePlayerInput'
import { movePlayer } from '../../engine/movement'
import { nearestInteractable, makePlayer } from '../../engine/entity'
import { getCityDef, isGateUnlocked } from '../../content/world-data'
import { useGameStore } from '../../store/game-store'
import { getEnemiesForAct } from '../../content/enemies'
import { SafeAreaWrapper } from '../../components/SafeAreaWrapper'
import { TouchDpad } from '../../components/TouchDpad'
import type { Entity } from '../../engine/entity'

const TILE_SIZE = 32

const CITY_ACT: Record<string, 1 | 2 | 3 | 4> = {
  overworld: 1, llamatown: 1, forge: 2, vale: 3, ridge: 4,
}

const CITY_TRACK: Record<string, TrackId> = {
  llamatown: 'llamatown',
  forge: 'forge',
  vale: 'caverns',
  ridge: 'convergence',
}

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
  const encounterCooldown = useRef(90)

  useEffect(() => {
    const track = CITY_TRACK[id ?? ''] ?? 'llamatown'
    AudioManager.play(track)
    return () => AudioManager.stop()
  }, [id])

  useGameLoop(useCallback((dt) => {
    if (dialogue) return
    const prev = playerRef.current
    const moved = movePlayer(prev, input.current!, cityDef.grid, dt)
    playerRef.current = moved
    setPlayerState({ ...moved })
    setNearbyEntity(nearestInteractable(cityDef.entities, moved.x, moved.y))

    // Encounter check
    const act = CITY_ACT[id ?? ''] ?? 1
    const stepped =
      Math.floor(moved.x) !== Math.floor(prev.x) ||
      Math.floor(moved.y) !== Math.floor(prev.y)
    if (stepped) {
      if (encounterCooldown.current > 0) {
        encounterCooldown.current -= 1
      } else if (Math.random() < 0.06) {
        const enemies = getEnemiesForAct(act)
        const enemy = enemies[Math.floor(Math.random() * enemies.length)]
        if (enemy) {
          encounterCooldown.current = 90
          router.push(`/battle?enemyId=${enemy.id}`)
        }
      }
    }
  }, [dialogue, cityDef, id]))

  function handleInteract() {
    if (!nearbyEntity) return
    if (nearbyEntity.type === 'npc') {
      const lines = nearbyEntity.data['lines'] as string[]
      const name = nearbyEntity.data['name'] as string
      markNPCMet(nearbyEntity.id)
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
      setDialogue({ lines, speaker: name })
      AudioManager.sfx('npcBlip')
    } else if (nearbyEntity.type === 'building_entrance') {
      const dest = nearbyEntity.data['destination'] as string
      setPosition(id as any, playerRef.current.x, playerRef.current.y)
      router.push(`/building/${dest}`)
    } else if (nearbyEntity.type === 'sandbox_portal') {
      const dest = nearbyEntity.data['destination'] as string
      router.push(`/sandbox/${dest}`)
    } else if (nearbyEntity.type === 'gate') {
      const dest = nearbyEntity.data['destination'] as string
      const bossId = nearbyEntity.data['bossId'] as string | undefined
      const locked = nearbyEntity.data['locked'] as boolean | undefined

      if (locked && bossId) {
        // Boss battle gate (e.g., Llamatown → Forge via Frozen Boot)
        if (progression.defeatedBosses[bossId]) {
          if (dest === 'overworld') router.push('/overworld')
          else router.push(`/city/${dest}`)
        } else {
          encounterCooldown.current = 90
          router.push(`/battle?enemyId=${bossId}`)
        }
      } else if (locked) {
        // Act mastery + boss defeat gate (e.g., Forge → Vale, Vale → Ridge)
        const cityAct = CITY_ACT[id ?? ''] ?? 1
        if (isGateUnlocked(cityAct as 1 | 2 | 3 | 4, progression.masteredConcepts, progression.defeatedBosses)) {
          if (dest === 'overworld') router.push('/overworld')
          else router.push(`/city/${dest}`)
        } else {
          setDialogue({ lines: [`Gate locked — read all Act ${cityAct} lessons and defeat the boss to proceed.`] })
        }
      } else {
        // Unlocked gate — route directly
        if (dest === 'overworld') router.push('/overworld')
        else router.push(`/city/${dest}`)
      }
    }
  }

  const interactLabel = nearbyEntity
    ? nearbyEntity.type === 'npc'
      ? `[E] Talk to ${nearbyEntity.data['name']}`
      : nearbyEntity.type === 'sandbox_portal'
      ? '[E] Open Terminal'
      : nearbyEntity.type === 'gate' && nearbyEntity.data['locked'] && !nearbyEntity.data['bossId']
      ? '[E] Gate (locked?)'
      : '[E] Enter'
    : null

  return (
    <SafeAreaWrapper style={styles.screen}>
      <WorldRenderer
        grid={cityDef.grid}
        player={playerState}
        entities={cityDef.entities}
        tileSize={TILE_SIZE}
        screenWidth={width}
        screenHeight={height}
        time={0}
      />
      <HUD />
      <TouchDpad
        onInput={(dx, dy) => { input.current!.dx = dx; input.current!.dy = dy }}
        onInteract={handleInteract}
      />
      {interactLabel && !dialogue && (
        <TouchableOpacity style={styles.prompt} onPress={handleInteract}>
          <Text style={styles.promptText}>{interactLabel}</Text>
        </TouchableOpacity>
      )}
      {dialogue && (
        <DialogueBox lines={dialogue.lines} speakerName={dialogue.speaker} onClose={() => setDialogue(null)} />
      )}
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0d1a' },
  prompt: { position: 'absolute', bottom: 80, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.8)', borderWidth: 2, borderColor: '#c0a060', borderRadius: 4, paddingHorizontal: 16, paddingVertical: 8 },
  promptText: { color: '#c0a060', fontFamily: 'monospace', fontSize: 13 },
})
