import { useColorScheme } from "react-native";

import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";

export function useTheme() {
  const { theme } = useApp();
  const systemScheme = useColorScheme();

  const isDark =
    theme === "system"
      ? systemScheme === "dark"
      : theme === "dark";

  const colors = isDark ? Colors.dark : Colors.light;

  return { isDark, colors, primary: Colors.primary, accent: Colors.accent };
}
