import { Platform } from 'react-native'
import * as LlamatownTheme from './themes/llamatown'
import * as OverworldTheme from './themes/overworld'
import * as ForgeTheme from './themes/forge'
import * as CavernsTheme from './themes/caverns'
import * as ConvergenceTheme from './themes/convergence'
import * as BattleTheme from './themes/battle'
import { SFX_MAP } from './sfx'

export type TrackId = 'overworld' | 'llamatown' | 'forge' | 'caverns' | 'convergence' | 'battle'

interface Theme {
  start: (volume: number) => void
  stop: () => void
}

const THEMES: Record<TrackId, Theme> = {
  overworld: OverworldTheme,
  llamatown: LlamatownTheme,
  forge: ForgeTheme,
  caverns: CavernsTheme,
  convergence: ConvergenceTheme,
  battle: BattleTheme,
}

export class AudioManagerImpl {
  private currentTrack: TrackId | null = null
  private musicEnabled = true
  private sfxEnabled = true
  private volume = 0.8

  play(trackId: TrackId): void {
    if (this.currentTrack === trackId) return
    if (this.currentTrack !== null) {
      THEMES[this.currentTrack]?.stop()
    }
    this.currentTrack = trackId
    if (!this.musicEnabled) return
    if (Platform.OS === 'web') {
      THEMES[trackId]?.start(this.volume)
    }
    // Native expo-av: not implemented in Phase 4 (web-first)
  }

  stop(): void {
    if (this.currentTrack !== null && Platform.OS === 'web') {
      THEMES[this.currentTrack]?.stop()
    }
    this.currentTrack = null
  }

  sfx(id: keyof typeof SFX_MAP): void {
    if (!this.sfxEnabled) return
    const fn = SFX_MAP[id]
    if (fn) fn()
  }

  setVolume(v: number): void {
    this.volume = v
  }

  setMusicEnabled(v: boolean): void {
    this.musicEnabled = v
    if (!v) this.stop()
  }

  setSfxEnabled(v: boolean): void {
    this.sfxEnabled = v
  }
}

export const AudioManager = new AudioManagerImpl()
