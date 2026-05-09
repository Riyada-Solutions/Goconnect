import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import { View } from "react-native";
// eslint-disable-next-line @typescript-eslint/no-require-imports
import SignatureScreen, { SignatureViewRef } from "react-native-signature-canvas";

function normalizeDataUrlForCanvas(url: string | undefined): string {
  if (!url) return "";
  const v = url.trim();
  if (!v) return "";
  if (v.startsWith("data:")) return v;
  return `data:image/png;base64,${v}`;
}

interface Props {
  colors: any;
  height?: number;
  penColor?: string;
  /**
   * Previously saved signature (full data URI or raw base64) — shown when reopening
   * the pad. Pass through `react-native-signature-canvas` `dataURL`.
   */
  initialDataUrl?: string;
  /** Called whenever the signature changes. dataUrl is a base64 PNG data URI. */
  onChange?: (dataUrl: string, hasContent: boolean) => void;
  placeholderLabel?: string;
}

export interface SignaturePadHandle {
  clear: () => void;
}

/**
 * Signature pad backed by `react-native-signature-canvas`.
 * Renders an HTML5 canvas inside a WebView and captures the drawing as a PNG data URL.
 */
export const SignaturePad = forwardRef<SignaturePadHandle, Props>(function SignaturePad(
  { colors, height = 200, penColor = "#111827", initialDataUrl, onChange, placeholderLabel = "Sign here" },
  ref,
) {
  const innerRef = useRef<SignatureViewRef>(null);
  const [dismissedInitial, setDismissedInitial] = useState(false);
  useEffect(() => {
    setDismissedInitial(false);
  }, [initialDataUrl]);
  const canvasDataUrl = normalizeDataUrlForCanvas(
    dismissedInitial || !initialDataUrl ? undefined : initialDataUrl,
  );
  const [hasContent, setHasContent] = useState(() => Boolean(canvasDataUrl));
  useEffect(() => {
    if (canvasDataUrl) setHasContent(true);
  }, [canvasDataUrl]);

  useImperativeHandle(ref, () => ({
    clear: () => {
      innerRef.current?.clearSignature();
    },
  }));

  const webStyle = `
    .m-signature-pad { box-shadow: none; border: none; margin: 0; }
    .m-signature-pad--body { border: none; }
    .m-signature-pad--footer { display: none; margin: 0; }
    body, html { width: 100%; height: 100%; margin: 0; padding: 0; background: transparent; }
    canvas { background-color: transparent; }
  `;

  return (
    <View
      style={{
        height,
        borderWidth: 1.5,
        borderColor: hasContent ? "#22C55E" : colors.border,
        borderRadius: 12,
        borderStyle: hasContent ? "solid" : "dashed",
        backgroundColor: hasContent ? "#F0FDF4" : colors.card,
        overflow: "hidden",
      }}
    >
      <SignatureScreen
        ref={innerRef}
        key={canvasDataUrl || "empty"}
        webStyle={webStyle}
        autoClear={false}
        dataURL={canvasDataUrl}
        descriptionText={placeholderLabel}
        penColor={penColor}
        backgroundColor="transparent"
        onBegin={() => {
          if (!hasContent) {
            setHasContent(true);
            onChange?.("", true);
          }
        }}
        onOK={(dataUrl: string) => {
          onChange?.(dataUrl, true);
        }}
        onEmpty={() => {
          setHasContent(false);
          onChange?.("", false);
        }}
        onClear={() => {
          setDismissedInitial(true);
          setHasContent(false);
          onChange?.("", false);
        }}
        onEnd={() => innerRef.current?.readSignature()}
      />
    </View>
  );
});
