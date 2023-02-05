import React from "react";
import { Align, ButtonBox } from "react-gjs-renderer";
import { FontSettings } from "../../../../quarks/settings/font-size";
import { AppMarkup } from "../../../app-markup/app-markup";

export type ConvListButton = {
  onClick: () => void;
  label: string;
  isActive: boolean;
};

export const ConvListButton = (props: ConvListButton) => {
  const fontSettings = FontSettings.use();

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
      <AppMarkup horizontalAlign={Align.START} margin={[5, 20]}>
        {props.label}
      </AppMarkup>
    </ButtonBox>
  );
};
