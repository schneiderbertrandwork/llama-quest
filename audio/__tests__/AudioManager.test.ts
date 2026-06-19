jest.mock('react-native', () => ({ Platform: { OS: 'web' } }))
jest.mock('../themes/llamatown', () => ({ start: jest.fn(), stop: jest.fn() }))
jest.mock('../themes/overworld', () => ({ start: jest.fn(), stop: jest.fn() }))
jest.mock('../themes/forge', () => ({ start: jest.fn(), stop: jest.fn() }))
jest.mock('../themes/caverns', () => ({ start: jest.fn(), stop: jest.fn() }))
jest.mock('../themes/convergence', () => ({ start: jest.fn(), stop: jest.fn() }))
jest.mock('../themes/battle', () => ({ start: jest.fn(), stop: jest.fn() }))
jest.mock('../sfx', () => ({
  SFX_MAP: {
    levelUp: jest.fn(), hit: jest.fn(), npcBlip: jest.fn(),
    menuMove: jest.fn(), miss: jest.fn(), victory: jest.fn(), escape: jest.fn(),
  },
}))

import { AudioManagerImpl } from '../AudioManager'
import * as llamatown from '../themes/llamatown'
import * as overworld from '../themes/overworld'

let manager: AudioManagerImpl

beforeEach(() => {
  manager = new AudioManagerImpl()
  jest.clearAllMocks()
})

it('play("llamatown") calls llamatown.start with volume 0.8', () => {
  manager.play('llamatown')
  expect(llamatown.start).toHaveBeenCalledWith(0.8)
})

it('play same track twice is a no-op', () => {
  manager.play('llamatown')
  manager.play('llamatown')
  expect(llamatown.start).toHaveBeenCalledTimes(1)
})

it('play new track stops previous theme first', () => {
  manager.play('llamatown')
  jest.clearAllMocks()
  manager.play('overworld')
  expect(llamatown.stop).toHaveBeenCalledTimes(1)
  expect(overworld.start).toHaveBeenCalledWith(0.8)
})

it('setMusicEnabled(false) stops current music', () => {
  manager.play('llamatown')
  jest.clearAllMocks()
  manager.setMusicEnabled(false)
  expect(llamatown.stop).toHaveBeenCalled()
})

it('play after setMusicEnabled(false) does not call theme.start', () => {
  manager.setMusicEnabled(false)
  manager.play('overworld')
  expect(overworld.start).not.toHaveBeenCalled()
})

it('stop() calls theme.stop on current theme', () => {
  manager.play('llamatown')
  jest.clearAllMocks()
  manager.stop()
  expect(llamatown.stop).toHaveBeenCalled()
})
