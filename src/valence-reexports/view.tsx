import React from "react";
import { View as VView } from "valence-native";
import type { ViewStyle } from "../stylesheets/typings";
import type { ComponentWithChildren } from "../types";

export interface ViewProps extends ComponentWithChildren {
  style?: ViewStyle;
}

export const View = (props: ViewProps) => <VView {...(props as any)} />;
