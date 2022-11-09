import { StyleSheet as ValenceStyleSheet } from "valence-native";
import type { NamedStyles } from "./typings";

export class StyleSheet {
  create<S extends NamedStyles<S> | NamedStyles<any>>(
    style: S | NamedStyles<S>
  ): S {
    return ValenceStyleSheet.create(style) as S;
  }
}
