/**
 * Dezente Motion-Bausteine (professionell, nicht verspielt):
 *  - <FadeSlide delay>: Inhalt gleitet beim Mount sanft von unten ein.
 *  - useCountUp(n): zaehlt eine Zahl weich hoch (fuer Kennzahlen).
 * Auf Web ohne Native-Driver.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, type ViewStyle } from 'react-native';

const USE_NATIVE = Platform.OS !== 'web';

export function FadeSlide({
  children,
  delay = 0,
  distance = 12,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: ViewStyle | ViewStyle[];
}) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(t, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE,
    });
    anim.start();
    return () => anim.stop();
  }, [delay, t]);

  return (
    <Animated.View
      style={[
        {
          opacity: t,
          transform: [
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) },
          ],
        },
        style as ViewStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Zaehlt von 0 auf `target` weich hoch (einmalig / bei Aenderung). */
export function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(target);
  const av = useMemo(() => new Animated.Value(0), []);
  useEffect(() => {
    setVal(0);
    const id = av.addListener(({ value }) => setVal(Math.round(value)));
    const anim = Animated.timing(av, {
      toValue: target,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start();
    return () => {
      anim.stop();
      av.removeListener(id);
    };
  }, [target, duration, av]);
  return val;
}
