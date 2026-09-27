---
status: awaiting_human_verify
trigger: "App crashes on launch with 'Couldn't find a navigation context' error due to NativeWind CssInterop conflict"
created: 2026-03-19T00:00:00Z
updated: 2026-03-19T00:05:00Z
---

## Current Focus

hypothesis: CONFIRMED - NativeWind CssInterop wrapping Pressable components breaks React Navigation context propagation
test: Converted all Pressable className to StyleSheet.create style props across entire codebase
expecting: App launches without navigation context crash
next_action: Await human verification that app loads correctly

## Symptoms

expected: App loads normally, user can access Create Story section in HomeScreen
actual: App crashes immediately with ErrorBoundary catching a navigation context error
errors: "ErrorBoundary caught: Error: Couldn't find a navigation context. Have you wrapped your app with 'NavigationContainer'? at CssInterop.Pressable"
reproduction: Launch the app on iOS - crashes immediately
started: Since NativeWind CssInterop was identified as conflicting with React Navigation (Mar 17, 2026)

## Eliminated

## Evidence

- timestamp: 2026-03-19T00:01:00Z
  checked: App.tsx component tree hierarchy
  found: ErrorBoundary wraps everything (line 146), NavigationContainer is nested inside at line 151. ErrorBoundary is OUTSIDE navigation context.
  implication: Any NativeWind CssInterop component in ErrorBoundary's fallback will lack navigation context

- timestamp: 2026-03-19T00:02:00Z
  checked: ErrorBoundary.tsx fallback UI (lines 36-57)
  found: Uses className on SafeAreaView, View, Text, and Pressable - ALL will be wrapped by NativeWind CssInterop
  implication: When ErrorBoundary renders its fallback, CssInterop.Pressable tries to access navigation context and throws

- timestamp: 2026-03-19T00:03:00Z
  checked: Error component stack from symptoms
  found: "CssInterop.Pressable -> ErrorBoundary -> App" confirms the Pressable in ErrorBoundary fallback is the one throwing
  implication: Error cascade - original error triggers ErrorBoundary, fallback renders CssInterop.Pressable outside NavigationContainer, which throws again

- timestamp: 2026-03-19T00:04:00Z
  checked: babel.config.js
  found: jsxImportSource set to "nativewind" which means ALL JSX gets CssInterop treatment, not just components with className
  implication: Even basic View/Text components may trigger CssInterop processing

- timestamp: 2026-03-19T00:05:00Z
  checked: NativeWind GitHub issues #1466, #1536, #1557, #1712
  found: Known bug in NativeWind 4 - CssInterop on Pressable/TouchableOpacity with className (especially conditional template literals and shadow-* utilities) breaks React Navigation context propagation. Community workaround: use StyleSheet.create instead of className on Pressable components.
  implication: This is a confirmed upstream NativeWind bug. Fix is to remove className from all Pressable components and use style prop.

- timestamp: 2026-03-19T00:06:00Z
  checked: TypeScript compilation after fix
  found: npx tsc --noEmit passes cleanly with zero errors
  implication: All converted files are type-correct

## Resolution

root_cause: NativeWind 4's CssInterop wraps Pressable components that use className, and during rendering the CssInterop wrapper accesses React Navigation context getters. This breaks navigation context propagation, throwing MISSING_CONTEXT_ERROR. The ErrorBoundary (outside NavigationContainer) catches the initial crash but its fallback UI also uses className on Pressable, creating an error cascade. This is a known upstream bug (nativewind/nativewind#1466, #1536, #1712).
fix: Converted ALL Pressable components across the entire codebase from className to StyleSheet.create style props. This bypasses NativeWind CssInterop entirely for Pressable while keeping className on View/Text/other components where CssInterop works correctly.
verification: TypeScript compiles cleanly. Awaiting human verification of runtime behavior.
files_changed: [src/components/ErrorBoundary.tsx, src/screens/HomeScreen.tsx, src/screens/AuthScreen.tsx, src/screens/AccountScreen.tsx, src/screens/GalleryScreen.tsx, src/screens/PaymentCanceledScreen.tsx, src/screens/PaymentSuccessScreen.tsx, src/screens/PaymentHistoryScreen.tsx, src/components/PaymentModal.tsx]
