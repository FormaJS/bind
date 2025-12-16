import { transformMoldErrorsToFormik, ValidationError } from "./utils.js";

/**
 * Cria um validador para Formik a partir de um schema do @formajs/mold.
 * Pode retornar objeto de erros (padrão do Formik) ou lançar ValidationError se opcionalmente habilitado.
 * @param {object} schema - Schema do mold com método validate
 * @param {object} [options]
 * @param {boolean} [options.throwOnError=false] - Se true, lança ValidationError com errors
 * @returns {(values:any) => Promise<object>} função de validação para Formik
 */
export function formikBinder(schema, options = {}) {
  const { throwOnError = false } = options;
  if (!schema || typeof schema.validate !== "function") {
    throw new Error(
      "formikBinder requires a mold schema with a validate method",
    );
  }
  return async (values) => {
    const result = await schema.validate(values);
    if (result.valid) {
      // Formik usa os "values" locais; a sanitização pode ser aplicada via onSubmit
      return {};
    }
    const errors = transformMoldErrorsToFormik(result.errors);
    if (throwOnError) {
      throw new ValidationError(errors);
    }
    return errors;
  };
}

export { ValidationError };
export default formikBinder;
