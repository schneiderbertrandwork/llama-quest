import { QBANK, getQuestionsForAct, getQuestionsForLesson } from '../qbank'

it('has exactly 25 lesson keys', () =>
  expect(Object.keys(QBANK)).toHaveLength(25))

it('each lesson has exactly 4 questions', () => {
  for (const [id, qs] of Object.entries(QBANK)) {
    expect(qs).toHaveLength(4)
  }
})

it('all correct indices are 0–3', () => {
  for (const qs of Object.values(QBANK).flat()) {
    expect([0, 1, 2, 3]).toContain(qs.c)
  }
})

it('getQuestionsForAct(1) returns 24 questions (6 lessons × 4)', () =>
  expect(getQuestionsForAct(1)).toHaveLength(24))

it('getQuestionsForLesson("oll-intro") returns 4 questions', () =>
  expect(getQuestionsForLesson('oll-intro')).toHaveLength(4))
