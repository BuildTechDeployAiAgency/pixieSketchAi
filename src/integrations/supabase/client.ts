import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://uihnpebacpcndtkdizxd.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpaG5wZWJhY3BjbmR0a2RpenhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNTk4ODIsImV4cCI6MjA2NDkzNTg4Mn0.is_-3d_8FWrU7ge8y69zV6U4-QZhilk_FOH26clxqBo";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
