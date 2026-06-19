# Phase 3 — Content Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add all 19 remaining lessons (Acts II–IV), 5 remaining diagrams, sandbox definitions, a simulated terminal component, and a sandbox screen — completing the full in-game curriculum.

**Architecture:** Content files are pure TypeScript data (no React). Terminal is a self-contained React Native component with regex-based command recognition. The sandbox screen integrates both and routes into the existing city screen via a new `sandbox_portal` entity type.

**Tech Stack:** React Native views, TypeScript data files, expo-router navigation, zustand store actions.

## Global Constraints

- Expo SDK 52 managed workflow; no ejecting
- TypeScript strict with `noUncheckedIndexedAccess: true`; all array/object index access uses `?? fallback`
- `--legacy-peer-deps` required for all `npm install` calls
- No arbitrary colors — pull from established palette in `components/HUD.tsx` and `renderer/TilemapRenderer.tsx`
- Entity IDs kebab-case; lesson IDs `<tech>-<concept>`
- Save key `'llama_quest_v1'` — never change
- TDD: write failing test first → implement minimal code → confirm green → commit
- `Record<string, boolean>` for all progression tracking
- Constants: `TILE_SIZE = 32`, `PLAYER_SPEED = 4`, `MAX_DT = 0.05`
- `XP_PER_LEVEL = 120`; XP rewards: lesson read +20, NPC met +8, correct quiz +5, concept mastered +40, boss defeated +100, sandbox completed +15

---

## File Map

### Created
| File | Responsibility |
|------|----------------|
| `content/__tests__/lessons.test.ts` | 7 structural tests (act counts, total, uniqueness) |
| `content/sandboxes.ts` | 5 sandbox project definitions + `getSandboxDef` |
| `content/__tests__/sandboxes.test.ts` | 3 structural tests |
| `components/Terminal.tsx` | Simulated bash/Python REPL with objectives panel |
| `components/__tests__/Terminal.test.tsx` | Command recognition + objective callback tests |
| `app/sandbox/[id].tsx` | Sandbox screen (Terminal + objective tracking) |

### Modified
| File | Change |
|------|--------|
| `content/lessons.ts` | Append 19 lessons (Act II: 8, Act III: 8, Act IV: 3) |
| `content/diagrams.ts` | Add 5 remaining diagrams (vectorspace, distance, collection, ragpipe, stack) |
| `engine/entity.ts` | Add `'sandbox_portal'` to EntityType union + `makeSandboxPortal` factory |
| `store/game-store.ts` | Add `markSandboxCompleted(sandboxId: string)` action |
| `store/__tests__/game-store.test.ts` | 2 tests for new action |
| `content/world-data.ts` | Add `firstchat` sandbox portal entity to LLAMATOWN |
| `app/city/[id].tsx` | Handle `sandbox_portal` in `handleInteract` + `interactLabel` |

---

### Task 1: Migrate Acts II–IV Lessons

**Files:**
- Modify: `content/lessons.ts`
- Create: `content/__tests__/lessons.test.ts`

**Interfaces:**
- Consumes: existing `BlockType`, `Lesson` types and `LESSONS` array from `content/lessons.ts`
- Produces: 19 additional Lesson objects in the LESSONS array; existing `getLessonsForAct` and `getLessonById` work unchanged

- [ ] **Step 1: Write the failing tests**

```typescript
// content/__tests__/lessons.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- content/__tests__/lessons.test.ts --watchAll=false
```
Expected: 4 tests fail (`LESSONS.toHaveLength(25)`, act II/III/IV counts, `getLessonById` returns undefined)

- [ ] **Step 3: Append Act II lessons to `content/lessons.ts`**

Add the following block at the end of the `LESSONS` array, before the closing `]`. Each lesson object must match the `Lesson` interface exactly. Source: `localhost-quest.html` lines 718–847.

```typescript
  // ── ACT II ────────────────────────────────────────────────────────
  {
    id: 'oll-modelfile',
    act: 2,
    idx: 7,
    title: 'Modelfiles: Custom Models',
    lede: 'Forge your own model variants with a personality, baked-in settings, and a system prompt.',
    body: [
      { p: 'A **Modelfile** is a small recipe — very much like a Dockerfile — that builds a customized model from an existing base. You set a system prompt, lock in parameters, and register it as a new named model.' },
      { diagram: 'modelfile' },
      { h2: 'The directives' },
      { ul: [
        '`FROM` — the base model (required), e.g. `FROM llama3.2`.',
        '`SYSTEM` — the system prompt that defines the model\'s role and rules.',
        '`PARAMETER` — defaults like `temperature`, `num_ctx`, `stop` sequences.',
        '`TEMPLATE` — the raw prompt template (advanced; controls how messages are formatted).',
        '`MESSAGE` — seed example turns for few-shot behavior.',
        '`ADAPTER` — attach a LoRA fine-tuning adapter. `LICENSE` — embed a license string.',
      ]},
      { h2: 'Build one' },
      { code: { lang: 'docker', c: '# File: Modelfile\nFROM llama3.2\n\nPARAMETER temperature 0.3\nPARAMETER num_ctx 8192\n\nSYSTEM """\nYou are a senior Python backend engineer.\nAnswer with concise code snippets and brief explanations only.\n"""' } },
      { code: { lang: 'bash', c: '# Register it, then run it like any other model\nollama create py-mentor -f Modelfile\nollama run py-mentor' } },
      { tip: 'Use `ollama show <model>` to view the Modelfile of any model you\'ve pulled — a great way to learn good system prompts and templates from the pros.' },
      { note: 'A Modelfile doesn\'t copy the weights — it layers your config on top of the base model, so custom variants are cheap to create.' },
    ],
  },
  {
    id: 'oll-api',
    act: 2,
    idx: 8,
    title: 'The REST API',
    lede: 'Everything the CLI does, your code can do too — over plain HTTP on port 11434.',
    body: [
      { p: 'The Ollama server exposes a REST API at `http://localhost:11434`. All endpoints take JSON. The two you\'ll use constantly are `/api/generate` (single prompt) and `/api/chat` (a conversation).' },
      { diagram: 'reqflow' },
      { h2: '/api/generate — one prompt, one completion' },
      { code: { lang: 'bash', c: 'curl http://localhost:11434/api/generate -d \'{\n  "model": "llama3.2",\n  "prompt": "Why is the sky blue? One sentence.",\n  "stream": false\n}\'' } },
      { h2: '/api/chat — multi-turn with roles' },
      { p: 'Send a `messages` array with `role` (`system`, `user`, `assistant`) and `content`. To continue a conversation, append the model\'s reply and the next user turn, then send the whole array again — the server is stateless, so **you** hold the history.' },
      { code: { lang: 'bash', c: 'curl http://localhost:11434/api/chat -d \'{\n  "model": "llama3.2",\n  "stream": false,\n  "messages": [\n    {"role": "system", "content": "You are concise."},\n    {"role": "user", "content": "Define a vector embedding."}\n  ]\n}\'' } },
      { h2: 'Streaming' },
      { p: 'By default `stream` is **true**: the server sends newline-delimited JSON objects, one token chunk at a time — great for typewriter UIs. Set `"stream": false` to get a single complete JSON object instead.' },
      { ul: [
        'Set per-request options under an `options` key: `"options": {"temperature": 0, "num_ctx": 8192}`.',
        'Other endpoints: `/api/tags` (list), `/api/ps` (loaded), `/api/show`, `/api/pull`, `/api/create`, `/api/copy`, `/api/delete`, `/api/embed`.',
      ]},
      { tip: 'The response includes timing fields in nanoseconds (`total_duration`, `load_duration`) and token counts (`prompt_eval_count`, `eval_count`) — useful for measuring performance.' },
    ],
  },
  {
    id: 'oll-openai',
    act: 2,
    idx: 9,
    title: 'OpenAI Compatibility & SDKs',
    lede: 'Drop Ollama into any app that already speaks OpenAI — or use the first-party libraries.',
    body: [
      { h2: 'The OpenAI-compatible endpoint' },
      { p: 'Ollama mirrors the OpenAI API at `/v1`. Point any OpenAI client at `http://localhost:11434/v1`, pass any non-empty string as the key, and existing code just works — locally and for free.' },
      { code: { lang: 'python', c: 'from openai import OpenAI\n\nclient = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")\n\nresp = client.chat.completions.create(\n    model="llama3.2",\n    messages=[{"role": "user", "content": "Hello!"}],\n)\nprint(resp.choices[0].message.content)' } },
      { p: 'Supported compatible routes include `/v1/chat/completions`, `/v1/embeddings`, and `/v1/models`. Ollama also ships an Anthropic-compatible layer.' },
      { h2: 'The native Python library' },
      { code: { lang: 'bash', c: 'pip install ollama' } },
      { code: { lang: 'python', c: 'import ollama\n\n# Chat\nresp = ollama.chat(model="llama3.2",\n    messages=[{"role": "user", "content": "Why is the sky blue?"}])\nprint(resp.message.content)\n\n# Single completion\nprint(ollama.generate(model="llama3.2", prompt="Hello").response)\n\n# Point at a remote host\nfrom ollama import Client\nclient = Client(host="http://192.168.1.50:11434")' } },
      { note: 'There\'s a matching JavaScript library (`npm i ollama`) with the same shape: `ollama.chat({ model, messages })`. Both support async clients and streaming.' },
      { tip: '**When to use which?** Use the OpenAI-compatible API to reuse existing tooling and frameworks; use the native `ollama` library for the cleanest access to Ollama-specific features like `format`, `think`, and model management.' },
    ],
  },
  {
    id: 'oll-structured',
    act: 2,
    idx: 10,
    title: 'Structured Outputs',
    lede: 'Force the model to return valid JSON that matches a schema you define — reliably parseable, every time.',
    body: [
      { p: 'Free-form text is hard to parse. **Structured outputs** constrain a model\'s response to a JSON schema you provide, so you can extract data, describe images, or feed downstream code without brittle string parsing.' },
      { h2: 'Pass a schema in the `format` field' },
      { code: { lang: 'bash', c: 'curl -X POST http://localhost:11434/api/chat -d \'{\n  "model": "llama3.2",\n  "stream": false,\n  "messages": [{"role": "user", "content": "Tell me about Canada."}],\n  "format": {\n    "type": "object",\n    "properties": {\n      "name":      {"type": "string"},\n      "capital":   {"type": "string"},\n      "languages": {"type": "array", "items": {"type": "string"}}\n    },\n    "required": ["name", "capital", "languages"]\n  }\n}\'' } },
      { p: 'The reply\'s content is now guaranteed to match the schema, e.g. `{"name":"Canada","capital":"Ottawa","languages":["English","French"]}`. Passing `"format": "json"` (the string) enables looser JSON mode without a fixed shape.' },
      { h2: 'In Python with Pydantic (recommended)' },
      { code: { lang: 'python', c: 'from ollama import chat\nfrom pydantic import BaseModel\n\nclass Country(BaseModel):\n    name: str\n    capital: str\n    languages: list[str]\n\nresp = chat(model="llama3.2",\n    messages=[{"role": "user", "content": "Tell me about Canada."}],\n    format=Country.model_json_schema())\n\ncountry = Country.model_validate_json(resp.message.content)\nprint(country)' } },
      { tip: 'Also restate "return the answer as JSON" in the prompt itself. Grounding the model with the schema in words alongside the `format` field improves reliability.' },
      { prism: 'Structured outputs pair beautifully with **vision models** (extract fields from an invoice image) and with the **tool calling** you\'ll learn next.' },
    ],
  },
  {
    id: 'oll-tools',
    act: 2,
    idx: 11,
    title: 'Tool Calling',
    lede: 'Let the model call your functions — fetch weather, query a database, run code — and use the results.',
    body: [
      { p: '**Tool calling** (function calling) lets a model decide to invoke functions you describe. You pass a `tools` array; the model either answers directly or returns a `tool_calls` list naming the function and its arguments. You run the function, send the result back, and the model continues.' },
      { diagram: 'toolloop' },
      { h2: 'Describe the tools' },
      { code: { lang: 'bash', c: 'curl http://localhost:11434/api/chat -d \'{\n  "model": "llama3.1",\n  "stream": false,\n  "messages": [{"role": "user", "content": "What is the weather in Nairobi?"}],\n  "tools": [{\n    "type": "function",\n    "function": {\n      "name": "get_weather",\n      "description": "Get current weather for a city",\n      "parameters": {\n        "type": "object",\n        "properties": {"city": {"type": "string"}},\n        "required": ["city"]\n      }\n    }\n  }]\n}\'' } },
      { h2: 'The loop' },
      { ul: [
        '1. Model returns `tool_calls: [{ function: { name: "get_weather", arguments: { city: "Nairobi" } } }]`.',
        '2. **You** execute `get_weather("Nairobi")` in your own code.',
        '3. Append a message with `role: "tool"` containing the result.',
        '4. Send the conversation back; the model now answers using the real data.',
      ]},
      { note: 'Tool calling needs a tool-capable model. Examples include Llama 3.1+, Qwen 2.5 / Qwen 3, Mistral, and others. The model only *chooses* tools — your code always does the actual work.' },
      { warn: 'Never blindly execute model-chosen actions with side effects (deleting files, sending money). Validate arguments and gate dangerous tools behind your own checks.' },
    ],
  },
  {
    id: 'oll-multimodal',
    act: 2,
    idx: 12,
    title: 'Vision & Reasoning Models',
    lede: 'Send images to multimodal models, and let reasoning models think before they answer.',
    body: [
      { h2: 'Vision: send an image' },
      { p: 'Multimodal models such as **gemma3** and **llava** accept images. From the CLI, just put the image path in your prompt:' },
      { code: { lang: 'bash', c: 'ollama run gemma3 "What is in this image? /home/you/screenshot.png"' } },
      { p: 'Over the API, pass images as an array of **base64-encoded** strings on the message:' },
      { code: { lang: 'python', c: 'import ollama\nresp = ollama.chat(model="gemma3", messages=[{\n    "role": "user",\n    "content": "Describe this image.",\n    "images": ["./photo.jpg"],   # path or base64; the lib handles encoding\n}])\nprint(resp.message.content)' } },
      { h2: 'Reasoning models think first' },
      { p: 'Reasoning models (e.g. **gpt-oss**, **deepseek-r1**) produce an internal chain of thought before the final answer. Control it with the `think` parameter:' },
      { code: { lang: 'python', c: 'resp = ollama.chat(model="gpt-oss",\n    messages=[{"role": "user", "content": "Solve 17 * 23 step by step."}],\n    think=True)\nprint(resp.message.thinking)  # the reasoning\nprint(resp.message.content)   # the answer' } },
      { tip: 'Combine capabilities: a vision model with **structured outputs** can read a receipt image and return clean JSON line items. A reasoning model with **tools** can plan multi-step actions.' },
      { note: 'Vision and reasoning are detected from the model\'s metadata and template — Ollama enables the right behavior automatically when the model supports it.' },
    ],
  },
  {
    id: 'oll-embed',
    act: 2,
    idx: 13,
    title: 'Embeddings',
    lede: 'Turn text into vectors of meaning — the bridge from Ollama to vector search and RAG.',
    body: [
      { p: 'An **embedding** is a list of numbers (a vector) that captures the *meaning* of a piece of text. Texts with similar meaning produce vectors that sit close together in space. This is the foundation of semantic search and Retrieval-Augmented Generation.' },
      { diagram: 'embed' },
      { h2: 'Pull an embedding model' },
      { p: 'Use a model trained specifically for embeddings — they\'re small, fast, and produce compact vectors:' },
      { code: { lang: 'bash', c: 'ollama pull nomic-embed-text     # 768 dimensions, strong + fast\nollama pull mxbai-embed-large    # 1024 dimensions, broad coverage' } },
      { h2: 'Generate a vector' },
      { code: { lang: 'bash', c: 'curl http://localhost:11434/api/embed -d \'{\n  "model": "nomic-embed-text",\n  "input": "The sky is blue because of Rayleigh scattering"\n}\'' } },
      { code: { lang: 'python', c: 'import ollama\n\nresp = ollama.embed(model="nomic-embed-text",\n                    input="The sky is blue because of Rayleigh scattering")\nprint(resp.embeddings)   # list of vectors (one per input)' } },
      { note: '`/api/embed` (and `ollama.embed`) is the current endpoint and accepts a single string **or a list** of strings, returning `embeddings`. The older `/api/embeddings` / `ollama.embeddings(prompt=...)` returns one vector under `embedding` — you\'ll still see it in tutorials.' },
      { warn: '**Use a real embedding model, not a chat model.** A chat model like llama3 can technically embed, but the vectors are huge (4096+ dims) and worse for search. `nomic-embed-text` gives better results at a fraction of the size.' },
      { prism: 'A vector alone isn\'t useful — you need somewhere to store thousands of them and search by similarity. That\'s exactly what **ChromaDB** is for. Onward to the Prism Caverns.' },
    ],
  },
  {
    id: 'oll-ops',
    act: 2,
    idx: 14,
    title: 'Operations & Performance',
    lede: 'Keep models warm, serve many requests, run in Docker, and expose Ollama safely on a network.',
    body: [
      { h2: 'Keep models loaded (or not)' },
      { p: 'Loading a model into memory takes time. The `keep_alive` setting controls how long it stays resident after a request:' },
      { ul: [
        '`OLLAMA_KEEP_ALIVE=5m` — default; unload after 5 minutes idle.',
        '`keep_alive: 0` on a request — unload immediately after responding (free VRAM fast).',
        '`keep_alive: -1` — keep the model loaded indefinitely (a warm, always-ready server).',
      ]},
      { h2: 'Serve concurrent requests' },
      { code: { lang: 'bash', c: 'OLLAMA_NUM_PARALLEL=4      # handle 4 requests at once\nOLLAMA_FLASH_ATTENTION=1   # faster attention on supported GPUs\nOLLAMA_GPU_OVERHEAD=...    # reserve VRAM for the OS (bytes)' } },
      { p: 'On Linux, set these in a systemd override so they persist:' },
      { code: { lang: 'bash', c: '# /etc/systemd/system/ollama.service.d/override.conf\n[Service]\nEnvironment="OLLAMA_HOST=0.0.0.0:11434"\nEnvironment="OLLAMA_NUM_PARALLEL=4"\nEnvironment="OLLAMA_FLASH_ATTENTION=1"' } },
      { h2: 'Expose on a network' },
      { p: 'By default Ollama binds to `127.0.0.1` (local only). Set `OLLAMA_HOST=0.0.0.0:11434` to accept connections from other machines.' },
      { warn: 'Binding to `0.0.0.0` puts an **unauthenticated** API on your network. Only do it on a trusted LAN, and put it behind a firewall or reverse proxy with auth before anything touches the public internet.' },
      { tip: 'In Docker, mount a volume so models survive restarts: `-v ollama:/root/.ollama`. Without it, every `docker rm` deletes your downloaded models.' },
      { note: 'Cloud models (`model:cloud`) let you run very large models on Ollama\'s infrastructure after `ollama signin`, while keeping the same CLI and API. Useful when a model is too big for local hardware.' },
    ],
  },
  // ── ACT III ───────────────────────────────────────────────────────
  {
    id: 'chr-vectors',
    act: 3,
    idx: 15,
    title: 'Vectors & Vector Space',
    lede: 'Meaning as geometry: how embeddings turn words into points you can measure the distance between.',
    body: [
      { p: 'You met embeddings with Ollama. Now the key intuition: an embedding places a piece of text as a **point in a high-dimensional space**. The clever part is that *meaning becomes position* — "cat" and "kitten" land near each other, while "cat" and "spreadsheet" are far apart.' },
      { diagram: 'vectorspace' },
      { h2: 'Why this is powerful' },
      { p: 'Traditional search matches keywords. If you search "automobile" it misses a document that only says "car." **Semantic search** compares *meaning*: the query and the documents are embedded into the same space, and you return the nearest neighbors — regardless of exact words.' },
      { h2: 'Measuring closeness' },
      { ul: [
        '**Cosine similarity** — the angle between two vectors. Direction matters, length doesn\'t. The most common choice for text.',
        '**L2 (Euclidean)** — straight-line distance between points.',
        '**Inner product (ip)** — a dot-product measure, often used with normalized vectors.',
      ]},
      { diagram: 'distance' },
      { note: 'Most systems report a **distance**, where *smaller means more similar*. Keep that straight: a result with distance 0.1 is closer (better) than one with distance 0.6.' },
      { prism: 'A vector database stores millions of these points and finds nearest neighbors in milliseconds using an index (Chroma uses **HNSW**). That\'s the next lesson.' },
    ],
  },
  {
    id: 'chr-intro',
    act: 3,
    idx: 16,
    title: 'Meet ChromaDB',
    lede: 'An open-source vector database that\'s a single pip install — perfect for local, privacy-first AI.',
    body: [
      { p: '**ChromaDB** stores embeddings together with their original documents and metadata, and lets you query by semantic similarity. It\'s lightweight, embeddable, and pairs naturally with Ollama for a fully local stack.' },
      { h2: 'Install' },
      { code: { lang: 'bash', c: 'pip install chromadb' } },
      { h2: 'The four client modes' },
      { p: 'How you create the client decides where data lives:' },
      { code: { lang: 'python', c: 'import chromadb\n\n# 1) In-memory — fast, disposable. Great for tests/prototyping.\nclient = chromadb.Client()              # (or EphemeralClient())\n\n# 2) Persistent — saved to disk, survives restarts. Your daily driver.\nclient = chromadb.PersistentClient(path="./chroma_db")\n\n# 3) Client/server — talk to a running Chroma server over HTTP.\nclient = chromadb.HttpClient(host="localhost", port=8000)\n\n# 4) Chroma Cloud — managed hosting.\n# client = chromadb.CloudClient(api_key=..., tenant=..., database=...)' } },
      { ul: [
        '**In-memory** — data vanishes when the process ends.',
        '**Persistent** — writes to the given directory automatically; use this for anything you want to keep.',
        '**Http** — multiple processes share one database; the production shape.',
      ]},
      { warn: 'There are two Python packages: install **`chromadb`** for local/embedded use. The slimmer `chromadb-client` is only for talking to a remote server and lacks local dependencies — don\'t mix them.' },
      { note: 'Chroma also has SDKs for JavaScript/TypeScript, Rust, Go, Java, and more — the concepts (collections, add, query) are identical across them.' },
    ],
  },
  {
    id: 'chr-collections',
    act: 3,
    idx: 17,
    title: 'Collections',
    lede: 'The fundamental unit of storage — like a table in a database, holding vectors of one shape.',
    body: [
      { p: 'A **collection** groups related embeddings. It\'s the equivalent of a table (or an index). Each collection holds vectors of the **same dimensionality** along with their documents and metadata.' },
      { diagram: 'collection' },
      { h2: 'Create, get, or both' },
      { code: { lang: 'python', c: '# Create (errors if it already exists)\ncol = client.create_collection("docs")\n\n# Get an existing one\ncol = client.get_collection("docs")\n\n# Get it, or create it if missing — the convenient default\ncol = client.get_or_create_collection("docs")\n\nclient.list_collections()        # all collections\nclient.delete_collection("docs") # remove one' } },
      { h2: 'Choosing the distance metric' },
      { p: 'Set the similarity space at creation time via metadata. Valid values are `l2` (default), `ip`, and `cosine`:' },
      { code: { lang: 'python', c: 'col = client.create_collection(\n    name="docs",\n    metadata={"hnsw:space": "cosine"},   # recommended for text\n)' } },
      { h2: 'Naming rules' },
      { ul: [
        '3–512 characters long.',
        'Start and end with a lowercase letter or a digit.',
        'May contain dots, dashes, and underscores in between.',
        'No two consecutive dots, and not a valid IP address.',
      ]},
      { tip: 'Pick the distance metric deliberately and never change it on an existing collection. For most text/RAG work, `cosine` is the right default.' },
    ],
  },
  {
    id: 'chr-add',
    act: 3,
    idx: 18,
    title: 'Adding Documents',
    lede: 'Put data in: Chroma can embed text for you automatically, or you can supply your own vectors.',
    body: [
      { p: 'The `add` method takes parallel lists: `documents`, optional `metadatas`, and required unique `ids`. If you don\'t supply embeddings, Chroma embeds the documents for you using the collection\'s **embedding function**.' },
      { code: { lang: 'python', c: 'col.add(\n    documents=[\n        "Python is a high-level programming language.",\n        "ChromaDB is an open-source vector database.",\n        "Claude is an AI assistant built by Anthropic.",\n    ],\n    metadatas=[{"topic": "lang"}, {"topic": "db"}, {"topic": "ai"}],\n    ids=["doc1", "doc2", "doc3"],   # must be unique within the collection\n)\nprint(col.count())   # 3' } },
      { h2: 'The default embedding function' },
      { p: 'Out of the box, Chroma uses **Sentence Transformers (`all-MiniLM-L6-v2`)**, which produces **384-dimensional** vectors — no API key, runs locally. (Soon you\'ll swap this for an Ollama-powered function.)' },
      { h2: 'Supplying your own embeddings' },
      { p: 'If you generate vectors elsewhere (e.g. with Ollama), pass them directly and Chroma won\'t embed anything itself:' },
      { code: { lang: 'python', c: 'col.add(\n    ids=["a", "b"],\n    documents=["first chunk", "second chunk"],\n    embeddings=[[0.12, -0.04, ...], [0.31, 0.08, ...]],  # your vectors\n    metadatas=[{"src": "notes"}, {"src": "notes"}],\n)' } },
      { warn: '**Every vector in a collection must have the same dimension.** Mixing a 768-dim Ollama vector into a 384-dim collection raises an `InvalidDimensionException`. One collection = one embedding model.' },
      { tip: '`add` takes lists, so batch your inserts. Calling `add` in a tight loop for thousands of docs is slow — build the lists and add in batches instead. Re-adding the same `id` keeps the original and ignores the new value (use `upsert` to overwrite).' },
    ],
  },
  {
    id: 'chr-query',
    act: 3,
    idx: 19,
    title: 'Querying & Managing Data',
    lede: 'Search by similarity, fetch by id, and update or delete — the full read/write surface.',
    body: [
      { h2: 'Semantic search with query()' },
      { p: 'Pass `query_texts` (Chroma embeds them with the collection\'s function) and `n_results`. You get back the closest matches per query, in order, with their distances:' },
      { code: { lang: 'python', c: 'res = col.query(\n    query_texts=["What is a vector database?"],\n    n_results=2,\n)\nfor doc, dist in zip(res["documents"][0], res["distances"][0]):\n    print(f"[{dist:.3f}] {doc}")\n# [0.31] ChromaDB is an open-source vector database.\n# [0.58] Python is a high-level programming language.' } },
      { p: 'Results are nested one level per query (you can pass several at once), so `res["documents"][0]` is the list for your first query. You can also query by `query_embeddings` if you already have vectors.' },
      { h2: 'Get, count, update, delete' },
      { code: { lang: 'python', c: 'col.get(ids=["doc1", "doc2"])          # fetch specific records\ncol.get(limit=10, offset=0)            # page through everything\ncol.count()                            # how many records\n\ncol.update(ids=["doc1"], documents=["updated text"])\ncol.upsert(ids=["doc9"], documents=["insert or overwrite"])\ncol.delete(ids=["doc3"])               # remove by id (or by filter)' } },
      { h2: 'Control what comes back' },
      { p: 'Use `include` to choose fields and keep payloads small — e.g. `include=["documents", "metadatas", "distances"]`. (Embeddings are large, so they\'re often excluded.)' },
      { note: 'Distances depend on the collection\'s metric. With cosine/L2, **lower is closer**. The exact numbers aren\'t meaningful on their own — use them to *rank* results.' },
    ],
  },
  {
    id: 'chr-filter',
    act: 3,
    idx: 20,
    title: 'Metadata Filtering',
    lede: 'Combine semantic search with precise filters on metadata and document text — the secret to good retrieval.',
    body: [
      { p: 'Pure similarity search can drift off-topic. Filters narrow the candidate set *before* ranking, so a query about Python auth code won\'t return TypeScript tests that merely mention "auth." Two filters exist: `where` (on metadata) and `where_document` (on the text itself).' },
      { h2: 'Filter on metadata with where' },
      { code: { lang: 'python', c: 'res = col.query(\n    query_texts=["tell me about a citrus fruit"],\n    n_results=3,\n    where={"category": "food"},        # only docs tagged category=food\n)' } },
      { p: 'Operators give you range and set logic:' },
      { ul: [
        '`$eq`, `$ne` — equals / not equals',
        '`$gt`, `$gte`, `$lt`, `$lte` — numeric comparisons',
        '`$in`, `$nin` — value in / not in a list',
        '`$and`, `$or` — combine conditions',
      ]},
      { code: { lang: 'python', c: 'where={\n  "$and": [\n    {"language": {"$eq": "python"}},\n    {"year":     {"$gte": 2023}},\n  ]\n}' } },
      { h2: 'Filter on document content with where_document' },
      { code: { lang: 'python', c: 'res = col.query(\n    query_texts=["AI assistant"],\n    n_results=3,\n    where_document={"$contains": "Anthropic"},   # text must contain this\n)' } },
      { tip: '**Use metadata aggressively.** Store fields like source, type, language, date, and section on every chunk, then filter by them. It\'s the single biggest lever for retrieval quality in real systems.' },
      { note: 'Plan your metadata schema before you ingest. Adding a useful field later means re-processing your documents.' },
    ],
  },
  {
    id: 'chr-ef',
    act: 3,
    idx: 21,
    title: 'Embedding Functions',
    lede: 'Swap the default embedder for one you control — including an Ollama-powered function.',
    body: [
      { p: 'An **embedding function (EF)** is what turns documents and queries into vectors. The collection remembers which EF it was created with, so the *same* function is used for both indexing and searching — automatically.' },
      { h2: 'The Ollama embedding function' },
      { p: 'Chroma ships a built-in wrapper around Ollama\'s embeddings API. This is the heart of a fully local stack — Ollama produces the vectors, Chroma stores and searches them:' },
      { code: { lang: 'python', c: 'import chromadb\nfrom chromadb.utils.embedding_functions import OllamaEmbeddingFunction\n\nollama_ef = OllamaEmbeddingFunction(\n    url="http://localhost:11434",\n    model_name="nomic-embed-text",\n)\n\nclient = chromadb.PersistentClient(path="./chroma_db")\ncol = client.get_or_create_collection(\n    name="local_docs",\n    embedding_function=ollama_ef,\n    metadata={"hnsw:space": "cosine"},\n)\n\n# Now add()/query() text and Ollama does the embedding for you\ncol.add(ids=["1"], documents=["Llamas are camelids related to vicunas."])\nprint(col.query(query_texts=["What family are llamas in?"], n_results=1))' } },
      { h2: 'Other built-in EFs' },
      { ul: [
        '`DefaultEmbeddingFunction` — Sentence Transformers `all-MiniLM-L6-v2` (384-dim, local, no key).',
        '`OpenAIEmbeddingFunction`, plus functions for HuggingFace, Google, Cohere, and others.',
        'You can write a **custom EF** by implementing a callable that takes a list of strings and returns a list of vectors.',
      ]},
      { warn: '**The embedding model must match between indexing and querying.** If you index with `nomic-embed-text` but query with `mxbai-embed-large`, the vectors live in different spaces and results are garbage. Changing the model means re-indexing everything.' },
      { note: 'In current Chroma, the EF is stored on the collection, so `get_collection` can resolve it for you. On older versions (pre-1.1.13) you had to pass the same EF every time you fetched the collection.' },
    ],
  },
  {
    id: 'chr-persist',
    act: 3,
    idx: 22,
    title: 'Persistence & Server Mode',
    lede: 'Keep data between runs, run Chroma as a shared server, and avoid the classic pitfalls.',
    body: [
      { h2: 'Where your data lives' },
      { p: '`PersistentClient(path="./chroma_db")` writes everything to that folder automatically — no explicit "save" call. Reopen with the same path and your collections are right where you left them. (With no path set, Chroma defaults to a `./chroma` directory.)' },
      { code: { lang: 'python', c: 'client = chromadb.PersistentClient(path="./chroma_db")\ncol = client.get_or_create_collection("docs")\n# ...add data, close the program, run again later — data is still here.' } },
      { h2: 'Run Chroma as a server' },
      { p: 'For multiple processes or a production deployment, run Chroma as an HTTP service and connect with `HttpClient`:' },
      { code: { lang: 'bash', c: 'chroma run --path ./chroma_db --port 8000' } },
      { code: { lang: 'python', c: 'client = chromadb.HttpClient(host="localhost", port=8000)\ncol = client.get_or_create_collection("docs")' } },
      { h2: 'Common pitfalls' },
      { ul: [
        '**Dimension mismatch** — `InvalidDimensionException` means you mixed embedding models. One collection, one model.',
        '**Lost data** — you used `Client()` (in-memory) instead of `PersistentClient`. Or, in Docker, you didn\'t mount a volume for the persist directory.',
        '**Slow inserts** — you called `add` per document. Batch instead.',
        '**Irrelevant results** — tune chunk size and use metadata filters; verify the same EF is used for index and query.',
      ]},
      { tip: 'Use `col.count()` to monitor size — Chroma comfortably handles millions of vectors on local disk. Start small, validate retrieval quality, then scale your corpus.' },
      { prism: 'You now have both halves: Ollama for inference and embeddings, ChromaDB for storage and search. Time to fuse them into a real application at **The Convergence**.' },
    ],
  },
  // ── ACT IV ────────────────────────────────────────────────────────
  {
    id: 'rag-concept',
    act: 4,
    idx: 23,
    title: 'What Is RAG?',
    lede: 'Retrieval-Augmented Generation: ground an LLM in your own documents to get accurate, current answers.',
    body: [
      { p: 'A raw LLM only knows what it was trained on — it can\'t see your PDFs, wiki, or codebase, and it may confidently make things up. **RAG** fixes this: when a question comes in, you first *retrieve* the most relevant chunks from a vector database, then pass those chunks **plus** the question to the model, which answers grounded in real content.' },
      { diagram: 'ragpipe' },
      { h2: 'The two phases' },
      { ul: [
        '**Indexing (once, ahead of time)** — split documents into chunks, embed each chunk, and store the vectors + text + metadata in Chroma.',
        '**Querying (every question)** — embed the question, retrieve the top-k nearest chunks, build a prompt that includes them as context, and generate the answer.',
      ]},
      { h2: 'Why it beats a bigger prompt' },
      { p: 'You can\'t paste a 500-page manual into the context window — it won\'t fit, and it\'s wasteful. RAG injects only the handful of passages that actually matter for *this* question, which is cheaper, faster, and reduces hallucination by giving the model something true to read.' },
      { h2: 'Chunking matters' },
      { ul: [
        'Too small (single lines) loses context; too large (whole files) dilutes the signal.',
        'For prose, ~500–1000 characters per chunk with ~100–200 characters of **overlap** is a solid start.',
        'Retrieve **k = 5** chunks by default; raise to 7–10 for complex questions, but watch the context limit.',
      ]},
      { note: 'RAG is the standard pattern for chatbots over support docs, internal knowledge bases, and proprietary data — and with Ollama + Chroma, you can build it entirely offline.' },
    ],
  },
  {
    id: 'rag-build',
    act: 4,
    idx: 24,
    title: 'Build a Local RAG System',
    lede: 'The full pipeline end to end: documents in, grounded answers out — all on your machine.',
    body: [
      { p: 'Here is a complete, minimal local RAG app: Ollama for both embeddings and generation, ChromaDB for the vector store. This is the capstone — read it slowly, then build it in the Sandbox.' },
      { diagram: 'stack' },
      { h2: '1. Setup' },
      { code: { lang: 'bash', c: 'pip install ollama chromadb\nollama pull nomic-embed-text   # embeddings\nollama pull llama3.2           # generation' } },
      { h2: '2. Index your documents' },
      { code: { lang: 'python', c: 'import ollama, chromadb\nfrom chromadb.utils.embedding_functions import OllamaEmbeddingFunction\n\nef = OllamaEmbeddingFunction(url="http://localhost:11434",\n                             model_name="nomic-embed-text")\nclient = chromadb.PersistentClient(path="./rag_db")\ncol = client.get_or_create_collection("kb", embedding_function=ef,\n                                      metadata={"hnsw:space": "cosine"})\n\ndocs = [\n  "Llamas are camelids, closely related to vicunas and camels.",\n  "Llamas were domesticated as pack animals ~5,000 years ago in Peru.",\n  "An adult llama can carry 25-30% of its body weight.",\n]\ncol.add(ids=[f"d{i}" for i in range(len(docs))], documents=docs)' } },
      { h2: '3. Retrieve + augment + generate' },
      { code: { lang: 'python', c: 'def ask(question, k=3):\n    # RETRIEVE: nearest chunks from Chroma\n    hits = col.query(query_texts=[question], n_results=k)\n    context = "\\n".join(hits["documents"][0])\n\n    # AUGMENT: build a grounded prompt\n    prompt = (\n        "Answer using ONLY the context. If it is not there, say you don\'t know.\\n\\n"\n        f"Context:\\n{context}\\n\\nQuestion: {question}"\n    )\n\n    # GENERATE: local LLM answers from the retrieved text\n    resp = ollama.chat(model="llama3.2",\n        messages=[{"role": "user", "content": prompt}])\n    return resp.message.content\n\nprint(ask("How much can a llama carry?"))' } },
      { tip: 'That\'s the whole pattern. Everything else — PDF loaders, smarter chunking, re-ranking, citations — is an upgrade on these three steps: retrieve, augment, generate.' },
      { warn: 'Embed your documents and your questions with the **same** model (`nomic-embed-text` here). Switching the embedding model on either side breaks retrieval.' },
    ],
  },
  {
    id: 'rag-prod',
    act: 4,
    idx: 25,
    title: 'Production & Tuning',
    lede: 'From a working demo to a system you can trust — evaluation, scaling, and the upgrades that matter.',
    body: [
      { h2: 'Make retrieval better (biggest wins first)' },
      { ul: [
        '**Tune chunk size & overlap** — try 500–1000 chars; if answers miss context, increase overlap.',
        '**Use metadata filters** — store source, type, date, section; filter before ranking to cut noise.',
        '**Tune k** — start at 5; too many chunks dilute relevance and may overflow the context window.',
        '**Add re-ranking** — retrieve 20, then re-score with a cross-encoder and keep the best 5 for a large quality jump.',
      ]},
      { h2: 'Evaluate, don\'t guess' },
      { p: 'Build a small set of question→expected-answer pairs and check retrieval and answer quality whenever you change the model, chunking, or k. "It felt better" is not a metric.' },
      { h2: 'Operational concerns' },
      { ul: [
        '**Re-index on model change** — a new embedding model means rebuilding the collection from scratch.',
        '**Persist & back up** — use `PersistentClient` (or a Chroma server) and back up the data directory.',
        '**Scale the database** — run Chroma in server mode for multiple clients; Chroma handles millions of vectors locally, but evaluate managed options for very large or multi-region needs.',
        '**Scale inference** — `OLLAMA_NUM_PARALLEL` and `keep_alive: -1` keep a warm model serving concurrent requests.',
      ]},
      { h2: 'Ground the model, reduce hallucination' },
      { ul: [
        'Instruct the model to answer **only** from the provided context and to say "I don\'t know" otherwise.',
        'Ask it to **cite** which chunk each claim came from (include chunk ids in the context).',
        'Lower the temperature for factual Q&A.',
      ]},
      { prism: 'You\'ve gone from "what is Ollama?" to a tunable, production-shaped, fully local RAG system. Master every node and the Skill Constellation is yours, Operator.' },
    ],
  },
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- content/__tests__/lessons.test.ts --watchAll=false
```
Expected: 7 passing

- [ ] **Step 5: TypeScript check**

```
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 6: Run full test suite to confirm no regressions**

```
npm test -- --watchAll=false
```
Expected: all 65 + 7 = 72 tests passing

- [ ] **Step 7: Commit**

```
git add content/lessons.ts content/__tests__/lessons.test.ts
git commit -m "feat: migrate Acts II–IV lessons — 19 lessons, 25 total"
```

---

### Task 2: Add 5 Remaining Diagrams

**Files:**
- Modify: `content/diagrams.ts`

**Interfaces:**
- Consumes: existing `DiagramDef` type from `content/diagrams.ts`
- Produces: 5 additional entries in DIAGRAMS (`vectorspace`, `distance`, `collection`, `ragpipe`, `stack`)
- Consumed by: Task 1 lessons via `{ diagram: 'vectorspace' }` block type in Codex

No tests needed — pure data validated by TypeScript. Source SVGs are in `localhost-quest.html` lines 1193–1308.

- [ ] **Step 1: Append the 5 diagram entries to `content/diagrams.ts`**

Append these entries inside the `DIAGRAMS` object, after the existing `embed` entry:

```typescript
  vectorspace: {
    key: 'vectorspace',
    caption: 'Meaning becomes geometry: related ideas land near each other.',
    svg: `<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vector space clusters">
<defs><radialGradient id="g_vs" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#a06bff"/><stop offset="1" stop-color="#5f4fd0"/></radialGradient></defs>
<rect x="20" y="20" width="600" height="320" rx="10" fill="#0a0818" stroke="#3a3270" stroke-width="1.5"/>
<line x1="50" y1="320" x2="600" y2="320" stroke="#2c2660" stroke-width="1.5"/>
<line x1="50" y1="40" x2="50" y2="320" stroke="#2c2660" stroke-width="1.5"/>
<g font-family="'JetBrains Mono',monospace" font-size="11.5" fill="#ece9ff" text-anchor="middle">
<circle cx="150" cy="110" r="9" fill="#ff5fae"/><text x="150" y="92">dog</text>
<circle cx="190" cy="140" r="9" fill="#ff5fae"/><text x="222" y="140" text-anchor="start">puppy</text>
<circle cx="135" cy="160" r="9" fill="#ff5fae"/><text x="118" y="182">cat</text>
<text x="150" y="218" fill="#ff8fc7" font-size="10">animals</text>
<circle cx="470" cy="120" r="9" fill="#5fd0ff"/><text x="470" y="102">car</text>
<circle cx="510" cy="150" r="9" fill="#5fd0ff"/><text x="540" y="152" text-anchor="start">truck</text>
<circle cx="455" cy="165" r="9" fill="#5fd0ff"/><text x="438" y="186">bus</text>
<text x="485" y="216" fill="#9fe2ff" font-size="10">vehicles</text>
<circle cx="300" cy="255" r="9" fill="#ffd45f"/><text x="300" y="285">king</text>
<circle cx="340" cy="240" r="9" fill="#ffd45f"/><text x="372" y="240" text-anchor="start">queen</text>
<text x="322" y="300" fill="#ffe08a" font-size="10">royalty</text>
</g>
<text x="320" y="36" text-anchor="middle" font-family="'Press Start 2P',monospace" font-size="7" fill="#726cab">(2-D SHADOW OF A 768-D SPACE)</text>
</svg>`,
  },
  distance: {
    key: 'distance',
    caption: 'Cosine looks at the angle; Euclidean at the straight-line gap. For text, cosine wins.',
    svg: `<svg viewBox="0 0 640 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Distance metrics">
<rect x="20" y="20" width="600" height="280" rx="10" fill="#0a0818" stroke="#3a3270" stroke-width="1.5"/>
<g transform="translate(70,270)">
<line x1="0" y1="0" x2="0" y2="-220" stroke="#2c2660" stroke-width="1.5"/>
<line x1="0" y1="0" x2="480" y2="0" stroke="#2c2660" stroke-width="1.5"/>
<line x1="0" y1="0" x2="300" y2="-180" stroke="#5fd0ff" stroke-width="3"/>
<circle cx="300" cy="-180" r="6" fill="#5fd0ff"/><text x="312" y="-184" font-family="'JetBrains Mono',monospace" font-size="12" fill="#5fd0ff">doc A</text>
<line x1="0" y1="0" x2="360" y2="-90" stroke="#ff5fae" stroke-width="3"/>
<circle cx="360" cy="-90" r="6" fill="#ff5fae"/><text x="372" y="-90" font-family="'JetBrains Mono',monospace" font-size="12" fill="#ff5fae">doc B</text>
<path d="M70 0 A 70 70 0 0 0 60 -36" fill="none" stroke="#ffb061" stroke-width="2"/>
<text x="86" y="-22" font-family="'Inter',sans-serif" font-size="14" fill="#ffb061">θ</text>
<line x1="300" y1="-180" x2="360" y2="-90" stroke="#726cab" stroke-width="1.6" stroke-dasharray="5 4"/>
<text x="350" y="-150" font-family="'Inter',sans-serif" font-size="11" fill="#a8a2da">Euclidean</text>
<text x="150" y="-70" font-family="'Inter',sans-serif" font-size="11" fill="#ffb061">cosine = angle θ</text>
</g>
<text x="320" y="296" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="10" fill="#726cab">hnsw:space = "cosine"  ·  smaller distance = more similar</text>
</svg>`,
  },
  collection: {
    key: 'collection',
    caption: 'A collection stores four things per record — and auto-embeds documents for you.',
    svg: `<svg viewBox="0 0 640 318" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Collection structure">
<defs><linearGradient id="g_col" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff5fae"/><stop offset="0.5" stop-color="#a06bff"/><stop offset="1" stop-color="#5fd0ff"/></linearGradient></defs>
<rect x="20" y="20" width="600" height="278" rx="10" fill="#0d0b1f" stroke="url(#g_col)" stroke-width="2.5"/>
<text x="40" y="48" font-family="'JetBrains Mono',monospace" font-size="13" fill="#5fd0ff">collection · "docs"</text>
<g font-family="'Press Start 2P',monospace" font-size="7" fill="#726cab">
<text x="48" y="84">ID</text><text x="150" y="84">DOCUMENT</text><text x="330" y="84">EMBEDDING</text><text x="500" y="84">METADATA</text>
</g>
<line x1="40" y1="94" x2="600" y2="94" stroke="#3a3270" stroke-width="1.5"/>
<g font-family="'JetBrains Mono',monospace" font-size="11.5" fill="#d8d4f2">
<text x="48" y="124" fill="#ffb061">a1</text><text x="150" y="124">"Returns within</text><text x="150" y="140">30 days..."</text>
<text x="330" y="132" fill="#a06bff">[0.04, 0.91, ...]</text><text x="500" y="124">{topic:</text><text x="500" y="140"> "policy"}</text>
<line x1="40" y1="156" x2="600" y2="156" stroke="#241f52" stroke-width="1"/>
<text x="48" y="184" fill="#ffb061">a2</text><text x="150" y="184">"Ship times vary</text><text x="150" y="200">by region..."</text>
<text x="330" y="192" fill="#a06bff">[0.77, 0.10, ...]</text><text x="500" y="184">{topic:</text><text x="500" y="200"> "shipping"}</text>
<line x1="40" y1="216" x2="600" y2="216" stroke="#241f52" stroke-width="1"/>
<text x="48" y="244" fill="#ffb061">a3</text><text x="150" y="244">"Warranty covers</text><text x="150" y="260">defects..."</text>
<text x="330" y="252" fill="#a06bff">[0.31, 0.58, ...]</text><text x="500" y="244">{topic:</text><text x="500" y="260"> "policy"}</text>
</g>
<text x="40" y="288" font-family="'Inter',sans-serif" font-size="11.5" fill="#a8a2da" font-style="italic">add() the id + document + metadata — the embedding is computed automatically.</text>
</svg>`,
  },
  ragpipe: {
    key: 'ragpipe',
    caption: 'RAG has two phases that share one vector store.',
    svg: `<svg viewBox="0 0 640 430" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="RAG pipeline">
<defs><marker id="ar_rp" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#8f88c4"/></marker>
<linearGradient id="g_rp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5fae"/><stop offset="0.5" stop-color="#a06bff"/><stop offset="1" stop-color="#5fd0ff"/></linearGradient></defs>
<text x="30" y="36" font-family="'Press Start 2P',monospace" font-size="8" fill="#ffb061">PHASE 1 · INDEXING (once)</text>
<g font-family="'Inter',sans-serif" font-size="11.5" fill="#ece9ff" text-anchor="middle">
<rect x="24" y="50" width="104" height="46" rx="7" fill="#1b1740" stroke="#4a3f8c" stroke-width="2"/><text x="76" y="78">Your docs</text>
<rect x="166" y="50" width="104" height="46" rx="7" fill="#1b1740" stroke="#4a3f8c" stroke-width="2"/><text x="218" y="72">Chunk</text><text x="218" y="88" font-size="9.5" fill="#a8a2da">~800 chars</text>
<rect x="308" y="50" width="104" height="46" rx="7" fill="#161a30" stroke="#a06bff" stroke-width="2"/><text x="360" y="72" fill="#c9b6ff">Embed</text><text x="360" y="88" font-size="9.5" fill="#a8a2da">→ vectors</text>
</g>
<path d="M128 73 L 164 73" stroke="#8f88c4" stroke-width="2" marker-end="url(#ar_rp)"/>
<path d="M270 73 L 306 73" stroke="#8f88c4" stroke-width="2" marker-end="url(#ar_rp)"/>
<rect x="236" y="170" width="168" height="74" rx="10" fill="#0d0b1f" stroke="url(#g_rp)" stroke-width="3"/>
<text x="320" y="200" text-anchor="middle" font-family="'Inter',sans-serif" font-weight="700" font-size="15" fill="#5fd0ff">ChromaDB</text>
<text x="320" y="222" text-anchor="middle" font-family="'Inter',sans-serif" font-size="11.5" fill="#a8a2da">vector store</text>
<path d="M360 96 C 360 130, 330 140, 322 168" stroke="#8f88c4" stroke-width="2" marker-end="url(#ar_rp)"/>
<text x="372" y="134" font-family="'Inter',sans-serif" font-size="10" fill="#726cab">store</text>
<text x="30" y="296" font-family="'Press Start 2P',monospace" font-size="8" fill="#5fd0ff">PHASE 2 · QUERYING (every question)</text>
<g font-family="'Inter',sans-serif" font-size="11.5" fill="#ece9ff" text-anchor="middle">
<rect x="24" y="312" width="104" height="46" rx="7" fill="#1b1740" stroke="#4a3f8c" stroke-width="2"/><text x="76" y="340">Question</text>
<rect x="166" y="312" width="104" height="46" rx="7" fill="#161a30" stroke="#a06bff" stroke-width="2"/><text x="218" y="340" fill="#c9b6ff">Embed</text>
<rect x="392" y="312" width="120" height="46" rx="7" fill="#1b1740" stroke="#4a3f8c" stroke-width="2"/><text x="452" y="334">Augment</text><text x="452" y="350" font-size="9.5" fill="#a8a2da">context + Q</text>
<rect x="540" y="312" width="84" height="46" rx="7" fill="#2a2150" stroke="#ffb061" stroke-width="2.5"/><text x="582" y="334" fill="#ffb061">Ollama</text><text x="582" y="350" font-size="9.5" fill="#a8a2da">answer</text>
</g>
<path d="M128 335 L 164 335" stroke="#8f88c4" stroke-width="2" marker-end="url(#ar_rp)"/>
<path d="M270 330 C 300 320, 300 260, 318 246" stroke="#8f88c4" stroke-width="2" marker-end="url(#ar_rp)"/>
<path d="M322 246 C 330 300, 360 322, 390 332" stroke="#8f88c4" stroke-width="2" marker-end="url(#ar_rp)"/>
<text x="300" y="280" font-family="'Inter',sans-serif" font-size="10" fill="#726cab">top-k</text>
<path d="M512 335 L 538 335" stroke="#8f88c4" stroke-width="2" marker-end="url(#ar_rp)"/>
</svg>`,
  },
  stack: {
    key: 'stack',
    caption: 'The whole RAG stack runs on one machine — nothing leaves localhost.',
    svg: `<svg viewBox="0 0 640 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Local RAG stack">
<defs><linearGradient id="g_st" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff5fae"/><stop offset="0.5" stop-color="#a06bff"/><stop offset="1" stop-color="#5fd0ff"/></linearGradient></defs>
<rect x="20" y="20" width="600" height="280" rx="12" fill="none" stroke="#4a3f8c" stroke-width="2" stroke-dasharray="6 6"/>
<text x="40" y="46" font-family="'Press Start 2P',monospace" font-size="8" fill="#726cab">localhost — air-gapped capable</text>
<rect x="170" y="60" width="300" height="56" rx="9" fill="#241f52" stroke="#4a3f8c" stroke-width="2"/>
<text x="320" y="86" text-anchor="middle" font-family="'Inter',sans-serif" font-weight="700" font-size="15" fill="#ece9ff">Your Python app</text>
<text x="320" y="106" text-anchor="middle" font-family="'Inter',sans-serif" font-size="11.5" fill="#a8a2da">orchestrates retrieval + generation</text>
<rect x="70" y="170" width="220" height="92" rx="10" fill="#0d0b1f" stroke="url(#g_st)" stroke-width="2.5"/>
<text x="180" y="200" text-anchor="middle" font-family="'Inter',sans-serif" font-weight="700" font-size="14" fill="#5fd0ff">ChromaDB</text>
<text x="180" y="222" text-anchor="middle" font-family="'Inter',sans-serif" font-size="11.5" fill="#a8a2da">stores + retrieves</text>
<text x="180" y="240" text-anchor="middle" font-family="'Inter',sans-serif" font-size="11.5" fill="#a8a2da">your knowledge</text>
<rect x="350" y="170" width="220" height="92" rx="10" fill="#2a2150" stroke="#ffb061" stroke-width="2.5"/>
<text x="460" y="200" text-anchor="middle" font-family="'Inter',sans-serif" font-weight="700" font-size="14" fill="#ffb061">Ollama</text>
<text x="460" y="222" text-anchor="middle" font-family="'Inter',sans-serif" font-size="11.5" fill="#a8a2da">embeds the text +</text>
<text x="460" y="240" text-anchor="middle" font-family="'Inter',sans-serif" font-size="11.5" fill="#a8a2da">generates the answer</text>
<line x1="200" y1="116" x2="180" y2="168" stroke="#8f88c4" stroke-width="2"/>
<line x1="440" y1="116" x2="460" y2="168" stroke="#8f88c4" stroke-width="2"/>
</svg>`,
  },
```

- [ ] **Step 2: TypeScript check**

```
npx tsc --noEmit
```
Expected: no errors (the new diagram keys are referenced by the lessons added in Task 1)

- [ ] **Step 3: Commit**

```
git add content/diagrams.ts
git commit -m "feat: add 5 remaining diagrams (vectorspace, distance, collection, ragpipe, stack)"
```

---

### Task 3: markSandboxCompleted Store Action + sandbox_portal Entity Type

**Files:**
- Modify: `store/game-store.ts`
- Modify: `store/__tests__/game-store.test.ts`
- Modify: `engine/entity.ts`

**Interfaces:**
- `completedSandboxes: Record<string, boolean>` already exists in `ProgressionData` — just needs the action
- Produces:
  - `markSandboxCompleted(sandboxId: string): void` — sets `completedSandboxes[sandboxId] = true`, idempotent, awards +15 XP
  - `EntityType` extended with `'sandbox_portal'`
  - `makeSandboxPortal(id: string, x: number, y: number, destination: string): Entity`
- Consumed by: Task 6 (sandbox screen + world-data)

- [ ] **Step 1: Write the failing tests**

Append to `store/__tests__/game-store.test.ts`:

```typescript
describe('markSandboxCompleted', () => {
  it('marks sandbox completed and awards 15 XP', () => {
    const { result } = renderHook(() => useGameStore())
    act(() => result.current.initPlayer('Ada', 'Tinkerer'))
    act(() => result.current.markSandboxCompleted('firstchat'))
    expect(result.current.progression.completedSandboxes['firstchat']).toBe(true)
    expect(result.current.player.xp).toBe(15)
  })

  it('is idempotent — second call awards no extra XP', () => {
    const { result } = renderHook(() => useGameStore())
    act(() => result.current.initPlayer('Ada', 'Tinkerer'))
    act(() => result.current.markSandboxCompleted('firstchat'))
    act(() => result.current.markSandboxCompleted('firstchat'))
    expect(result.current.player.xp).toBe(15)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- store/__tests__/game-store.test.ts --watchAll=false
```
Expected: `markSandboxCompleted is not a function`

- [ ] **Step 3: Add `markSandboxCompleted` to `store/game-store.ts`**

In the `GameState` interface, add after `setPlayerHp`:
```typescript
  markSandboxCompleted: (sandboxId: string) => void
```

In the `create` body, add after `setPlayerHp`:
```typescript
      markSandboxCompleted: (sandboxId) => {
        const { progression } = get()
        if (progression.completedSandboxes[sandboxId]) return
        set((state) => ({
          progression: {
            ...state.progression,
            completedSandboxes: { ...state.progression.completedSandboxes, [sandboxId]: true },
          },
        }))
        get().awardXP(15)
      },
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- store/__tests__/game-store.test.ts --watchAll=false
```
Expected: all store tests pass (previous 7 + new 2 = 9 passing)

- [ ] **Step 5: Add `sandbox_portal` to `engine/entity.ts`**

Change the `EntityType` line:
```typescript
export type EntityType = 'player' | 'npc' | 'sign' | 'building_entrance' | 'gate' | 'sandbox_portal'
```

Add `makeSandboxPortal` factory after `makeGate`:
```typescript
export function makeSandboxPortal(id: string, x: number, y: number, destination: string): Entity {
  return { id, type: 'sandbox_portal', x, y, facing: 'down', interactable: true, data: { destination } }
}
```

- [ ] **Step 6: TypeScript check**

```
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 7: Commit**

```
git add store/game-store.ts store/__tests__/game-store.test.ts engine/entity.ts
git commit -m "feat: markSandboxCompleted store action + sandbox_portal entity type"
```

---

### Task 4: Sandbox Definitions

**Files:**
- Create: `content/sandboxes.ts`
- Create: `content/__tests__/sandboxes.test.ts`

**Interfaces:**
- Produces:
  - `SandboxObjective` — `{ id: string; label: string; hint: string }`
  - `SandboxDef` — `{ id, title, intro, act, concept, mode, objectives }`
  - `SANDBOXES: Record<string, SandboxDef>`
  - `getSandboxDef(id: string): SandboxDef` — throws on unknown id
- Consumed by: Task 5 (Terminal), Task 6 (sandbox screen)

- [ ] **Step 1: Write the failing tests**

```typescript
// content/__tests__/sandboxes.test.ts
import { SANDBOXES, getSandboxDef } from '../sandboxes'

it('has exactly 5 sandboxes', () => expect(Object.keys(SANDBOXES)).toHaveLength(5))

it('getSandboxDef("firstchat") has 4 objectives', () =>
  expect(getSandboxDef('firstchat').objectives).toHaveLength(4))

it('getSandboxDef("collection") has 6 objectives', () =>
  expect(getSandboxDef('collection').objectives).toHaveLength(6))
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- content/__tests__/sandboxes.test.ts --watchAll=false
```
Expected: Cannot find module `'../sandboxes'`

- [ ] **Step 3: Create `content/sandboxes.ts`**

```typescript
// content/sandboxes.ts
export interface SandboxObjective {
  id: string
  label: string
  hint: string
}

export interface SandboxDef {
  id: 'firstchat' | 'modelfile' | 'api' | 'collection' | 'rag'
  title: string
  intro: string
  act: 1 | 2 | 3 | 4
  concept: string
  mode: 'sh' | 'py'
  objectives: SandboxObjective[]
}

export const SANDBOXES: Record<string, SandboxDef> = {
  firstchat: {
    id: 'firstchat',
    title: 'First Chat',
    intro: 'Pull a model, list it, run it, and check it\'s loaded. These four commands are your daily Ollama workflow.',
    act: 1,
    concept: 'oll-run',
    mode: 'sh',
    objectives: [
      { id: 'pull', label: 'Download llama3.2', hint: 'Run: ollama pull llama3.2' },
      { id: 'list', label: 'List installed models', hint: 'Run: ollama list' },
      { id: 'run', label: 'Start a chat', hint: 'Run: ollama run llama3.2' },
      { id: 'ps', label: 'Check loaded model', hint: 'Run: ollama ps' },
    ],
  },
  modelfile: {
    id: 'modelfile',
    title: 'Custom Modelfile',
    intro: 'Build a Modelfile, create a custom model from it, and run it.',
    act: 2,
    concept: 'oll-modelfile',
    mode: 'sh',
    objectives: [
      { id: 'create-file', label: 'Create a Modelfile', hint: 'Run: printf "FROM llama3.2\\nSYSTEM \\"You are a SQL expert.\\"" > Modelfile' },
      { id: 'build', label: 'Build the custom model', hint: 'Run: ollama create sqlbot -f Modelfile' },
      { id: 'run-custom', label: 'Run your custom model', hint: 'Run: ollama run sqlbot' },
    ],
  },
  api: {
    id: 'api',
    title: 'REST API Explorer',
    intro: 'Hit the Ollama HTTP API directly with curl — health check, chat, and embeddings.',
    act: 2,
    concept: 'oll-api',
    mode: 'sh',
    objectives: [
      { id: 'tags', label: 'Health check the API', hint: 'Run: curl localhost:11434/api/tags' },
      { id: 'chat', label: 'Send a chat request', hint: 'Run: curl localhost:11434/api/chat -d \'{"model":"llama3.2","messages":[{"role":"user","content":"hello"}]}\'' },
      { id: 'embed', label: 'Create an embedding', hint: 'Run: curl localhost:11434/api/embed -d \'{"model":"llama3.2","input":"hello"}\'' },
    ],
  },
  collection: {
    id: 'collection',
    title: 'ChromaDB Collection',
    intro: 'Install ChromaDB, create a collection, add documents, and run your first semantic query.',
    act: 3,
    concept: 'chr-add',
    mode: 'py',
    objectives: [
      { id: 'install', label: 'Install chromadb', hint: 'Run: pip install chromadb' },
      { id: 'python', label: 'Enter Python REPL', hint: 'Run: python' },
      { id: 'client', label: 'Create a PersistentClient', hint: 'Type: import chromadb; client = chromadb.PersistentClient(path="./chroma")' },
      { id: 'collection', label: 'Get or create a collection', hint: 'Type: col = client.get_or_create_collection("docs")' },
      { id: 'add', label: 'Add documents', hint: 'Type: col.add(documents=["Ollama runs models locally"],ids=["doc1"])' },
      { id: 'query', label: 'Query the collection', hint: 'Type: col.query(query_texts=["local AI"],n_results=1)' },
    ],
  },
  rag: {
    id: 'rag',
    title: 'Local RAG System',
    intro: 'Pull an embedding model, index documents in ChromaDB, retrieve relevant chunks, and generate a grounded answer.',
    act: 4,
    concept: 'rag-build',
    mode: 'sh',
    objectives: [
      { id: 'embed-model', label: 'Pull an embedding model', hint: 'Run: ollama pull nomic-embed-text' },
      { id: 'index', label: 'Index documents in ChromaDB', hint: 'Use Python + chromadb + OllamaEmbeddingFunction to add documents' },
      { id: 'retrieve', label: 'Retrieve relevant chunks', hint: 'Use col.query() to retrieve top-k chunks for a question' },
      { id: 'generate', label: 'Generate a grounded answer', hint: 'Pass retrieved chunks as context to ollama.chat()' },
    ],
  },
}

export function getSandboxDef(id: string): SandboxDef {
  const def = SANDBOXES[id]
  if (!def) throw new Error(`Unknown sandbox id: ${id}`)
  return def
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- content/__tests__/sandboxes.test.ts --watchAll=false
```
Expected: 3 passing

- [ ] **Step 5: TypeScript check**

```
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 6: Commit**

```
git add content/sandboxes.ts content/__tests__/sandboxes.test.ts
git commit -m "feat: sandbox definitions — 5 projects with 20 total objectives"
```

---

### Task 5: Terminal Component

**Files:**
- Create: `components/Terminal.tsx`
- Create: `components/__tests__/Terminal.test.tsx`

**Interfaces:**
- Consumes: `SandboxDef` from `content/sandboxes`
- Produces: `Terminal` component with props:
  ```typescript
  interface TerminalProps {
    sandbox: SandboxDef
    completedObjectives: Record<string, boolean>
    onObjectiveDone: (id: string) => void
    onAllDone: () => void
  }
  ```
- Consumed by: Task 6 (sandbox screen)

- [ ] **Step 1: Write the failing tests**

```typescript
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
  fireEvent.submitEditing(input)
  expect(onObjectiveDone).toHaveBeenCalledWith('pull')
})

it('entering "ollama list" calls onObjectiveDone("list")', () => {
  const onObjectiveDone = jest.fn()
  const { getByPlaceholderText } = render(
    <Terminal sandbox={firstchat} completedObjectives={{}} onObjectiveDone={onObjectiveDone} onAllDone={jest.fn()} />
  )
  const input = getByPlaceholderText('Type command…')
  fireEvent.changeText(input, 'ollama list')
  fireEvent.submitEditing(input)
  expect(onObjectiveDone).toHaveBeenCalledWith('list')
})

it('unknown command outputs command not found', () => {
  const { getByPlaceholderText, queryByText } = render(
    <Terminal sandbox={firstchat} completedObjectives={{}} onObjectiveDone={jest.fn()} onAllDone={jest.fn()} />
  )
  const input = getByPlaceholderText('Type command…')
  fireEvent.changeText(input, 'foobar')
  fireEvent.submitEditing(input)
  expect(queryByText(/command not found/)).toBeTruthy()
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- components/__tests__/Terminal.test.tsx --watchAll=false
```
Expected: Cannot find module `'../Terminal'`

- [ ] **Step 3: Create `components/Terminal.tsx`**

```tsx
// components/Terminal.tsx
import React, { useState, useRef } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import type { SandboxDef } from '../content/sandboxes'

export interface TerminalProps {
  sandbox: SandboxDef
  completedObjectives: Record<string, boolean>
  onObjectiveDone: (id: string) => void
  onAllDone: () => void
}

interface CommandPattern {
  pattern: RegExp
  objectiveId: string
  sandboxId: string
  response: string
}

const SHELL_PATTERNS: CommandPattern[] = [
  // firstchat
  { pattern: /ollama\s+pull\s+llama3\.2/, objectiveId: 'pull', sandboxId: 'firstchat',
    response: 'pulling manifest\npulling 8eeb52dfb585... 100% ▕████████████████▏ 2.0 GB\nsuccess' },
  { pattern: /ollama\s+list/, objectiveId: 'list', sandboxId: 'firstchat',
    response: 'NAME              ID              SIZE    MODIFIED\nllama3.2:latest   a80c4f17acd5    2.0 GB  1 second ago' },
  { pattern: /ollama\s+run\s+llama3\.2/, objectiveId: 'run', sandboxId: 'firstchat',
    response: '>>> ' },
  { pattern: /ollama\s+ps/, objectiveId: 'ps', sandboxId: 'firstchat',
    response: 'NAME              ID              SIZE    PROCESSOR    UNTIL\nllama3.2:latest   a80c4f17acd5    4.7 GB  100% GPU     4 minutes from now' },
  // modelfile
  { pattern: /printf.*>.*Modelfile|echo.*>.*Modelfile|cat\s*>.*Modelfile|nano\s+Modelfile|vi\s+Modelfile/,
    objectiveId: 'create-file', sandboxId: 'modelfile', response: '' },
  { pattern: /ollama\s+create\s+\S+\s+-f\s+Modelfile/, objectiveId: 'build', sandboxId: 'modelfile',
    response: 'transferring model data\ncreating model layer\nsuccess' },
  { pattern: /ollama\s+run\s+sqlbot/, objectiveId: 'run-custom', sandboxId: 'modelfile',
    response: '>>> ' },
  // api
  { pattern: /curl\s+localhost:11434\/api\/tags/, objectiveId: 'tags', sandboxId: 'api',
    response: '{"models":[{"name":"llama3.2:latest","size":2052668416}]}' },
  { pattern: /curl\s+localhost:11434\/api\/chat/, objectiveId: 'chat', sandboxId: 'api',
    response: '{"model":"llama3.2","message":{"role":"assistant","content":"Hello! How can I help you today?"},"done":true}' },
  { pattern: /curl\s+localhost:11434\/api\/embed/, objectiveId: 'embed', sandboxId: 'api',
    response: '{"model":"llama3.2","embeddings":[[0.1201,-0.0372,0.8821]],"total_duration":523000000}' },
  // rag
  { pattern: /ollama\s+pull\s+nomic-embed-text/, objectiveId: 'embed-model', sandboxId: 'rag',
    response: 'pulling manifest\npulling all layers... done\nsuccess' },
]

const PYTHON_PATTERNS: CommandPattern[] = [
  // collection
  { pattern: /pip\s+install\s+chromadb/, objectiveId: 'install', sandboxId: 'collection',
    response: 'Collecting chromadb\nInstalling collected packages: chromadb\nSuccessfully installed chromadb-0.5.0' },
  { pattern: /import\s+chromadb.*PersistentClient|PersistentClient.*chromadb/, objectiveId: 'client', sandboxId: 'collection',
    response: '' },
  { pattern: /get_or_create_collection/, objectiveId: 'collection', sandboxId: 'collection',
    response: '' },
  { pattern: /col\.add\(/, objectiveId: 'add', sandboxId: 'collection',
    response: '' },
  { pattern: /col\.query\(/, objectiveId: 'query', sandboxId: 'collection',
    response: "{'ids': [['doc1']], 'distances': [[0.123]], 'documents': [['Ollama runs models locally']]}" },
  // rag
  { pattern: /OllamaEmbeddingFunction|embedding_function/, objectiveId: 'index', sandboxId: 'rag',
    response: 'Documents indexed.' },
  { pattern: /col\.query\(/, objectiveId: 'retrieve', sandboxId: 'rag',
    response: "{'ids': [['d0']], 'documents': [['Llamas are camelids...']]}" },
  { pattern: /ollama\.chat\(|ollama\.generate\(/, objectiveId: 'generate', sandboxId: 'rag',
    response: 'A llama can carry 25–30% of its body weight.' },
]

export function Terminal({ sandbox, completedObjectives, onObjectiveDone, onAllDone }: TerminalProps) {
  const [mode, setMode] = useState<'sh' | 'py'>('sh')
  const [output, setOutput] = useState<string[]>([
    `Simulated terminal — sandbox: ${sandbox.title}`,
    `${sandbox.objectives.length} objectives to complete.`,
    '',
  ])
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<ScrollView>(null)

  function appendOutput(lines: string[]) {
    setOutput(prev => {
      const next = [...prev, ...lines]
      return next
    })
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)
  }

  function runCommand(cmd: string) {
    const prompt = mode === 'sh' ? `$ ${cmd}` : `>>> ${cmd}`
    appendOutput([prompt])

    if (mode === 'sh' && (cmd === 'python' || cmd === 'python3')) {
      setMode('py')
      appendOutput(['Python 3.11.0 (simulated)', '>>> '])
      return
    }
    if (mode === 'py' && cmd.trim() === 'exit()') {
      setMode('sh')
      appendOutput(['$ '])
      return
    }

    const patterns = mode === 'sh' ? SHELL_PATTERNS : PYTHON_PATTERNS
    const match = patterns.find(p => p.sandboxId === sandbox.id && p.pattern.test(cmd))
    if (match) {
      if (match.response) appendOutput([match.response])
      onObjectiveDone(match.objectiveId)
      const allDone = sandbox.objectives.every(
        o => completedObjectives[o.id] || o.id === match.objectiveId
      )
      if (allDone) setTimeout(onAllDone, 800)
    } else {
      const cmdName = cmd.trim().split(/\s+/)[0] ?? cmd
      appendOutput([`bash: ${cmdName}: command not found`])
    }
  }

  function handleSubmit() {
    const cmd = inputValue.trim()
    if (!cmd) return
    setInputValue('')
    runCommand(cmd)
  }

  return (
    <View style={styles.container}>
      {/* Objectives panel */}
      <View style={styles.objectives}>
        <Text style={styles.objectivesTitle}>Objectives</Text>
        {sandbox.objectives.map(obj => {
          const done = completedObjectives[obj.id] === true
          return (
            <View key={obj.id} style={styles.objectiveRow}>
              <Text style={[styles.objectiveCheck, done && styles.objectiveDone]}>
                {done ? '✓' : '○'}
              </Text>
              <Text style={[styles.objectiveLabel, done && styles.objectiveDone]}>{obj.label}</Text>
            </View>
          )
        })}
      </View>

      {/* Terminal output */}
      <ScrollView ref={scrollRef} style={styles.output} contentContainerStyle={styles.outputContent}>
        {output.map((line, i) => (
          <Text key={i} style={styles.outputLine}>{line}</Text>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputRow}>
        <Text style={styles.prompt}>{mode === 'sh' ? '$' : '>>>'}</Text>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={handleSubmit}
          placeholder="Type command…"
          placeholderTextColor="#4a3f8c"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0818' },
  objectives: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1b1740' },
  objectivesTitle: { color: '#c0a060', fontFamily: 'monospace', fontSize: 11, marginBottom: 6 },
  objectiveRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  objectiveCheck: { color: '#4a3f8c', fontFamily: 'monospace', fontSize: 12, width: 14 },
  objectiveLabel: { color: '#a8a2da', fontFamily: 'monospace', fontSize: 11 },
  objectiveDone: { color: '#4caf50' },
  output: { flex: 1, paddingHorizontal: 12 },
  outputContent: { paddingVertical: 8 },
  outputLine: { color: '#ece9ff', fontFamily: 'monospace', fontSize: 11, lineHeight: 18 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#1b1740' },
  prompt: { color: '#4fe0cf', fontFamily: 'monospace', fontSize: 13, marginRight: 8 },
  input: { flex: 1, color: '#ece9ff', fontFamily: 'monospace', fontSize: 13 },
})
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- components/__tests__/Terminal.test.tsx --watchAll=false
```
Expected: 4 passing

- [ ] **Step 5: TypeScript check**

```
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 6: Commit**

```
git add components/Terminal.tsx components/__tests__/Terminal.test.tsx
git commit -m "feat: Terminal component with command recognition and objective tracking"
```

---

### Task 6: Sandbox Screen + City Wiring

**Files:**
- Create: `app/sandbox/[id].tsx`
- Modify: `content/world-data.ts` — add `firstchat` portal to LLAMATOWN
- Modify: `app/city/[id].tsx` — handle `sandbox_portal` in `handleInteract` and `interactLabel`

**Interfaces:**
- Consumes: `getSandboxDef` from `content/sandboxes`, `Terminal` from `components/Terminal`, `useGameStore` (`progression`, `markSandboxCompleted`), `makeSandboxPortal` from `engine/entity`, `useLocalSearchParams`, `useRouter` from `expo-router`
- Route: `/sandbox/firstchat` — navigated from city screen when player interacts with a `sandbox_portal` entity
- No unit tests — TypeScript check + manual smoke test

- [ ] **Step 1: Create `app/sandbox/[id].tsx`**

```tsx
// app/sandbox/[id].tsx
import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getSandboxDef } from '../../content/sandboxes'
import { Terminal } from '../../components/Terminal'
import { useGameStore } from '../../store/game-store'

export default function SandboxScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { progression, markSandboxCompleted } = useGameStore()
  const sandbox = getSandboxDef(id ?? 'firstchat')
  const [completedObjectives, setCompletedObjectives] = useState<Record<string, boolean>>({})

  const alreadyCompleted = progression.completedSandboxes[sandbox.id] === true

  function handleObjectiveDone(objectiveId: string) {
    setCompletedObjectives(prev => ({ ...prev, [objectiveId]: true }))
  }

  function handleAllDone() {
    markSandboxCompleted(sandbox.id)
    setTimeout(() => router.back(), 1500)
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{sandbox.title}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.exitBtn}>
          <Text style={styles.exitText}>✕ Exit</Text>
        </TouchableOpacity>
      </View>

      {alreadyCompleted ? (
        <View style={styles.doneContainer}>
          <Text style={styles.doneText}>✓ Sandbox completed!</Text>
          <Text style={styles.doneSubtext}>{sandbox.intro}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Return to city</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.intro}>{sandbox.intro}</Text>
          <Terminal
            sandbox={sandbox}
            completedObjectives={completedObjectives}
            onObjectiveDone={handleObjectiveDone}
            onAllDone={handleAllDone}
          />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0a0818' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1b1740' },
  title: { color: '#ffb061', fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold' },
  exitBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  exitText: { color: '#726cab', fontFamily: 'monospace', fontSize: 12 },
  intro: { color: '#a8a2da', fontFamily: 'monospace', fontSize: 11, lineHeight: 18, paddingHorizontal: 16, paddingVertical: 10 },
  doneContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  doneText: { color: '#4caf50', fontFamily: 'monospace', fontSize: 20, fontWeight: 'bold' },
  doneSubtext: { color: '#a8a2da', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', lineHeight: 20 },
  backBtn: { marginTop: 8, backgroundColor: '#1b1740', borderWidth: 2, borderColor: '#4a3f8c', borderRadius: 6, paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText: { color: '#ece9ff', fontFamily: 'monospace', fontSize: 13 },
})
```

- [ ] **Step 2: Add sandbox portal to LLAMATOWN in `content/world-data.ts`**

Add the import at the top of the file (it already imports `makeNPC`, `makeBuildingEntrance`, `makeGate` — add `makeSandboxPortal`):
```typescript
import { makeNPC, makeBuildingEntrance, makeGate, makeSandboxPortal } from '../engine/entity'
```

Add the portal to `LLAMATOWN.entities` array (after the `makeGate` entry):
```typescript
    makeGate('gate-south', 9, 13, 'overworld', false),
    (() => { const g = makeGate('gate-boss-llamatown', 9, 1, 'forge', true); g.data = { ...g.data, bossId: 'frozen-boot' }; return g })(),
    makeSandboxPortal('sandbox-firstchat', 16, 8, 'firstchat'),
```

The portal is at tile (16, 8) — east side of the city, between the workshop building and the south path. The player can walk there and press [E] to enter the sandbox.

- [ ] **Step 3: Handle `sandbox_portal` in `app/city/[id].tsx`**

In `handleInteract`, add a `sandbox_portal` branch after the `gate` branch:
```typescript
    } else if (nearbyEntity.type === 'sandbox_portal') {
      const dest = nearbyEntity.data['destination'] as string
      router.push(`/sandbox/${dest}`)
    }
```

Update `interactLabel` to handle the new type:
```typescript
  const interactLabel = nearbyEntity
    ? nearbyEntity.type === 'npc'
      ? `[E] Talk to ${nearbyEntity.data['name']}`
      : nearbyEntity.type === 'sandbox_portal'
      ? '[E] Open Terminal'
      : '[E] Enter'
    : null
```

- [ ] **Step 4: TypeScript check**

```
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 5: Run full test suite**

```
npm test -- --watchAll=false
```
Expected: all 65 (existing) + 7 (lessons) + 3 (sandboxes) + 2 (store) + 4 (Terminal) = 81 tests passing

- [ ] **Step 6: Smoke test**

```
npx expo start --web
```

1. Create a character → walk to Llamatown.
2. Navigate to tile (16, 8) — east area of the city, near the workshop. `[E] Open Terminal` prompt should appear.
3. Press [E] → sandbox screen opens with "First Chat" title and 4 objectives.
4. Type `ollama pull llama3.2` → simulated output appears, "Download llama3.2" objective checks off.
5. Type `ollama list` → second objective completes.
6. Type `ollama run llama3.2` → third objective.
7. Type `ollama ps` → fourth objective. Screen should show completion and auto-return after 1.5s.
8. Walk back to the portal → `[E] Open Terminal` → screen shows "✓ Sandbox completed!" (already done state).

- [ ] **Step 7: Commit**

```
git add app/sandbox/[id].tsx content/world-data.ts app/city/[id].tsx
git commit -m "feat: sandbox screen + firstchat portal in Llamatown"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] `content/lessons.ts` — 19 lessons appended (Act II: 8, Act III: 8, Act IV: 3) → Task 1
- [x] `content/__tests__/lessons.test.ts` — 7 structural tests → Task 1
- [x] `content/diagrams.ts` — 5 remaining diagrams (vectorspace, distance, collection, ragpipe, stack) → Task 2
- [x] `engine/entity.ts` — `sandbox_portal` EntityType + `makeSandboxPortal` factory → Task 3
- [x] `store/game-store.ts` — `markSandboxCompleted` action → Task 3
- [x] `content/sandboxes.ts` — 5 sandbox definitions → Task 4
- [x] `components/Terminal.tsx` — command recognition, objective callbacks → Task 5
- [x] `app/sandbox/[id].tsx` — full sandbox screen with completion state → Task 6
- [x] `content/world-data.ts` — `firstchat` portal in LLAMATOWN → Task 6
- [x] `app/city/[id].tsx` — `sandbox_portal` interaction handler → Task 6

**Sandboxes for other acts (modelfile, api, collection, rag)** — these are defined in `content/sandboxes.ts` but their portals are not wired into city maps yet, because Forge, Prism Caverns, and The Convergence are built in Phase 5. This is intentional. The `getSandboxDef` and Terminal will work for any sandbox id — Phase 5 just adds the entity in the correct city.

**diagram SVG marker IDs** — SVGs for Phase 3 diagrams use ids `g_vs`, `g_col`, `g_rp`, `g_st` (all distinct from Phase 1 diagram ids `arr`, `arr2`, `arr3`, `arr3b`, `arr4`, `arr4b`, `arr5`, `g_arch`, `g_em`). No conflicts.

**Type check** — `getSandboxDef` throws on unknown id (it doesn't return `undefined`), so the sandbox screen can call it unconditionally. The `id ?? 'firstchat'` fallback in the screen ensures there's always a valid string to pass.
