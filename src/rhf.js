import { flattenMoldErrorsToRHF } from './utils.js';

/**
 * Cria um resolver para React Hook Form a partir de um schema do @formajs/mold.
 * O resolver é assíncrono, executa schema.validate(data) e retorna { values, errors }.
 * @template T
 * @param {object} schema - Schema do @formajs/mold (possui método validate).
 * @returns {(data: T, context?: any, options?: any) => Promise<{ values: T, errors: Record<string,{type:string,message:string}> }>} RHF resolver
 */
export function rhfBinder(schema) {
  if (!schema || typeof schema.validate !== 'function') {
    throw new Error('rhfBinder requires a mold schema with a validate method');
  }
  return async (data) => {
    const result = await schema.validate(data);
    if (result.valid) {
      return { values: result.value, errors: {} };
    }
    const flat = flattenMoldErrorsToRHF(result.errors);
    return { values: {}, errors: flat };
  };
}

export default rhfBinder;
