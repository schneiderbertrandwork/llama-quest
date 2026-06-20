import React, { useState } from 'react'
import { Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Codex } from '../../components/Codex'
import { getLessonsForAct } from '../../content/lessons'
import { useGameStore } from '../../store/game-store'
import { SafeAreaWrapper } from '../../components/SafeAreaWrapper'
import type { Lesson } from '../../content/lessons'

// Map building id to act number
const BUILDING_ACT: Record<string, number> = {
  'llamatown-library': 1,
  'forge-library': 2,
  'vale-library': 3,
  'ridge-library': 4,
}

export default function BuildingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { progression, markLessonRead } = useGameStore()
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)

  const act = BUILDING_ACT[id ?? ''] ?? 1
  const lessons = getLessonsForAct(act)

  function openLesson(lesson: Lesson) {
    markLessonRead(lesson.id)
    setActiveLesson(lesson)
  }

  if (activeLesson) {
    return <Codex lesson={activeLesson} onBack={() => setActiveLesson(null)} />
  }

  return (
    <SafeAreaWrapper style={styles.screen}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Exit Building</Text>
      </TouchableOpacity>
      <Text style={styles.heading}>LIBRARY</Text>
      <Text style={styles.sub}>Act {act} Lessons</Text>
      <FlatList
        data={lessons}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => {
          const read = progression.readLessons[item.id]
          return (
            <TouchableOpacity
              style={[styles.lessonRow, read && styles.lessonRowRead]}
              onPress={() => openLesson(item)}
            >
              <Text style={styles.lessonTitle}>
                {read ? '✓ ' : '  '}
                {item.title}
              </Text>
              <Text style={styles.lessonLede}>{item.lede}</Text>
            </TouchableOpacity>
          )
        }}
      />
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0d1a', padding: 16 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#7ec8e3', fontFamily: 'monospace', fontSize: 13 },
  heading: {
    color: '#f5c518',
    fontFamily: 'monospace',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sub: { color: '#aaa', fontFamily: 'monospace', fontSize: 12, marginBottom: 16 },
  lessonRow: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
  },
  lessonRowRead: { borderColor: '#4caf50' },
  lessonTitle: { color: '#fff', fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  lessonLede: { color: '#aaa', fontFamily: 'monospace', fontSize: 11 },
})
