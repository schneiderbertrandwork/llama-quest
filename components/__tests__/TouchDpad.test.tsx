import React from 'react'
import { Platform } from 'react-native'
import { render, fireEvent } from '@testing-library/react-native'
import { TouchDpad } from '../TouchDpad'

describe('TouchDpad', () => {
  const onInput = jest.fn()
  const onInteract = jest.fn()

  beforeEach(() => {
    onInput.mockClear()
    onInteract.mockClear()
  })

  it('returns null on web', () => {
    const originalOS = Platform.OS
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true })
    const { toJSON } = render(<TouchDpad onInput={onInput} onInteract={onInteract} />)
    expect(toJSON()).toBeNull()
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true })
  })

  it('renders 5 buttons on non-web', () => {
    const originalOS = Platform.OS
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true })
    const { getAllByRole } = render(<TouchDpad onInput={onInput} onInteract={onInteract} />)
    // 4 direction buttons + 1 interact button
    expect(getAllByRole('button').length).toBe(5)
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true })
  })

  it('calls onInput(0, -1) when up pressed, onInput(0, 0) when released', () => {
    const originalOS = Platform.OS
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true })
    const { getByTestId } = render(<TouchDpad onInput={onInput} onInteract={onInteract} />)
    fireEvent(getByTestId('dpad-up'), 'pressIn')
    expect(onInput).toHaveBeenCalledWith(0, -1)
    fireEvent(getByTestId('dpad-up'), 'pressOut')
    expect(onInput).toHaveBeenCalledWith(0, 0)
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true })
  })

  it('calls onInteract when center button pressed', () => {
    const originalOS = Platform.OS
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true })
    const { getByTestId } = render(<TouchDpad onInput={onInput} onInteract={onInteract} />)
    fireEvent.press(getByTestId('dpad-interact'))
    expect(onInteract).toHaveBeenCalledTimes(1)
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true })
  })
})
