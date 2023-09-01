import React from "react";
import {
  Align,
  Box,
  ButtonBox,
  EllipsizeMode,
  Orientation,
  PackType,
  Span,
} from "react-gjs-renderer";
import { AppMarkup } from "../../../app-markup/app-markup";
import { FontMod, FontSize } from "../../../font-size/font-size-context";

export type ConvListButton = {
  onClick: () => void;
  label: string;
  isActive: boolean;
  unreadCount?: number;
};

export const ConvListButton = (props: ConvListButton) => {
  const hasUnread = props.unreadCount != null && props.unreadCount > 0;

  return (
    <ButtonBox
      horizontalAlign={Align.FILL}
      onClick={props.onClick}
      style={{
        background: props.isActive ? "rgb(28, 113, 216)" : "transparent",
        border: "none",
        borderRadius: "0",
        boxShadow: "none",
        textShadow: "none",
        ":hover": {
          background: props.isActive
            ? "rgb(28, 113, 216)"
            : "rgba(128, 128, 128, 0.2)",
          border: "none",
        },
      }}
    >
      <Box
        expand
        horizontalAlign={Align.FILL}
        orientation={Orientation.HORIZONTAL}
      >
        <AppMarkup
          lines={1}
          ellipsize={EllipsizeMode.END}
          horizontalAlign={Align.START}
          margin={[5, 20]}
        >
          <Span fontWeight={hasUnread ? "bold" : "normal"}>{props.label}</Span>
        </AppMarkup>
        {hasUnread && (
          <Box
            cpt:pack-type={PackType.END}
            margin={[0, 10, 0, 0]}
            verticalAlign={Align.CENTER}
            widthRequest={30}
            style={{
              borderRadius: 5,
              background: "rgba(128, 128, 128, 0.3)",
            }}
          >
            <FontSize size={FontMod.shrink.by10}>
              <AppMarkup
                margin={[4, 0]}
                horizontalAlign={Align.CENTER}
                verticalAlign={Align.CENTER}
              >
                {props.unreadCount! > 9 ? "9+" : props.unreadCount!.toString()}
              </AppMarkup>
            </FontSize>
          </Box>
        )}
      </Box>
    </ButtonBox>
  );
};
