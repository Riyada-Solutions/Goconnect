import { useCallback } from "react";

import { useFeedbackDialog } from "@/components/ui/FeedbackDialog";
import { useApp } from "@/context/AppContext";
import type { RuleAction } from "@/data/models/rules";

/**
 * Wrap an action so it shows a "permission denied" dialog when the rule is
 * missing. Pair with the dialog component returned by `useFeedbackDialog`.
 *
 *   const { dialogProps, show: showDialog } = useFeedbackDialog();
 *   const guard = useRuleGuard(showDialog);
 *
 *   <Pressable onPress={() => guard("confirm_appointment", handleConfirm)} />
 *   <FeedbackDialog {...dialogProps} />
 *
 * If you'd rather hide the UI entirely, use `<RuleGate>` instead.
 */
export function useRuleGuard(
  showDialog: ReturnType<typeof useFeedbackDialog>["show"],
) {
  const { can, t } = useApp();

  return useCallback(
    (action: RuleAction, run: () => void) => {
      if (can(action)) {
        run();
        return;
      }
      showDialog({
        variant: "error",
        title: t("permissionDenied"),
        message: t("permissionDeniedDescription"),
      });
    },
    [can, showDialog, t],
  );
}
