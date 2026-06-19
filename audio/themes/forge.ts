import * as Tone from 'tone'

let synth: Tone.PolySynth | null = null
let layer2: Tone.PolySynth | null = null
let seq: Tone.Sequence | null = null
let seq2: Tone.Sequence | null = null
let layerTimer: ReturnType<typeof setTimeout> | null = null

const NOTES = ['D3', 'F3', 'A3', 'C4', 'A3', 'F3', 'D3', 'E3']
const NOTES2 = ['D4', null, null, 'F4', null, null, 'A4', null]

export function start(volume: number): void {
  Tone.getTransport().bpm.value = 90
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.3 },
  }).toDestination()
  synth.volume.value = Tone.gainToDb(volume * 0.6)
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
    oscillator: { type: 'square' },
    envelope: { attack: 0.05, decay: 0.3, sustain: 0.3, release: 0.5 },
  }).toDestination()
  layer2.volume.value = Tone.gainToDb(volume * 0.35)
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
