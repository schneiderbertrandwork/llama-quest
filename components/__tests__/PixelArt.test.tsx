import React from 'react'
import { render } from '@testing-library/react-native'
import { PixelArt } from '../PixelArt'

const SIMPLE = { pixels: ['#ff0000', '', '', '#0000ff'], size: 2 }

describe('PixelArt', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<PixelArt pixels={SIMPLE.pixels} size={2} scale={8} testID="pa" />)
    expect(toJSON()).not.toBeNull()
  })

  it('renders size*size pixel views', () => {
    const { getAllByTestId } = render(<PixelArt pixels={SIMPLE.pixels} size={2} scale={8} testID="pa" />)
    expect(getAllByTestId('pa-pixel').length).toBe(4)
  })

  it('applies backgroundColor from pixels array', () => {
    const { getAllByTestId } = render(<PixelArt pixels={SIMPLE.pixels} size={2} scale={8} testID="pa" />)
    const pixelViews = getAllByTestId('pa-pixel')
    expect(pixelViews[0]?.props.style).toEqual(
      expect.objectContaining({ backgroundColor: '#ff0000' })
    )
  })
})
