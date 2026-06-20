// components/PSIAttack.tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { QuizQuestion } from '../content/qbank'

interface PSIAttackProps {
  question: QuizQuestion
  onAnswer: (idx: 0 | 1 | 2 | 3) => void
  result: 'none' | 'correct' | 'wrong'
}

const INDICES = [0, 1, 2, 3] as const

export function PSIAttack({ question, onAnswer, result }: PSIAttackProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.q}</Text>
      {INDICES.map((i) => (
        <TouchableOpacity
          key={i}
          style={[styles.choice, result !== 'none' && styles.choiceDisabled]}
          onPress={() => onAnswer(i)}
          disabled={result !== 'none'}
        >
          <Text style={styles.choiceText}>{String.fromCharCode(65 + i)}. {question.a[i]}</Text>
        </TouchableOpacity>
      ))}
      {result !== 'none' && (
        <Text style={[styles.why, result === 'correct' ? styles.correct : styles.wrong]}>
          {result === 'correct' ? '✓ ' : '✗ '}{question.why}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 6, width: '100%', maxWidth: 480 },
  questionText: { color: '#ece9ff', fontFamily: 'monospace', fontSize: 12, marginBottom: 4, lineHeight: 18 },
  choice: { backgroundColor: '#1b1740', borderWidth: 1, borderColor: '#4a3f8c', borderRadius: 4, padding: 8 },
  choiceDisabled: { opacity: 0.6 },
  choiceText: { color: '#ece9ff', fontFamily: 'monospace', fontSize: 11 },
  why: { fontFamily: 'monospace', fontSize: 11, marginTop: 4, lineHeight: 16 },
  correct: { color: '#4caf50' },
  wrong: { color: '#f44336' },
})
