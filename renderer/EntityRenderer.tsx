import React from 'react'
import { Canvas, Rect, Group } from '@shopify/react-native-skia'
import type { Entity } from '../engine/entity'
import type { CritterData } from '../engine/entity'
import type { Camera } from '../engine/camera'
import type { SpriteGrid, SpriteAnimation } from '../content/sprites'
import {
  SPRITE_PLAYER_ANIM,
  SPRITE_NPC_ELDER_ANIM,
  SPRITE_NPC_PIP_ANIM,
  SPRITE_NPC_SMITH_ANIM,
  SPRITE_NPC_ARTIFICER_ANIM,
  SPRITE_NPC_ORACLE_ANIM,
  SPRITE_NPC_VECTOR_ANIM,
  SPRITE_NPC_ARCHITECT_ANIM,
  SPRITE_NPC_KEEPER_ANIM,
  SPRITE_DOOR,
  SPRITE_GATE,
  SPRITE_PORTAL,
  SPRITE_DECO_LLAMA,
  SPRITE_RABBIT_ANIM,
  SPRITE_BIRD_ANIM,
  SPRITE_SQUIRREL_ANIM,
  SPRITE_BUTTERFLY_ANIM,
} from '../content/sprites'

const NPC_ANIM: Record<string, SpriteAnimation> = {
  'npc-llama-elder': SPRITE_NPC_ELDER_ANIM,
  'mayor-lloyd': SPRITE_NPC_ELDER_ANIM,
  'npc-pip': SPRITE_NPC_PIP_ANIM,
  'npc-penny': SPRITE_NPC_PIP_ANIM,
  'npc-smith': SPRITE_NPC_SMITH_ANIM,
  'npc-api-artificer': SPRITE_NPC_ARTIFICER_ANIM,
  'npc-prism-oracle': SPRITE_NPC_ORACLE_ANIM,
  'npc-vector-sprite': SPRITE_NPC_VECTOR_ANIM,
  'npc-architect': SPRITE_NPC_ARCHITECT_ANIM,
  'npc-keeper': SPRITE_NPC_KEEPER_ANIM,
}

const CRITTER_ANIM: Record<string, SpriteAnimation> = {
  rabbit: SPRITE_RABBIT_ANIM,
  bird: SPRITE_BIRD_ANIM,
  squirrel: SPRITE_SQUIRREL_ANIM,
  butterfly: SPRITE_BUTTERFLY_ANIM,
}

const FALLBACK_COLOR: Record<string, string> = {
  player: '#f5c518',
  npc: '#4fc3f7',
  sign: '#ce93d8',
  building_entrance: '#80cbc4',
  gate: '#ef9a9a',
  sandbox_portal: '#a5d6a7',
  decoration: '#c8b89a',
  critter: '#c8b89a',
}

function staticAnim(sprite: SpriteGrid): SpriteAnimation {
  return { frames: [sprite], frameDuration: 1000 }
}

function getAnimForEntity(entity: Entity): { anim: SpriteAnimation; tint?: string } | null {
  switch (entity.type) {
    case 'player':
      return { anim: SPRITE_PLAYER_ANIM }
    case 'npc': {
      const anim = NPC_ANIM[entity.id]
      return anim ? { anim } : null
    }
    case 'building_entrance':
      return { anim: staticAnim(SPRITE_DOOR) }
    case 'gate': {
      const locked = entity.data['locked'] as boolean | undefined
      return { anim: staticAnim(SPRITE_GATE), tint: locked ? '#f44336' : '#4caf50' }
    }
    case 'sandbox_portal':
      return { anim: staticAnim(SPRITE_PORTAL) }
    case 'decoration':
      return { anim: staticAnim(SPRITE_DECO_LLAMA) }
    case 'critter': {
      const cd = entity.data as unknown as CritterData
      const anim = CRITTER_ANIM[cd.critterType ?? '']
      return anim ? { anim } : null
    }
    default:
      return null
  }
}

interface EntityRendererProps {
  entities: Entity[]
  camera: Camera
  tileSize: number
  width: number
  height: number
  time: number
}

export function EntityRenderer({ entities, camera, tileSize, width, height, time }: EntityRendererProps) {
  return (
    <Canvas style={{ position: 'absolute', top: 0, left: 0, width, height }}>
      <Group>
        {entities.flatMap((entity) => {
          const baseSx = entity.x * tileSize - camera.x
          const baseSy = entity.y * tileSize - camera.y

          // Butterfly sine-wave vertical offset
          let sineOffset = 0
          if (entity.type === 'critter') {
            const cd = entity.data as unknown as CritterData
            if (cd.critterType === 'butterfly') {
              sineOffset = Math.sin(time / 400 + (cd.phaseOffset ?? 0)) * 0.3 * tileSize
            }
          }

          const sy = baseSy + sineOffset

          const result = getAnimForEntity(entity)

          if (!result) {
            const size = tileSize * 0.8
            const offset = tileSize * 0.1
            return [
              <Rect
                key={entity.id}
                x={baseSx + offset}
                y={sy + offset}
                width={size}
                height={size}
                color={FALLBACK_COLOR[entity.type] ?? '#ffffff'}
              />,
            ]
          }

          const { anim, tint } = result
          const frameIdx = Math.floor(time / anim.frameDuration) % anim.frames.length
          const frame = anim.frames[frameIdx] ?? anim.frames[0]
          if (!frame) return []

          const pixelSize = tileSize / frame.size
          return frame.pixels
            .map((color, i) => {
              if (!color) return null          // always skip transparent pixels
              const c = tint ?? color          // apply tint to opaque pixels
              const row = Math.floor(i / frame.size)
              const col = i % frame.size
              return (
                <Rect
                  key={`${entity.id}-${i}`}
                  x={baseSx + col * pixelSize}
                  y={sy + row * pixelSize}
                  width={pixelSize}
                  height={pixelSize}
                  color={c}
                />
              )
            })
            .filter((el): el is React.ReactElement => el !== null)
        })}
      </Group>
    </Canvas>
  )
}
