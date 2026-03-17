import 'react-native-gesture-handler';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from '@/src/navigation';
import { StatusBar } from 'expo-status-bar';
import './global.css'; // NativeWind v4 requirement
import { Text, TouchableOpacity } from 'react-native';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <RootNavigator />
      <TouchableOpacity 
        className="absolute bottom-6 right-6 bg-blue-600 w-16 h-16 rounded-full items-center justify-center shadow-lg"
        onPress={() => navigation.navigate('CreateAuction')}
      >
        <Text className="text-white text-3xl font-light mb-1">+</Text>
      </TouchableOpacity>
    </SafeAreaProvider>
  );
}