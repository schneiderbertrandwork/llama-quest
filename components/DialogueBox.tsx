import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface DialogueBoxProps {
  lines: string[]
  speakerName?: string
  onClose: () => void
}

export function DialogueBox({ lines, speakerName, onClose }: DialogueBoxProps) {
  const [lineIdx, setLineIdx] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [finished, setFinished] = useState(false)

  const currentLine = lines[lineIdx] ?? ''

  useEffect(() => {
    setDisplayed('')
    setFinished(false)
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(currentLine.slice(0, i))
      if (i >= currentLine.length) { clearInterval(interval); setFinished(true) }
    }, 30)
    return () => clearInterval(interval)
  }, [lineIdx, currentLine])

  const advance = useCallback(() => {
    if (!finished) { setDisplayed(currentLine); setFinished(true); return }
    if (lineIdx < lines.length - 1) { setLineIdx((n) => n + 1) } else { onClose() }
  }, [finished, lineIdx, lines.length, currentLine, onClose])

  return (
    <TouchableOpacity style={styles.overlay} onPress={advance} activeOpacity={1}>
      <View style={styles.outerBorder}>
        <View style={styles.gap}>
          <View style={styles.innerBorder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            {speakerName ? <Text style={styles.speaker}>{speakerName}</Text> : null}
            <Text style={styles.text}>{displayed}</Text>
            {finished && <Text style={styles.arrow}>▼</Text>}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8 },
  outerBorder: { borderWidth: 2, borderColor: '#c0a060', backgroundColor: '#000000' },
  gap: { padding: 2, backgroundColor: '#000000' },
  innerBorder: { borderWidth: 2, borderColor: '#c0a060', backgroundColor: '#0a0826', padding: 12, minHeight: 80 },
  corner: { position: 'absolute', width: 4, height: 4, backgroundColor: '#c0a060' },
  cornerTL: { top: -1, left: -1 },
  cornerTR: { top: -1, right: -1 },
  cornerBL: { bottom: -1, left: -1 },
  cornerBR: { bottom: -1, right: -1 },
  speaker: { color: '#f5c518', fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  text: { color: '#ffffff', fontFamily: 'monospace', fontSize: 13, lineHeight: 20 },
  arrow: { color: '#c0a060', alignSelf: 'flex-end', fontSize: 12 },
})
