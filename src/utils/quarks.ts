import type { ComponentModuleParam, Dependency } from "react-better-components";
import { ComponentModule, type BetterComponent } from "react-better-components";
import type { Quark } from "react-quarks";
import type { ReadonlyQuark } from "./types";

export function $quark<T, S = T>(
  component: BetterComponent | ComponentModule,
  quark: Quark<T, any, any, any>,
  selector: (v: T) => S = (v) => v as any,
  additionalDependencies?: Quark<T, any, any, any>[],
) {
  if (additionalDependencies) {
    return component.$externalStore(
      (cb) => {
        const cancel: Function[] = [quark.subscribe(cb).cancel];
        for (const q of additionalDependencies) {
          cancel.push(q.subscribe(cb).cancel);
        }
        return () => {
          for (const c of cancel) {
            c();
          }
        };
      },
      () => selector(quark.get()),
    );
  }

  return component.$externalStore(
    (cb) => quark.subscribe(cb).cancel,
    () => selector(quark.get()),
  );
}

export class $Quark<T> extends ComponentModule<[Dependency<ReadonlyQuark<T>>]> {
  private value;

  constructor(param: ComponentModuleParam) {
    super(param);

    const [q] = this.args;
    this.value = this.$state(q.get().get());

    this.$effect(() => this.setupQuarkListener(), [q]);
  }

  private setupQuarkListener() {
    const [q] = this.args;
    const quark = q.get();
    const currentValue = quark.get();

    if (currentValue !== this.value.get()) {
      this.value.set(currentValue);
    }

    const subscription = quark.subscribe((newState) => {
      this.value.set(newState);
    });

    return () => {
      subscription.cancel();
    };
  }

  public get(): T {
    return this.value.get();
  }
}
