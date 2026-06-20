import type { CityId } from '../store/game-store'
import { makeGrid, setTile } from '../engine/tilemap'
import type { TileGrid } from '../engine/tilemap'
import { makeNPC, makeBuildingEntrance, makeGate, makeSandboxPortal, makeDecoration, makeCritter } from '../engine/entity'
import type { Entity, CritterData } from '../engine/entity'

function c(id: string, x: number, y: number, type: CritterData['critterType'], wanderRadius = 4, phaseOffset = 0): Entity {
  return makeCritter(id, x, y, {
    homeX: x, homeY: y,
    targetX: x + (Math.random() > 0.5 ? 1 : -1),
    targetY: y,
    wanderRadius,
    speed: type === 'butterfly' ? 2.5 : type === 'bird' ? 2 : 1.5,
    pauseTimer: 0,
    critterType: type,
    phaseOffset,
  })
}

export interface CityDef {
  id: CityId | 'overworld'
  grid: TileGrid
  playerSpawn: { x: number; y: number }
  entities: Entity[]
  gateExit: { x: number; y: number; destination: CityId | 'overworld' }
}

function buildOverworldGrid(): TileGrid {
  const g = makeGrid(400, 300, 'grass')

  // ── Forest borders ────────────────────────────────────────────
  for (let x = 0; x < 400; x++) {
    for (let y = 0; y < 8; y++) setTile(g, x, y, 'forest')     // north edge
    for (let y = 292; y < 300; y++) setTile(g, x, y, 'forest') // south edge
  }

  // ── West / east forest columns ────────────────────────────────
  for (let y = 8; y < 140; y++) { setTile(g, 0, y, 'forest'); setTile(g, 1, y, 'forest') }
  for (let y = 160; y < 292; y++) { setTile(g, 0, y, 'forest'); setTile(g, 1, y, 'forest') }
  for (let y = 8; y < 292; y++) { setTile(g, 398, y, 'forest'); setTile(g, 399, y, 'forest') }

  // ── Interior forest biomes ────────────────────────────────────
  for (let x = 130; x <= 160; x++) for (let y = 40; y <= 100; y++) setTile(g, x, y, 'forest')
  for (let x = 250; x <= 310; x++) for (let y = 8; y <= 80; y++) setTile(g, x, y, 'forest')

  // ── Main east-west road ───────────────────────────────────────
  for (let x = 10; x < 390; x++) {
    setTile(g, x, 148, 'path')
    setTile(g, x, 149, 'path')
  }

  // ── North road (to Llamatown, x=52) ───────────────────────────
  for (let y = 100; y < 148; y++) {
    setTile(g, 50, y, 'path'); setTile(g, 51, y, 'path')
  }

  // ── Northeast road (to Forge, x=280) ─────────────────────────
  for (let y = 100; y < 148; y++) {
    setTile(g, 280, y, 'path'); setTile(g, 281, y, 'path')
  }

  // ── South-central road (to Prism Caverns, x=180) ─────────────
  for (let y = 149; y <= 240; y++) {
    setTile(g, 180, y, 'path'); setTile(g, 181, y, 'path')
  }

  // ── Southwest road (to The Convergence, x=90) ────────────────
  for (let y = 149; y <= 260; y++) {
    setTile(g, 90, y, 'path'); setTile(g, 91, y, 'path')
  }

  // ── River (north vertical) ────────────────────────────────────
  for (let y = 8; y <= 100; y++) {
    setTile(g, 200, y, 'water'); setTile(g, 201, y, 'water'); setTile(g, 202, y, 'water')
  }
  // River lake
  for (let x = 195; x <= 210; x++) for (let y = 80; y <= 100; y++) setTile(g, x, y, 'water')
  // River south section
  for (let y = 100; y < 148; y++) {
    setTile(g, 200, y, 'water'); setTile(g, 201, y, 'water'); setTile(g, 202, y, 'water')
  }

  // ── Small pond ────────────────────────────────────────────────
  for (let x = 340; x <= 350; x++) for (let y = 200; y <= 210; y++) setTile(g, x, y, 'water')

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
  playerSpawn: { x: 52, y: 148 },
  entities: [
    makeBuildingEntrance('enter-llamatown', 52, 146, 'llamatown'),
    makeBuildingEntrance('enter-forge', 280, 150, 'forge'),
    makeBuildingEntrance('enter-vale', 180, 240, 'vale'),
    makeBuildingEntrance('enter-ridge', 90, 259, 'ridge'),
    // Decorative llamas — 12 scattered across the world
    makeDecoration('deco-llama-1', 25, 20),
    makeDecoration('deco-llama-2', 80, 35),
    makeDecoration('deco-llama-3', 170, 15),
    makeDecoration('deco-llama-4', 230, 50),
    makeDecoration('deco-llama-5', 350, 30),
    makeDecoration('deco-llama-6', 30, 180),
    makeDecoration('deco-llama-7', 120, 200),
    makeDecoration('deco-llama-8', 250, 170),
    makeDecoration('deco-llama-9', 320, 200),
    makeDecoration('deco-llama-10', 370, 260),
    makeDecoration('deco-llama-11', 60, 270),
    makeDecoration('deco-llama-12', 200, 280),
    // Woodland creatures
    c('critter-rabbit-1', 35, 30, 'rabbit'),
    c('critter-rabbit-2', 220, 140, 'rabbit'),
    c('critter-rabbit-3', 300, 180, 'rabbit'),
    c('critter-rabbit-4', 160, 270, 'rabbit'),
    c('critter-bird-1', 100, 60, 'bird', 6),
    c('critter-bird-2', 260, 200, 'bird', 6),
    c('critter-bird-3', 380, 120, 'bird', 6),
    c('critter-squirrel-1', 165, 80, 'squirrel', 3),
    c('critter-squirrel-2', 330, 90, 'squirrel', 3),
    c('critter-squirrel-3', 70, 230, 'squirrel', 3),
    c('critter-butterfly-1', 60, 120, 'butterfly', 8, 0.0),
    c('critter-butterfly-2', 200, 60, 'butterfly', 8, 1.5),
    c('critter-butterfly-3', 290, 250, 'butterfly', 8, 3.0),
    c('critter-butterfly-4', 140, 260, 'butterfly', 8, 4.5),
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
    (() => {
      const bg = makeGate('gate-boss-forge', 16, 9, 'vale', true)
      bg.data = { ...bg.data, bossId: 'rate-limiter' }
      return bg
    })(),
  ],
  gateExit: { x: 9, y: 16, destination: 'overworld' },
}

function buildCavernsGrid(): TileGrid {
  const g = makeGrid(22, 18, 'floor')
  // Perimeter walls
  for (let x = 0; x < 22; x++) {
    setTile(g, x, 0, 'building_wall')
    setTile(g, x, 17, 'building_wall')
  }
  for (let y = 0; y < 18; y++) {
    setTile(g, 0, y, 'building_wall')
    setTile(g, 21, y, 'building_wall')
  }
  // North exit tiles (back to overworld — entered from north)
  setTile(g, 10, 0, 'door')
  setTile(g, 11, 0, 'door')
  // West gate tile to The Convergence
  setTile(g, 0, 9, 'door')
  // Main east-west path
  for (let x = 1; x < 21; x++) setTile(g, x, 9, 'path')
  // Vale Library: x=2..6, y=2..7; door at (4,7)
  for (let x = 2; x <= 6; x++) for (let y = 2; y <= 7; y++) setTile(g, x, y, 'building_wall')
  setTile(g, 4, 7, 'door')
  // ChromaDB Cave (sandbox portal: collection): x=13..19, y=2..7; portal at (16,7)
  for (let x = 13; x <= 19; x++) for (let y = 2; y <= 7; y++) setTile(g, x, y, 'building_wall')
  setTile(g, 16, 7, 'door')
  return g
}

export const CAVERNS: CityDef = {
  id: 'vale',
  grid: buildCavernsGrid(),
  playerSpawn: { x: 10, y: 2 },
  entities: [
    makeBuildingEntrance('enter-vale-library', 4, 7, 'vale-library'),
    makeSandboxPortal('sandbox-collection', 16, 7, 'collection'),
    makeNPC('npc-prism-oracle', 11, 4, {
      name: 'The Prism Oracle',
      lines: [
        "Deep in these caverns, text turns into light — vectors of pure meaning.",
        "Similar ideas glow near each other. A vector database finds neighbors in that space.",
        "ChromaDB is our store. One rule above all: embed queries with the *same* model you indexed with.",
      ],
    }),
    makeNPC('npc-vector-sprite', 18, 13, {
      name: 'Vector Sprite',
      lines: [
        '`PersistentClient(path=...)` keeps your collection on disk between runs.',
        '`get_or_create_collection` never crashes. `add` then `query`. That\'s the whole dance.',
      ],
    }),
    makeGate('gate-vale-north', 10, 1, 'overworld', false),
    makeGate('gate-vale-west', 1, 9, 'ridge', true),
    (() => {
      const bg = makeGate('gate-boss-vale', 2, 9, 'ridge', true)
      bg.data = { ...bg.data, bossId: 'dimensionless-beast' }
      return bg
    })(),
  ],
  gateExit: { x: 10, y: 1, destination: 'overworld' },
}

function buildConvergenceGrid(): TileGrid {
  const g = makeGrid(20, 16, 'floor')
  // Perimeter walls
  for (let x = 0; x < 20; x++) {
    setTile(g, x, 0, 'building_wall')
    setTile(g, x, 15, 'building_wall')
  }
  for (let y = 0; y < 16; y++) {
    setTile(g, 0, y, 'building_wall')
    setTile(g, 19, y, 'building_wall')
  }
  // West exit tile (back to overworld — entered from west)
  setTile(g, 0, 8, 'door')
  // Main east-west path
  for (let x = 1; x < 19; x++) setTile(g, x, 8, 'path')
  // Ridge Library: x=1..3, y=1..6; door at (2,6)
  for (let x = 1; x <= 3; x++) for (let y = 1; y <= 6; y++) setTile(g, x, y, 'building_wall')
  setTile(g, 2, 6, 'door')
  // RAG Production Vault (sandbox portal: rag): x=12..18, y=1..6; portal at (15,6)
  for (let x = 12; x <= 18; x++) for (let y = 1; y <= 6; y++) setTile(g, x, y, 'building_wall')
  setTile(g, 15, 6, 'door')
  return g
}

export const CONVERGENCE: CityDef = {
  id: 'ridge',
  grid: buildConvergenceGrid(),
  playerSpawn: { x: 2, y: 8 },
  entities: [
    makeBuildingEntrance('enter-ridge-library', 2, 6, 'ridge-library'),
    makeSandboxPortal('sandbox-rag', 15, 6, 'rag'),
    makeNPC('npc-architect', 4, 4, {
      name: 'Architect of the Convergence',
      lines: [
        "You've reached the Convergence, Operator. Here Ollama and ChromaDB become one system.",
        "RAG: retrieve relevant chunks from Chroma, hand them to Ollama, generate a grounded answer.",
        "Index once. Query forever. All on your own machine.",
      ],
    }),
    makeNPC('npc-keeper', 15, 11, {
      name: 'Keeper of Citations',
      lines: [
        "Tell the model: answer ONLY from the context, and cite the chunk. That's how trust is built.",
        "Low temperature. Top-k retrieval. Re-rank when precision matters.",
      ],
    }),
    makeGate('gate-ridge-west', 1, 8, 'overworld', false),
  ],
  gateExit: { x: 1, y: 8, destination: 'overworld' },
}

const CITY_MAP: Record<string, CityDef> = {
  overworld: OVERWORLD,
  llamatown: LLAMATOWN,
  forge: FORGE,
  vale: CAVERNS,
  ridge: CONVERGENCE,
}

export function getCityDef(id: CityId | 'overworld'): CityDef {
  const def = CITY_MAP[id]
  if (!def) throw new Error(`Unknown city: ${id}`)
  return def
}

export const ACT_CONCEPTS: Record<1 | 2 | 3 | 4, string[]> = {
  1: ['oll-intro', 'oll-install', 'oll-run', 'oll-manage', 'oll-models', 'oll-params'],
  2: ['oll-modelfile', 'oll-api', 'oll-openai', 'oll-structured', 'oll-tools', 'oll-multimodal', 'oll-embed', 'oll-ops'],
  3: ['chr-vectors', 'chr-intro', 'chr-collections', 'chr-add', 'chr-query', 'chr-filter', 'chr-ef', 'chr-persist'],
  4: ['rag-concept', 'rag-build', 'rag-prod'],
}

export function isActMastered(act: 1 | 2 | 3 | 4, masteredConcepts: Record<string, boolean>): boolean {
  return (ACT_CONCEPTS[act] ?? []).every(id => masteredConcepts[id] === true)
}

export function isGateUnlocked(
  fromAct: 1 | 2 | 3 | 4,
  masteredConcepts: Record<string, boolean>,
  defeatedBosses: Record<string, boolean>,
): boolean {
  const bossIds: Record<1 | 2 | 3 | 4, string> = {
    1: 'frozen-boot',
    2: 'rate-limiter',
    3: 'dimensionless-beast',
    4: 'hallucinator',
  }
  return isActMastered(fromAct, masteredConcepts) && (defeatedBosses[bossIds[fromAct] ?? ''] === true)
}
