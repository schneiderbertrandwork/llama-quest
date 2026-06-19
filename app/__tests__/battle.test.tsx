// app/__tests__/battle.test.tsx
// Smoke test: renders the battle screen with a valid enemyId and shows enemy name.
import React from 'react'
import { render } from '@testing-library/react-native'

// ─── expo-router mock ──────────────────────────────────────────────────────
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({ enemyId: 'spinning-cursor' })),
  useRouter: jest.fn(() => ({ back: jest.fn() })),
}))

// ─── useBattle mock ───────────────────────────────────────────────────────
jest.mock('../../hooks/useBattle', () => ({
  useBattle: jest.fn(() => ({
    state: {
      phase: 'player-turn',
      playerHp: 60,
      playerMaxHp: 60,
      displayHp: 60,
      enemyHp: 40,
      enemyMaxHp: 40,
      enemy: {
        id: 'spinning-cursor',
        name: 'Spinning Cursor',
        maxHp: 40,
        attack: 8,
        defense: 0,
        xpReward: 15,
        act: 1,
        isBoss: false,
        dialogue: { onAppear: 'Spinning…', onHit: 'Hit!', onDefeat: 'Done.' },
      },
      log: [],
      pendingQuestion: null,
      guardActive: false,
      seenQuestions: new Set(),
      turnCount: 0,
    },
    choosePSI: jest.fn(),
    answer: jest.fn(),
    chooseGuard: jest.fn(),
    chooseRun: jest.fn(() => ({ escaped: false })),
  })),
}))

// ─── useGameStore mock ────────────────────────────────────────────────────
jest.mock('../../store/game-store', () => ({
  useGameStore: jest.fn(() => ({
    player: { name: 'Tester', class: 'Tinkerer', hp: 60, maxHp: 60, level: 1, xp: 0 },
    progression: {
      currentCity: 'overworld',
      position: { x: 5, y: 5 },
      masteredConcepts: {},
      readLessons: {},
      metNPCs: {},
      completedSandboxes: {},
      defeatedBosses: {},
    },
    setPlayerHp: jest.fn(),
    setPosition: jest.fn(),
  })),
}))

import BattleScreen from '../battle'

describe('BattleScreen smoke test', () => {
  it('renders the enemy name when given a valid enemyId', () => {
    const { getByText } = render(<BattleScreen />)
    expect(getByText('Spinning Cursor')).toBeTruthy()
  })

  it('renders the battle menu buttons', () => {
    const { getByText } = render(<BattleScreen />)
    expect(getByText('⚡ PSI')).toBeTruthy()
    expect(getByText('🛡 Guard')).toBeTruthy()
    expect(getByText('💨 Run')).toBeTruthy()
  })

  it('renders the HP display', () => {
    const { getByText } = render(<BattleScreen />)
    expect(getByText('HP')).toBeTruthy()
  })
})
