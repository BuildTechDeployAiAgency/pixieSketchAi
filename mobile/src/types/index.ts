export interface UserProfile {
  id: string;
  email: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

export interface Sketch {
  id: string;
  user_id: string;
  name: string;
  original_image_url: string;
  animated_image_url: string | null;
  status: 'processing' | 'completed' | 'failed';
  is_new: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransformationResult {
  success: boolean;
  animatedImageUrl?: string;
  error?: string;
  processingTime?: number;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: string;
  priceNum: number;
  popular?: boolean;
}

export type PresetOption = 'cartoon' | 'pixar' | 'realistic' | 'anime' | 'watercolor' | 'fantasy';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  emoji: string;
  gradient: [string, string];
}
