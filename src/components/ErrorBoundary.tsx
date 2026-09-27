import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertTriangle, RotateCcw } from "lucide-react-native";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

/**
 * ErrorBoundary sits OUTSIDE NavigationContainer in the component tree.
 * All styling here MUST use inline style / StyleSheet — NOT className.
 * NativeWind's CssInterop wraps components that use className, and the
 * wrapper accesses React Navigation context getters which throw when
 * there is no NavigationContainer ancestor.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <AlertTriangle color="#ef4444" size={64} />
            <Text style={styles.title}>
              Something went wrong
            </Text>
            <Text style={styles.subtitle}>
              An unexpected error occurred. Please try again.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                { opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={this.handleReset}
            >
              <RotateCcw color="#fff" size={20} />
              <Text style={styles.buttonText}>
                Try Again
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 16,
  },
  subtitle: {
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 32,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
});
