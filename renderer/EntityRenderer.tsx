import React from 'react'
import { Canvas, Rect, Group } from '@shopify/react-native-skia'
import type { Entity } from '../engine/entity'
import type { Camera } from '../engine/camera'

// Phase 1 placeholders: colored rects per entity type
const ENTITY_COLOR: Record<string, string> = {
  player: '#f5c518',
  npc: '#4fc3f7',
  sign: '#ce93d8',
  building_entrance: '#80cbc4',
  gate: '#ef9a9a',
}

interface EntityRendererProps {
  entities: Entity[]
  camera: Camera
  tileSize: number
  width: number
  height: number
}

export function EntityRenderer({ entities, camera, tileSize, width, height }: EntityRendererProps) {
  return (
    <Canvas style={{ position: 'absolute', top: 0, left: 0, width, height }}>
      <Group>
        {entities.map((entity) => {
          const sx = entity.x * tileSize - camera.x + tileSize * 0.1
          const sy = entity.y * tileSize - camera.y + tileSize * 0.1
          const size = tileSize * 0.8
          return (
            <Rect
              key={entity.id}
              x={sx}
              y={sy}
              width={size}
              height={size}
              color={ENTITY_COLOR[entity.type] ?? '#ffffff'}
            />
          )
        })}
      </Group>
    </Canvas>
  )
}
