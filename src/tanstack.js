import { flattenMoldErrorsToRHF } from './utils.js';

/**
 * Binder para TanStack React Form.
 * Retorna uma função de validação de formulário que devolve um objeto
 * achatado { 'path.dot': 'message' }.
 * Compatível com uso como form-level validator.
 * @param {object} schema - Schema do mold com método validate
 * @returns {(values:any) => Promise<Record<string,string>>}
 */
export function tanstackBinder(schema) {
  if (!schema || typeof schema.validate !== 'function') {
    throw new Error('tanstackBinder requires a mold schema with a validate method');
  }
  return async (values) => {
    const result = await schema.validate(values);
    if (result.valid) return {};
    const flat = flattenMoldErrorsToRHF(result.errors);
    const out = {};
    for (const k in flat) out[k] = flat[k].message;
    return out;
  };
}

export default tanstackBinder;
