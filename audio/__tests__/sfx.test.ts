import { SFX_MAP } from '../sfx'
const tone = require('tone')

beforeEach(() => jest.clearAllMocks())

it('levelUp creates a PolySynth and triggers exactly 3 notes', () => {
  SFX_MAP.levelUp?.()
  const instance = tone.PolySynth.mock.results[0]?.value
  expect(tone.PolySynth).toHaveBeenCalled()
  expect(instance?.triggerAttackRelease).toHaveBeenCalledTimes(3)
})

it('hit creates a PolySynth and triggers exactly 1 note', () => {
  SFX_MAP.hit?.()
  const instance = tone.PolySynth.mock.results[0]?.value
  expect(tone.PolySynth).toHaveBeenCalled()
  expect(instance?.triggerAttackRelease).toHaveBeenCalledTimes(1)
})

it('miss creates a NoiseSynth', () => {
  SFX_MAP.miss?.()
  expect(tone.NoiseSynth).toHaveBeenCalled()
})

it('victory creates a PolySynth and triggers exactly 4 notes', () => {
  SFX_MAP.victory?.()
  const instance = tone.PolySynth.mock.results[0]?.value
  expect(tone.PolySynth).toHaveBeenCalled()
  expect(instance?.triggerAttackRelease).toHaveBeenCalledTimes(4)
})

it('npcBlip creates a PolySynth', () => {
  SFX_MAP.npcBlip?.()
  expect(tone.PolySynth).toHaveBeenCalled()
})
