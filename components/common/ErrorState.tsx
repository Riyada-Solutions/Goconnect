import React from "react";

import { EmptyState } from "./EmptyState";
import { useApp } from "@/context/AppContext";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel,
}: ErrorStateProps) {
  const { t } = useApp();
  const msg = description ?? t("somethingWentWrong");

  return (
    <EmptyState
      variant="error"
      icon="alert-triangle"
      title={title ?? t("failedToLoad")}
      description={msg}
      actionLabel={onRetry ? (retryLabel ?? t("retry")) : undefined}
      onAction={onRetry}
    />
  );
}
