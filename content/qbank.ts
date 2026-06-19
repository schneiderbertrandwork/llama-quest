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
  'oll-install': [
    { q: "By default, the Ollama server listens on:", a: ["localhost:11434", "localhost:8080", "localhost:443", "localhost:5000"], c: 0, why: "Port **11434** on localhost is the address everything else depends on.", lessonId: 'oll-install' },
    { q: "On a headless Linux box, which command starts the server?", a: ["ollama serve", "ollama start", "ollama daemon", "ollama up"], c: 0, why: "`ollama serve` launches the daemon manually; desktop apps do this for you.", lessonId: 'oll-install' },
    { q: "A command fails with \"could not connect.\" Most likely cause?", a: ["The server isn't running", "Your model name is misspelled", "You have no GPU", "Your API key expired"], c: 0, why: "Every command is an HTTP call to the local server — if it can't connect, the daemon is down.", lessonId: 'oll-install' },
    { q: "Quick health check that lists installed models via the API:", a: ["curl http://localhost:11434/api/tags", "curl .../api/health", "curl .../ping", "curl .../status"], c: 0, why: "`/api/tags` returns your installed models — a simple way to confirm the server is alive.", lessonId: 'oll-install' },
  ],
  'oll-run': [
    { q: "`ollama run llama3.2` when the model isn't present yet will:", a: ["Download it first, then open an interactive chat", "Throw an error", "Only download, never chat", "Chat using a blank model"], c: 0, why: "`run` = pull-if-needed **then** chat.", lessonId: 'oll-run' },
    { q: "In `qwen3:8b`, what does the `8b` after the colon mean?", a: ["A tag selecting the model size/variant", "A file path", "The temperature", "The context length"], c: 0, why: "The text after the colon is a **tag** — usually a size or quantization.", lessonId: 'oll-run' },
    { q: "How do you download a model without starting a chat?", a: ["ollama pull <model>", "ollama get <model>", "ollama download <model>", "ollama fetch <model>"], c: 0, why: "`ollama pull` grabs the model and exits.", lessonId: 'oll-run' },
    { q: "Where do you browse all available models and their tags?", a: ["ollama.com/library", "hub.docker.com", "pypi.org", "npmjs.com"], c: 0, why: "The model library lists every model and tag you can pull.", lessonId: 'oll-run' },
  ],
  'oll-manage': [
    { q: "List the models you've already downloaded:", a: ["ollama list", "ollama models", "ollama ps", "ollama all"], c: 0, why: "`ollama list` (alias `ls`) shows what's on disk. `ps` shows what's *running*.", lessonId: 'oll-manage' },
    { q: "See which models are currently loaded in memory:", a: ["ollama ps", "ollama list", "ollama top", "ollama mem"], c: 0, why: "`ollama ps` is like the Unix `ps` — it shows running models.", lessonId: 'oll-manage' },
    { q: "Remove a model from disk:", a: ["ollama rm <model>", "ollama delete <model>", "ollama uninstall <model>", "ollama clear <model>"], c: 0, why: "`ollama rm` deletes the model's files.", lessonId: 'oll-manage' },
    { q: "Inspect a model's parameters, template, and license:", a: ["ollama show <model>", "ollama info <model>", "ollama inspect <model>", "ollama cat <model>"], c: 0, why: "`ollama show` prints the model's metadata and Modelfile details.", lessonId: 'oll-manage' },
  ],
  'oll-models': [
    { q: "A \"7B\" model refers to roughly:", a: ["7 billion parameters", "7 gigabytes, always", "7 layers", "7 thousand tokens"], c: 0, why: "The B = **billions of parameters**, a rough proxy for capability and memory cost.", lessonId: 'oll-models' },
    { q: "By default, which quantization does Ollama download for most models?", a: ["Q4_K_M (a 4-bit quant)", "fp32", "fp16", "Q2_K"], c: 0, why: "`Q4_K_M` is the common default — a good balance of quality and size.", lessonId: 'oll-models' },
    { q: "On a machine with limited RAM/VRAM, the safer choice is generally:", a: ["A smaller or more-quantized model", "The largest model available", "Two big models at once", "Always fp16"], c: 0, why: "Smaller/quantized models fit in memory and still perform well for many tasks.", lessonId: 'oll-models' },
    { q: "Quantization mainly trades:", a: ["A little quality for much lower memory and size", "Privacy for cost", "Tokens for context", "Speed for accuracy only"], c: 0, why: "Lower precision shrinks the model with usually minor quality loss.", lessonId: 'oll-models' },
  ],
  'oll-params': [
    { q: "Which CLI flag stackably sets runtime parameters?", a: ["-p (e.g. -p num_ctx=8192 -p temperature=0.2)", "--config", "-e", "--set"], c: 0, why: "Repeat `-p key=value` to layer multiple runtime settings.", lessonId: 'oll-params' },
    { q: "`num_ctx` controls:", a: ["The context window size (tokens the model can see)", "The number of CPU cores", "The temperature", "The GPU count"], c: 0, why: "A larger `num_ctx` lets the model consider more text at once (at higher memory cost).", lessonId: 'oll-params' },
    { q: "Lowering `temperature` toward 0 makes output:", a: ["More deterministic and focused", "More random", "Longer", "Faster only"], c: 0, why: "Low temperature = less randomness — ideal for factual / structured tasks.", lessonId: 'oll-params' },
    { q: "In an API request, runtime parameters like temperature live inside:", a: ["the options object", "the HTTP headers", "the URL path", "the model's name"], c: 0, why: "Set them under `options` in the JSON body.", lessonId: 'oll-params' },
  ],
  'oll-modelfile': [
    { q: "The only **required** directive in a Modelfile is:", a: ["FROM", "SYSTEM", "PARAMETER", "TEMPLATE"], c: 0, why: "`FROM` names the base model; everything else is optional.", lessonId: 'oll-modelfile' },
    { q: "To give a model a persistent persona / standing instructions, use:", a: ["SYSTEM", "PROMPT", "ROLE", "PERSONA"], c: 0, why: "`SYSTEM` sets the system prompt baked into the model.", lessonId: 'oll-modelfile' },
    { q: "Build a custom model from a Modelfile with:", a: ["ollama create <name> -f Modelfile", "ollama build", "ollama make", "ollama compile"], c: 0, why: "`ollama create name -f Modelfile` produces a new reusable model.", lessonId: 'oll-modelfile' },
    { q: "`PARAMETER temperature 0.2` in a Modelfile does what?", a: ["Bakes in a default runtime setting", "Imports another model", "Sets the license", "Defines a tool"], c: 0, why: "PARAMETER lines store default options so you don't pass them every run.", lessonId: 'oll-modelfile' },
  ],
  'oll-api': [
    { q: "The endpoint for multi-turn conversational chat is:", a: ["/api/chat", "/api/generate", "/api/complete", "/api/talk"], c: 0, why: "`/api/chat` takes a `messages` array; `/api/generate` takes a single prompt.", lessonId: 'oll-api' },
    { q: "To get one complete JSON object instead of a token stream, set:", a: ["stream: false", "stream: 0", "once: true", "format: text"], c: 0, why: "`\"stream\": false` returns a single response object.", lessonId: 'oll-api' },
    { q: "`/api/generate` differs from `/api/chat` because it:", a: ["Takes a single prompt, not a messages array", "Streams only", "Needs no model", "Is only for embeddings"], c: 0, why: "`generate` is the simpler single-prompt completion endpoint.", lessonId: 'oll-api' },
    { q: "All of Ollama's REST endpoints are served from:", a: ["http://localhost:11434", "a cloud URL", "port 443 only", "the /v1 path only"], c: 0, why: "Everything lives under the local server at port 11434.", lessonId: 'oll-api' },
  ],
  'oll-openai': [
    { q: "The OpenAI-compatible base URL for Ollama is:", a: ["http://localhost:11434/v1", "http://localhost:11434/openai", "http://localhost:11434/compat", "https://api.openai.com/v1"], c: 0, why: "Point the OpenAI SDK's `base_url` at `/v1` on the local server.", lessonId: 'oll-openai' },
    { q: "What do you pass as the API key to the compatible endpoint?", a: ["Any non-empty string, e.g. `ollama`", "Your real OpenAI key", "Nothing — it errors without one", "A paid token"], c: 0, why: "The key is ignored but must be present; `ollama` is the convention.", lessonId: 'oll-openai' },
    { q: "The main point of the OpenAI-compatible layer is:", a: ["Reuse existing OpenAI SDK code by changing base_url", "Faster inference", "Smaller models", "Automatic RAG"], c: 0, why: "Drop-in compatibility: change the base URL and most OpenAI code just works.", lessonId: 'oll-openai' },
    { q: "Chat completions via the compat layer hit which path?", a: ["/v1/chat/completions", "/api/chat", "/v1/generate", "/chat"], c: 0, why: "It mirrors OpenAI's `/v1/chat/completions` route.", lessonId: 'oll-openai' },
  ],
  'oll-structured': [
    { q: "To force the model to return JSON matching a shape, set the request's:", a: ["format to a JSON schema", "temperature to 0", "stream to false", "model to json"], c: 0, why: "The `format` field accepts a JSON schema (or the string `json`) to constrain output.", lessonId: 'oll-structured' },
    { q: "In Python, a clean way to produce that schema is:", a: ["MyModel.model_json_schema()", "json.dumps(MyModel)", "str(MyModel)", "MyModel.schema_str()"], c: 0, why: "Pydantic's `.model_json_schema()` gives you a schema to drop into `format`.", lessonId: 'oll-structured' },
    { q: "Structured outputs are most useful when you need to:", a: ["Reliably parse the answer into fields", "Make the model faster", "Shrink the model", "Enable streaming"], c: 0, why: "They guarantee machine-parseable shape, so downstream code won't choke.", lessonId: 'oll-structured' },
    { q: "Besides a full schema, `format` also accepts the simple value:", a: ["the string `json`", "`yaml`", "`strict`", "`auto`"], c: 0, why: "Passing `\"json\"` asks for valid JSON without a specific schema.", lessonId: 'oll-structured' },
  ],
  'oll-tools': [
    { q: "After the model returns `tool_calls`, your code should:", a: ["Run the tool, then send the result back as a tool message", "Ignore them", "Stop and answer yourself", "Re-ask the user"], c: 0, why: "You execute the function and feed the result back so the model can finish.", lessonId: 'oll-tools' },
    { q: "The tool result is appended to the conversation with role:", a: ["tool", "function", "system", "assistant"], c: 0, why: "Add a message with `role: \"tool\"` carrying the function's output.", lessonId: 'oll-tools' },
    { q: "Tool calling lets a model:", a: ["Trigger your functions to fetch data or take actions", "Browse the web by itself", "Train itself", "Embed text"], c: 0, why: "It bridges the model to real code — APIs, databases, calculators.", lessonId: 'oll-tools' },
    { q: "Which model families support tool calling in Ollama?", a: ["Llama 3.1+, Qwen 2.5/Qwen3, Mistral", "Embedding models only", "Vision-only models", "None of them"], c: 0, why: "Tool use requires a tool-capable model like Llama 3.1+, Qwen, or Mistral.", lessonId: 'oll-tools' },
  ],
  'oll-multimodal': [
    { q: "To send an image to a vision model via the API, you provide:", a: ["base64 image data in an `images` array", "a file path in the URL", "an HTML <img> tag", "a vector"], c: 0, why: "The API takes base64-encoded images in the `images` field of the message.", lessonId: 'oll-multimodal' },
    { q: "Which model is suited to image understanding?", a: ["llava or gemma3", "nomic-embed-text", "a quant tag", "llama-guard"], c: 0, why: "`llava` and `gemma3` are multimodal (vision) models.", lessonId: 'oll-multimodal' },
    { q: "For reasoning models, you enable step-by-step thinking with:", a: ["think=True (then read .message.thinking)", "reason:true", "cot:1", "deep:yes"], c: 0, why: "Reasoning models expose their thought process via the `think` option.", lessonId: 'oll-multimodal' },
    { q: "Which is a reasoning-focused model family?", a: ["deepseek-r1 / gpt-oss", "llava", "all-MiniLM", "bge-small"], c: 0, why: "`deepseek-r1` and `gpt-oss` are built for explicit reasoning.", lessonId: 'oll-multimodal' },
  ],
  'oll-embed': [
    { q: "The current API endpoint to create embeddings is:", a: ["/api/embed", "/api/vector", "/v1/embed-text", "/api/encode"], c: 0, why: "`/api/embed` is current; the older `/api/embeddings` still exists for compatibility.", lessonId: 'oll-embed' },
    { q: "You should embed text with:", a: ["A dedicated embedding model like nomic-embed-text", "A chat model like llama3.2", "Any model — they're identical", "A vision model"], c: 0, why: "Embedding models are trained to output meaningful vectors; chat models are not.", lessonId: 'oll-embed' },
    { q: "`nomic-embed-text` produces vectors of how many dimensions?", a: ["768", "384", "1024", "1536"], c: 0, why: "768 dims for nomic-embed-text; mxbai-embed-large is 1024.", lessonId: 'oll-embed' },
    { q: "An embedding is best described as:", a: ["A list of numbers capturing the text's meaning", "A short summary sentence", "A hash of the text", "A token count"], c: 0, why: "It's a dense numeric vector positioning the text in meaning-space.", lessonId: 'oll-embed' },
  ],
  'oll-ops': [
    { q: "To make Ollama reachable from other machines, you set:", a: ["OLLAMA_HOST=0.0.0.0 (and then secure it)", "OLLAMA_PUBLIC=1", "OLLAMA_OPEN=true", "nothing — it's open by default"], c: 0, why: "Binding to 0.0.0.0 exposes it on the network — add auth/firewalling since it's unauthenticated.", lessonId: 'oll-ops' },
    { q: "By default, an idle model is unloaded from memory after about:", a: ["5 minutes", "30 seconds", "1 hour", "never"], c: 0, why: "The default keep-alive is ~5 minutes of inactivity.", lessonId: 'oll-ops' },
    { q: "To keep a model loaded in memory indefinitely, set keep_alive to:", a: ["-1", "0", "1", "\"max\""], c: 0, why: "`keep_alive: -1` keeps it loaded forever; `0` unloads immediately after the call.", lessonId: 'oll-ops' },
    { q: "In Docker, persisting downloaded models across restarts requires:", a: ["A volume mounted at /root/.ollama", "--net host", "OLLAMA_SAVE=1", "nothing, it's automatic"], c: 0, why: "Mount a volume to `/root/.ollama` so models survive container recreation.", lessonId: 'oll-ops' },
  ],
  'chr-vectors': [
    { q: "In a vector database, similarity between two texts is computed from:", a: ["The distance between their embedding vectors", "Their character count", "Alphabetical order", "Their file size"], c: 0, why: "Search compares **vectors**, not words — that's why it captures meaning.", lessonId: 'chr-vectors' },
    { q: "Two documents with similar meaning have embeddings that are:", a: ["Close together in vector space", "Far apart", "Byte-identical", "Always orthogonal"], c: 0, why: "Closeness in the space ≈ closeness in meaning.", lessonId: 'chr-vectors' },
    { q: "For text similarity, the usually-recommended distance metric is:", a: ["cosine", "manhattan", "hamming", "jaccard"], c: 0, why: "Cosine compares direction (meaning) and is the standard for text embeddings.", lessonId: 'chr-vectors' },
    { q: "With cosine distance, \"more similar\" means the distance value is:", a: ["Smaller", "Larger", "Always negative", "Exactly 1"], c: 0, why: "Lower distance = closer = more similar.", lessonId: 'chr-vectors' },
  ],
  'chr-intro': [
    { q: "To install ChromaDB for local use you run:", a: ["pip install chromadb", "npm install chroma", "pip install chroma-client", "apt install chroma"], c: 0, why: "The local package is `chromadb` (the `chromadb-client` package is for remote-only use).", lessonId: 'chr-intro' },
    { q: "For a database that persists to disk (the everyday choice), use:", a: ["PersistentClient(path=...)", "Client()", "EphemeralClient()", "HttpClient()"], c: 0, why: "`PersistentClient` writes to a folder so your data survives restarts.", lessonId: 'chr-intro' },
    { q: "`EphemeralClient()` (same as `Client()`) stores data:", a: ["In memory only — lost on exit", "On disk", "In the cloud", "Inside Ollama"], c: 0, why: "Great for tests; nothing is saved when the process ends.", lessonId: 'chr-intro' },
    { q: "To connect to a Chroma server running on another host:", a: ["HttpClient(host, port)", "RemoteClient()", "PersistentClient()", "Client(remote=True)"], c: 0, why: "`HttpClient` talks to a running `chroma run` server.", lessonId: 'chr-intro' },
  ],
  'chr-collections': [
    { q: "The safest way to create-or-reuse a collection is:", a: ["get_or_create_collection(name)", "create_collection(name) only", "get_collection(name) only", "Collection(name)"], c: 0, why: "It returns the existing one or makes a new one — no crash either way.", lessonId: 'chr-collections' },
    { q: "A collection is roughly analogous to:", a: ["A table in a database", "A single row", "A whole database file", "An index file"], c: 0, why: "Collections group related records (documents + vectors + metadata).", lessonId: 'chr-collections' },
    { q: "To set the distance metric on a collection, you pass:", a: ["metadata={'hnsw:space':'cosine'}", "distance='cosine'", "metric='cosine'", "space=cosine"], c: 0, why: "The metric is configured via the `hnsw:space` metadata key (l2 / ip / cosine).", lessonId: 'chr-collections' },
    { q: "Calling `create_collection` with a name that already exists will:", a: ["Raise an error — use get_or_create to be safe", "Silently overwrite it", "Return None", "Rename it"], c: 0, why: "`create_collection` is strict; `get_or_create_collection` is forgiving.", lessonId: 'chr-collections' },
  ],
  'chr-add': [
    { q: "At minimum, `add()` requires:", a: ["Documents (or embeddings) plus unique ids", "Just documents", "Just ids", "Only metadatas"], c: 0, why: "You always need `ids`, and either `documents` (to auto-embed) or precomputed `embeddings`.", lessonId: 'chr-add' },
    { q: "If you pass `documents` but no `embeddings`, Chroma will:", a: ["Embed them automatically with the collection's embedding function", "Reject them", "Store empty vectors", "Ask you to embed first"], c: 0, why: "Auto-embedding via the collection's embedding function is the default convenience.", lessonId: 'chr-add' },
    { q: "The `ids` you supply must be:", a: ["Unique within the collection", "Sequential integers", "Equal to the document text", "Optional"], c: 0, why: "Ids are the primary key — they must be unique.", lessonId: 'chr-add' },
    { q: "Using `add()` with an id that already exists will:", a: ["Keep the original — use upsert to overwrite", "Duplicate the record", "Delete the collection", "Auto-rename it"], c: 0, why: "`add` won't overwrite; `upsert` replaces an existing id.", lessonId: 'chr-add' },
  ],
  'chr-query': [
    { q: "To search a collection by meaning you call:", a: ["query(query_texts=[...], n_results=k)", "search(...)", "find(...)", "match(...)"], c: 0, why: "`query` embeds your text and returns the nearest records.", lessonId: 'chr-query' },
    { q: "`n_results` controls:", a: ["How many nearest matches to return (top-k)", "The embedding size", "The number of collections", "The temperature"], c: 0, why: "It's your **k** — the count of results.", lessonId: 'chr-query' },
    { q: "Results are nested per query, so the first query's documents are at:", a: ["results['documents'][0]", "results['documents']", "results[0]['docs']", "results.documents.first"], c: 0, why: "Each result list is keyed, then indexed by query — hence the `[0]`.", lessonId: 'chr-query' },
    { q: "In query results, a smaller distance means the match is:", a: ["More similar to the query", "Less similar", "An error", "Ignored"], c: 0, why: "Distances sort ascending — smallest = closest.", lessonId: 'chr-query' },
  ],
  'chr-filter': [
    { q: "To restrict a query to records where topic equals \"policy\", use:", a: ["where={'topic':'policy'}", "filter='policy'", "tag='policy'", "where_text='policy'"], c: 0, why: "`where` filters on **metadata** fields.", lessonId: 'chr-filter' },
    { q: "To keep only documents whose text contains a word, use:", a: ["where_document={'$contains':'refund'}", "where={'$contains':'refund'}", "contains='refund'", "search_text='refund'"], c: 0, why: "`where_document` filters on the **document text**, not metadata.", lessonId: 'chr-filter' },
    { q: "Which is a valid metadata filter operator?", a: ["$gte", "$like", "$regex", "$near"], c: 0, why: "Chroma supports $eq/$ne/$gt/$gte/$lt/$lte/$in/$nin/$and/$or.", lessonId: 'chr-filter' },
    { q: "Metadata filtering is powerful because it:", a: ["Narrows results alongside semantic search (hybrid filtering)", "Replaces embeddings", "Speeds up embedding", "Encrypts the data"], c: 0, why: "You combine \"means this\" with \"tagged like that\" in one query.", lessonId: 'chr-filter' },
  ],
  'chr-ef': [
    { q: "By default, a Chroma collection embeds text using:", a: ["all-MiniLM-L6-v2 (384-dim)", "OpenAI ada", "nomic-embed-text", "no default — you must set one"], c: 0, why: "The built-in default is Sentence-Transformers `all-MiniLM-L6-v2`, 384 dimensions.", lessonId: 'chr-ef' },
    { q: "To use Ollama for embeddings inside Chroma, you configure:", a: ["OllamaEmbeddingFunction(url=..., model_name=...)", "a Modelfile", "OpenAIEmbeddingFunction", "nothing — it's automatic"], c: 0, why: "Chroma ships an `OllamaEmbeddingFunction` you attach to the collection.", lessonId: 'chr-ef' },
    { q: "The single most important rule about embedding functions is:", a: ["Use the SAME model to index and to query", "Use the biggest model", "Change models often", "Only embed once, ever"], c: 0, why: "Mismatched embedders produce incomparable vectors — and dimension errors.", lessonId: 'chr-ef' },
    { q: "Querying with a different-dimension embedding than the index gives:", a: ["A dimension mismatch error / garbage results", "Faster queries", "Automatic conversion", "No change"], c: 0, why: "Different models = different vector spaces; results become meaningless.", lessonId: 'chr-ef' },
  ],
  'chr-persist': [
    { q: "`PersistentClient(path='./chroma_db')` will:", a: ["Save data to that folder so it survives restarts", "Keep data only in memory", "Require a running server", "Upload to the cloud"], c: 0, why: "It persists everything to the given directory on disk.", lessonId: 'chr-persist' },
    { q: "After re-running your script with a PersistentClient, your collections are:", a: ["Still there, loaded from disk", "Gone", "Duplicated", "Read-only"], c: 0, why: "Persistence means you pick up exactly where you left off.", lessonId: 'chr-persist' },
    { q: "To run Chroma as a standalone server process:", a: ["chroma run --path ./chroma_db --port 8000", "python -m chroma", "ollama run chroma", "chroma start cloud"], c: 0, why: "`chroma run` launches a server you connect to with `HttpClient`.", lessonId: 'chr-persist' },
    { q: "Storing the embedding function on the collection (v1.1.13+) means:", a: ["get_collection can re-create it automatically", "You never need a model", "Queries become free", "Data is encrypted"], c: 0, why: "Chroma remembers how the collection was embedded, so reopening it just works.", lessonId: 'chr-persist' },
  ],
  'rag-concept': [
    { q: "RAG stands for:", a: ["Retrieval-Augmented Generation", "Random Access Generation", "Rapid AI Gateway", "Recursive Answer Graph"], c: 0, why: "Retrieve relevant text, then let the model generate using it.", lessonId: 'rag-concept' },
    { q: "The core idea of RAG is to:", a: ["Retrieve relevant context and add it to the prompt before generating", "Fine-tune the model on every query", "Replace the model entirely", "Cache previous answers"], c: 0, why: "RAG grounds the model in retrieved facts instead of retraining it.", lessonId: 'rag-concept' },
    { q: "RAG's two phases are:", a: ["Indexing (store) and querying (retrieve + generate)", "Train and test", "Encrypt and decrypt", "Compile and run"], c: 0, why: "Index once; then query as often as you like.", lessonId: 'rag-concept' },
    { q: "RAG mainly helps with:", a: ["Answering from your own / current documents and reducing hallucination", "Making the model smaller", "Faster GPUs", "Offline installs only"], c: 0, why: "It injects knowledge the base model never saw, with citations.", lessonId: 'rag-concept' },
  ],
  'rag-build': [
    { q: "In a local RAG stack, ChromaDB's job is to:", a: ["Store embeddings and retrieve the top-k relevant chunks", "Generate the final answer", "Quantize the model", "Serve a web UI"], c: 0, why: "Chroma is the retrieval layer — the searchable memory.", lessonId: 'rag-build' },
    { q: "In that same stack, Ollama's job is to:", a: ["Embed text and generate the answer", "Store vectors", "Index documents", "Host ChromaDB"], c: 0, why: "Ollama does both the embedding model and the generation model, locally.", lessonId: 'rag-build' },
    { q: "A sensible chunk size for prose is roughly:", a: ["500–1000 characters, with some overlap", "5 characters", "An entire book", "Exactly one word"], c: 0, why: "Chunks must be small enough to be specific but large enough to hold context; overlap avoids cutting ideas in half.", lessonId: 'rag-build' },
    { q: "The retrieved chunks are used by:", a: ["Inserting them into the prompt as context", "Training the model", "Deleting old data", "Setting the temperature"], c: 0, why: "Augment the prompt with the retrieved text, then ask the model to answer from it.", lessonId: 'rag-build' },
  ],
  'rag-prod': [
    { q: "To reduce hallucination, instruct the model to:", a: ["Answer only from the provided context, else say it doesn't know", "Be as creative as possible", "Ignore the context", "Always answer confidently"], c: 0, why: "Grounding instructions keep the model from inventing facts.", lessonId: 'rag-prod' },
    { q: "A re-ranking step typically:", a: ["Retrieves many candidates, then keeps the best few via a cross-encoder", "Skips retrieval", "Embeds everything twice", "Forces k=1 always"], c: 0, why: "Over-retrieve, then re-rank for precision before sending to the model.", lessonId: 'rag-prod' },
    { q: "For factual Q&A, a good temperature setting is:", a: ["Low, near 0", "High, near 1", "Exactly 2", "It doesn't matter"], c: 0, why: "Low temperature keeps answers grounded and consistent.", lessonId: 'rag-prod' },
    { q: "Asking the model to cite which chunk each claim came from improves:", a: ["Traceability and trust in the answer", "Raw speed", "Model size", "Encryption"], c: 0, why: "Citations let users verify the source of every statement.", lessonId: 'rag-prod' },
  ],
}

export function getQuestionsForAct(act: 1 | 2 | 3 | 4): QuizQuestion[] {
  const lessonIds = ACT_LESSONS[act] ?? []
  return lessonIds.flatMap(id => QBANK[id] ?? [])
}

export function getQuestionsForLesson(lessonId: string): QuizQuestion[] {
  return QBANK[lessonId] ?? []
}
