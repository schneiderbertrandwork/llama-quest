import {
  initBattle, choosePSI, answerPSI, chooseGuard, chooseRun, enemyTurn, tickDisplayHp,
} from '../battle'
import type { EnemyDef } from '../../content/enemies'
import type { QuizQuestion } from '../../content/qbank'

const enemy: EnemyDef = {
  id: 'spinning-cursor', name: 'Spinning Cursor', maxHp: 40, attack: 8, defense: 0,
  xpReward: 15, act: 1, isBoss: false,
  dialogue: { onAppear: 'Spinning…', onHit: 'Hit!', onDefeat: 'Done.' },
}

const q: QuizQuestion = {
  q: 'Q?', a: ['A', 'B', 'C', 'D'], c: 1, why: 'B is right', lessonId: 'oll-intro',
}

it('initBattle sets phase to intro and mirrors HP', () => {
  const s = initBattle(enemy, 60, 60)
  expect(s.phase).toBe('intro')
  expect(s.playerHp).toBe(60)
  expect(s.displayHp).toBe(60)
  expect(s.enemyHp).toBe(enemy.maxHp)
})

it('choosePSI transitions to psi-question and sets pendingQuestion', () => {
  const s = initBattle(enemy, 60, 60)
  const s2 = choosePSI({ ...s, phase: 'player-turn' }, [q])
  expect(s2.phase).toBe('psi-question')
  expect(s2.pendingQuestion).toBe(q)
})

it('answerPSI correct reduces enemyHp by 25–35', () => {
  const s = initBattle(enemy, 60, 60)
  const s2 = answerPSI({ ...s, phase: 'psi-question', pendingQuestion: q }, 1)
  expect(s2.enemyHp).toBeLessThanOrEqual(enemy.maxHp - 25)
  expect(s2.enemyHp).toBeGreaterThanOrEqual(enemy.maxHp - 35)
  expect(s2.phase).toBe('enemy-turn')
})

it('answerPSI wrong reduces enemyHp by 8–12', () => {
  const s = initBattle(enemy, 60, 60)
  const s2 = answerPSI({ ...s, phase: 'psi-question', pendingQuestion: q }, 0)
  expect(s2.enemyHp).toBeLessThanOrEqual(enemy.maxHp - 8)
  expect(s2.enemyHp).toBeGreaterThanOrEqual(enemy.maxHp - 12)
})

it('answerPSI that kills enemy transitions to victory', () => {
  const s = initBattle(enemy, 60, 60)
  const s2 = answerPSI({ ...s, phase: 'psi-question', pendingQuestion: q, enemyHp: 5 }, 1)
  expect(s2.phase).toBe('victory')
})

it('enemyTurn reduces playerHp', () => {
  const s = initBattle(enemy, 60, 60)
  const s2 = enemyTurn({ ...s, phase: 'enemy-turn', guardActive: false })
  expect(s2.playerHp).toBeLessThan(60)
  expect(s2.guardActive).toBe(false)
})

it('guard halves enemy damage (rounds down)', () => {
  const s = initBattle(enemy, 60, 60)
  const unguarded = enemyTurn({ ...s, phase: 'enemy-turn', guardActive: false })
  const guarded = enemyTurn({ ...s, phase: 'enemy-turn', guardActive: true })
  expect(guarded.playerHp).toBeGreaterThan(unguarded.playerHp)
})

it('tickDisplayHp drains displayHp toward playerHp at 30/sec', () => {
  const s = initBattle(enemy, 30, 60)
  const s2 = tickDisplayHp({ ...s, displayHp: 60 }, 1 / 60)
  expect(s2.displayHp).toBeCloseTo(60 - 30 / 60, 0)
})
