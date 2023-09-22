if (!("dispose" in Symbol)) {
  Object.defineProperty(Symbol, "dispose", {
    value: Symbol("@@Symbol.dispose"),
    writable: false,
    enumerable: false,
    configurable: false,
  });
}

if (!("asyncDispose" in Symbol)) {
  Object.defineProperty(Symbol, "asyncDispose", {
    value: Symbol("@@Symbol.asyncDispose"),
    writable: false,
    enumerable: false,
    configurable: false,
  });
}

export function defer(action: () => void) {
  return {
    // @ts-expect-error
    [Symbol.dispose]: action,
  };
}

export function asyncDefer(action: () => Promise<void>) {
  return {
    // @ts-expect-error
    [Symbol.asyncDispose]: action,
  };
}
