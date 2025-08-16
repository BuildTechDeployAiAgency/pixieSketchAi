export type PresetOption = "cartoon" | "pixar" | "realistic";

export interface PresetPrompt {
  label: string;
  backendPrompt: string;
}

export const PRESET_PROMPTS: Record<PresetOption, PresetPrompt> = {
  cartoon: {
    label: "Turn this as Cartoon",
    backendPrompt:
      "Please convert the uploaded children's drawing into a clean, 2-D hand-drawn cartoon. Keep every line, shape, and character exactly where the child placed them, but redraw with smooth bold outlines, flat vibrant colors, and minimal shading. Preserve the whimsical imperfections so it still feels like a kid's artwork, just in polished Saturday-morning-cartoon style.",
  },
  pixar: {
    label: "Turn this as Pixar Character",
    backendPrompt:
      "Transform the uploaded children's drawing into a high-quality Pixar-style 3-D scene. Maintain the original layout, proportions, and color placement of every character and object. Rebuild them with soft rounded geometry, expressive Pixar eyes, gentle subsurface lighting, and a cheerful cinematic palette. Aim for a final render that looks like a frame from a modern Pixar short while clearly echoing the child's design.",
  },
  realistic: {
    label: "Bring this to Life",
    backendPrompt:
      "Bring the uploaded children's drawing to life in a semi-realistic storybook illustration. Keep the exact composition and whimsical shapes, but add believable textures, depth, and dynamic lighting. Use rich painterly brushstrokes and subtle gradients so the scene feels tangible and vibrant, yet retains the playful spirit and color blocking of the child's original art.",
  },
};
