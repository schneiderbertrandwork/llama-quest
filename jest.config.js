module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|zustand)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}
