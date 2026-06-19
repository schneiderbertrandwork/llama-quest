import * as Tone from 'tone'

let synth: Tone.PolySynth | null = null
let layer2: Tone.PolySynth | null = null
let seq: Tone.Sequence | null = null
let seq2: Tone.Sequence | null = null
let layerTimer: ReturnType<typeof setTimeout> | null = null

const NOTES = ['G3', 'B3', 'D4', 'G4', 'D4', 'B3', 'G3', 'A3']
const NOTES2 = ['G4', null, 'D5', null, 'B4', null, 'G5', null]

export function start(volume: number): void {
  Tone.getTransport().bpm.value = 80
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5 },
  }).toDestination()
  synth.volume.value = Tone.gainToDb(volume * 0.7)
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
    envelope: { attack: 0.05, decay: 0.4, sustain: 0.2, release: 1.0 },
  }).toDestination()
  layer2.volume.value = Tone.gainToDb(volume * 0.4)
  seq2 = new Tone.Sequence(
    (time, note) => { if (note) layer2?.triggerAttackRelease(note, '4n', time) },
    NOTES2,
    '4n',
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
