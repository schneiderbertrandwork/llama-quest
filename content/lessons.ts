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
]

export function getLessonsForAct(act: number): Lesson[] {
  return LESSONS.filter((l) => l.act === act).sort((a, b) => a.idx - b.idx)
}

export function getLessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id)
}
