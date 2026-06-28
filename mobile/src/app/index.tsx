import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/shared/store/authStore';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    // Simulate checking some storage or token validity here
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <LoadingScreen message="Đang khởi động Owly..." />;
  }

  if (token) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
