export interface EnemyDef {
  id: string
  name: string
  maxHp: number
  attack: number
  defense: number
  xpReward: number
  act: 1 | 2 | 3 | 4
  isBoss: boolean
  dialogue: {
    onAppear: string
    onHit: string
    onDefeat: string
  }
}

export const ENEMIES: EnemyDef[] = [
  // Act I regulars
  { id: 'spinning-cursor', name: 'Spinning Cursor', maxHp: 40, attack: 8, defense: 0, xpReward: 15, act: 1, isBoss: false,
    dialogue: { onAppear: "Round and round… round and round…", onHit: "S-still spinning!", onDefeat: "…resolved." } },
  { id: 'cloud-invoice', name: 'Cloud Invoice', maxHp: 50, attack: 10, defense: 2, xpReward: 18, act: 1, isBoss: false,
    dialogue: { onAppear: "$0.0004 per token. Every. Single. One.", onHit: "That's a compute surcharge.", onDefeat: "Invoice… cancelled." } },
  { id: 'driver-missing', name: 'Driver Missing', maxHp: 35, attack: 12, defense: 0, xpReward: 14, act: 1, isBoss: false,
    dialogue: { onAppear: "ERROR: CUDA driver not found. Install? [Y/N]", onHit: "Segmentation fault.", onDefeat: "Driver located. Loading…" } },
  { id: 'stack-overflow', name: 'Stack Overflow', maxHp: 55, attack: 9, defense: 1, xpReward: 20, act: 1, isBoss: false,
    dialogue: { onAppear: "Maximum recursion depth exceeded.", onHit: "Stack unwind initiated.", onDefeat: "Tail call optimized." } },
  // Act I boss
  { id: 'frozen-boot', name: 'The Frozen Boot', maxHp: 120, attack: 14, defense: 3, xpReward: 100, act: 1, isBoss: true,
    dialogue: { onAppear: "BRRR… BRRR… BRRR… It just keeps spinning. The boot never completes.", onHit: "KERNEL PANIC—no wait, still spinning.", onDefeat: "…connection established. At last." } },

  // Act II regulars
  { id: 'config-error', name: 'Config Error', maxHp: 60, attack: 13, defense: 2, xpReward: 22, act: 2, isBoss: false,
    dialogue: { onAppear: "Unexpected token } at line 47.", onHit: "Validation failed.", onDefeat: "Config parsed successfully." } },
  { id: 'api-timeout', name: 'API Timeout', maxHp: 65, attack: 11, defense: 3, xpReward: 20, act: 2, isBoss: false,
    dialogue: { onAppear: "408 Request Timeout. Try again later. Or don't.", onHit: "Connection dropped.", onDefeat: "200 OK." } },
  { id: 'dependency-hell', name: 'Dependency Hell', maxHp: 70, attack: 15, defense: 1, xpReward: 25, act: 2, isBoss: false,
    dialogue: { onAppear: "peer requires 'foo@^1.0' but 'foo@2.3.1' is installed.", onHit: "Circular dependency detected.", onDefeat: "npm install --legacy-peer-deps… done." } },
  { id: 'json-syntax', name: 'JSON Syntax Error', maxHp: 55, attack: 12, defense: 2, xpReward: 18, act: 2, isBoss: false,
    dialogue: { onAppear: "SyntaxError: Unexpected token ' in JSON at position 0.", onHit: "Invalid escape sequence.", onDefeat: "JSON.parse complete." } },
  // Act II boss
  { id: 'rate-limiter', name: 'The Rate Limiter', maxHp: 150, attack: 18, defense: 5, xpReward: 100, act: 2, isBoss: true,
    dialogue: { onAppear: "429 Too Many Requests. You shall not pass this frequently.", onHit: "Your quota is being consumed.", onDefeat: "Rate limit lifted. Proceed, Operator." } },

  // Act III regulars
  { id: 'dim-mismatch', name: 'Dim Mismatch', maxHp: 75, attack: 16, defense: 2, xpReward: 28, act: 3, isBoss: false,
    dialogue: { onAppear: "Expected 768 dimensions, got 384. Incompatible vector spaces.", onHit: "Cosine similarity undefined.", onDefeat: "Dimension aligned." } },
  { id: 'oom-vector', name: 'OOM Vector', maxHp: 80, attack: 14, defense: 4, xpReward: 26, act: 3, isBoss: false,
    dialogue: { onAppear: "Out of memory. Cannot allocate 4.2 GB.", onHit: "Swap exhausted.", onDefeat: "Memory freed." } },
  { id: 'null-embedding', name: 'Null Embedding', maxHp: 65, attack: 18, defense: 1, xpReward: 25, act: 3, isBoss: false,
    dialogue: { onAppear: "[0.0, 0.0, 0.0, …]. Every dimension: zero.", onHit: "NaN propagating…", onDefeat: "Non-zero embedding restored." } },
  { id: 'metric-clash', name: 'Metric Clash', maxHp: 70, attack: 15, defense: 3, xpReward: 24, act: 3, isBoss: false,
    dialogue: { onAppear: "You indexed with cosine. You query with L2. The results mean nothing.", onHit: "Distance metric undefined.", onDefeat: "Metric unified." } },
  // Act III boss
  { id: 'dimensionless-beast', name: 'Dimensionless Beast', maxHp: 180, attack: 22, defense: 6, xpReward: 100, act: 3, isBoss: true,
    dialogue: { onAppear: "I exist in no vector space you can comprehend.", onHit: "Your query returns nothing.", onDefeat: "Reduced. Indexed. Found." } },

  // Act IV regulars
  { id: 'hallucinated-fact', name: 'Hallucinated Fact', maxHp: 90, attack: 20, defense: 3, xpReward: 32, act: 4, isBoss: false,
    dialogue: { onAppear: "The Eiffel Tower is located in Berlin. Trust me.", onHit: "Confidence: 99%.", onDefeat: "Grounded by retrieved context." } },
  { id: 'context-overflow', name: 'Context Overflow', maxHp: 85, attack: 18, defense: 5, xpReward: 30, act: 4, isBoss: false,
    dialogue: { onAppear: "128 000 tokens. All of them about nothing.", onHit: "Attention pattern fragmented.", onDefeat: "Context pruned." } },
  { id: 'citation-gap', name: 'Citation Gap', maxHp: 80, attack: 22, defense: 2, xpReward: 30, act: 4, isBoss: false,
    dialogue: { onAppear: "No source. No chunk. Just vibes.", onHit: "Claim unverified.", onDefeat: "Chunk cited." } },
  { id: 'rerank-roulette', name: 'Re-rank Roulette', maxHp: 95, attack: 17, defense: 4, xpReward: 28, act: 4, isBoss: false,
    dialogue: { onAppear: "Spinning the wheel of relevance… 🎰", onHit: "Wrong chunk surfaced.", onDefeat: "Cross-encoder applied." } },
  // Act IV boss
  { id: 'hallucinator', name: 'The Hallucinator', maxHp: 220, attack: 28, defense: 8, xpReward: 100, act: 4, isBoss: true,
    dialogue: { onAppear: "I am certain. I am confident. I am completely wrong.", onHit: "Probability mass misplaced.", onDefeat: "Grounded. Cited. Trusted." } },
]

export const BOSSES: EnemyDef[] = ENEMIES.filter(e => e.isBoss)

export function getEnemiesForAct(act: 1 | 2 | 3 | 4): EnemyDef[] {
  return ENEMIES.filter(e => e.act === act && !e.isBoss)
}

export function getBossForAct(act: 1 | 2 | 3 | 4): EnemyDef {
  const boss = BOSSES.find(e => e.act === act)
  if (!boss) throw new Error(`No boss for act ${act}`)
  return boss
}
