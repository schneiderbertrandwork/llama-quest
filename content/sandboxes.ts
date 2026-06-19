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
