import React from "react";
import { Align, Box, Justification } from "react-gjs-renderer";
import { AppMarkup } from "../../../app-markup/app-markup";
import { FontMod, FontSize } from "../../../font-size/font-size-context";

export type ConversationHeaderProps = {
  title: string;
};

export const ConversationHeader = (props: ConversationHeaderProps) => {
  return (
    <Box
      expandHorizontal
      horizontalAlign={Align.FILL}
      style={{ background: "rgba(32,32,32,0.15)" }}
    >
      <FontSize size={FontMod.enlarge.by50}>
        <AppMarkup
          horizontalAlign={Align.START}
          justify={Justification.LEFT}
          margin={[10, 0, 10, 20]}
        >
          {props.title}
        </AppMarkup>
      </FontSize>
    </Box>
  );
};
