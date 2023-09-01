import envs from "gapp:env";
import React from "react";
import { Align, ScrollBox, Window } from "react-gjs-renderer";
import "react-gnome";
import { FontSize } from "./components/font-size/font-size-context";
import { WindowBar } from "./components/window-bar/window-bar";
import { MainStack } from "./main-stack";
import { FontSettings } from "./quarks/settings/font-size";

export const App = () => {
  const fontSettings = FontSettings.useUiSettings();

  return (
    <FontSize size={fontSettings}>
      <Window
        defaultWidth={1024}
        defaultHeight={768}
        quitAppOnClose
        title={envs.friendlyAppName}
      >
        <WindowBar />
        <ScrollBox
          expand
          useChildHeight
          useChildWidth
          verticalAlign={Align.FILL}
          horizontalAlign={Align.FILL}
        >
          <MainStack />
        </ScrollBox>
      </Window>
    </FontSize>
  );
};
