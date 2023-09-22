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

export class Logger {
  static info(...args: any[]) {
    print(color("cyan", "INFO: ") + args.map(String).join(" "));
  }

  static log(...args: any) {
    console.log(...args);
  }

  static warn(...args: any) {
    console.warn(...args);
  }

  static error(...args: any) {
    console.error(...args);
  }
}
