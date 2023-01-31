import React from "react";
import { Align, ScrollBox, Window } from "react-gjs-renderer";
import "react-gnome";
import { SignInPanel } from "./components/signin-panel/signin-panel";

export const App = () => {
  return (
    <Window
      defaultWidth={400}
      defaultHeight={250}
      quitAppOnClose
      title="React Gnome App"
    >
      <ScrollBox
        expand
        useChildHeight
        useChildWidth
        verticalAlign={Align.CENTER}
        horizontalAlign={Align.CENTER}
      >
        <SignInPanel />
      </ScrollBox>
    </Window>
  );
};
