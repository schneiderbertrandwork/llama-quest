import * as llamatown from '../themes/llamatown'
import * as overworld from '../themes/overworld'
import * as forge from '../themes/forge'
import * as caverns from '../themes/caverns'
import * as convergence from '../themes/convergence'
import * as battle from '../themes/battle'

const themes = { llamatown, overworld, forge, caverns, convergence, battle }

for (const [name, theme] of Object.entries(themes)) {
  it(`${name} exports a start function`, () => {
    expect(typeof theme.start).toBe('function')
  })
  it(`${name} exports a stop function`, () => {
    expect(typeof theme.stop).toBe('function')
  })
  it(`${name}.start(0.8) does not throw`, () => {
    expect(() => theme.start(0.8)).not.toThrow()
  })
  it(`${name}.stop() does not throw`, () => {
    expect(() => theme.stop()).not.toThrow()
  })
}
