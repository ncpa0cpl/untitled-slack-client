export type ReadonlyQuark<T> = {
  use(): { value: T };
  get(): T;
  subscribe(cb: (v: T) => void): { cancel(): void };
};
