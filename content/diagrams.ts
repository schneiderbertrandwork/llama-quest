export interface DiagramDef {
  key: string
  caption: string
  svg: string // raw SVG markup string
}

// Migrated from localhost-quest.html DIAGRAMS object
export const DIAGRAMS: Record<string, DiagramDef> = {
  arch: {
    key: 'arch',
    caption: 'Ollama architecture: client → server → model',
    svg: `<svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="40" width="100" height="40" rx="6" fill="#ffb061" opacity="0.9"/>
      <text x="60" y="65" text-anchor="middle" font-size="13" fill="#1a1a2e">Your App</text>
      <line x1="110" y1="60" x2="150" y2="60" stroke="#fff" stroke-width="2" marker-end="url(#arr)"/>
      <rect x="150" y="40" width="100" height="40" rx="6" fill="#ffb061" opacity="0.9"/>
      <text x="200" y="65" text-anchor="middle" font-size="13" fill="#1a1a2e">Ollama Server</text>
      <line x1="250" y1="60" x2="290" y2="60" stroke="#fff" stroke-width="2" marker-end="url(#arr)"/>
      <rect x="290" y="40" width="100" height="40" rx="6" fill="#ffb061" opacity="0.9"/>
      <text x="340" y="65" text-anchor="middle" font-size="13" fill="#1a1a2e">LLM Model</text>
      <defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#fff"/></marker></defs>
    </svg>`,
  },
  modelfile: {
    key: 'modelfile',
    caption: 'Modelfile layers config on top of a base model',
    svg: `<svg viewBox="0 0 400 140" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="80" width="120" height="40" rx="6" fill="#ffb061" opacity="0.9"/>
      <text x="90" y="105" text-anchor="middle" font-size="12" fill="#1a1a2e">Base Model</text>
      <rect x="30" y="30" width="120" height="40" rx="6" fill="#c0a060" opacity="0.9"/>
      <text x="90" y="55" text-anchor="middle" font-size="12" fill="#1a1a2e">Modelfile</text>
      <line x1="90" y1="70" x2="90" y2="80" stroke="#fff" stroke-width="2" marker-end="url(#arr2)"/>
      <line x1="160" y1="100" x2="210" y2="100" stroke="#fff" stroke-width="2" marker-end="url(#arr2)"/>
      <rect x="210" y="70" width="140" height="60" rx="6" fill="#ffb061" opacity="0.9"/>
      <text x="280" y="95" text-anchor="middle" font-size="12" fill="#1a1a2e">Custom Model</text>
      <text x="280" y="115" text-anchor="middle" font-size="10" fill="#1a1a2e">(ollama create)</text>
      <defs><marker id="arr2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#fff"/></marker></defs>
    </svg>`,
  },
  reqflow: {
    key: 'reqflow',
    caption: 'Ollama REST API request/response flow',
    svg: `<svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="40" width="90" height="40" rx="6" fill="#ffb061" opacity="0.9"/>
      <text x="55" y="65" text-anchor="middle" font-size="11" fill="#1a1a2e">Client</text>
      <line x1="100" y1="55" x2="150" y2="55" stroke="#fff" stroke-width="2" marker-end="url(#arr3)"/>
      <text x="125" y="48" text-anchor="middle" font-size="9" fill="#aaa">POST /api/chat</text>
      <rect x="150" y="30" width="100" height="60" rx="6" fill="#ffb061" opacity="0.9"/>
      <text x="200" y="60" text-anchor="middle" font-size="11" fill="#1a1a2e">Ollama</text>
      <text x="200" y="75" text-anchor="middle" font-size="10" fill="#1a1a2e">:11434</text>
      <line x1="250" y1="55" x2="300" y2="55" stroke="#fff" stroke-width="2" marker-end="url(#arr3)"/>
      <rect x="300" y="40" width="90" height="40" rx="6" fill="#ffb061" opacity="0.9"/>
      <text x="345" y="65" text-anchor="middle" font-size="11" fill="#1a1a2e">Model</text>
      <line x1="300" y1="75" x2="250" y2="75" stroke="#7ec8e3" stroke-width="2" marker-end="url(#arr3b)"/>
      <line x1="150" y1="75" x2="100" y2="75" stroke="#7ec8e3" stroke-width="2" marker-end="url(#arr3b)"/>
      <text x="125" y="90" text-anchor="middle" font-size="9" fill="#7ec8e3">stream/JSON</text>
      <defs>
        <marker id="arr3" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#fff"/></marker>
        <marker id="arr3b" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#7ec8e3"/></marker>
      </defs>
    </svg>`,
  },
  toolloop: {
    key: 'toolloop',
    caption: 'Tool calling loop: model → your code → model',
    svg: `<svg viewBox="0 0 400 160" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="60" width="100" height="40" rx="6" fill="#ffb061" opacity="0.9"/>
      <text x="70" y="85" text-anchor="middle" font-size="12" fill="#1a1a2e">LLM Model</text>
      <line x1="120" y1="75" x2="170" y2="75" stroke="#fff" stroke-width="2" marker-end="url(#arr4)"/>
      <text x="145" y="68" text-anchor="middle" font-size="9" fill="#aaa">tool_calls</text>
      <rect x="170" y="50" width="110" height="60" rx="6" fill="#c0a060" opacity="0.9"/>
      <text x="225" y="78" text-anchor="middle" font-size="11" fill="#1a1a2e">Your Code</text>
      <text x="225" y="95" text-anchor="middle" font-size="10" fill="#1a1a2e">executes fn</text>
      <line x1="280" y1="75" x2="330" y2="75" stroke="#fff" stroke-width="2" marker-end="url(#arr4)"/>
      <rect x="330" y="60" width="55" height="40" rx="6" fill="#ffb061" opacity="0.9"/>
      <text x="357" y="85" text-anchor="middle" font-size="10" fill="#1a1a2e">Result</text>
      <path d="M357 100 Q357 140 225 140 Q120 140 70 115" stroke="#7ec8e3" stroke-width="2" fill="none" marker-end="url(#arr4b)"/>
      <text x="200" y="155" text-anchor="middle" font-size="9" fill="#7ec8e3">role:tool result → continue</text>
      <defs>
        <marker id="arr4" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#fff"/></marker>
        <marker id="arr4b" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#7ec8e3"/></marker>
      </defs>
    </svg>`,
  },
  embed: {
    key: 'embed',
    caption: 'Text → embedding vector (semantic meaning as numbers)',
    svg: `<svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="40" width="100" height="40" rx="6" fill="#ffb061" opacity="0.9"/>
      <text x="60" y="65" text-anchor="middle" font-size="11" fill="#1a1a2e">"Hello world"</text>
      <line x1="110" y1="60" x2="150" y2="60" stroke="#fff" stroke-width="2" marker-end="url(#arr5)"/>
      <rect x="150" y="30" width="110" height="60" rx="6" fill="#ffb061" opacity="0.9"/>
      <text x="205" y="58" text-anchor="middle" font-size="11" fill="#1a1a2e">Embedding</text>
      <text x="205" y="75" text-anchor="middle" font-size="10" fill="#1a1a2e">Model</text>
      <line x1="260" y1="60" x2="300" y2="60" stroke="#fff" stroke-width="2" marker-end="url(#arr5)"/>
      <rect x="300" y="35" width="90" height="50" rx="6" fill="#7ec8e3" opacity="0.8"/>
      <text x="345" y="58" text-anchor="middle" font-size="10" fill="#1a1a2e">[0.12, -0.04,</text>
      <text x="345" y="73" text-anchor="middle" font-size="10" fill="#1a1a2e">0.87, ...]</text>
      <defs><marker id="arr5" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#fff"/></marker></defs>
    </svg>`,
  },
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
}
