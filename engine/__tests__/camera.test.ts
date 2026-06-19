import { followEntity, clampCamera } from '../camera'
import { makePlayer } from '../entity'

describe('followEntity', () => {
  it('centers camera on entity', () => {
    const player = makePlayer(5, 5)
    const cam = followEntity(player, 32, 320, 240)
    expect(cam.x).toBe(0)
    expect(cam.y).toBe(40)
  })
})

describe('clampCamera', () => {
  it('prevents camera from going negative', () => {
    const cam = { x: -50, y: -50 }
    const clamped = clampCamera(cam, 32, 20, 15, 320, 240)
    expect(clamped.x).toBe(0)
    expect(clamped.y).toBe(0)
  })

  it('clamps to max bounds', () => {
    const cam = { x: 9999, y: 9999 }
    // World: 20*32=640 wide, screen 320 wide; maxX = 640-320 = 320
    // World: 15*32=480 tall, screen 240 tall; maxY = 480-240 = 240
    const clamped = clampCamera(cam, 32, 20, 15, 320, 240)
    expect(clamped.x).toBe(320)
    expect(clamped.y).toBe(240)
  })
})
