import React from "react";
import { Align, Box, Justification } from "react-gjs-renderer";
import { AppMarkup } from "../../../app-markup/app-markup";

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
      <AppMarkup
        horizontalAlign={Align.START}
        justify={Justification.LEFT}
        margin={[10, 0, 10, 20]}
        fontSizeMultiplier={1.5}
      >
        {props.title}
      </AppMarkup>
    </Box>
  );
};
