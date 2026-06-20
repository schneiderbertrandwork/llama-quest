import React, { useMemo } from 'react'
import { Canvas, Rect, Group } from '@shopify/react-native-skia'
import type { TileGrid, TileType } from '../engine/tilemap'
import { tileAt } from '../engine/tilemap'
import type { Camera } from '../engine/camera'

const TILE_BASE: Record<TileType, string> = {
  grass: '#2d5a1b',
  forest: '#1e4d22',
  path: '#b5934a',
  water: '#1a5276',
  building_wall: '#5d4037',
  floor: '#7e6551',
  door: '#d4ac0d',
}

interface TileRect {
  x: number; y: number; w: number; h: number; color: string
}

function getTextureRects(type: TileType, sx: number, sy: number, ts: number, grassPhase: number): TileRect[] {
  switch (type) {
    case 'grass': {
      // Animated: phase 0 = normal dots, phase 1 = dots shifted 1px east (wind shimmer)
      const shift = (grassPhase % 2 === 1) ? 1 : 0
      const rects: TileRect[] = []
      for (let dy = 0; dy < ts; dy += 8) {
        for (let dx = 0; dx < ts; dx += 8) {
          rects.push({ x: sx + dx + shift, y: sy + dy, w: 1, h: 1, color: '#3a7022' })
        }
      }
      return rects
    }
    case 'path':
      return [{ x: sx, y: sy + ts / 2, w: ts, h: 1, color: '#7a6347' }]
    case 'forest':
      return [
        { x: sx + ts / 2 - 1, y: sy + 2, w: 1, h: 3, color: '#122d12' },
        { x: sx + ts / 2 - 2, y: sy + 3, w: 3, h: 2, color: '#122d12' },
      ]
    case 'water': {
      const mid = Math.floor(ts / 2)
      return [
        { x: sx, y: sy + mid - 3, w: ts, h: 1, color: '#2a4d8b' },
        { x: sx, y: sy + mid + 3, w: ts, h: 1, color: '#2a4d8b' },
      ]
    }
    case 'building_wall': {
      const rects: TileRect[] = []
      for (let dy = 8; dy < ts; dy += 8) {
        rects.push({ x: sx, y: sy + dy, w: ts, h: 1, color: '#555555' })
      }
      return rects
    }
    case 'floor': {
      const rects: TileRect[] = []
      for (let dx = 8; dx < ts; dx += 8) {
        rects.push({ x: sx + dx, y: sy, w: 1, h: ts, color: '#444444' })
      }
      return rects
    }
    case 'door':
      return [{ x: sx + ts / 4, y: sy + 4, w: ts / 2, h: ts - 8, color: '#a07820' }]
    default:
      return []
  }
}

interface TilemapRendererProps {
  grid: TileGrid
  camera: Camera
  tileSize: number
  width: number
  height: number
  grassPhase: number
}

export function TilemapRenderer({ grid, camera, tileSize, width, height, grassPhase }: TilemapRendererProps) {
  const allRects = useMemo(() => {
    const startX = Math.max(0, Math.floor(camera.x / tileSize))
    const startY = Math.max(0, Math.floor(camera.y / tileSize))
    const endX = Math.min(grid.width, startX + Math.ceil(width / tileSize) + 2)
    const endY = Math.min(grid.height, startY + Math.ceil(height / tileSize) + 2)
    const rects: TileRect[] = []
    for (let ty = startY; ty < endY; ty++) {
      for (let tx = startX; tx < endX; tx++) {
        const tile = tileAt(grid, tx, ty)
        if (!tile) continue
        const sx = tx * tileSize - camera.x
        const sy = ty * tileSize - camera.y
        rects.push({ x: sx, y: sy, w: tileSize, h: tileSize, color: TILE_BASE[tile.type] })
        for (const r of getTextureRects(tile.type, sx, sy, tileSize, grassPhase)) rects.push(r)
      }
    }
    return rects
  }, [grid, camera, tileSize, width, height, grassPhase])

  return (
    <Canvas style={{ width, height }}>
      <Group>
        {allRects.map((r, i) => (
          <Rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} color={r.color} />
        ))}
      </Group>
    </Canvas>
  )
}
