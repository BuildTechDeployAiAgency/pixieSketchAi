import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { Input } from '@/components/ui/Input';
import { GradientButton } from '@/components/ui/GradientButton';
import { FontSize, Spacing } from '@/constants/theme';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', confirm: '' });

  const validate = () => {
    const newErrors = { email: '', password: '', confirm: '' };
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirm = 'Passwords do not match';
    setErrors(newErrors);
    return !newErrors.email && !newErrors.password && !newErrors.confirm;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await signUp(email.trim(), password);
      if (result.error) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Signup Failed', result.error);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Account Created! 🎉',
          'Please check your email to verify your account, then sign in.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Text style={[styles.closeText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>

          {/* Header */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
            <Text style={styles.headerEmoji}>🎨</Text>
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Get 10 free credits to start creating!
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
              containerStyle={{ marginBottom: Spacing.lg }}
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry={!showPassword}
              error={errors.password}
              rightIcon={
                <Text style={{ fontSize: 16 }}>{showPassword ? '🙈' : '👁️'}</Text>
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
              containerStyle={{ marginBottom: Spacing.lg }}
            />
            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry={!showPassword}
              error={errors.confirm}
              containerStyle={{ marginBottom: Spacing['2xl'] }}
            />

            <GradientButton
              title="Create Account"
              onPress={handleSignup}
              loading={isLoading}
              size="lg"
              colors={['#10B981', '#14B8A6']}
            />

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={[styles.loginText, { color: colors.textSecondary }]}>
                Already have an account?{' '}
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Sign In</Text>
              </Text>
            </TouchableOpacity>

            {/* Legal */}
            <Text style={[styles.legalText, { color: colors.textMuted }]}>
              By creating an account, you agree to our Terms of Service and Privacy Policy. PixieSketch AI is COPPA compliant.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing['2xl'], flexGrow: 1 },
  closeButton: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.md,
  },
  closeText: { fontSize: FontSize.md, fontWeight: '600' },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing['3xl'],
  },
  headerEmoji: { fontSize: 56, marginBottom: Spacing.lg },
  title: { fontSize: FontSize['3xl'], fontWeight: '800' },
  subtitle: { fontSize: FontSize.md, marginTop: Spacing.sm },
  form: { flex: 1 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing['2xl'],
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: Spacing.lg, fontSize: FontSize.sm },
  loginLink: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  loginText: { fontSize: FontSize.md },
  legalText: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: Spacing.xl,
    lineHeight: 18,
    paddingHorizontal: Spacing.lg,
  },
});
