import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, type StyleProp, type TextStyle } from 'react-native';

type AnimatedNumberProps = {
  value: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  prefix?: string;
  suffix?: string;
};

export function AnimatedNumber({
  value,
  duration = 1000,
  style,
  prefix = '',
  suffix = '',
}: AnimatedNumberProps) {
  const animatedValue = useRef(new Animated.Value(value)).current;
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const listener = animatedValue.addListener(({ value: current }) => {
      setDisplayValue(Math.round(current));
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration: Math.min(duration, 1200),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => animatedValue.removeListener(listener);
  }, [animatedValue, duration, value]);

  return (
    <Text style={style}>
      {prefix}
      {displayValue.toLocaleString('es-CL')}
      {suffix}
    </Text>
  );
}
