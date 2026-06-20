import React, { useMemo } from 'react'
import { View } from 'react-native'
import { TilemapRenderer } from './TilemapRenderer'
import { EntityRenderer } from './EntityRenderer'
import type { TileGrid } from '../engine/tilemap'
import type { Entity } from '../engine/entity'
import { followEntity, clampCamera } from '../engine/camera'

interface WorldRendererProps {
  grid: TileGrid
  player: Entity
  entities: Entity[]
  tileSize: number
  screenWidth: number
  screenHeight: number
  time?: number
}

export function WorldRenderer({ grid, player, entities, tileSize, screenWidth, screenHeight, time }: WorldRendererProps) {
  const camera = useMemo(() => {
    const raw = followEntity(player, tileSize, screenWidth, screenHeight)
    return clampCamera(raw, tileSize, grid.width, grid.height, screenWidth, screenHeight)
  }, [player.x, player.y, tileSize, screenWidth, screenHeight, grid.width, grid.height])

  const allEntities = useMemo(() => [player, ...entities], [player, entities])
  const animTime = time ?? Date.now()

  return (
    <View style={{ width: screenWidth, height: screenHeight, overflow: 'hidden' }}>
      <TilemapRenderer grid={grid} camera={camera} tileSize={tileSize} width={screenWidth} height={screenHeight} />
      <EntityRenderer entities={allEntities} camera={camera} tileSize={tileSize} width={screenWidth} height={screenHeight} time={animTime} />
    </View>
  )
}
