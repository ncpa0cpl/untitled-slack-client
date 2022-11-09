import React from "react";
import { App, Window } from "valence-native";
import { SignInPanel } from "./components/signin-panel/signin-panel";
import { View } from "./valence-reexports/view";

export class Main extends React.Component {
  render() {
    return (
      <App>
        <Window style={{ width: "100%", height: "100%" }}>
          <View>
            <SignInPanel />
          </View>
        </Window>
      </App>
    );
  }
}
