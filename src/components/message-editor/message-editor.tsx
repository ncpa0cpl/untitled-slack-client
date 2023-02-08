import React from "react";
import {
  Align,
  Box,
  IconName,
  TextArea,
  Toolbar,
  ToolbarButton,
} from "react-gjs-renderer";

export const MessageEditor = () => {
  return (
    <Box margin={[5, 15, 0]} expandHorizontal horizontalAlign={Align.FILL}>
      <Toolbar
        expandHorizontal
        horizontalAlign={Align.FILL}
        style={{
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        }}
      >
        <ToolbarButton icon={IconName.FormatTextBold} />
        <ToolbarButton icon={IconName.FormatTextItalic} />
        <ToolbarButton icon={IconName.FormatTextStrikethrough} />
        <ToolbarButton icon={IconName.FormatTextUnderline} />
      </Toolbar>
      <TextArea
        expandHorizontal
        horizontalAlign={Align.FILL}
        heightRequest={75}
        style={{
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
        }}
      ></TextArea>
    </Box>
  );
};
