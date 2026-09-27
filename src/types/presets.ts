export type PresetOption = "cartoon" | "pixar" | "realistic";

export type VideoPromptMode = "ai_decide" | "custom";

export interface PresetPrompt {
  label: string;
  backendPrompt: string;
  supportsVideo?: boolean;
  creditCost: number;
}

export const PRESET_PROMPTS: Record<PresetOption, PresetPrompt> = {
  cartoon: {
    label: "Turn this as Cartoon",
    creditCost: 1,
    backendPrompt:
      "Convert the uploaded sketch into a clean, 2-D hand-drawn cartoon. Keep every line, shape, and character exactly where they are placed, but redraw with smooth bold outlines, flat vibrant colors, and minimal shading. Preserve the whimsical imperfections in a polished Saturday-morning-cartoon style.",
  },
  pixar: {
    label: "Turn this as Pixar Character",
    creditCost: 1,
    backendPrompt:
      "Transform the uploaded sketch into a high-quality Pixar-style 3-D scene. Maintain the original layout, proportions, and color placement of every character and object. Rebuild them with soft rounded geometry, expressive eyes, gentle subsurface lighting, and a cheerful cinematic palette.",
  },
  realistic: {
    label: "Bring this to Life",
    supportsVideo: true,
    creditCost: 2,
    backendPrompt:
      "Bring the uploaded sketch to life as a semi-realistic storybook illustration with believable textures, depth, and dynamic lighting.",
  },
};
