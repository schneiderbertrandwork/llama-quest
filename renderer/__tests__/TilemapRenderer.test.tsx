import React from 'react'
import { render } from '@testing-library/react-native'
import { TilemapRenderer } from '../TilemapRenderer'
import { makeGrid } from '../../engine/tilemap'

describe('TilemapRenderer', () => {
  it('renders without crashing for a valid grid', () => {
    const grid = makeGrid(5, 5, 'grass')
    const camera = { x: 0, y: 0 }
    const { toJSON } = render(
      <TilemapRenderer grid={grid} camera={camera} tileSize={32} width={320} height={240} />,
    )
    expect(toJSON()).not.toBeNull()
  })
})
