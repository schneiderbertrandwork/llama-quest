// __mocks__/expo-av.js
const mockSound = {
  playAsync: jest.fn().mockResolvedValue({}),
  stopAsync: jest.fn().mockResolvedValue({}),
  unloadAsync: jest.fn().mockResolvedValue({}),
  setVolumeAsync: jest.fn().mockResolvedValue({}),
}

module.exports = {
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({ sound: mockSound }),
    },
    setAudioModeAsync: jest.fn().mockResolvedValue({}),
  },
}
