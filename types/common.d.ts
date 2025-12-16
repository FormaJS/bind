// Representa o resultado de validação de Mold.
export interface MoldValidationResult<TOut> {
  valid: boolean;
  value: TOut;
  errors?: MoldErrorsTree | null;
}

// Estrutura recursiva de erros do mold (simplificada para typing).
export type MoldErrorsLeaf = {
  rule: string;
  message: string;
  context?: Record<string, any> | null;
};
export type MoldErrorsArray = Array<
  MoldErrorsLeaf | MoldErrorsTree | undefined
> & { items?: MoldErrorsArray };
export type MoldErrorsTree = {
  [key: string]: MoldErrorsArray | MoldErrorsTree | MoldErrorsLeaf[];
};

// Schema de Mold com entrada e saída (pode sanitizar/parsing transformando tipos).
export interface MoldSchema<TIn, TOut = TIn> {
  validate(input: TIn): Promise<MoldValidationResult<TOut>>;
}

// Mapa achatado de erros para RHF.
export type RHFErrorMap = Record<string, { type: string; message: string }>;

// Utilitário para derivar tipo do value retornado do schema (TOut).
export type InferMoldOutput<S> = S extends MoldSchema<any, infer O> ? O : never;
export type InferMoldInput<S> = S extends MoldSchema<infer I, any> ? I : never;
