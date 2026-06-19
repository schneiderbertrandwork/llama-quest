import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AudioManager } from '../audio/AudioManager'

export type PlayerClass = 'Tinkerer' | 'Scholar' | 'Architect'
export type CityId = 'overworld' | 'llamatown' | 'forge' | 'vale' | 'ridge'

const XP_PER_LEVEL = 120

interface PlayerData {
  name: string
  class: PlayerClass
  hp: number
  maxHp: number
  level: number
  xp: number
}

interface ProgressionData {
  currentCity: CityId
  position: { x: number; y: number }
  masteredConcepts: Record<string, boolean>
  readLessons: Record<string, boolean>
  metNPCs: Record<string, boolean>
  completedSandboxes: Record<string, boolean>
  defeatedBosses: Record<string, boolean>
}

interface SettingsData {
  musicEnabled: boolean
  sfxEnabled: boolean
  masterVolume: number
}

interface GameState {
  player: PlayerData
  progression: ProgressionData
  settings: SettingsData
  initPlayer: (name: string, cls: PlayerClass) => void
  awardXP: (amount: number) => void
  markLessonRead: (lessonId: string) => void
  markNPCMet: (npcId: string) => void
  setPosition: (city: CityId, x: number, y: number) => void
  updateSettings: (partial: Partial<SettingsData>) => void
  awardBossKill: (bossId: string) => void
  setPlayerHp: (hp: number) => void
  markSandboxCompleted: (sandboxId: string) => void
}

const DEFAULT_PLAYER: PlayerData = {
  name: '',
  class: 'Tinkerer',
  hp: 60,
  maxHp: 60,
  level: 1,
  xp: 0,
}

const DEFAULT_PROGRESSION: ProgressionData = {
  currentCity: 'overworld',
  position: { x: 5, y: 5 },
  masteredConcepts: {},
  readLessons: {},
  metNPCs: {},
  completedSandboxes: {},
  defeatedBosses: {},
}

const DEFAULT_SETTINGS: SettingsData = {
  musicEnabled: true,
  sfxEnabled: true,
  masterVolume: 0.8,
}

export const initialGameState = {
  player: { ...DEFAULT_PLAYER },
  progression: { ...DEFAULT_PROGRESSION },
  settings: { ...DEFAULT_SETTINGS },
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      player: { ...DEFAULT_PLAYER },
      progression: { ...DEFAULT_PROGRESSION },
      settings: { ...DEFAULT_SETTINGS },

      initPlayer: (name, cls) =>
        set({
          player: { ...DEFAULT_PLAYER, name, class: cls },
          progression: { ...DEFAULT_PROGRESSION },
        }),

      awardXP: (amount) =>
        set((state) => {
          let { xp, level, hp, maxHp } = state.player
          xp += amount
          while (xp >= XP_PER_LEVEL) {
            xp -= XP_PER_LEVEL
            level++
            maxHp += 5
            hp = maxHp
            AudioManager.sfx('levelUp')
          }
          return { player: { ...state.player, xp, level, hp, maxHp } }
        }),

      markLessonRead: (lessonId) => {
        const { progression } = get()
        if (progression.readLessons[lessonId]) return
        set((state) => ({
          progression: {
            ...state.progression,
            readLessons: { ...state.progression.readLessons, [lessonId]: true },
            masteredConcepts: { ...state.progression.masteredConcepts, [lessonId]: true },
          },
        }))
        get().awardXP(20)
      },

      markNPCMet: (npcId) => {
        const { progression } = get()
        if (progression.metNPCs[npcId]) return
        set((state) => ({
          progression: {
            ...state.progression,
            metNPCs: { ...state.progression.metNPCs, [npcId]: true },
          },
        }))
        get().awardXP(8)
      },

      setPosition: (city, x, y) =>
        set((state) => ({
          progression: { ...state.progression, currentCity: city, position: { x, y } },
        })),

      updateSettings: (partial) =>
        set((s) => {
          const next = { ...s.settings, ...partial }
          if (partial.musicEnabled !== undefined) AudioManager.setMusicEnabled(partial.musicEnabled)
          if (partial.sfxEnabled !== undefined) AudioManager.setSfxEnabled(partial.sfxEnabled)
          if (partial.masterVolume !== undefined) AudioManager.setVolume(partial.masterVolume)
          return { settings: next }
        }),

      awardBossKill: (bossId) => {
        const { progression } = get()
        if (progression.defeatedBosses[bossId]) return
        set((state) => ({
          progression: {
            ...state.progression,
            defeatedBosses: { ...state.progression.defeatedBosses, [bossId]: true },
          },
        }))
        get().awardXP(100)
      },

      setPlayerHp: (hp) =>
        set((state) => ({
          player: { ...state.player, hp: Math.min(Math.max(1, hp), state.player.maxHp) },
        })),

      markSandboxCompleted: (sandboxId) => {
        const { progression } = get()
        if (progression.completedSandboxes[sandboxId]) return
        set((state) => ({
          progression: {
            ...state.progression,
            completedSandboxes: { ...state.progression.completedSandboxes, [sandboxId]: true },
          },
        }))
        get().awardXP(15)
      },
    }),
    {
      name: 'llama_quest_v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
