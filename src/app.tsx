import envs from "gapp:env";
import React from "react";
import { Align, ScrollBox, Window } from "react-gjs-renderer";
import "react-gnome";
import { SignInPanel } from "./components/signin-panel/signin-panel";

export const App = () => {
  return (
    <Window
      defaultWidth={1024}
      defaultHeight={768}
      quitAppOnClose
      title={envs.friendlyAppName}
    >
      <ScrollBox
        expand
        useChildHeight
        useChildWidth
        verticalAlign={Align.CENTER}
        horizontalAlign={Align.FILL}
      >
        <SignInPanel />
      </ScrollBox>
    </Window>
  );
};
