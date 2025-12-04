import type { MoldSchema, InferMoldInput } from './common';
import type { ErrorsOf } from './formik';

export declare function felteBinder<S extends MoldSchema<any, any>>(
  schema: S
): (values: InferMoldInput<S>) => Promise<ErrorsOf<InferMoldInput<S>>>;

export default felteBinder;
