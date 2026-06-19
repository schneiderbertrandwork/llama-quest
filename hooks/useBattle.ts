// hooks/useBattle.ts
import { useState, useEffect, useCallback } from 'react'
import {
  initBattle,
  choosePSI as engineChoosePSI,
  answerPSI as engineAnswerPSI,
  chooseGuard as engineChooseGuard,
  chooseRun as engineChooseRun,
  tickDisplayHp,
} from '../engine/battle'
import type { BattleState } from '../engine/battle'
import type { EnemyDef } from '../content/enemies'
import { getQuestionsForAct } from '../content/qbank'
import { useGameStore } from '../store/game-store'
import { useGameLoop } from './useGameLoop'

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

  // Drain displayHp toward playerHp each frame
  useGameLoop(
    useCallback(
      (dt: number) => {
        setState((prev) => tickDisplayHp(prev, dt))
      },
      [],
    ),
  )

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
      setState((prev) => {
        const next = engineAnswerPSI(prev, idx)
        // Award +5 XP for a correct PSI answer (before state commit)
        const wasCorrect = prev.pendingQuestion != null && idx === prev.pendingQuestion.c
        if (wasCorrect) awardXP(5)
        return next
      })
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
