export const SUPABASE_URL = 'https://uihnpebacpcndtkdizxd.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpaG5wZWJhY3BjbmR0a2RpenhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNTk4ODIsImV4cCI6MjA2NDkzNTg4Mn0.is_-3d_8FWrU7ge8y69zV6U4-QZhilk_FOH26clxqBo';

// OpenRouter configuration
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
export const OPENROUTER_APP_NAME = 'PixieSketch AI';
export const OPENROUTER_APP_URL = 'https://pixiesketch.ai';

// AI Model defaults (via OpenRouter)
export const VISION_MODEL = 'openai/gpt-4o-mini';
export const IMAGE_MODEL = 'openai/dall-e-3';

// Credit packages
export const CREDIT_PACKAGES = [
  { id: 'starter', name: 'Starter', credits: 1, price: '$0.99', priceNum: 0.99, popular: false },
  { id: 'popular', name: 'Popular', credits: 10, price: '$4.99', priceNum: 4.99, popular: true },
  { id: 'pro', name: 'Pro Pack', credits: 25, price: '$9.99', priceNum: 9.99, popular: false },
] as const;

// Transformation presets
export const PRESETS = [
  {
    id: 'cartoon' as const,
    label: 'Cartoon',
    emoji: '🎨',
    description: 'Bold outlines & flat colors',
    colors: ['#F97316', '#EAB308'] as [string, string],
  },
  {
    id: 'pixar' as const,
    label: 'Pixar',
    emoji: '🎬',
    description: '3D animated movie style',
    colors: ['#3B82F6', '#8B5CF6'] as [string, string],
  },
  {
    id: 'realistic' as const,
    label: 'Realistic',
    emoji: '🖼️',
    description: 'Painterly storybook art',
    colors: ['#10B981', '#14B8A6'] as [string, string],
  },
  {
    id: 'anime' as const,
    label: 'Anime',
    emoji: '⚡',
    description: 'Japanese animation style',
    colors: ['#EC4899', '#F43F5E'] as [string, string],
  },
  {
    id: 'watercolor' as const,
    label: 'Watercolor',
    emoji: '💧',
    description: 'Soft watercolor painting',
    colors: ['#06B6D4', '#8B5CF6'] as [string, string],
  },
  {
    id: 'fantasy' as const,
    label: 'Fantasy',
    emoji: '🧙',
    description: 'Magical fantasy world',
    colors: ['#7C3AED', '#EC4899'] as [string, string],
  },
] as const;

export type PresetId = (typeof PRESETS)[number]['id'];

// App constants
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const INITIAL_FREE_CREDITS = 10;
