import type { ConversationChannel } from "../quarks/slack/conversations";

export type Ok<T> = { ok: true; value: T };

export type Err<E> = { ok: false; error: E };

export type Result<T = void, E = Error> = Ok<T> | Err<E>;

export type AsyncResult<T = void, E = Error> = Promise<Result<T, E>>;

export function ok<T = undefined>(value?: undefined): Ok<T>;
export function ok<T>(value: T): Ok<T>;
export function ok<T>(value?: T): Ok<T> {
  return { ok: true, value: value as T };
}

export const err = <E>(error: E): Err<E> => ({ ok: false, error });

type MappedAsyncValues<T extends any[]> = number extends T["length"]
  ? T extends AsyncResult<infer T, any>[]
    ? T[]
    : never
  : T extends [infer R, ...infer Rest]
  ? [
      R extends AsyncResult<infer T, any> ? T : never,
      ...MappedAsyncValues<Rest>
    ]
  : [];

type MappedAsyncErrors<T extends any[]> = number extends T["length"]
  ? T extends AsyncResult<any, infer E>[]
    ? E[]
    : never
  : T extends [infer R, ...infer Rest]
  ? [
      R extends AsyncResult<any, infer E> ? E : never,
      ...MappedAsyncValues<Rest>
    ]
  : [];

type AsyncAllResult<T extends AsyncResult<any, any>[]> = AsyncResult<
  MappedAsyncValues<T>,
  MappedAsyncErrors<T>
>;

type Test = AsyncResult<ConversationChannel>[];

type T1 = number extends Test["length"] ? true : false;

export const AsyncAll = async <R extends AsyncResult<any, any>[]>(
  results: R
): AsyncAllResult<R> => {
  const awaited = await Promise.all(results);

  const tList: any[] = [];
  const eList: any[] = [];

  for (let i = 0; i < awaited.length; i++) {
    const result = awaited[i]!;

    if (result.ok) {
      tList.push(result.value);
    } else {
      eList.push(result.error);
    }
  }

  if (eList.length > 0) {
    return err(eList) as Err<MappedAsyncErrors<R>>;
  }

  return ok(tList) as Ok<MappedAsyncValues<R>>;
};
