import type { ImageStyle, TextStyle, ViewStyle } from "./stylesheets/typings";

type AttributesWithChildren<A = {}> = A & {
  children?: React.ReactNode;
};

type WindowAttributes = AttributesWithChildren<{
  style?: ViewStyle;
  onResize?: (dimmensions: { h: number; w: number }) => void;
  onMove?: (movementVector: { x: number; y: number }) => void;
}>;

type ImageAttributes = AttributesWithChildren<{
  style?: ImageStyle;
  source: string;
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
}>;

type ViewAttributes = AttributesWithChildren<{
  style?: ViewStyle;
  onMouseMove: (event: unknown) => void;
  onMouseEnter: (event: unknown) => void;
  onMouseLeave: (event: unknown) => void;
}>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      APP: AttributesWithChildren;
      WINDOW: AttributesWithChildren<WindowAttributes>;
      VIEW: AttributesWithChildren<ViewAttributes>;
      VIRTUALTEXT: AttributesWithChildren<{ style?: TextStyle }>;
      ROOTTEXT: AttributesWithChildren<{ style?: TextStyle }>;
      IMAGE: AttributesWithChildren<ImageAttributes>;
      TEXTINPUT: AttributesWithChildren<{ style?: TextStyle }>;
      PICKERINTERNAL: AttributesWithChildren<{ style?: ViewStyle }>;
      BUTTON: AttributesWithChildren<{ style?: ViewStyle; title?: string }>;
    }
  }
}

export {};
