import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useGameStore } from '../store/game-store'
import type { PlayerClass } from '../store/game-store'

const CLASSES: { id: PlayerClass; label: string; desc: string }[] = [
  { id: 'Tinkerer', label: 'TINKERER', desc: 'A hands-on builder. Extra XP from sandboxes.' },
  { id: 'Scholar', label: 'SCHOLAR', desc: 'A careful reader. Extra XP from lessons.' },
  { id: 'Architect', label: 'ARCHITECT', desc: 'A systems thinker. Extra XP from mastery.' },
]

export default function TitleScreen() {
  const router = useRouter()
  const { initPlayer } = useGameStore()
  const [name, setName] = useState('')
  const [cls, setCls] = useState<PlayerClass>('Tinkerer')

  function handleStart() {
    if (!name.trim()) return
    initPlayer(name.trim(), cls)
    router.push('/overworld')
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>LLAMA QUEST</Text>
      <Text style={styles.subtitle}>A Learning RPG</Text>

      <Text style={styles.label}>YOUR NAME</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter name..."
        placeholderTextColor="#555"
        maxLength={12}
        autoCorrect={false}
      />

      <Text style={styles.label}>YOUR CLASS</Text>
      {CLASSES.map((c) => (
        <TouchableOpacity
          key={c.id}
          style={[styles.classBtn, cls === c.id && styles.classBtnActive]}
          onPress={() => setCls(c.id)}
        >
          <Text style={[styles.classBtnLabel, cls === c.id && styles.classBtnLabelActive]}>{c.label}</Text>
          <Text style={styles.classBtnDesc}>{c.desc}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.startBtn, !name.trim() && styles.startBtnDisabled]}
        onPress={handleStart}
        disabled={!name.trim()}
      >
        <Text style={styles.startBtnText}>START GAME</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0d0d1a', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#f5c518', fontFamily: 'monospace', fontSize: 28, fontWeight: 'bold', letterSpacing: 4, marginBottom: 4 },
  subtitle: { color: '#7ec8e3', fontFamily: 'monospace', fontSize: 13, marginBottom: 32 },
  label: { color: '#c0a060', fontFamily: 'monospace', fontSize: 11, alignSelf: 'flex-start', marginBottom: 6, marginTop: 12, letterSpacing: 2 },
  input: { backgroundColor: '#1a1a2e', borderWidth: 2, borderColor: '#c0a060', borderRadius: 4, color: '#fff', fontFamily: 'monospace', fontSize: 16, paddingHorizontal: 12, paddingVertical: 8, width: '100%', maxWidth: 320 },
  classBtn: { width: '100%', maxWidth: 320, backgroundColor: '#1a1a2e', borderWidth: 2, borderColor: '#444', borderRadius: 4, padding: 12, marginBottom: 8 },
  classBtnActive: { borderColor: '#f5c518' },
  classBtnLabel: { color: '#aaa', fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold' },
  classBtnLabelActive: { color: '#f5c518' },
  classBtnDesc: { color: '#777', fontFamily: 'monospace', fontSize: 11, marginTop: 2 },
  startBtn: { marginTop: 24, backgroundColor: '#c0a060', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 4 },
  startBtnDisabled: { backgroundColor: '#444' },
  startBtnText: { color: '#0d0d1a', fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
})
