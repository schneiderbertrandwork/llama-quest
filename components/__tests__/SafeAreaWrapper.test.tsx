import React from 'react'
import { render } from '@testing-library/react-native'
import { Text } from 'react-native'
import { SafeAreaWrapper } from '../SafeAreaWrapper'

describe('SafeAreaWrapper', () => {
  it('renders children', () => {
    const { getByText } = render(
      <SafeAreaWrapper>
        <Text>hello</Text>
      </SafeAreaWrapper>
    )
    expect(getByText('hello')).toBeTruthy()
  })

  it('applies inset padding from useSafeAreaInsets', () => {
    const { getByTestId } = render(
      <SafeAreaWrapper testID="wrapper">
        <Text>child</Text>
      </SafeAreaWrapper>
    )
    const wrapper = getByTestId('wrapper')
    // Mock returns top:44, bottom:34
    expect(wrapper.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ paddingTop: 44, paddingBottom: 34 }),
      ])
    )
  })
})
