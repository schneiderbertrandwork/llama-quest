import { SANDBOXES, getSandboxDef } from '../sandboxes'

it('has exactly 5 sandboxes', () => expect(Object.keys(SANDBOXES)).toHaveLength(5))

it('getSandboxDef("firstchat") has 4 objectives', () =>
  expect(getSandboxDef('firstchat').objectives).toHaveLength(4))

it('getSandboxDef("collection") has 6 objectives', () =>
  expect(getSandboxDef('collection').objectives).toHaveLength(6))
