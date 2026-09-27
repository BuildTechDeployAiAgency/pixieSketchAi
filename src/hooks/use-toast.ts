import Toast from "react-native-toast-message";

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
};

function toast({ title, description, variant, duration }: ToastOptions) {
  Toast.show({
    type: variant === "destructive" ? "error" : "success",
    text1: title ?? "",
    text2: description ?? "",
    visibilityTime: duration ?? 4000,
  });
}

function useToast() {
  return {
    toast,
    dismiss: () => Toast.hide(),
  };
}

export { useToast, toast };
