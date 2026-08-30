import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from './src/theme';

/**
 * App-Einstieg. Bewusst noch OHNE Design: dies ist nur das Grundgeruest.
 *
 * Spaeter wird hier — wie in der zenit-alpine-app — eine kleine State-Machine
 * die Screens steuern (z.B. home -> events -> attendance -> sign -> news).
 * Solange kein Design steht, zeigt die App nur einen Platzhalter, damit
 * `npm run web` und der Vercel-Web-Export sauber bauen.
 */
export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.center}>
        <Text style={styles.title}>Community</Text>
        <Text style={styles.subtitle}>Grundgeruest steht — Design folgt.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  title: { fontSize: 32, fontWeight: '600', color: colors.foreground, marginBottom: spacing.sm },
  subtitle: { fontSize: 16, color: colors.mutedForeground, textAlign: 'center' },
});
