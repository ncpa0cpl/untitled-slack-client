declare module "gi://Secret" {
  type SchemaRecord<S extends Schema> = S extends Schema<infer A>
    ? {
        [K in keyof A]: A[K] extends SchemaAttributeType.STRING
          ? string
          : A[K] extends SchemaAttributeType.INTEGER
          ? number
          : A[K] extends SchemaAttributeType.BOOLEAN
          ? boolean
          : never;
      }
    : never;

  class AsyncOperationResult {}

  export const COLLECTION_DEFAULT: string;

  export enum SchemaAttributeType {
    STRING = 0,
    INTEGER = 1,
    BOOLEAN = 2,
  }

  export enum SchemaFlags {
    NONE = 0,
  }

  export class Schema<A extends Record<string, SchemaAttributeType>> {
    constructor(schemaName: string, flags: number, attributes: A);
  }

  export class Service {
    static password_store<S extends Schema>(
      schema: S,
      attributes: SchemaRecord<S>,
      collectionLabel: string,
      secretLabel: string,
      secretValue: string,
      cancellable: object | null,
      callback: (obj: Service, res: AsyncOperationResult) => void
    );

    static password_store_finish(res: AsyncOperationResult): string;

    static password_lookup<S extends Schema>(
      schema: S,
      attributes: SchemaRecord<S>,
      cancellable: object | null,
      callback: (obj: Service, res: AsyncOperationResult) => void
    ): void;

    static password_lookup_finish(res: AsyncOperationResult): string;
  }
}
