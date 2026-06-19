import type { EnemyDef } from '../content/enemies'
import type { QuizQuestion } from '../content/qbank'

export type BattlePhase =
  | 'intro'
  | 'player-turn'
  | 'psi-question'
  | 'enemy-turn'
  | 'victory'
  | 'defeat'

export interface BattleState {
  phase: BattlePhase
  playerHp: number
  playerMaxHp: number
  displayHp: number      // drains toward playerHp; defeat triggers when displayHp hits 0
  enemyHp: number
  enemyMaxHp: number
  enemy: EnemyDef
  log: string[]          // last 3 messages
  pendingQuestion: QuizQuestion | null
  guardActive: boolean
  seenQuestions: Set<string>   // q text keys — transient, not persisted
  turnCount: number
}

export function initBattle(
  enemy: EnemyDef,
  playerHp: number,
  playerMaxHp: number,
): BattleState {
  return {
    phase: 'intro',
    playerHp,
    playerMaxHp,
    displayHp: playerHp,
    enemyHp: enemy.maxHp,
    enemyMaxHp: enemy.maxHp,
    enemy,
    log: [enemy.dialogue.onAppear],
    pendingQuestion: null,
    guardActive: false,
    seenQuestions: new Set(),
    turnCount: 0,
  }
}

export function choosePSI(state: BattleState, availableQuestions: QuizQuestion[]): BattleState {
  const unseen = availableQuestions.filter(q => !state.seenQuestions.has(q.q))
  const pool = unseen.length > 0 ? unseen : availableQuestions
  const idx = Math.floor(Math.random() * pool.length)
  const question = pool[idx] ?? availableQuestions[0] ?? null
  return { ...state, phase: 'psi-question', pendingQuestion: question }
}

export function answerPSI(state: BattleState, answerIdx: 0 | 1 | 2 | 3): BattleState {
  const { pendingQuestion } = state
  if (!pendingQuestion) return state

  const correct = answerIdx === pendingQuestion.c
  const damage = correct
    ? Math.floor(Math.random() * 11) + 25   // 25–35
    : Math.floor(Math.random() * 5) + 8     // 8–12

  const newEnemyHp = Math.max(0, state.enemyHp - damage)
  const seenQuestions = new Set(state.seenQuestions)
  seenQuestions.add(pendingQuestion.q)

  const logMsg = correct
    ? `PSI strike! ${damage} damage!`
    : `Wrong… ${damage} damage anyway.`
  const log = [...state.log, logMsg].slice(-3)
  const phase: BattlePhase = newEnemyHp <= 0 ? 'victory' : 'enemy-turn'

  return {
    ...state,
    enemyHp: newEnemyHp,
    pendingQuestion: null,
    seenQuestions,
    log,
    phase,
    turnCount: state.turnCount + 1,
  }
}

export function chooseGuard(state: BattleState): BattleState {
  return {
    ...state,
    guardActive: true,
    phase: 'enemy-turn',
    log: [...state.log, 'Guard up!'].slice(-3),
  }
}

export function chooseRun(state: BattleState): { newState: BattleState; escaped: boolean } {
  if (Math.random() < 0.6) {
    return {
      newState: { ...state, log: [...state.log, 'Got away safely!'].slice(-3) },
      escaped: true,
    }
  }
  const attacked = enemyTurn({ ...state, guardActive: false })
  return {
    newState: { ...attacked, log: [...attacked.log, "Couldn't escape!"].slice(-3) },
    escaped: false,
  }
}

export function enemyTurn(state: BattleState): BattleState {
  const rawDamage = Math.max(1, state.enemy.attack)
  const damage = state.guardActive ? Math.floor(rawDamage / 2) : rawDamage
  const newPlayerHp = Math.max(0, state.playerHp - damage)
  const log = [...state.log, `${state.enemy.name} attacks! ${damage} dmg.`].slice(-3)
  const phase: BattlePhase = newPlayerHp <= 0 ? 'defeat' : 'player-turn'

  return {
    ...state,
    playerHp: newPlayerHp,
    guardActive: false,
    log,
    phase,
    turnCount: state.turnCount + 1,
  }
}

export function tickDisplayHp(state: BattleState, dt: number): BattleState {
  if (state.displayHp <= state.playerHp) return state
  const newDisplayHp = Math.max(state.playerHp, state.displayHp - 30 * dt)
  return { ...state, displayHp: newDisplayHp }
}
