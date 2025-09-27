// app/index.tsx
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="auth" />; // or "/auth" if you want login first
}
