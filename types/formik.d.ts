import type { MoldSchema, InferMoldInput } from './common';

export interface FormikBinderOptions { throwOnError?: boolean }

export declare class ValidationError extends Error {
  errors: Record<string, any>;
  constructor(errors: Record<string, any>);
}

// Tipo recursivo para erros do Formik com base no shape de entrada
export type ErrorsOf<T> =
  T extends Array<infer U>
    ? { [K in number]?: ErrorsOf<U> } | string | undefined
    : T extends object
      ? { [K in keyof T]?: ErrorsOf<T[K]> }
      : string | undefined;

export declare function formikBinder<S extends MoldSchema<any, any>>(
  schema: S,
  options?: FormikBinderOptions
): (values: InferMoldInput<S>) => Promise<ErrorsOf<InferMoldInput<S>>>;

export { ValidationError };
export default formikBinder;
