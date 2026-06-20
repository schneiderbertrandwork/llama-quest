// hooks/useBattle.ts
import { useState, useEffect, useRef, useCallback } from 'react'
import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'
import {
  initBattle,
  choosePSI as engineChoosePSI,
  answerPSI as engineAnswerPSI,
  chooseGuard as engineChooseGuard,
  chooseRun as engineChooseRun,
  enemyTurn as engineEnemyTurn,
  tickDisplayHp,
} from '../engine/battle'
import type { BattleState, BattlePhase } from '../engine/battle'
import type { EnemyDef } from '../content/enemies'
import { getQuestionsForAct } from '../content/qbank'
import { useGameStore } from '../store/game-store'
import { useGameLoop } from './useGameLoop'
import { AudioManager } from '../audio/AudioManager'

export interface UseBattleReturn {
  state: BattleState
  choosePSI: () => void
  answer: (idx: 0 | 1 | 2 | 3) => void
  chooseGuard: () => void
  chooseRun: () => { escaped: boolean }
}

export function useBattle(
  enemy: EnemyDef,
  playerHp: number,
  playerMaxHp: number,
): UseBattleReturn {
  const [state, setState] = useState<BattleState>(() =>
    initBattle(enemy, playerHp, playerMaxHp),
  )
  const { awardXP, awardBossKill, setPlayerHp } = useGameStore()
  const questions = getQuestionsForAct(enemy.act)
  const prevPhaseRef = useRef<BattlePhase>(state.phase)

  // Auto-advance from intro to player-turn after enemy appear dialogue is shown
  useEffect(() => {
    if (state.phase === 'intro') {
      const timer = setTimeout(() => {
        setState((prev) => prev.phase === 'intro' ? { ...prev, phase: 'player-turn' } : prev)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [state.phase])

  // Drain displayHp toward playerHp each frame; execute enemy turn when phase is 'enemy-turn'
  useGameLoop(
    useCallback(
      (dt: number) => {
        setState((prev) => {
          if (prev.phase === 'enemy-turn') {
            const afterEnemyTurn = engineEnemyTurn(prev)
            return tickDisplayHp(afterEnemyTurn, dt)
          }
          return tickDisplayHp(prev, dt)
        })
      },
      [],
    ),
  )

  // Fire hit sfx when enemy-turn phase ends — kept outside setState updater (no side effects in updaters)
  useEffect(() => {
    if (prevPhaseRef.current === 'enemy-turn' && state.phase !== 'enemy-turn') {
      AudioManager.sfx('hit')
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      }
    }
    prevPhaseRef.current = state.phase
  }, [state.phase])

  // Award XP and boss kill on victory — runs once when phase becomes 'victory'
  useEffect(() => {
    if (state.phase === 'victory') {
      awardXP(enemy.xpReward)
      if (enemy.isBoss) awardBossKill(enemy.id)
      setPlayerHp(state.playerHp)
    }
  }, [state.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    state,
    choosePSI: () => setState((prev) => engineChoosePSI(prev, questions)),
    answer: (idx) => {
      if (state.pendingQuestion != null && idx === state.pendingQuestion.c) awardXP(5)
      setState((prev) => engineAnswerPSI(prev, idx))
    },
    chooseGuard: () => setState((prev) => engineChooseGuard(prev)),
    chooseRun: () => {
      const result = engineChooseRun(state)
      setState(result.newState)
      if (result.escaped) {
        setPlayerHp(result.newState.playerHp)
      }
      return { escaped: result.escaped }
    },
  }
}
