import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/theme/colors";

export type FeedbackVariant = "success" | "error" | "confirm";

interface Action {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface FeedbackDialogProps {
  visible: boolean;
  variant: FeedbackVariant;
  title: string;
  message?: string;
  /** Primary action (confirm / ok). If omitted a default "OK" is shown. */
  primaryAction?: Action;
  /** Secondary action (cancel / dismiss). Only shown when provided. */
  secondaryAction?: Action;
  onDismiss: () => void;
}

const ICON: Record<FeedbackVariant, { name: "check-circle" | "x-circle" | "alert-triangle"; color: string }> = {
  success: { name: "check-circle",    color: "#22C55E" },
  error:   { name: "x-circle",        color: "#EF4444" },
  confirm: { name: "alert-triangle",  color: "#F59E0B" },
};

export function FeedbackDialog({
  visible,
  variant,
  title,
  message,
  primaryAction,
  secondaryAction,
  onDismiss,
}: FeedbackDialogProps) {
  const { colors } = useTheme();
  const icon = ICON[variant];

  const handlePrimary = () => {
    onDismiss();
    primaryAction?.onPress();
  };

  const handleSecondary = () => {
    onDismiss();
    secondaryAction?.onPress();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={[styles.card, { backgroundColor: colors.card }]} onPress={() => {}}>
          <View style={[styles.iconCircle, { backgroundColor: icon.color + "20" }]}>
            <Feather name={icon.name} size={28} color={icon.color} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {!!message && (
            <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          )}

          <View style={styles.actions}>
            {secondaryAction && (
              <Pressable
                style={[styles.btn, styles.secondaryBtn, { borderColor: colors.border , flex: 1 }]}
                onPress={handleSecondary}
              >
                <Text style={[styles.btnText, { color: colors.text }]}>
                  {secondaryAction.label}
                </Text>
              </Pressable>
            )}
            <Pressable
              style={[
                styles.btn,
                styles.primaryBtn,
                {
                  backgroundColor: primaryAction?.destructive
                    ? "#EF4444"
                    : Colors.primary,
                  flex:  1,
                  // minWidth: secondaryAction ? undefined : 120,
                },
              ]}
              onPress={handlePrimary}
            >
              <Text style={styles.primaryBtnText}>
                {primaryAction?.label ?? "OK"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Convenience hook for managing dialog state */
export function useFeedbackDialog() {
  const [state, setState] = React.useState<
    Omit<FeedbackDialogProps, "onDismiss"> & { visible: boolean }
  >({ visible: false, variant: "success", title: "" });

  const show = React.useCallback(
    (props: Omit<FeedbackDialogProps, "visible" | "onDismiss">) => {
      setState({ ...props, visible: true });
    },
    []
  );

  const dismiss = React.useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
  }, []);

  return { dialogProps: { ...state, onDismiss: dismiss }, show, dismiss };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    width: "100%",
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtn: {
    borderWidth: 1.5,
  },
  primaryBtn: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  btnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
