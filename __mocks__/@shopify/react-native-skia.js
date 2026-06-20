const React = require('react')

const mockComponent = (name) => {
  const Comp = ({ children, testID }) =>
    React.createElement('View', { testID }, children)
  Comp.displayName = name
  return Comp
}

module.exports = {
  Canvas: mockComponent('Canvas'),
  Rect: mockComponent('Rect'),
  Circle: mockComponent('Circle'),
  Group: mockComponent('Group'),
  Text: mockComponent('SkiaText'),
  Image: mockComponent('SkiaImage'),
  useImage: jest.fn(() => null),
  useFont: jest.fn(() => null),
  useDerivedValue: jest.fn((fn) => ({ value: fn() })),
  useSharedValue: jest.fn((v) => ({ value: v })),
  Skia: { Color: jest.fn((c) => c) },
}
