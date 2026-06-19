import type { CityId } from '../store/game-store'
import { makeGrid, setTile } from '../engine/tilemap'
import type { TileGrid } from '../engine/tilemap'
import { makeNPC, makeBuildingEntrance, makeGate } from '../engine/entity'
import type { Entity } from '../engine/entity'

export interface CityDef {
  id: CityId | 'overworld'
  grid: TileGrid
  playerSpawn: { x: number; y: number }
  entities: Entity[]
  gateExit: { x: number; y: number; destination: CityId | 'overworld' }
}

function buildOverworldGrid(): TileGrid {
  const g = makeGrid(40, 30, 'grass')
  // Paths between cities
  for (let x = 5; x < 35; x++) setTile(g, x, 14, 'path')  // horizontal road
  for (let x = 5; x < 35; x++) setTile(g, x, 15, 'path')
  // Forest borders
  for (let x = 0; x < 40; x++) {
    setTile(g, x, 0, 'forest'); setTile(g, x, 1, 'forest')
    setTile(g, x, 28, 'forest'); setTile(g, x, 29, 'forest')
  }
  return g
}

function buildLlamatownGrid(): TileGrid {
  const g = makeGrid(20, 15, 'grass')
  // Perimeter wall
  for (let x = 0; x < 20; x++) {
    setTile(g, x, 0, 'building_wall')
    setTile(g, x, 14, 'building_wall')
  }
  for (let y = 0; y < 15; y++) {
    setTile(g, 0, y, 'building_wall')
    setTile(g, 19, y, 'building_wall')
  }
  // Path through middle
  for (let x = 1; x < 19; x++) setTile(g, x, 7, 'path')
  // Building footprints
  for (let x = 3; x <= 6; x++) for (let y = 2; y <= 5; y++) setTile(g, x, y, 'building_wall')
  setTile(g, 4, 5, 'door')   // Library door
  for (let x = 8; x <= 11; x++) for (let y = 2; y <= 5; y++) setTile(g, x, y, 'building_wall')
  setTile(g, 9, 5, 'door')   // Dojo door
  for (let x = 13; x <= 16; x++) for (let y = 2; y <= 5; y++) setTile(g, x, y, 'building_wall')
  setTile(g, 14, 5, 'door')  // Workshop door
  // Exit south
  setTile(g, 9, 14, 'door')
  setTile(g, 10, 14, 'door')
  return g
}

export const OVERWORLD: CityDef = {
  id: 'overworld',
  grid: buildOverworldGrid(),
  playerSpawn: { x: 6, y: 14 },
  entities: [
    makeBuildingEntrance('enter-llamatown', 7, 13, 'llamatown'),
  ],
  gateExit: { x: 0, y: 0, destination: 'llamatown' },
}

export const LLAMATOWN: CityDef = {
  id: 'llamatown',
  grid: buildLlamatownGrid(),
  playerSpawn: { x: 9, y: 12 },
  entities: [
    makeBuildingEntrance('enter-library', 4, 6, 'llamatown-library'),
    makeBuildingEntrance('enter-dojo', 9, 6, 'llamatown-dojo'),
    makeBuildingEntrance('enter-workshop', 14, 6, 'llamatown-workshop'),
    makeNPC('mayor-lloyd', 9, 9, {
      name: 'Mayor Lloyd',
      lines: [
        "Welcome to Llamatown, traveller!",
        "The Great Models have gone silent.",
        "Only one who understands them can help.",
        "Visit the Library — your journey begins there.",
      ],
    }),
    makeNPC('npc-penny', 5, 10, {
      name: 'Penny',
      lines: ["I heard Ollama can run models locally!", "Try the Library if you want to learn more."],
    }),
    makeGate('gate-south', 9, 13, 'overworld', false),
  ],
  gateExit: { x: 9, y: 13, destination: 'overworld' },
}

const CITY_MAP: Record<string, CityDef> = {
  overworld: OVERWORLD,
  llamatown: LLAMATOWN,
}

export function getCityDef(id: CityId | 'overworld'): CityDef {
  const def = CITY_MAP[id]
  if (!def) throw new Error(`Unknown city: ${id}`)
  return def
}
