import React from 'react'
import { render } from '@testing-library/react-native'
import { RollingHP } from '../RollingHP'

it('displays the displayHp value', () => {
  const { getByText } = render(
    <RollingHP displayHp={45} playerHp={30} maxHp={60} />
  )
  expect(getByText('45')).toBeTruthy()
})

it('shows "HP" label', () => {
  const { getByText } = render(
    <RollingHP displayHp={10} playerHp={10} maxHp={60} />
  )
  expect(getByText('HP')).toBeTruthy()
})
