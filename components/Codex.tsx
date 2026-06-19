import React from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { Lesson, BlockType } from '../content/lessons'

interface CodexProps {
  lesson: Lesson
  onBack: () => void
}

function md(text: string): string {
  // Strip inline markdown for plain text rendering (bold, code, kbd)
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[\[(.*?)\]\]/g, '[$1]')
}

function renderBlock(block: BlockType, idx: number): React.ReactNode {
  if ('h2' in block) return (
    <Text key={idx} style={styles.h2}>
      {block.h2}
    </Text>
  )
  if ('p' in block) return (
    <Text key={idx} style={styles.p}>
      {md(block.p)}
    </Text>
  )
  if ('ul' in block) return (
    <View key={idx} style={styles.ul}>
      {block.ul.map((item, i) => (
        <Text key={i} style={styles.li}>
          {'• '}
          {md(item)}
        </Text>
      ))}
    </View>
  )
  if ('code' in block) return (
    <View key={idx} style={styles.codeBlock}>
      <Text style={styles.codeLang}>{block.code.lang}</Text>
      <Text style={styles.codeText}>{block.code.c}</Text>
    </View>
  )
  if ('tip' in block) return (
    <View key={idx} style={[styles.callout, styles.tip]}>
      <Text style={styles.calloutText}>💡 {md(block.tip)}</Text>
    </View>
  )
  if ('warn' in block) return (
    <View key={idx} style={[styles.callout, styles.warn]}>
      <Text style={styles.calloutText}>⚠️ {md(block.warn)}</Text>
    </View>
  )
  if ('note' in block) return (
    <View key={idx} style={[styles.callout, styles.note]}>
      <Text style={styles.calloutText}>{md(block.note)}</Text>
    </View>
  )
  if ('prism' in block) return (
    <View key={idx} style={[styles.callout, styles.prism]}>
      <Text style={styles.calloutText}>{md(block.prism)}</Text>
    </View>
  )
  if ('diagram' in block) return (
    <Text key={idx} style={styles.diagramPlaceholder}>
      [Diagram: {block.diagram}]
    </Text>
  )
  return null
}

export function Codex({ lesson, onBack }: CodexProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{lesson.title}</Text>
      <Text style={styles.lede}>{lesson.lede}</Text>
      <View style={styles.divider} />
      {lesson.body.map((block, idx) => renderBlock(block, idx))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  content: { padding: 20 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#7ec8e3', fontFamily: 'monospace', fontSize: 13 },
  title: {
    color: '#f5c518',
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  lede: {
    color: '#aaa',
    fontFamily: 'monospace',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  divider: { height: 1, backgroundColor: '#333', marginBottom: 16 },
  h2: {
    color: '#7ec8e3',
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  p: {
    color: '#ddd',
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  ul: { marginBottom: 10 },
  li: {
    color: '#ddd',
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
    paddingLeft: 8,
  },
  codeBlock: {
    backgroundColor: '#1a1a2e',
    borderLeftWidth: 3,
    borderLeftColor: '#c0a060',
    padding: 12,
    marginBottom: 12,
    borderRadius: 4,
  },
  codeLang: { color: '#c0a060', fontFamily: 'monospace', fontSize: 10, marginBottom: 4 },
  codeText: { color: '#c8f0c8', fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
  callout: { borderRadius: 4, padding: 12, marginBottom: 12 },
  tip: { backgroundColor: '#1a2e1a', borderLeftWidth: 3, borderLeftColor: '#4caf50' },
  warn: { backgroundColor: '#2e1a0d', borderLeftWidth: 3, borderLeftColor: '#ff9800' },
  note: { backgroundColor: '#1a1a2e', borderLeftWidth: 3, borderLeftColor: '#7ec8e3' },
  prism: { backgroundColor: '#1a0d2e', borderLeftWidth: 3, borderLeftColor: '#a06bff' },
  calloutText: { color: '#ddd', fontFamily: 'monospace', fontSize: 13, lineHeight: 20 },
  diagramPlaceholder: {
    color: '#555',
    fontFamily: 'monospace',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 4,
    marginBottom: 12,
  },
})
