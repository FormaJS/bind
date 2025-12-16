import { writable, get } from 'svelte/store';

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
function flattenMoldErrorsToRHF(moldErrors) {
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
            } else if (Array.isArray(arrErr) && arrErr.length === 1 && arrErr[0] && typeof arrErr[0] === 'object' && !arrErr[0].rule) {
              // Wrapper interno de object schema dentro de array
              walk(arrErr[0], basePath ? `${basePath}.${idx}` : idx);
            } else if (arrErr && typeof arrErr === 'object') {
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
      if (node.length === 1 && node[0] && typeof node[0] === 'object' && !node[0].rule) {
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
        }
        else if (item && typeof item === 'object' && !Array.isArray(item) && !item.rule) {
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
          } else if (Array.isArray(arrErr) && arrErr.length === 1 && arrErr[0] && typeof arrErr[0] === 'object' && !arrErr[0].rule) {
            // Wrapper interno de object schema dentro de array
            walk(arrErr[0], basePath ? `${basePath}.${idx}` : idx);
          } else if (arrErr && typeof arrErr === 'object') {
            // Nested (ex: array de objetos)
            walk(arrErr, basePath ? `${basePath}.${idx}` : idx);
          }
        });
      }
      return;
    }
    // Objeto de campos
    if (typeof node === 'object') {
      Object.keys(node).forEach((key) => {
        const value = node[key];
        const path = basePath ? `${basePath}.${key}` : key;
        walk(value, path);
      });
    }
  };

  walk(moldErrors, '');
  return out;
}

/**
 * Creates a Svelte store-based form binder.
 * Compatible with Svelte 4 and 5.
 * @param {object} schema - Mold schema instance.
 * @param {object} [initialValues={}] - Initial form values.
 * @returns {object} { form, errors, isSubmitting, handleChange, handleSubmit }
 */
function svelteBinder(schema, initialValues = {}) {
    if (!schema || typeof schema.validate !== 'function') {
        throw new Error('svelteBinder requires a mold schema with a validate method');
    }

    // Create stores
    const values = writable(initialValues);
    const errors = writable({});
    const isSubmitting = writable(false);
    const isValid = writable(true);

    const validate = async (currentValues) => {
        const result = await schema.validate(currentValues);
        if (result.valid) {
            errors.set({});
            isValid.set(true);
            return { valid: true, values: result.value };
        } else {
            const flatErrors = flattenMoldErrorsToRHF(result.errors);
            errors.set(flatErrors);
            isValid.set(false);
            return { valid: false, errors: flatErrors };
        }
    };

    const handleChange = (field, value) => {
        values.update(v => ({ ...v, [field]: value }));
    };

    const handleSubmit = (onSubmit) => async (e) => {
        e?.preventDefault();
        isSubmitting.set(true);
        const currentValues = get(values);

        try {
            const result = await validate(currentValues);
            if (result.valid) {
                await onSubmit(result.values);
            }
        } finally {
            isSubmitting.set(false);
        }
    };

    return {
        values,
        errors,
        isSubmitting,
        isValid,
        handleChange,
        handleSubmit,
        validate: () => validate(get(values))
    };
}

export { svelteBinder };
