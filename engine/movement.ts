import type { Entity, Facing } from './entity'
import type { TileGrid } from './tilemap'
import { isWalkable } from './tilemap'

export interface InputState {
  dx: number
  dy: number
}

const PLAYER_SPEED = 4

function facingFromInput(dx: number, dy: number): Facing {
  if (dx > 0) return 'right'
  if (dx < 0) return 'left'
  if (dy < 0) return 'up'
  return 'down'
}

export function movePlayer(player: Entity, input: InputState, grid: TileGrid, dt: number): Entity {
  const { dx, dy } = input
  if (dx === 0 && dy === 0) return player

  const mag = Math.hypot(dx, dy)
  const ndx = dx / mag
  const ndy = dy / mag
  const distance = PLAYER_SPEED * dt

  let newX = player.x + ndx * distance
  let newY = player.y + ndy * distance

  // Separate axis collision: check each axis independently
  // For X: move incrementally and stop just before non-walkable
  if (ndx !== 0) {
    const step = ndx > 0 ? 1 : -1
    let checkX = Math.round(player.x)
    while (checkX !== Math.round(newX)) {
      checkX += step
      if (!isWalkable(grid, checkX, Math.round(player.y))) {
        newX = checkX - step
        break
      }
    }
  }

  // For Y: move incrementally and stop just before non-walkable
  if (ndy !== 0) {
    const step = ndy > 0 ? 1 : -1
    let checkY = Math.round(player.y)
    while (checkY !== Math.round(newY)) {
      checkY += step
      if (!isWalkable(grid, Math.round(player.x), checkY)) {
        newY = checkY - step
        break
      }
    }
  }

  return { ...player, x: newX, y: newY, facing: facingFromInput(dx, dy) }
}
