import React from "react";
import { AppRegistry } from "valence-native";
import { Main } from "./main";
import "./quarks/settings";

AppRegistry.registerComponent("client", (<Main />) as any);

// =============================================================================
// This is for hot reloading (this will be stripped off in production by
// webpack)
// THIS SHOULD NOT BE CHANGED
// @ts-ignore
if (module.hot) {
  // @ts-ignore
  module.hot.accept(["./app"], function () {
    // eslint-disable-next-line
    const app = require("./app")["default"];
    AppRegistry.updateProxy(app);
  });
}
