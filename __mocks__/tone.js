// __mocks__/tone.js
const mockSynthInstance = () => ({
  volume: { value: 0 },
  frequency: { value: 440, linearRampTo: jest.fn() },
  triggerAttackRelease: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  dispose: jest.fn(),
  toDestination: jest.fn().mockReturnThis(),
})

const mockTransport = {
  bpm: { value: 120 },
  start: jest.fn(),
  stop: jest.fn(),
}

module.exports = {
  getTransport: jest.fn(() => mockTransport),
  gainToDb: jest.fn((v) => v * 10),
  now: jest.fn(() => 0),
  PolySynth: jest.fn(mockSynthInstance),
  Synth: jest.fn(),
  NoiseSynth: jest.fn(mockSynthInstance),
  Oscillator: jest.fn(mockSynthInstance),
  Sequence: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    dispose: jest.fn(),
  })),
}
