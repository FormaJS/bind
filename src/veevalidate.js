import { flattenMoldErrorsToRHF } from "./utils.js";

/**
 * Cria um validador para VeeValidate a partir de um schema do @formajs/mold.
 * Retorna uma função que recebe os valores do formulário e devolve um objeto
 * de erros achatado em notação de ponto, contendo apenas mensagens (string).
 * É compatível com cenários onde VeeValidate consome um "validation schema" como função.
 * @param {object} schema - Schema do mold com método validate
 * @returns {(values:any) => Promise<Record<string,string>>}
 */
export function veeBinder(schema) {
  if (!schema || typeof schema.validate !== "function") {
    throw new Error("veeBinder requires a mold schema with a validate method");
  }
  return async (values) => {
    const result = await schema.validate(values);
    if (result.valid) return {};
    const flat = flattenMoldErrorsToRHF(result.errors);
    const out = {};
    for (const k in flat) {
      out[k] = flat[k].message;
    }
    return out;
  };
}

export default veeBinder;
