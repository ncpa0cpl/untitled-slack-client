import React from "react";
import { Markup, Span } from "react-gjs-renderer";
import type { MarkupProps } from "react-gjs-renderer/dist/gjs-elements/rg-types";
import { FontSettings } from "../../quarks/settings/font-size";

export const AppMarkup = ({
  children,
  ...props
}: React.PropsWithChildren<MarkupProps>) => {
  const fontSettings = FontSettings.useUiSettings();

  return (
    <Markup {...props}>
      <Span fontSize={fontSettings}>{children}</Span>
    </Markup>
  );
};
