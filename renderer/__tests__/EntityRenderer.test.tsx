import React from 'react'
import { render } from '@testing-library/react-native'
import { EntityRenderer } from '../EntityRenderer'
import { makePlayer, makeNPC, makeDecoration, makeCritter } from '../../engine/entity'
import type { CritterData } from '../../engine/entity'

const camera = { x: 0, y: 0 }
const baseProps = { camera, tileSize: 32, width: 320, height: 240, time: 0 }

describe('EntityRenderer', () => {
  it('renders player without crashing', () => {
    const { toJSON } = render(<EntityRenderer entities={[makePlayer(5, 5)]} {...baseProps} />)
    expect(toJSON()).not.toBeNull()
  })

  it('renders decoration without crashing', () => {
    const { toJSON } = render(<EntityRenderer entities={[makeDecoration('d1', 3, 4)]} {...baseProps} />)
    expect(toJSON()).not.toBeNull()
  })

  it('renders known NPC without crashing', () => {
    const npc = makeNPC('npc-llama-elder', 5, 5, { name: 'Elder', lines: ['Hi'] })
    const { toJSON } = render(<EntityRenderer entities={[npc]} {...baseProps} />)
    expect(toJSON()).not.toBeNull()
  })

  it('renders unknown NPC with fallback without crashing', () => {
    const npc = makeNPC('npc-unknown', 5, 5, { name: '?', lines: ['?'] })
    const { toJSON } = render(<EntityRenderer entities={[npc]} {...baseProps} />)
    expect(toJSON()).not.toBeNull()
  })

  it('renders rabbit critter without crashing', () => {
    const data: CritterData = {
      homeX: 10, homeY: 20, targetX: 11, targetY: 20,
      wanderRadius: 4, speed: 1.5, pauseTimer: 0, critterType: 'rabbit',
    }
    const { toJSON } = render(<EntityRenderer entities={[makeCritter('c1', 10, 20, data)]} {...baseProps} />)
    expect(toJSON()).not.toBeNull()
  })

  it('renders butterfly critter without crashing', () => {
    const data: CritterData = {
      homeX: 5, homeY: 5, targetX: 6, targetY: 5,
      wanderRadius: 8, speed: 2, pauseTimer: 0, critterType: 'butterfly', phaseOffset: 1.2,
    }
    const { toJSON } = render(<EntityRenderer entities={[makeCritter('b1', 5, 5, data)]} {...baseProps} />)
    expect(toJSON()).not.toBeNull()
  })

  it('renders without crashing at varying time values', () => {
    // Just confirms no crash with time prop varying
    const { rerender } = render(<EntityRenderer entities={[makePlayer(5, 5)]} {...baseProps} time={0} />)
    rerender(<EntityRenderer entities={[makePlayer(5, 5)]} {...baseProps} time={500} />)
  })
})
