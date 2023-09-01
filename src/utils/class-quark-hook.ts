import type { BetterComponent } from "react-better-components";
import type { Quark } from "react-quarks";

export function $quark<T, S = T>(
  component: BetterComponent,
  quark: Quark<T, any>,
  selector: (v: T) => S = (v) => v as any
) {
  return component.$externalStore(
    (cb) => {
      return quark.subscribe(cb).cancel;
    },
    () => {
      return selector(quark.get());
    }
  );
}
