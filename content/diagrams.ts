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
}
