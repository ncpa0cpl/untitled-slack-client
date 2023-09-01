export const Bound =
  () => (proto: object, key: string, descriptor: PropertyDescriptor) => {
    const impl = descriptor.value;
    const implKey = `__impl_${key}`;
    const boundKey = `__bound_${key}`;

    Object.defineProperty(proto, implKey, {
      value: impl,
    });

    Object.defineProperty(proto, key, {
      get() {
        if (boundKey in this) {
          return this[boundKey];
        }

        const bound = (...args: any[]) => this[implKey](...args);

        Object.defineProperty(this, boundKey, {
          value: bound,
        });

        return bound;
      },
    });

    return proto;
  };
