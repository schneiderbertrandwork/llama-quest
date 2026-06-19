### Task 1: QBANK Migration

**Files:**
- Create: `content/qbank.ts`
- Create: `content/__tests__/qbank.test.ts`

**Interfaces:**
- Produces:
  - `QuizQuestion` — `{ q, a, c, why, lessonId }`
  - `QBank` — `Record<string, QuizQuestion[]>` keyed by lesson id
  - `QBANK` — the full bank constant
  - `getQuestionsForAct(act: 1|2|3|4): QuizQuestion[]`
  - `getQuestionsForLesson(lessonId: string): QuizQuestion[]`

- [ ] **Step 1: Write the failing tests**

```typescript
// content/__tests__/qbank.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- content/__tests__/qbank.test.ts --watchAll=false
```
Expected: Cannot find module `'../qbank'`

- [ ] **Step 3: Create `content/qbank.ts`**

The source is `localhost-quest.html`. Search for `const QBANK={}` (line 1319) and read through line 1476 — that covers all 25 lesson blocks. Each source block looks like:

```javascript
QBANK['oll-intro']=[
  {q:"Question?", a:["A","B","C","D"], c:0, why:"Explanation."},
  ...
]
```

Transcribe every block into TypeScript, adding `lessonId` to every question. The complete file structure:

```typescript
// content/qbank.ts
export interface QuizQuestion {
  q: string
  a: [string, string, string, string]
  c: 0 | 1 | 2 | 3
  why: string
  lessonId: string
}

export type QBank = Record<string, QuizQuestion[]>

// Act-to-lesson mapping — used by getQuestionsForAct
const ACT_LESSONS: Record<1 | 2 | 3 | 4, string[]> = {
  1: ['oll-intro', 'oll-install', 'oll-run', 'oll-manage', 'oll-models', 'oll-params'],
  2: ['oll-modelfile', 'oll-api', 'oll-openai', 'oll-structured', 'oll-tools', 'oll-multimodal', 'oll-embed', 'oll-ops'],
  3: ['chr-vectors', 'chr-intro', 'chr-collections', 'chr-add', 'chr-query', 'chr-filter', 'chr-ef', 'chr-persist'],
  4: ['rag-concept', 'rag-build', 'rag-prod'],
}

export const QBANK: QBank = {
  'oll-intro': [
    { q: "Which best describes what Ollama is?", a: ["A tool to download, manage, and run LLMs locally", "A paid cloud LLM API", "A Python web framework", "A spreadsheet plugin"], c: 0, why: "Ollama packages and runs models **on your own machine** — no cloud required.", lessonId: 'oll-intro' },
    { q: 'Ollama is often called the "_____ of LLMs."', a: ["Docker", "Git", "Excel", "Photoshop"], c: 0, why: "Like Docker bundles apps, Ollama bundles a model's weights, config, and prompt template into one pullable package.", lessonId: 'oll-intro' },
    { q: "Which is a real advantage of running models locally?", a: ["Your prompts and data never leave the machine", "It is always faster than any cloud GPU", "It needs no disk space", "It removes the need for a model"], c: 0, why: "**Privacy** is the headline benefit: nothing is sent to a third party.", lessonId: 'oll-intro' },
    { q: "The local AI stack is three parts: the server, the models on disk, and…", a: ["the clients that talk to the server", "a cloud account", "a GPU vendor login", "an internet connection"], c: 0, why: "Clients (CLI, your app, ChromaDB) all speak to the one local server.", lessonId: 'oll-intro' },
  ],
  // Transcribe all remaining 24 lessons from localhost-quest.html lines 1327–1476
  // Each lesson key must have exactly 4 questions.
  // Add `lessonId: '<key>'` to every question object.
  // Lesson keys in order: oll-install, oll-run, oll-manage, oll-models, oll-params,
  //   oll-modelfile, oll-api, oll-openai, oll-structured, oll-tools, oll-multimodal,
  //   oll-embed, oll-ops,
  //   chr-vectors, chr-intro, chr-collections, chr-add, chr-query, chr-filter, chr-ef, chr-persist,
  //   rag-concept, rag-build, rag-prod
}

export function getQuestionsForAct(act: 1 | 2 | 3 | 4): QuizQuestion[] {
  const lessonIds = ACT_LESSONS[act] ?? []
  return lessonIds.flatMap(id => QBANK[id] ?? [])
}

export function getQuestionsForLesson(lessonId: string): QuizQuestion[] {
  return QBANK[lessonId] ?? []
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- content/__tests__/qbank.test.ts --watchAll=false
```
Expected: 5 passing

- [ ] **Step 5: TypeScript check**

```
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 6: Commit**

```
git add content/qbank.ts content/__tests__/qbank.test.ts
git commit -m "feat: migrate QBANK — 100 quiz questions for 25 lessons"
```

---

