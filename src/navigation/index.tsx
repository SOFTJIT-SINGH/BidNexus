import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import AuthStack from './stacks/AuthStack';
import MainStack from './stacks/MainStack';

export default function Navigation() {
  const user = useAuthStore((s) => s.user);

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}