export type TileType =
  | 'grass'
  | 'forest'
  | 'path'
  | 'water'
  | 'building_wall'
  | 'floor'
  | 'door'

export interface Tile {
  type: TileType
  walkable: boolean
}

export interface TileGrid {
  width: number
  height: number
  tiles: Tile[]  // row-major: index = y * width + x
}

const WALKABLE: Record<TileType, boolean> = {
  grass: true,
  forest: false,
  path: true,
  water: false,
  building_wall: false,
  floor: true,
  door: true,
}

export function makeTile(type: TileType): Tile {
  return { type, walkable: WALKABLE[type] }
}

export function makeGrid(width: number, height: number, fill: TileType): TileGrid {
  return {
    width,
    height,
    tiles: Array.from({ length: width * height }, () => makeTile(fill)),
  }
}

export function tileAt(grid: TileGrid, x: number, y: number): Tile | null {
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return null
  return grid.tiles[y * grid.width + x] ?? null
}

export function isWalkable(grid: TileGrid, x: number, y: number): boolean {
  const tile = tileAt(grid, x, y)
  return tile?.walkable ?? false
}

export function setTile(grid: TileGrid, x: number, y: number, type: TileType): void {
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return
  grid.tiles[y * grid.width + x] = makeTile(type)
}
