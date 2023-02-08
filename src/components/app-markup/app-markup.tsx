import React from "react";
import { Markup, Span } from "react-gjs-renderer";
import { FontSettings } from "../../quarks/settings/font-size";

export type AppMarkupProps = JSX.IntrinsicElements["MARKUP"] & {
  fontSizeMultiplier?: number;
};

export const AppMarkup = ({
  children,
  fontSizeMultiplier,
  ...props
}: AppMarkupProps) => {
  const fontSettings = FontSettings.useUiSettings();

  const fontSize = React.useMemo(
    () => Math.round(fontSettings * (fontSizeMultiplier ?? 1)),
    [fontSettings, fontSizeMultiplier]
  );

  return (
    <Markup {...props}>
      <Span fontSize={fontSize}>{children}</Span>
    </Markup>
  );
};
