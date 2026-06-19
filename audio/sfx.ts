// audio/sfx.ts
// Implementations added in Task 5
import * as Tone from 'tone'

export const SFX_MAP: Record<string, () => void> = {
  levelUp: () => {
    const synth = new Tone.PolySynth(Tone.Synth).toDestination()
    const now = Tone.now()
    synth.triggerAttackRelease('C4', '8n', now)
    synth.triggerAttackRelease('E4', '8n', now + 0.1)
    synth.triggerAttackRelease('G5', '8n', now + 0.2)
    setTimeout(() => synth.dispose(), 1000)
  },
  hit: () => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.1 },
    }).toDestination()
    synth.triggerAttackRelease('C2', '32n')
    setTimeout(() => synth.dispose(), 500)
  },
  miss: () => {
    const noise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
    }).toDestination()
    noise.triggerAttackRelease('16n')
    setTimeout(() => noise.dispose(), 500)
  },
  npcBlip: () => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.05 },
    }).toDestination()
    synth.triggerAttackRelease('A5', '64n')
    setTimeout(() => synth.dispose(), 200)
  },
  menuMove: () => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.015, sustain: 0, release: 0.03 },
    }).toDestination()
    synth.triggerAttackRelease('E5', '64n')
    setTimeout(() => synth.dispose(), 200)
  },
  victory: () => {
    const synth = new Tone.PolySynth(Tone.Synth).toDestination()
    const now = Tone.now()
    synth.triggerAttackRelease('C4', '8n', now)
    synth.triggerAttackRelease('E4', '8n', now + 0.1)
    synth.triggerAttackRelease('G4', '8n', now + 0.2)
    synth.triggerAttackRelease('C5', '4n', now + 0.3)
    setTimeout(() => synth.dispose(), 2000)
  },
  escape: () => {
    const osc = new Tone.Oscillator(800, 'sine').toDestination()
    const now = Tone.now()
    osc.frequency.linearRampTo(200, 0.2, now)
    osc.start(now)
    osc.stop(now + 0.2)
    setTimeout(() => osc.dispose(), 500)
  },
}
