import React from "react";
import { App, Window } from "valence-native";
import { Text } from "./valence-reexports/text";
import { View } from "./valence-reexports/view";

export class Main extends React.Component {
  render() {
    return (
      <App>
        <Window style={{ width: 500, height: 500 }}>
          <View>
            <Text>Hello, world!</Text>
          </View>
        </Window>
      </App>
    );
  }
}
