export type BlockType =
  | { h2: string }
  | { p: string }
  | { ul: string[] }
  | { code: { lang: string; c: string } }
  | { tip: string }
  | { warn: string }
  | { note: string }
  | { diagram: string }
  | { prism: string }

export interface Lesson {
  id: string
  act: 1 | 2 | 3 | 4
  idx: number
  title: string
  lede: string
  body: BlockType[]
}

export const LESSONS: Lesson[] = [
  // ── ACT I ─────────────────────────────────────────────────────────
  {
    id: 'oll-intro',
    act: 1,
    idx: 1,
    title: 'What Is Ollama?',
    lede: 'Run powerful large language models entirely on your own machine — no cloud, no API bill, no data leaving your computer.',
    body: [
      {
        p: '**Ollama** is an open-source tool that downloads, manages, and runs large language models (LLMs) locally. Think of it as the **Docker of LLMs**: it bundles a model’s weights, configuration, and prompt template into one package you can pull and run with a single command.',
      },
      {
        p: 'When you run a model, Ollama starts a small background server on your machine and talks to it over HTTP. The same server powers the command line, a REST API, and the Python/JavaScript libraries — so everything you learn in the terminal transfers directly to code.',
      },
      { diagram: 'arch' },
      { h2: 'Why run models locally?' },
      {
        ul: [
          '**Privacy** — your prompts and documents never leave the machine. Ideal for sensitive code, legal text, or medical data.',
          '**Cost** — no per-token billing. Once a model is downloaded, inference is free.',
          '**Offline** — it works on a plane at 35,000 feet or in an air-gapped network.',
          '**Control** — you choose the exact model, version, and quantization, and you can customize behavior with a Modelfile.',
        ],
      },
      {
        note: 'Ollama runs on macOS, Windows, and Linux. A modern GPU (NVIDIA) or Apple Silicon makes it fast, but many small models run fine on CPU.',
      },
      { h2: 'The mental model' },
      {
        p: 'Three things make up your local AI stack: the **Ollama server** (always listening on `localhost:11434`), the **models** you’ve pulled (stored on disk), and the **clients** that talk to the server (CLI, your app, or a vector database like ChromaDB). Master this triangle and the rest is detail.',
      },
      {
        prism:
          'Later in this quest you’ll pair Ollama with **ChromaDB** to build a Retrieval-Augmented Generation (RAG) system that answers questions from your own documents — fully local, end to end.',
      },
    ],
  },
  {
    id: 'oll-install',
    act: 1,
    idx: 2,
    title: 'Install & the Server',
    lede: 'Get Ollama running and understand the daemon on port 11434 that everything else depends on.',
    body: [
      { h2: 'Installing' },
      {
        ul: [
          '**macOS / Windows** — download the installer from `ollama.com` and run it. The app starts the server automatically and keeps it running in the background.',
          '**Linux** — one line: `curl -fsSL https://ollama.com/install.sh | sh`',
          '**Docker** — `docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama`',
        ],
      },
      { h2: 'The server (the part people miss)' },
      {
        p: 'Every Ollama command is really an HTTP call to a local server. On macOS and Windows the desktop app launches it for you. On a headless Linux box or in a container, you start it yourself:',
      },
      {
        code: {
          lang: 'bash',
          c: '# Start the server manually (headless / Linux / debugging)\nollama serve\n# It now listens on http://localhost:11434',
        },
      },
      {
        p: 'You almost never need `ollama serve` on desktop — but knowing it exists explains everything else. If a command ever says it can’t connect, the server isn’t running.',
      },
      { h2: 'Verify it’s alive' },
      {
        code: {
          lang: 'bash',
          c: '# The simplest health check — list installed models via the API\ncurl http://localhost:11434/api/tags\n\n# Or just\nollama --version',
        },
      },
      {
        tip: 'On Linux, manage the service with `sudo systemctl start ollama` and `sudo systemctl restart ollama`. After installing GPU drivers, restart the service so Ollama picks them up.',
      },
      {
        warn: 'If Ollama is installed but the command isn’t found, it’s a PATH issue. On Linux it lives in `/usr/local/bin`; on macOS check `/usr/local/bin` or `/opt/homebrew/bin`. Run `which ollama` to locate it.',
      },
    ],
  },
  {
    id: 'oll-run',
    act: 1,
    idx: 3,
    title: 'Your First Model',
    lede: 'Pull a model and start chatting in seconds — then learn what actually happened.',
    body: [
      { h2: 'Run = pull + chat' },
      {
        p: 'The single most important command. If the model isn’t on your machine yet, `ollama run` downloads it first, then drops you into an interactive chat:',
      },
      {
        code: {
          lang: 'bash',
          c: '# Download (if needed) and chat with a model\nollama run llama3.2\n\n# Pick a specific size with a tag\nollama run qwen3:8b\n>>> Why is the sky blue?',
        },
      },
      {
        p: 'Find every model and its tags at `ollama.com/library`. A **tag** after the colon selects a size or quantization, e.g. `qwen3:8b`, `qwen3:14b`. With no tag, you get the default tag for that model — usually a sensible mid-size build.',
      },
      { h2: 'Pull without chatting' },
      {
        p: 'To download ahead of time (e.g. while you have internet, before going offline), use `pull`. Cancelled downloads resume where they left off:',
      },
      {
        code: {
          lang: 'bash',
          c: 'ollama pull llama3.2:3b      # ~2 GB, great on modest hardware\nollama pull nomic-embed-text  # an embedding model (used later for RAG)',
        },
      },
      { h2: 'Inside interactive mode' },
      { p: 'Once chatting, special commands start with `/`:' },
      {
        ul: [
          '`/bye` or [[Ctrl]]+[[D]] — exit the chat',
          '`/set parameter temperature 0.2` — change a setting mid-session',
          '`/show info` — see the model’s details',
          '`/clear` — wipe the conversation context',
          'Triple-quote `"""` to write multi-line prompts',
        ],
      },
      {
        tip: 'Run a one-shot prompt without entering chat mode by passing it inline: `ollama run llama3.2 "Summarize quantum tunneling in one sentence."`',
      },
      {
        note: 'Models with a `:cloud` tag run on Ollama’s servers instead of your machine (handy for models too big for your hardware). Those require `ollama signin`. The default, and the focus of this quest, is fully local.',
      },
    ],
  },
  {
    id: 'oll-manage',
    act: 1,
    idx: 4,
    title: 'Managing Your Models',
    lede: 'Inventory, inspect, copy, and delete models — and reclaim gigabytes of disk space.',
    body: [
      { h2: 'The daily commands' },
      {
        code: {
          lang: 'bash',
          c: 'ollama list          # what’s installed (alias: ollama ls)\nollama ps            # what’s loaded in memory right now\nollama show llama3.2  # architecture, parameters, the Modelfile, license\nollama cp llama3.2 my-llama   # copy a model under a new name\nollama rm qwen3:14b   # delete a model and free disk space\nollama stop llama3.2  # unload a running model from VRAM now',
        },
      },
      { h2: '“Why is my VRAM full?”' },
      {
        p: '`ollama ps` is your debugger. It shows each loaded model, its size, whether it’s on GPU or CPU, the context length, and when it will be evicted:',
      },
      {
        code: {
          lang: 'bash',
          c: '$ ollama ps\nNAME        ID            SIZE    PROCESSOR    CONTEXT   UNTIL\nllama3.2:3b a80c4f17acd5  3.5 GB  100% GPU     4096      4 minutes from now',
        },
      },
      {
        p: 'By default Ollama keeps a model in memory for **5 minutes** after the last request, then unloads it automatically. `ollama stop` evicts it immediately.',
      },
      { h2: 'Where models live' },
      {
        ul: [
          'macOS / Linux: `~/.ollama/models`',
          'Windows: `%USERPROFILE%\\.ollama\\models`',
          'Change the location with the `OLLAMA_MODELS` environment variable.',
        ],
      },
      {
        code: {
          lang: 'bash',
          c: '# See how much disk your models use (macOS/Linux)\ndu -sh ~/.ollama/models',
        },
      },
      {
        tip: 'You can move models between machines by copying the `~/.ollama/models` directory — `ollama list` will recognize them on the other side, no re-download needed.',
      },
    ],
  },
  {
    id: 'oll-models',
    act: 1,
    idx: 5,
    title: 'Choosing Models & Quantization',
    lede: 'Parameters, GGUF, and quantization levels — how to pick a model that actually fits your hardware.',
    body: [
      { h2: 'Parameters: the size of the brain' },
      {
        p: 'Model size is measured in **parameters** (the 8B in `qwen3:8b` means 8 billion). More parameters generally means more capability — and more memory and slower inference. A rough rule: a model needs **memory roughly equal to its file size** to run, plus extra for context.',
      },
      { h2: 'Quantization: shrinking the model' },
      {
        p: 'Full-precision weights are large. **Quantization** stores them in fewer bits, dramatically cutting size and memory with only a small quality loss. Ollama uses the **GGUF** format and defaults to **Q4_K_M** (4-bit) unless a tag says otherwise.',
      },
      {
        ul: [
          '`q4_K_M` — the default. Best balance of size, speed, and quality. Start here.',
          '`q8_0` — 8-bit. Higher quality, roughly double the size of q4.',
          '`fp16` — full(ish) precision. Largest, highest fidelity, needs serious VRAM.',
        ],
      },
      {
        code: {
          lang: 'bash',
          c: 'ollama pull llama3.2:3b        # default Q4_K_M (~2 GB)\nollama pull llama3.2:3b-fp16   # full precision (~6.5 GB)\nollama pull qwen3:8b-q8_0      # explicit 8-bit quantization',
        },
      },
      { h2: 'Picking the right one' },
      {
        ul: [
          '**8 GB RAM / no GPU** — stick to 1B–3B models at q4.',
          '**16 GB VRAM** — comfortable with 7B–8B models; a 14B at q4 may fit.',
          '**24 GB+** — 14B–32B models open up.',
          'Two 8B models loaded at once need ~16 GB — they share VRAM.',
        ],
      },
      {
        warn: 'Out-of-memory errors? Drop to a smaller quantization (q8 → q4) or a smaller model. Reserve VRAM for the OS with `OLLAMA_GPU_OVERHEAD` (e.g. `524288000` for 512 MB).',
      },
      {
        note: 'There are specialist models too: coding models (e.g. Qwen Coder, DeepSeek-Coder), vision models (gemma3, llava), reasoning models (gpt-oss, deepseek-r1), and embedding models (nomic-embed-text). Match the model to the job.',
      },
    ],
  },
  {
    id: 'oll-params',
    act: 1,
    idx: 6,
    title: 'Tuning Inference',
    lede: 'Temperature, context window, and the knobs that change how a model responds.',
    body: [
      { h2: 'The parameters that matter most' },
      {
        ul: [
          '**temperature** (0–2) — randomness. `0` is deterministic and focused; `0.8`+ is creative. Use low temps for code and extraction, higher for brainstorming.',
          '**num_ctx** — the context window in tokens (how much it can “remember”). Default is often 4096. Raise it for long documents — but it costs memory.',
          '**num_predict** — max tokens to generate in the response.',
          '**top_p / top_k** — alternative sampling controls; usually leave at defaults.',
          '**seed** — fix it for reproducible output (with temperature 0).',
        ],
      },
      { h2: 'Setting them at runtime' },
      {
        p: 'The `-p` flag changes a parameter for a single run — no Modelfile needed. You can stack several:',
      },
      {
        code: {
          lang: 'bash',
          c: '# Bigger context, lower temperature\nollama run qwen3:14b -p num_ctx=32768 -p temperature=0.5\n\n# Deterministic coding run\nollama run qwen3-coder -p temperature=0 -p num_ctx=65536',
        },
      },
      {
        p: 'Inside interactive mode you can also use `/set parameter temperature 0.2`. In code or curl, pass an `options` object on the request.',
      },
      {
        tip: '**Reach for temperature first.** It has the biggest, most predictable effect. Set `0` when you need the same answer every time (tests, data extraction, tool calls); raise it when variety helps.',
      },
      {
        warn: 'A huge `num_ctx` isn’t free — it can blow past your VRAM and force the model onto CPU, making it crawl. Increase it only as far as your documents actually need.',
      },
      {
        note: 'To make settings permanent for a model, bake them into a **Modelfile** with `PARAMETER` directives — the first lesson of the next act.',
      },
    ],
  },
]

export function getLessonsForAct(act: number): Lesson[] {
  return LESSONS.filter((l) => l.act === act).sort((a, b) => a.idx - b.idx)
}

export function getLessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id)
}
