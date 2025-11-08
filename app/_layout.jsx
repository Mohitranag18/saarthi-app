import { Stack } from "expo-router";
import "../global.css";
import { AuthProvider } from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { deactivateKeepAwake } from 'expo-keep-awake';
deactivateKeepAwake();

function RootLayoutContent() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return null; // Or show a loading screen
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
