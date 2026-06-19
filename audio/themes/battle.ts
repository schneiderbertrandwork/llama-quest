import * as Tone from 'tone'

let synth: Tone.PolySynth | null = null
let layer2: Tone.PolySynth | null = null
let seq: Tone.Sequence | null = null
let seq2: Tone.Sequence | null = null

const NOTES = ['B2', 'D3', 'F3', 'B3', 'F3', 'D3', 'B2', null]
const NOTES2 = ['B3', null, 'D4', null, 'F4', null, 'B4', null]

export function start(volume: number): void {
  Tone.getTransport().bpm.value = 120
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.2 },
  }).toDestination()
  synth.volume.value = Tone.gainToDb(volume * 0.65)
  seq = new Tone.Sequence(
    (time, note) => { if (note) synth?.triggerAttackRelease(note, '16n', time) },
    NOTES,
    '16n',
  )
  seq.start(0)

  layer2 = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.3 },
  }).toDestination()
  layer2.volume.value = Tone.gainToDb(volume * 0.4)
  seq2 = new Tone.Sequence(
    (time, note) => { if (note) layer2?.triggerAttackRelease(note, '8n', time) },
    NOTES2,
    '8n',
  )
  seq2.start(0)
  Tone.getTransport().start()
}

export function stop(): void {
  seq?.stop(); seq?.dispose()
  seq2?.stop(); seq2?.dispose()
  synth?.dispose()
  layer2?.dispose()
  Tone.getTransport().stop()
  synth = null; layer2 = null; seq = null; seq2 = null
}
