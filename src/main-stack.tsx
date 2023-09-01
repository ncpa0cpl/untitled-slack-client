import React from "react";
import { BetterComponent } from "react-better-components";
import { Align, createStack } from "react-gjs-renderer";
import { Chat } from "./components/chat/chat";
import { SignInPanel } from "./components/signin-panel/signin-panel";

export type AppScreens = "sing-in" | "chat";

const Navigator: ReturnType<typeof createStack> = createStack();

export const navigate = (screen: AppScreens) => {
  Navigator.navigate(screen);
};

const screen = (label: AppScreens) => {
  return label;
};

export class MainStack extends BetterComponent {
  constructor(props: any) {
    super(props);

    this.$effect(() => {
      navigate("sing-in");
    }, []);
  }

  render() {
    return (
      <Navigator.Stack verticalAlign={Align.FILL} horizontalAlign={Align.FILL}>
        <Navigator.Screen
          verticalAlign={Align.FILL}
          horizontalAlign={Align.FILL}
          uid={screen("sing-in")}
          label=""
        >
          <SignInPanel />
        </Navigator.Screen>
        <Navigator.Screen
          verticalAlign={Align.FILL}
          horizontalAlign={Align.FILL}
          uid={screen("chat")}
          label=""
        >
          <Chat />
        </Navigator.Screen>
      </Navigator.Stack>
    );
  }
}
