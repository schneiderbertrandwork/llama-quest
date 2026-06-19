import type { CityId } from '../store/game-store'
import { makeGrid, setTile } from '../engine/tilemap'
import type { TileGrid } from '../engine/tilemap'
import { makeNPC, makeBuildingEntrance, makeGate, makeSandboxPortal } from '../engine/entity'
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
    makeBuildingEntrance('enter-forge', 33, 14, 'forge'),
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
    (() => {
      const bossGate = makeGate('gate-boss-llamatown', 9, 1, 'forge', true)
      bossGate.data = { ...bossGate.data, bossId: 'frozen-boot' }
      return bossGate
    })(),
    makeSandboxPortal('sandbox-firstchat', 16, 8, 'firstchat'),
  ],
  gateExit: { x: 9, y: 13, destination: 'overworld' },
}

function buildForgeGrid(): TileGrid {
  const g = makeGrid(20, 18, 'floor')
  // Perimeter walls
  for (let x = 0; x < 20; x++) {
    setTile(g, x, 0, 'building_wall')
    setTile(g, x, 17, 'building_wall')
  }
  for (let y = 0; y < 18; y++) {
    setTile(g, 0, y, 'building_wall')
    setTile(g, 19, y, 'building_wall')
  }
  // South exit (back to overworld)
  setTile(g, 9, 17, 'door')
  setTile(g, 10, 17, 'door')
  // East gate tile to Prism Caverns
  setTile(g, 19, 9, 'door')
  // Main east-west street
  for (let x = 1; x < 19; x++) setTile(g, x, 9, 'path')
  // Forge Library: x=1..3, y=1..6; door at (2,6)
  for (let x = 1; x <= 3; x++) for (let y = 1; y <= 6; y++) setTile(g, x, y, 'building_wall')
  setTile(g, 2, 6, 'door')
  // API Workshop (sandbox portal): x=7..11, y=1..6; portal at (9,6)
  for (let x = 7; x <= 11; x++) for (let y = 1; y <= 6; y++) setTile(g, x, y, 'building_wall')
  setTile(g, 9, 6, 'door')
  // Modelfile Foundry (sandbox portal): x=14..18, y=1..6; portal at (16,6)
  for (let x = 14; x <= 18; x++) for (let y = 1; y <= 6; y++) setTile(g, x, y, 'building_wall')
  setTile(g, 16, 6, 'door')
  return g
}

export const FORGE: CityDef = {
  id: 'forge',
  grid: buildForgeGrid(),
  playerSpawn: { x: 9, y: 15 },
  entities: [
    makeBuildingEntrance('enter-forge-library', 2, 6, 'forge-library'),
    makeSandboxPortal('sandbox-api-workshop', 9, 6, 'api'),
    makeSandboxPortal('sandbox-modelfile-foundry', 16, 6, 'modelfile'),
    makeNPC('npc-smith', 4, 4, {
      name: 'Smith Forge-Hand',
      lines: [
        "This is the Forge. Here we don't just use models — we shape them.",
        "A Modelfile is a recipe: FROM a base, add a SYSTEM persona, bake in PARAMETERs.",
        '`ollama create mybot -f Modelfile` and your custom model is born.',
      ],
    }),
    makeNPC('npc-api-artificer', 15, 8, {
      name: 'API Artificer',
      lines: [
        "Every CLI command is really a POST to :11434. Learn the API and you can build anything.",
        "/api/chat for conversation, /api/embed for vectors, /v1 if you speak OpenAI.",
      ],
    }),
    makeGate('gate-forge-south', 9, 16, 'overworld', false),
    makeGate('gate-forge-east', 18, 9, 'vale', true),
  ],
  gateExit: { x: 9, y: 16, destination: 'overworld' },
}

const CITY_MAP: Record<string, CityDef> = {
  overworld: OVERWORLD,
  llamatown: LLAMATOWN,
  forge: FORGE,
}

export function getCityDef(id: CityId | 'overworld'): CityDef {
  const def = CITY_MAP[id]
  if (!def) throw new Error(`Unknown city: ${id}`)
  return def
}
