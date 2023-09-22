import { BetterComponent } from "react-better-components";
import type { Quark } from "react-quarks";
import { $quark } from "./quarks";
import type { Reactive } from "./reactive";

export abstract class Component<
  P extends object = object,
> extends BetterComponent<P> {
  public $quark<T, S = T>(
    quark: Quark<T, any>,
    selector: (v: T) => S = (v) => v as any,
  ) {
    return $quark(this, quark, selector);
  }

  public $reactiveStore<R extends Reactive, S = R>(
    reactive: R,
    selector: (v: R) => S = (v) => v as any,
  ) {
    return this.$externalStore(
      (cb) => reactive.on("changed", cb),
      () => selector(reactive),
    );
  }
}
