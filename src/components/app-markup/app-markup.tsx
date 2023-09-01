import React from "react";
import { BetterComponent } from "react-better-components";
import { Markup, Span } from "react-gjs-renderer";
import { FontSizeContext } from "../font-size/font-size-context";

export type AppMarkupProps = JSX.IntrinsicElements["MARKUP"];

export class AppMarkup extends BetterComponent<AppMarkupProps> {
  render() {
    const { children, ...props } = this.props;

    return (
      <FontSizeContext.Consumer>
        {(fontSize) => (
          <Markup {...props}>
            <Span fontSize={fontSize}>{children}</Span>
          </Markup>
        )}
      </FontSizeContext.Consumer>
    );
  }
}
