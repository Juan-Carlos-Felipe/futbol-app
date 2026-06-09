import { Stack } from 'expo-router';

export default function MatchLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f1117' } }}>
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
