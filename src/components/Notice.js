import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Notice({ type = 'error', children }) {
  if (!children) return null;
  return <View accessibilityRole="alert" style={[styles.box, type === 'success' ? styles.success : styles.error]}><Text style={[styles.text, type === 'success' ? styles.successText : styles.errorText]}>{children}</Text></View>;
}
const styles = StyleSheet.create({
  box: { borderRadius: 10, padding: 12, marginTop: 14, borderWidth: 1 },
  error: { backgroundColor: '#fff1f1', borderColor: '#ffd1d1' },
  success: { backgroundColor: '#effaf3', borderColor: '#c8efd4' },
  text: { fontSize: 13, lineHeight: 19 },
  errorText: { color: '#a32626' },
  successText: { color: '#176b38' }
});
