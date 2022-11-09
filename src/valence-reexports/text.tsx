import React from "react";
import { Text as VText } from "valence-native";
import type { TextStyle } from "../stylesheets/typings";
import type { ComponentWithChildren } from "../types";

export interface TextProps extends ComponentWithChildren {
  style?: TextStyle;
}

export const Text = (props: TextProps) => <VText {...props} />;
