import * as Tone from 'tone'

let synth: Tone.PolySynth | null = null
let layer2: Tone.PolySynth | null = null
let seq: Tone.Sequence | null = null
let seq2: Tone.Sequence | null = null
let layerTimer: ReturnType<typeof setTimeout> | null = null

const NOTES = ['C4', 'E4', 'G4', 'A4', 'C5', 'A4', 'G4', 'E4']
const NOTES2 = ['G5', null, 'E5', null, 'C5', null, 'E5', null]

export function start(volume: number): void {
  Tone.getTransport().bpm.value = 72
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.8 },
  }).toDestination()
  synth.volume.value = Tone.gainToDb(volume)
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
    oscillator: { type: 'sine' },
    envelope: { attack: 0.1, decay: 0.5, sustain: 0.2, release: 1.5 },
  }).toDestination()
  layer2.volume.value = Tone.gainToDb(volume * 0.5)
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
