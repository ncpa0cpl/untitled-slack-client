import React from "react";
import { TextInput as VTextInput } from "valence-native";
import type { TextStyle } from "../stylesheets/typings";
import type { ComponentWithChildren } from "../types";

export interface TextInputProps extends ComponentWithChildren {
  style?: TextStyle;
  onChangeText?: (text: string) => void;
  value?: string;
  multiline?: boolean;
}

export const TextInput = (props: TextInputProps) => <VTextInput {...props} />;
