import { transformMoldErrorsToFormik } from './utils.js';

/**
 * Binder para @mantine/form.
 * Retorna uma função de validação que devolve objeto de erros estruturado
 * (shape semelhante aos valores), com strings nas folhas.
 * @param {object} schema
 * @returns {(values:any) => Promise<object>}
 */
export function mantineBinder(schema) {
  if (!schema || typeof schema.validate !== 'function') {
    throw new Error('mantineBinder requires a mold schema with a validate method');
  }
  return async (values) => {
    const result = await schema.validate(values);
    if (result.valid) return {};
    return transformMoldErrorsToFormik(result.errors);
  };
}

export default mantineBinder;
