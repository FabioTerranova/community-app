/**
 * Ambient-Hintergrund: zwei sehr dezente, weiche Licht-Formen (Radial-Verlauf ->
 * weiche Kanten, kein harter Kreis), die extrem langsam driften. Gibt der App Tiefe,
 * ohne vom Inhalt abzulenken. Liegt hinter dem Inhalt, faengt keine Taps ab.
 *
 * Bewusst niedrige Deckkraft; auf Web laeuft die Animation ohne Native-Driver.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '../ThemeContext';

const USE_NATIVE = Platform.OS !== 'web';

function SoftBlob({ size, color }: { size: number; color: string }) {
  // Eindeutige Gradient-ID pro Farbe/Groesse, damit sich mehrere Blobs nicht stoeren.
  const id = `blob-${color.replace(/[^a-z0-9]/gi, '')}-${size}`;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={1} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

/** Ein driftender Blob mit langsamer, endloser Schleife (leichter Versatz + Skalierung). */
function DriftBlob({
  size,
  color,
  opacity,
  top,
  left,
  duration,
  dx,
  dy,
}: {
  size: number;
  color: string;
  opacity: number;
  top: number;
  left: number;
  duration: number;
  dx: number;
  dy: number;
}) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [duration, t]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top,
        left,
        opacity,
        transform: [
          { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
          { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
        ],
      }}
    >
      <SoftBlob size={size} color={color} />
    </Animated.View>
  );
}

export function AmbientBackground() {
  const { colors, mode } = useTheme();
  // Im Dunkelmodus etwas praesenter, im Hellmodus fast unsichtbar-dezent.
  const o = mode === 'dark' ? { a: 0.22, b: 0.16 } : { a: 0.1, b: 0.08 };
  const blobs = useMemo(
    () => (
      <>
        <DriftBlob
          size={360}
          color={colors.brand2}
          opacity={o.a}
          top={-90}
          left={-70}
          duration={13000}
          dx={40}
          dy={30}
        />
        <DriftBlob
          size={320}
          color={colors.accent}
          opacity={o.b}
          top={220}
          left={160}
          duration={17000}
          dx={-36}
          dy={44}
        />
      </>
    ),
    [colors.accent, colors.brand2, o.a, o.b],
  );

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>{blobs}</View>
  );
}
