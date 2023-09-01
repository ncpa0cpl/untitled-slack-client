import type { StyleSheet } from "react-gjs-renderer/dist/gjs-elements/utils/property-maps-factories/create-style-prop-mapper";

export const stylesheet = <S extends StyleSheet>(s: S) => s;
