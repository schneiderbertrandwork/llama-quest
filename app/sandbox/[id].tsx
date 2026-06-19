// app/sandbox/[id].tsx
import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getSandboxDef } from '../../content/sandboxes'
import { Terminal } from '../../components/Terminal'
import { useGameStore } from '../../store/game-store'

export default function SandboxScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { progression, markSandboxCompleted } = useGameStore()
  const sandbox = getSandboxDef(id ?? 'firstchat')
  const [completedObjectives, setCompletedObjectives] = useState<Record<string, boolean>>({})

  const alreadyCompleted = progression.completedSandboxes[sandbox.id] === true

  function handleObjectiveDone(objectiveId: string) {
    setCompletedObjectives(prev => ({ ...prev, [objectiveId]: true }))
  }

  function handleAllDone() {
    markSandboxCompleted(sandbox.id)
    setTimeout(() => router.back(), 1500)
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{sandbox.title}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.exitBtn}>
          <Text style={styles.exitText}>✕ Exit</Text>
        </TouchableOpacity>
      </View>

      {alreadyCompleted ? (
        <View style={styles.doneContainer}>
          <Text style={styles.doneText}>✓ Sandbox completed!</Text>
          <Text style={styles.doneSubtext}>{sandbox.intro}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Return to city</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.intro}>{sandbox.intro}</Text>
          <Terminal
            sandbox={sandbox}
            completedObjectives={completedObjectives}
            onObjectiveDone={handleObjectiveDone}
            onAllDone={handleAllDone}
          />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0a0818' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1b1740' },
  title: { color: '#ffb061', fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold' },
  exitBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  exitText: { color: '#726cab', fontFamily: 'monospace', fontSize: 12 },
  intro: { color: '#a8a2da', fontFamily: 'monospace', fontSize: 11, lineHeight: 18, paddingHorizontal: 16, paddingVertical: 10 },
  doneContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  doneText: { color: '#4caf50', fontFamily: 'monospace', fontSize: 20, fontWeight: 'bold' },
  doneSubtext: { color: '#a8a2da', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', lineHeight: 20 },
  backBtn: { marginTop: 8, backgroundColor: '#1b1740', borderWidth: 2, borderColor: '#4a3f8c', borderRadius: 6, paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText: { color: '#ece9ff', fontFamily: 'monospace', fontSize: 13 },
})
