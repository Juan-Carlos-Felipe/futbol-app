import { Easing } from 'react-native';

export const timings = {
  fast: { duration: 150, easing: Easing.out(Easing.quad) },
  normal: { duration: 250, easing: Easing.out(Easing.cubic) },
  slow: { duration: 400, easing: Easing.out(Easing.cubic) },
};
