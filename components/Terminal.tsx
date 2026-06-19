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
