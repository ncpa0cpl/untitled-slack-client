const escape = "\u001b";
const COLORS = {
  unset: `${escape}[0m`,
  red: `${escape}[31m`,
  green: `${escape}[32m`,
  yellow: `${escape}[33m`,
  blue: `${escape}[34m`,
  magenta: `${escape}[35m`,
  cyan: `${escape}[36m`,
  white: `${escape}[37m`,
  lightRed: `${escape}[91m`,
  lightGreen: `${escape}[92m`,
  lightYellow: `${escape}[93m`,
  lightBlue: `${escape}[94m`,
  lightMagenta: `${escape}[95m`,
  lightCyan: `${escape}[96m`,
  lightWhite: `${escape}[97m`,
};

const color = (
  c: keyof typeof COLORS,

  str: string,
) => {
  return `${COLORS[c]}${str}${COLORS.unset}`;
};

const stringify = (v: any) => {
  switch (typeof v) {
    case "object":
      return JSON.stringify(v);
    default:
      return String(v);
  }
};

export class Logger {
  static info(...args: any[]) {
    // @ts-expect-error
    print(color("cyan", "INFO: ") + args.map(stringify).join(" "));
  }

  static log(...args: any) {
    // @ts-expect-error
    print(color("lightWhite", "LOG: ") + args.map(stringify).join(" "));
  }

  static warn(...args: any) {
    // @ts-expect-error
    print(color("lightYellow", "WARN: ") + args.map(stringify).join(" "));
  }

  static error(...args: any) {
    // @ts-expect-error
    print(color("lightRed", "ERROR: ") + args.map(stringify).join(" "));
  }

  static debug(...args: any) {
    // @ts-expect-error
    print(color("lightMagenta", "DEBUG: ") + args.map(stringify).join(" "));
  }
}
