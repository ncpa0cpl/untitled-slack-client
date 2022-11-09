import React from "react";
import { Button as VButton } from "valence-native";
import type { ViewStyle } from "../stylesheets/typings";

export interface ButtonProps {
  style?: ViewStyle;
  onPress?: () => void;
  children?: string;
}

export const Button = ({ children, ...props }: ButtonProps) => (
  <VButton {...props} title={children} />
);
