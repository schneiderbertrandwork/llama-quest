import * as Tone from 'tone'

let synth: Tone.PolySynth | null = null
let layer2: Tone.PolySynth | null = null
let seq: Tone.Sequence | null = null
let seq2: Tone.Sequence | null = null
let layerTimer: ReturnType<typeof setTimeout> | null = null

const NOTES = ['A2', 'C3', 'E3', 'A3', 'E3', 'C3', null, null]
const NOTES2 = ['A4', null, null, null, 'E4', null, null, null]

export function start(volume: number): void {
  Tone.getTransport().bpm.value = 60
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.08, decay: 0.5, sustain: 0.2, release: 2.0 },
  }).toDestination()
  synth.volume.value = Tone.gainToDb(volume * 0.65)
  seq = new Tone.Sequence(
    (time, note) => { if (note) synth?.triggerAttackRelease(note, '8n', time) },
    NOTES,
    '8n',
  )
  seq.start(0)
  Tone.getTransport().start()
  layerTimer = setTimeout(() => _addLayer2(volume), 30000)
}

function _addLayer2(volume: number): void {
  layer2 = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.2, decay: 1.0, sustain: 0.1, release: 3.0 },
  }).toDestination()
  layer2.volume.value = Tone.gainToDb(volume * 0.3)
  seq2 = new Tone.Sequence(
    (time, note) => { if (note) layer2?.triggerAttackRelease(note, '2n', time) },
    NOTES2,
    '2n',
  )
  seq2.start(0)
}

export function stop(): void {
  if (layerTimer) clearTimeout(layerTimer)
  seq?.stop(); seq?.dispose()
  seq2?.stop(); seq2?.dispose()
  synth?.dispose()
  layer2?.dispose()
  Tone.getTransport().stop()
  synth = null; layer2 = null; seq = null; seq2 = null; layerTimer = null
}
