import type {
  MoldSchema,
  RHFErrorMap,
  InferMoldOutput,
  InferMoldInput,
} from "./common";

// Resolver RHF: recebe dados (entrada) e retorna valores (saída do schema) + erros achatados
export declare function rhfBinder<S extends MoldSchema<any, any>>(
  schema: S,
): (
  data: InferMoldInput<S>,
  context?: any,
  options?: any,
) => Promise<{ values: InferMoldOutput<S> | {}; errors: RHFErrorMap }>;

export default rhfBinder;
