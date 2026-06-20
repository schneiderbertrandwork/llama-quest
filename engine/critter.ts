import type { Entity } from './entity'
import type { CritterData } from './entity'
import type { TileGrid } from './tilemap'
import { tileAt } from './tilemap'

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function tickCritter(entity: Entity, dt: number, grid?: TileGrid): Entity {
  const cd = entity.data as unknown as CritterData

  // Paused — count down timer
  if (cd.pauseTimer > 0) {
    return {
      ...entity,
      data: { ...entity.data, pauseTimer: cd.pauseTimer - dt } as unknown as Record<string, unknown>,
    }
  }

  // Too far from home — redirect to home
  const distFromHome = dist(entity.x, entity.y, cd.homeX, cd.homeY)
  if (distFromHome > cd.wanderRadius * 1.5) {
    return {
      ...entity,
      data: { ...entity.data, targetX: cd.homeX, targetY: cd.homeY } as unknown as Record<string, unknown>,
    }
  }

  // Move toward target
  const dx = cd.targetX - entity.x
  const dy = cd.targetY - entity.y
  const d = Math.sqrt(dx * dx + dy * dy)

  if (d < 0.1) {
    // Reached target — pick new random target and pause
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * cd.wanderRadius
    const newTargetX = cd.homeX + Math.cos(angle) * radius
    const newTargetY = cd.homeY + Math.sin(angle) * radius
    return {
      ...entity,
      data: {
        ...entity.data,
        targetX: newTargetX,
        targetY: newTargetY,
        pauseTimer: randomInRange(0.5, 1.5),
      } as unknown as Record<string, unknown>,
    }
  }

  const step = Math.min(cd.speed * dt, d)
  const newX = entity.x + (dx / d) * step
  const newY = entity.y + (dy / d) * step

  // Abort and pick new target if stepping into a non-walkable tile
  if (grid) {
    const tile = tileAt(grid, Math.floor(newX), Math.floor(newY))
    if (!tile || !tile.walkable) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * cd.wanderRadius * 0.5
      return {
        ...entity,
        data: {
          ...entity.data,
          targetX: cd.homeX + Math.cos(angle) * radius,
          targetY: cd.homeY + Math.sin(angle) * radius,
          pauseTimer: 1.0,
        } as unknown as Record<string, unknown>,
      }
    }
  }

  return { ...entity, x: newX, y: newY }
}
