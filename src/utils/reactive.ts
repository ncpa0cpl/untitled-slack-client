import { EventTarget } from "./event-target";
import { microThrottle } from "./micro-throttle";

type ReactiveEvents = {
  changed: null;
};

const reactiveProps = new Map<object, string[]>();

export class Reactive extends EventTarget<ReactiveEvents> {
  static property(proto: Reactive, key: string) {
    const rpList = reactiveProps.get(proto) || [];

    rpList.push(key);

    reactiveProps.set(proto, rpList);
  }

  private emitChangeEvent = microThrottle(() => {
    this.emit("changed", null);
  });

  constructor() {
    super();
    const proto = Object.getPrototypeOf(this);
    const rpList = reactiveProps.get(proto);

    const privates = new Map<any, any>();

    if (rpList)
      for (let i = 0; i < rpList.length; i++) {
        const propKey = rpList[i]!;
        Object.defineProperty(this, propKey, {
          configurable: false,
          enumerable: true,
          get: () => {
            return privates.get(propKey);
          },
          set: (v) => {
            privates.set(propKey, v);
            this.emitChangeEvent();
            return true;
          },
        });
      }
  }

  public make<A extends any[], T extends Reactive>(
    constructor: new (...args: A) => T,
    ...args: A
  ): T {
    const instance = new constructor(...args);
    instance.parent = this;
    return instance;
  }
}
