import React, { useMemo } from 'react'
import { Canvas, Rect, Group } from '@shopify/react-native-skia'
import type { TileGrid, TileType } from '../engine/tilemap'
import { tileAt } from '../engine/tilemap'
import type { Camera } from '../engine/camera'

// Phase 1: colored rects as tile placeholders (sprite sheet wired in Phase 5)
const TILE_COLOR: Record<TileType, string> = {
  grass: '#3d7a4a',
  forest: '#1e4d22',
  path: '#b5934a',
  water: '#1a5276',
  building_wall: '#5d4037',
  floor: '#7e6551',
  door: '#d4ac0d',
}

interface TilemapRendererProps {
  grid: TileGrid
  camera: Camera
  tileSize: number
  width: number
  height: number
}

export function TilemapRenderer({ grid, camera, tileSize, width, height }: TilemapRendererProps) {
  const visibleTiles = useMemo(() => {
    const startX = Math.max(0, Math.floor(camera.x / tileSize))
    const startY = Math.max(0, Math.floor(camera.y / tileSize))
    const endX = Math.min(grid.width, startX + Math.ceil(width / tileSize) + 2)
    const endY = Math.min(grid.height, startY + Math.ceil(height / tileSize) + 2)
    const tiles: { screenX: number; screenY: number; color: string }[] = []
    for (let ty = startY; ty < endY; ty++) {
      for (let tx = startX; tx < endX; tx++) {
        const tile = tileAt(grid, tx, ty)
        if (!tile) continue
        tiles.push({
          screenX: tx * tileSize - camera.x,
          screenY: ty * tileSize - camera.y,
          color: TILE_COLOR[tile.type],
        })
      }
    }
    return tiles
  }, [grid, camera, tileSize, width, height])

  return (
    <Canvas style={{ width, height }}>
      <Group>
        {visibleTiles.map((t, i) => (
          <Rect key={i} x={t.screenX} y={t.screenY} width={tileSize} height={tileSize} color={t.color} />
        ))}
      </Group>
    </Canvas>
  )
}
