import React, { useMemo } from 'react'
import { Canvas, Rect, Circle, Group } from '@shopify/react-native-skia'
import type { TileGrid, TileType } from '../engine/tilemap'
import { tileAt } from '../engine/tilemap'
import type { Camera } from '../engine/camera'

// Earthbound-inspired palette
const TILE_BASE: Record<TileType, string> = {
  grass:         '#3cb030',
  forest:        '#1a5a10',
  path:          '#b8986a',
  water:         '#2266aa',
  building_wall: '#c8b498',
  floor:         '#8a7060',
  door:          '#6ab868',
}

interface TileRect {
  kind: 'rect'
  x: number; y: number; w: number; h: number; color: string
}
interface TileCircle {
  kind: 'circle'
  cx: number; cy: number; r: number; color: string
}
type TileShape = TileRect | TileCircle

function r(x: number, y: number, w: number, h: number, color: string): TileShape {
  return { kind: 'rect', x, y, w, h, color }
}
function c(cx: number, cy: number, radius: number, color: string): TileShape {
  return { kind: 'circle', cx, cy, r: radius, color }
}

function getTextureShapes(
  type: TileType, sx: number, sy: number, ts: number,
  tx: number, ty: number, grid: TileGrid,
): TileShape[] {
  switch (type) {
    case 'grass': {
      // Scattered grass blade marks — no full-width bands that tile visibly
      const blade = '#26a018'
      const hi = '#4ed030'
      const bh = Math.max(3, Math.floor(ts * 0.18))
      const bw = Math.max(2, Math.floor(ts * 0.05))
      const m = (dx: number, dy: number): TileShape =>
        r(sx + Math.floor(ts * dx), sy + Math.floor(ts * dy), bw, bh, blade)
      const h = (dx: number, dy: number): TileShape =>
        r(sx + Math.floor(ts * dx), sy + Math.floor(ts * dy), bw + 1, Math.floor(bh * 0.5), hi)
      return [
        m(0.12, 0.22), m(0.38, 0.50), m(0.65, 0.28), m(0.80, 0.65), m(0.25, 0.72),
        h(0.50, 0.15), h(0.70, 0.55),
      ]
    }

    case 'forest': {
      // Earthbound-style tree: brown trunk + three-lobed leafy canopy
      const tkW = Math.floor(ts * 0.14)
      const tkH = Math.floor(ts * 0.32)
      const tkX = sx + Math.floor((ts - tkW) / 2)
      const tkY = sy + Math.floor(ts * 0.63)
      const midY = sy + ts * 0.42
      const topY = sy + ts * 0.26
      return [
        // trunk
        r(tkX, tkY, tkW, tkH, '#5a3010'),
        // shadow under canopy
        c(sx + ts * 0.50, midY + ts * 0.06, ts * 0.32, '#0d4808'),
        // three canopy lobes
        c(sx + ts * 0.30, midY, ts * 0.25, '#1a6a0a'),
        c(sx + ts * 0.70, midY, ts * 0.23, '#1a6a0a'),
        c(sx + ts * 0.50, topY, ts * 0.29, '#228a10'),
        // highlights
        c(sx + ts * 0.42, topY - ts * 0.08, ts * 0.14, '#38b018'),
        c(sx + ts * 0.55, topY - ts * 0.04, ts * 0.08, '#4ecc22'),
      ]
    }

    case 'path': {
      // Stone blocks — 2×2 grid of rectangular stones
      const hw = Math.floor(ts / 2)
      const hh = Math.floor(ts / 2)
      return [
        r(sx + 1,      sy + 1,      hw - 2, hh - 2, '#c8a86a'),
        r(sx + hw + 1, sy + 1,      hw - 2, hh - 2, '#bfa060'),
        r(sx + 1,      sy + hh + 1, hw - 2, hh - 2, '#bfa060'),
        r(sx + hw + 1, sy + hh + 1, hw - 2, hh - 2, '#c8a86a'),
      ]
    }

    case 'water': {
      return [
        r(sx + ts * 0.1,  sy + ts * 0.32, ts * 0.35, 3, '#4488cc'),
        r(sx + ts * 0.55, sy + ts * 0.58, ts * 0.35, 3, '#4488cc'),
        r(sx + ts * 0.2,  sy + ts * 0.72, ts * 0.25, 2, '#5599dd'),
      ]
    }

    case 'building_wall': {
      const above = tileAt(grid, tx, ty - 1)
      const below = tileAt(grid, tx, ty + 1)
      const isTop = !above || above.type !== 'building_wall'
      const isMiddle = !isTop && below != null && (below.type === 'building_wall' || below.type === 'door')
      const sw = Math.max(3, Math.floor(ts * 0.08))

      if (isTop) {
        // Terra-cotta roof tile (Earthbound style)
        const roofH = Math.floor(ts * 0.42)
        return [
          r(sx, sy, ts, roofH, '#c84828'),                                    // roof body
          r(sx, sy, ts, 3, '#5a2010'),                                         // dark ridge
          r(sx, sy + roofH - 4, ts, 4, '#a03818'),                            // roof eave shadow
          r(sx, sy + roofH, ts, 2, '#8a6840'),                                // roof-to-wall seam
          r(sx, sy + Math.floor(ts * 0.74), ts, 2, '#9a7850'),               // lower siding
          r(sx + ts - sw, sy + roofH, sw, ts - roofH, '#b4a480'),            // right shadow
        ]
      }

      if (isMiddle) {
        // Middle wall row: siding + centered window
        const ww = Math.floor(ts * 0.46)
        const wh = Math.floor(ts * 0.38)
        const wx = sx + Math.floor((ts - ww) / 2)
        const wy = sy + Math.floor(ts * 0.28)
        const aboveDoor = below?.type === 'door'
        return [
          r(sx, sy + Math.floor(ts * 0.33), ts, 2, '#9a7850'),               // upper siding
          r(sx, sy + Math.floor(ts * 0.67), ts, 2, '#9a7850'),               // lower siding
          r(sx + ts - sw, sy, sw, ts, '#b4a480'),                             // right shadow
          // Window (omit on column directly above door)
          ...(!aboveDoor ? [
            r(wx, wy, ww, wh, '#3a3860'),                                     // frame
            r(wx + 2, wy + 2, ww - 4, wh - 4, '#90b8e0'),                   // glass
            r(wx + 2, wy + 2, Math.floor((ww - 5) / 2), wh - 4, '#c0d8ff'), // left pane highlight
            r(wx + Math.floor(ww / 2), wy + 2, 2, wh - 4, '#3a3860'),       // vertical divider
          ] : []),
        ]
      }

      // Bottom wall row: plain siding only
      return [
        r(sx, sy + Math.floor(ts * 0.33), ts, 2, '#9a7850'),
        r(sx, sy + Math.floor(ts * 0.67), ts, 2, '#9a7850'),
        r(sx + ts - sw, sy, sw, ts, '#b4a480'),
      ]
    }

    case 'floor': {
      return [
        r(sx + Math.floor(ts / 3), sy, 2, ts, '#6e5e50'),
        r(sx + Math.floor(ts * 2 / 3), sy, 2, ts, '#6e5e50'),
      ]
    }

    case 'door': {
      // Green Earthbound-style door with panel detail
      const dw = Math.floor(ts * 0.55)
      const dh = Math.floor(ts * 0.75)
      const dx = sx + Math.floor((ts - dw) / 2)
      const dy = sy + Math.floor(ts * 0.15)
      return [
        r(dx, dy, dw, dh, '#56a055'),             // door panel
        r(dx + 2, dy + 2, dw - 4, Math.floor(dh * 0.4), '#6ac068'),  // top panel highlight
        r(dx + Math.floor(dw * 0.7), dy + Math.floor(dh * 0.45), 4, 4, '#3a7038'), // handle
      ]
    }

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

export function TilemapRenderer({ grid, camera, tileSize, width, height }: TilemapRendererProps) {
  const allShapes = useMemo(() => {
    const startX = Math.max(0, Math.floor(camera.x / tileSize))
    const startY = Math.max(0, Math.floor(camera.y / tileSize))
    const endX = Math.min(grid.width, startX + Math.ceil(width / tileSize) + 2)
    const endY = Math.min(grid.height, startY + Math.ceil(height / tileSize) + 2)
    const shapes: TileShape[] = []
    for (let ty = startY; ty < endY; ty++) {
      for (let tx = startX; tx < endX; tx++) {
        const tile = tileAt(grid, tx, ty)
        if (!tile) continue
        const sx = tx * tileSize - camera.x
        const sy = ty * tileSize - camera.y
        shapes.push({ kind: 'rect', x: sx, y: sy, w: tileSize, h: tileSize, color: TILE_BASE[tile.type] })
        for (const s of getTextureShapes(tile.type, sx, sy, tileSize, tx, ty, grid)) shapes.push(s)
      }
    }
    return shapes
  }, [grid, camera, tileSize, width, height])

  return (
    <Canvas style={{ width, height }}>
      <Group>
        {allShapes.map((s, i) =>
          s.kind === 'circle'
            ? <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} color={s.color} />
            : <Rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} color={s.color} />
        )}
      </Group>
    </Canvas>
  )
}
