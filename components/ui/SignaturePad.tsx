import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { View } from "react-native";
// eslint-disable-next-line @typescript-eslint/no-require-imports
import SignatureScreen, { SignatureViewRef } from "react-native-signature-canvas";

interface Props {
  colors: any;
  height?: number;
  penColor?: string;
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
  { colors, height = 200, penColor = "#111827", onChange, placeholderLabel = "Sign here" },
  ref,
) {
  const innerRef = useRef<SignatureViewRef>(null);
  const [hasContent, setHasContent] = useState(false);

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
        webStyle={webStyle}
        autoClear={false}
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
          setHasContent(false);
          onChange?.("", false);
        }}
        onEnd={() => innerRef.current?.readSignature()}
      />
    </View>
  );
});
