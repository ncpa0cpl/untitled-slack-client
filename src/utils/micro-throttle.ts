export function microThrottle<A extends any[]>(action: (...args: A) => void) {
  let omitNextCall = false;

  return (...args: A) => {
    if (omitNextCall) return;

    omitNextCall = true;
    queueMicrotask(() => {
      omitNextCall = false;
      action(...args);
    });
  };
}
