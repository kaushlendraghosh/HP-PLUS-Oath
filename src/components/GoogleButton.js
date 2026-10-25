import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function GoogleButton({ onPress, loading, disabled }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, (disabled || loading) && styles.disabled]}
    >
      {loading ? <ActivityIndicator color="#24324a" /> : <>
        <Text style={styles.google}>G</Text>
        <Text style={styles.label}>Continue with Google</Text>
      </>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: 12, borderWidth: 1, borderColor: '#d8deea', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 18 },
  pressed: { backgroundColor: '#f4f6fa' },
  disabled: { opacity: 0.65 },
  google: { fontSize: 21, fontWeight: '800', color: '#4285F4' },
  label: { color: '#17233b', fontSize: 15, fontWeight: '700' }
});
