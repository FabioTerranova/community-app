/**
 * Intro-Splash (~1.6s): animierte Wortmarke "Community" — Buchstabe fuer Buchstabe
 * gleitend eingeblendet, darueber ein Marken-Zeichen, darunter die CGS-Tagline.
 * Danach sanftes Ausblenden -> `onDone()` fuehrt in die App.
 *
 * Bewusst mit Marken-Verlauf als Vollflaeche (nur HIER ist Vollfarbe gewollt — als
 * Marken-Moment), waehrend die App selbst ruhig/hell bleibt.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../ThemeContext';
import { spacing } from '../theme';
import { DoveMark } from './icons';

const WORD = 'Community';
const USE_NATIVE = Platform.OS !== 'web';

export function Intro({ onDone }: { onDone: () => void }) {
  const { colors } = useTheme();

  const container = useRef(new Animated.Value(1)).current; // 1 sichtbar -> 0 aus
  const mark = useRef(new Animated.Value(0)).current;
  const tagline = useRef(new Animated.Value(0)).current;
  const letters = useMemo(
    () => WORD.split('').map(() => new Animated.Value(0)),
    [],
  );

  useEffect(() => {
    const markIn = Animated.timing(mark, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: USE_NATIVE,
    });
    const lettersIn = Animated.stagger(
      55,
      letters.map((v) =>
        Animated.timing(v, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USE_NATIVE,
        }),
      ),
    );
    const taglineIn = Animated.timing(tagline, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE,
    });
    const out = Animated.timing(container, {
      toValue: 0,
      duration: 380,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: USE_NATIVE,
    });

    Animated.sequence([
      markIn,
      Animated.parallel([lettersIn, Animated.sequence([Animated.delay(220), taglineIn])]),
      Animated.delay(1520),
      out,
    ]).start(({ finished }) => {
      if (finished) onDone();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: container }]}>
      <LinearGradient
        colors={colors.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.center}>
        <Animated.View
          style={{
            opacity: mark,
            transform: [
              { scale: mark.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
            ],
          }}
        >
          <DoveMark size={64} color="#FFFFFF" />
        </Animated.View>

        <View style={styles.word}>
          {WORD.split('').map((ch, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.letter,
                {
                  opacity: letters[i],
                  transform: [
                    {
                      translateY: letters[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [16, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {ch}
            </Animated.Text>
          ))}
        </View>

        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: tagline,
              transform: [
                { translateY: tagline.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
              ],
            },
          ]}
        >
          Gemeinschaft leben
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 100, elevation: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  word: { flexDirection: 'row', marginTop: spacing.md },
  letter: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
