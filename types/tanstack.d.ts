import type { MoldSchema, InferMoldInput } from "./common";

export declare function tanstackBinder<S extends MoldSchema<any, any>>(
  schema: S,
): (values: InferMoldInput<S>) => Promise<Record<string, string>>;

export default tanstackBinder;
