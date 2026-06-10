import { useRef } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
};

export function PressableScale({
  children,
  style,
  scaleValue = 0.96,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled) {
          Animated.spring(scale, {
            toValue: scaleValue,
            speed: 40,
            bounciness: 0,
            useNativeDriver: true,
          }).start();
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        if (!disabled) {
          Animated.spring(scale, {
            toValue: 1,
            speed: 30,
            bounciness: 6,
            useNativeDriver: true,
          }).start();
        }
        onPressOut?.(event);
      }}
      {...props}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}
