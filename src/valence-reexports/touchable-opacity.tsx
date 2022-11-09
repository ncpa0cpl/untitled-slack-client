import React from "react";
import { TouchableOpacity } from "valence-native";
import type { ViewStyle } from "../stylesheets/typings";
import type { ComponentWithChildren } from "../types";

export interface TouchableProps extends ComponentWithChildren {
  style?: ViewStyle;
  activeOpacity?: number;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const Touchable = (props: TouchableProps) => (
  <TouchableOpacity {...(props as any)} />
);
