import { Button } from "@/components/ui/button";
import { Palette, UserRound, Camera, Loader2, Eye } from "lucide-react";
import { PRESET_PROMPTS, PresetOption } from "@/types/presets";

interface PresetButtonGroupProps {
  onPresetSelect: (preset: PresetOption) => void;
  isProcessing: boolean;
  disabled: boolean;
  processingPreset?: PresetOption | null;
}

export const PresetButtonGroup = ({
  onPresetSelect,
  isProcessing,
  disabled,
  processingPreset,
}: PresetButtonGroupProps) => {
  const presetIcons = {
    cartoon: Palette,
    pixar: UserRound,
    realistic: Camera,
  } as const;

  const presetColors = {
    cartoon:
      "from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600",
    pixar:
      "from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600",
    realistic:
      "from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600",
  } as const;

  const processingMessages = {
    cartoon: "Creating Cartoon Magic...",
    pixar: "Rendering Pixar Style...",
    realistic: "Bringing to Life...",
  } as const;

  return (
    <div className="space-y-3">
      <div className="text-center space-y-2">
        <h4 className="font-semibold text-gray-800 flex items-center justify-center gap-2">
          <Eye className="h-4 w-4 text-purple-600" />
          AI-Enhanced Transformations
        </h4>
        <p className="text-sm text-gray-600">
          Our AI analyzes your drawing for context-aware transformations
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {(Object.keys(PRESET_PROMPTS) as PresetOption[]).map((preset) => {
          const Icon = presetIcons[preset];
          const colorClass = presetColors[preset];
          const isThisButtonProcessing =
            isProcessing && processingPreset === preset;

          return (
            <Button
              key={preset}
              onClick={() => onPresetSelect(preset)}
              disabled={isProcessing || disabled}
              className={`w-full h-12 bg-gradient-to-r ${colorClass} text-white font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg`}
            >
              {isThisButtonProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {processingMessages[preset]}
                </>
              ) : (
                <>
                  <Icon className="h-4 w-4 mr-2" />
                  {PRESET_PROMPTS[preset].label}
                </>
              )}
            </Button>
          );
        })}
      </div>

      {isProcessing && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <Eye className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-medium">
              AI is analyzing your drawing for enhanced results...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
