import React from "react";
import { PureBetterComponent } from "react-better-components";

export const FontSizeContext = React.createContext(12);

export class FontSize extends PureBetterComponent<{
  size: number | ((prev: number) => number);
}> {
  render() {
    const { size } = this.props;

    if (typeof size === "number") {
      return (
        <FontSizeContext.Provider value={size}>
          {this.props.children}
        </FontSizeContext.Provider>
      );
    }

    return (
      <FontSizeContext.Consumer>
        {(prev) => (
          <FontSizeContext.Provider value={size(prev)}>
            {this.props.children}
          </FontSizeContext.Provider>
        )}
      </FontSizeContext.Consumer>
    );
  }
}

export const FontMod = {
  enlarge: {
    by10: (prev: number) => prev * 1.1,
    by20: (prev: number) => prev * 1.2,
    by30: (prev: number) => prev * 1.3,
    by40: (prev: number) => prev * 1.4,
    by50: (prev: number) => prev * 1.5,
    by60: (prev: number) => prev * 1.6,
    by70: (prev: number) => prev * 1.7,
    by80: (prev: number) => prev * 1.8,
    by90: (prev: number) => prev * 1.9,
    by100: (prev: number) => prev * 2,
  },
  shrink: {
    by10: (prev: number) => prev / 1.1,
    by20: (prev: number) => prev / 1.2,
    by30: (prev: number) => prev / 1.3,
    by40: (prev: number) => prev / 1.4,
    by50: (prev: number) => prev / 1.5,
    by60: (prev: number) => prev / 1.6,
    by70: (prev: number) => prev / 1.7,
    by80: (prev: number) => prev / 1.8,
    by90: (prev: number) => prev / 1.9,
    by100: (prev: number) => prev / 2,
  },
};
