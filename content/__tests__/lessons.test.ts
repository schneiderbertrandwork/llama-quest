import { LESSONS, getLessonsForAct, getLessonById } from '../lessons'

it('total lessons is 25', () => expect(LESSONS).toHaveLength(25))
it('Act I has 6 lessons', () => expect(getLessonsForAct(1)).toHaveLength(6))
it('Act II has 8 lessons', () => expect(getLessonsForAct(2)).toHaveLength(8))
it('Act III has 8 lessons', () => expect(getLessonsForAct(3)).toHaveLength(8))
it('Act IV has 3 lessons', () => expect(getLessonsForAct(4)).toHaveLength(3))
it('getLessonById("oll-modelfile") exists with act 2', () =>
  expect(getLessonById('oll-modelfile')?.act).toBe(2))
it('all lesson ids are unique', () => {
  const ids = LESSONS.map(l => l.id)
  expect(new Set(ids).size).toBe(ids.length)
})
