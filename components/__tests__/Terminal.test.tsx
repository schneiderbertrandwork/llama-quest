// components/__tests__/Terminal.test.tsx
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Terminal } from '../Terminal'
import { SANDBOXES } from '../../content/sandboxes'

const firstchat = SANDBOXES['firstchat']!

it('renders objective labels', () => {
  const { getByText } = render(
    <Terminal sandbox={firstchat} completedObjectives={{}} onObjectiveDone={jest.fn()} onAllDone={jest.fn()} />
  )
  expect(getByText('Download llama3.2')).toBeTruthy()
})

it('entering "ollama pull llama3.2" calls onObjectiveDone("pull")', () => {
  const onObjectiveDone = jest.fn()
  const { getByPlaceholderText } = render(
    <Terminal sandbox={firstchat} completedObjectives={{}} onObjectiveDone={onObjectiveDone} onAllDone={jest.fn()} />
  )
  const input = getByPlaceholderText('Type command…')
  fireEvent.changeText(input, 'ollama pull llama3.2')
  fireEvent(input, 'submitEditing')
  expect(onObjectiveDone).toHaveBeenCalledWith('pull')
})

it('entering "ollama list" calls onObjectiveDone("list")', () => {
  const onObjectiveDone = jest.fn()
  const { getByPlaceholderText } = render(
    <Terminal sandbox={firstchat} completedObjectives={{}} onObjectiveDone={onObjectiveDone} onAllDone={jest.fn()} />
  )
  const input = getByPlaceholderText('Type command…')
  fireEvent.changeText(input, 'ollama list')
  fireEvent(input, 'submitEditing')
  expect(onObjectiveDone).toHaveBeenCalledWith('list')
})

it('unknown command outputs command not found', () => {
  const { getByPlaceholderText, queryByText } = render(
    <Terminal sandbox={firstchat} completedObjectives={{}} onObjectiveDone={jest.fn()} onAllDone={jest.fn()} />
  )
  const input = getByPlaceholderText('Type command…')
  fireEvent.changeText(input, 'foobar')
  fireEvent(input, 'submitEditing')
  expect(queryByText(/command not found/)).toBeTruthy()
})
