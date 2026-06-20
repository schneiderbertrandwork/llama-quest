export type Facing = 'up' | 'down' | 'left' | 'right'
export type EntityType = 'player' | 'npc' | 'sign' | 'building_entrance' | 'gate' | 'sandbox_portal' | 'decoration' | 'critter'

export interface Entity {
  id: string
  type: EntityType
  x: number
  y: number
  facing: Facing
  interactable: boolean
  data: Record<string, unknown>
}

let _nextId = 1
function nextId(prefix: string): string {
  return `${prefix}_${_nextId++}`
}

export function makePlayer(x: number, y: number): Entity {
  return { id: nextId('player'), type: 'player', x, y, facing: 'down', interactable: false, data: {} }
}

export function makeNPC(id: string, x: number, y: number, data: Record<string, unknown> = {}): Entity {
  return { id, type: 'npc', x, y, facing: 'down', interactable: true, data }
}

export function makeBuildingEntrance(id: string, x: number, y: number, destination: string): Entity {
  return { id, type: 'building_entrance', x, y, facing: 'down', interactable: true, data: { destination } }
}

export function makeGate(id: string, x: number, y: number, destination: string, locked: boolean): Entity {
  return { id, type: 'gate', x, y, facing: 'down', interactable: true, data: { destination, locked } }
}

export function makeSandboxPortal(id: string, x: number, y: number, destination: string): Entity {
  return { id, type: 'sandbox_portal', x, y, facing: 'down', interactable: true, data: { destination } }
}

export function makeDecoration(id: string, x: number, y: number): Entity {
  return { id, type: 'decoration', x, y, facing: 'down', interactable: false, data: {} }
}

export interface CritterData {
  homeX: number
  homeY: number
  targetX: number
  targetY: number
  wanderRadius: number
  speed: number
  pauseTimer: number
  critterType: 'rabbit' | 'bird' | 'squirrel' | 'butterfly'
  phaseOffset?: number  // butterfly sine offset
}

export function makeCritter(id: string, x: number, y: number, critterData: CritterData): Entity {
  return {
    id,
    type: 'critter',
    x,
    y,
    facing: 'down',
    interactable: false,
    data: critterData as unknown as Record<string, unknown>,
  }
}

export function nearestInteractable(entities: Entity[], playerX: number, playerY: number, maxDist = 1.5): Entity | null {
  let nearest: Entity | null = null
  let nearestDist = maxDist
  for (const entity of entities) {
    if (!entity.interactable) continue
    const dist = Math.hypot(entity.x - playerX, entity.y - playerY)
    if (dist < nearestDist) { nearestDist = dist; nearest = entity }
  }
  return nearest
}
