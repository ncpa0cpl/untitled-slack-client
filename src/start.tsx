import env from "gapp:env";
import React from "react";
import { render } from "react-gjs-renderer";
import "react-gnome";
import { App } from "./app";

render(<App />, {
  appId: env.appId,
});
