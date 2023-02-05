import envs from "gapp:env";
import React from "react";
import { Align, ScrollBox, Window } from "react-gjs-renderer";
import "react-gnome";
import { WindowBar } from "./components/window-bar/window-bar";
import { MainStack } from "./main-stack";

export const App = () => {
  return (
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
  );
};
