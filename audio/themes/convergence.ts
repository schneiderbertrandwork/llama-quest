import * as Tone from 'tone'

let synth: Tone.PolySynth | null = null
let layer2: Tone.PolySynth | null = null
let seq: Tone.Sequence | null = null
let seq2: Tone.Sequence | null = null

const NOTES = ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4', 'G3']
const NOTES2 = ['C5', null, 'E5', null, 'G5', null, 'C6', null]

export function start(volume: number): void {
  Tone.getTransport().bpm.value = 80
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.03, decay: 0.2, sustain: 0.5, release: 0.8 },
  }).toDestination()
  synth.volume.value = Tone.gainToDb(volume * 0.7)
  seq = new Tone.Sequence(
    (time, note) => { if (note) synth?.triggerAttackRelease(note, '8n', time) },
    NOTES,
    '8n',
  )
  seq.start(0)

  layer2 = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 1.0 },
  }).toDestination()
  layer2.volume.value = Tone.gainToDb(volume * 0.45)
  seq2 = new Tone.Sequence(
    (time, note) => { if (note) layer2?.triggerAttackRelease(note, '4n', time) },
    NOTES2,
    '4n',
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
