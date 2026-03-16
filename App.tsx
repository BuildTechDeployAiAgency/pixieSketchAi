import "./global.css";
import { View, Text } from "react-native";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Home, ImageIcon, User, WifiOff } from "lucide-react-native";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NetworkProvider, useNetwork } from "@/contexts/NetworkContext";
import { SketchProvider } from "@/contexts/SketchContext";
import { StoryProvider } from "@/contexts/StoryContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthScreen } from "@/screens/AuthScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { GalleryScreen } from "@/screens/GalleryScreen";
import { AccountScreen } from "@/screens/AccountScreen";
import { PaymentSuccessScreen } from "@/screens/PaymentSuccessScreen";
import { PaymentCanceledScreen } from "@/screens/PaymentCanceledScreen";
import { PaymentHistoryScreen } from "@/screens/PaymentHistoryScreen";

import type { RootStackParamList, MainTabParamList } from "@/types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const queryClient = new QueryClient();

const linking = {
  prefixes: [Linking.createURL("/")],
  config: {
    screens: {
      PaymentSuccess: "payment-success",
      PaymentCanceled: "payment-canceled",
    },
  },
};

function MainTabs() {
  return (
    <SketchProvider>
      <StoryProvider>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: "#7c3aed",
            tabBarInactiveTintColor: "#94a3b8",
            headerShown: false,
            tabBarStyle: {
              borderTopColor: "#e2e8f0",
            },
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarLabel: "Create",
              tabBarIcon: ({ color, size }) => (
                <Home color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen
            name="Gallery"
            component={GalleryScreen}
            options={{
              tabBarLabel: "Gallery",
              tabBarIcon: ({ color, size }) => (
                <ImageIcon color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen
            name="Account"
            component={AccountScreen}
            options={{
              tabBarLabel: "Account",
              tabBarIcon: ({ color, size }) => (
                <User color={color} size={size} />
              ),
            }}
          />
        </Tab.Navigator>
      </StoryProvider>
    </SketchProvider>
  );
}

function OfflineBanner() {
  const { isConnected } = useNetwork();
  if (isConnected) return null;
  return (
    <View className="bg-red-500 px-4 py-2 flex-row items-center justify-center">
      <WifiOff color="#fff" size={16} />
      <Text className="text-white text-sm font-medium ml-2">
        No internet connection
      </Text>
    </View>
  );
}

function RootNavigator() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="PaymentSuccess"
            component={PaymentSuccessScreen}
          />
          <Stack.Screen
            name="PaymentCanceled"
            component={PaymentCanceledScreen}
          />
          <Stack.Screen
            name="PaymentHistory"
            component={PaymentHistoryScreen}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NetworkProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <NavigationContainer linking={linking}>
                <OfflineBanner />
                <RootNavigator />
                <StatusBar style="auto" />
              </NavigationContainer>
            </AuthProvider>
          </QueryClientProvider>
        </NetworkProvider>
        <Toast />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
