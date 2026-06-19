import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { BattleMenu } from '../BattleMenu'

describe('BattleMenu', () => {
  const noop = () => {}

  it('renders all three action buttons', () => {
    const { getByText } = render(
      <BattleMenu onPSI={noop} onGuard={noop} onRun={noop} disabled={false} />
    )
    expect(getByText('⚡ PSI')).toBeTruthy()
    expect(getByText('🛡 Guard')).toBeTruthy()
    expect(getByText('💨 Run')).toBeTruthy()
  })

  it('calls onPSI when PSI button is pressed', () => {
    const onPSI = jest.fn()
    const { getByText } = render(
      <BattleMenu onPSI={onPSI} onGuard={noop} onRun={noop} disabled={false} />
    )
    fireEvent.press(getByText('⚡ PSI'))
    expect(onPSI).toHaveBeenCalledTimes(1)
  })

  it('calls onGuard when Guard button is pressed', () => {
    const onGuard = jest.fn()
    const { getByText } = render(
      <BattleMenu onPSI={noop} onGuard={onGuard} onRun={noop} disabled={false} />
    )
    fireEvent.press(getByText('🛡 Guard'))
    expect(onGuard).toHaveBeenCalledTimes(1)
  })

  it('calls onRun when Run button is pressed', () => {
    const onRun = jest.fn()
    const { getByText } = render(
      <BattleMenu onPSI={noop} onGuard={noop} onRun={onRun} disabled={false} />
    )
    fireEvent.press(getByText('💨 Run'))
    expect(onRun).toHaveBeenCalledTimes(1)
  })

  it('does not call onPSI when disabled', () => {
    const onPSI = jest.fn()
    const { getByText } = render(
      <BattleMenu onPSI={onPSI} onGuard={noop} onRun={noop} disabled={true} />
    )
    fireEvent.press(getByText('⚡ PSI'))
    expect(onPSI).not.toHaveBeenCalled()
  })

  it('does not call onGuard when disabled', () => {
    const onGuard = jest.fn()
    const { getByText } = render(
      <BattleMenu onPSI={noop} onGuard={onGuard} onRun={noop} disabled={true} />
    )
    fireEvent.press(getByText('🛡 Guard'))
    expect(onGuard).not.toHaveBeenCalled()
  })

  it('does not call onRun when disabled', () => {
    const onRun = jest.fn()
    const { getByText } = render(
      <BattleMenu onPSI={noop} onGuard={noop} onRun={onRun} disabled={true} />
    )
    fireEvent.press(getByText('💨 Run'))
    expect(onRun).not.toHaveBeenCalled()
  })
})
