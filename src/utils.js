/**
 * Achata erros produzidos pelo mold em notação de ponto para uso em bibliotecas
 * que esperam caminhos plano (ex: React Hook Form).
 * Regras de transformação:
 * - Objetos aninhados viram paths 'a.b.c'.
 * - Arrays: índice vira 'arr.0', 'arr.1'.
 * - Estrutura de ArraySchema com `items` preserva seus índices.
 * - Para cada campo pegamos apenas o primeiro erro do array.
 * @param {object|null} moldErrors Estrutura `errors` retornada por schema.validate()
 * @returns {Record<string,{ type:string, message:string }>} Erros achatados
 */
export function flattenMoldErrorsToRHF(moldErrors) {
  const out = {};
  if (!moldErrors) return out;

  const walk = (node, basePath) => {
    if (!node) return;
    // Caso array de erros diretos
    if (Array.isArray(node)) {
      if (node.length === 0) {
        // Mesmo com array vazio, pode haver erros por índice em `items`
        if (node.items) {
          const items = node.items;
          Object.keys(items).forEach((idx) => {
            const arrErr = items[idx];
            if (Array.isArray(arrErr) && arrErr[0] && arrErr[0].rule) {
              const path = basePath ? `${basePath}.${idx}` : idx;
              out[path] = { type: arrErr[0].rule, message: arrErr[0].message };
            } else if (
              Array.isArray(arrErr) &&
              arrErr.length === 1 &&
              arrErr[0] &&
              typeof arrErr[0] === "object" &&
              !arrErr[0].rule
            ) {
              // Wrapper interno de object schema dentro de array
              walk(arrErr[0], basePath ? `${basePath}.${idx}` : idx);
            } else if (arrErr && typeof arrErr === "object") {
              walk(arrErr, basePath ? `${basePath}.${idx}` : idx);
            }
          });
        }
        return;
      }
      // Verifica se é array de objetos de erro simples
      if (node[0] && node[0].rule && node[0].message) {
        const first = node[0];
        out[basePath] = { type: first.rule, message: first.message };
        return;
      }
      // Wrapper de ObjectSchema: [ { fieldA: [...], fieldB: [...] } ]
      if (
        node.length === 1 &&
        node[0] &&
        typeof node[0] === "object" &&
        !node[0].rule
      ) {
        walk(node[0], basePath); // não adiciona índice artificial
        return;
      }
      // Pode ser estrutura especial de ArraySchema (mistura de erros + items)
      // Ex: [ {rule...}, {rule...}, items: { 1: [...] } ] representado via Object.assign([...errors], { items })
      // Então percorremos cada índice
      for (let i = 0; i < node.length; i++) {
        const item = node[i];
        if (item && item.rule && item.message) {
          const path = basePath ? `${basePath}.${i}` : String(i);
          out[path] = { type: item.rule, message: item.message };
        } else if (
          item &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          !item.rule
        ) {
          // Pode ser objeto de erros aninhados dentro de array (ex: array de objetos)
          const pathPrefix = basePath ? `${basePath}.${i}` : String(i);
          walk(item, pathPrefix);
        }
      }
      // Caso tenha propriedade items para erros dos elementos
      if (node.items) {
        const items = node.items;
        Object.keys(items).forEach((idx) => {
          const arrErr = items[idx];
          if (Array.isArray(arrErr) && arrErr[0] && arrErr[0].rule) {
            const path = basePath ? `${basePath}.${idx}` : idx;
            out[path] = { type: arrErr[0].rule, message: arrErr[0].message };
          } else if (
            Array.isArray(arrErr) &&
            arrErr.length === 1 &&
            arrErr[0] &&
            typeof arrErr[0] === "object" &&
            !arrErr[0].rule
          ) {
            // Wrapper interno de object schema dentro de array
            walk(arrErr[0], basePath ? `${basePath}.${idx}` : idx);
          } else if (arrErr && typeof arrErr === "object") {
            // Nested (ex: array de objetos)
            walk(arrErr, basePath ? `${basePath}.${idx}` : idx);
          }
        });
      }
      return;
    }
    // Objeto de campos
    if (typeof node === "object") {
      Object.keys(node).forEach((key) => {
        const value = node[key];
        const path = basePath ? `${basePath}.${key}` : key;
        walk(value, path);
      });
    }
  };

  walk(moldErrors, "");
  return out;
}

/**
 * Para Formik normalmente retornamos um objeto com arrays de mensagens ou a primeira.
 * Aqui geramos um objeto (não achatado) replicando a estrutura original mas convertendo arrays
 * de erros em string única (primeiro erro) para compatibilidade com exibição simples.
 * @param {object|null} moldErrors
 * @returns {object} Estrutura de erros para Formik
 */
export function transformMoldErrorsToFormik(moldErrors) {
  if (!moldErrors) return {};
  const convert = (node) => {
    if (!node) return undefined;
    if (Array.isArray(node)) {
      if (node.length === 0) {
        if (node.items) {
          const itemsObj = {};
          Object.keys(node.items).forEach((i) => {
            const sub = convert(node.items[i]);
            if (sub != null) itemsObj[i] = sub;
          });
          return Object.keys(itemsObj).length > 0 ? itemsObj : undefined;
        }
        return undefined;
      }
      if (node[0] && node[0].rule && node[0].message) {
        return node[0].message; // pega primeira mensagem
      }
      // Wrapper de ObjectSchema
      if (
        node.length === 1 &&
        node[0] &&
        typeof node[0] === "object" &&
        !node[0].rule
      ) {
        return convert(node[0]);
      }
      // Caso structure de array + items
      const baseMessages = node
        .filter((e) => e && e.message)
        .map((e) => e.message);
      const outArr = baseMessages.length ? baseMessages[0] : undefined;
      if (node.items) {
        const itemsObj = {};
        Object.keys(node.items).forEach((i) => {
          const sub = convert(node.items[i]);
          if (sub != null) itemsObj[i] = sub;
        });
        if (Object.keys(itemsObj).length > 0) {
          return itemsObj; // retorna objeto indexado para os itens
        }
      }
      return outArr;
    }
    if (typeof node === "object") {
      const out = {};
      Object.keys(node).forEach((k) => {
        const sub = convert(node[k]);
        if (sub != null) out[k] = sub;
      });
      return out;
    }
    return undefined;
  };
  return convert(moldErrors) || {};
}

/**
 * Erro de validação estilo Formik.
 */
export class ValidationError extends Error {
  constructor(errors) {
    super("Validation failed");
    this.name = "ValidationError";
    this.errors = errors; // estrutura de erros transformada
  }
}
