import { transformMoldErrorsToFormik } from './utils.js';

/**
 * Binder para Felte.
 * Retorna função de validação que devolve objeto de erros com shape dos valores.
 * @param {object} schema
 * @returns {(values:any) => Promise<object>}
 */
export function felteBinder(schema) {
  if (!schema || typeof schema.validate !== 'function') {
    throw new Error('felteBinder requires a mold schema with a validate method');
  }
  return async (values) => {
    const result = await schema.validate(values);
    if (result.valid) return {};
    return transformMoldErrorsToFormik(result.errors);
  };
}

export default felteBinder;
