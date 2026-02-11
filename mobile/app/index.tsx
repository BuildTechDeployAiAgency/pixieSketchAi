import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { useAuth } from '@/lib/AuthContext';

export default function IndexScreen() {
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { isLoading } = useAuth();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem('onboarding_completed');
      if (completed === 'true') {
        router.replace('/(tabs)');
      } else {
        setShowOnboarding(true);
      }
    } catch {
      setShowOnboarding(true);
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  if (isCheckingOnboarding || isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (showOnboarding) {
    return <OnboardingScreen />;
  }

  return null;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
  },
});
