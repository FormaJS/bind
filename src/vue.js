/**
 * @typedef {import('@formajs/mold').AnySchema} AnySchema
 */

// We assume users have 'vue' installed.
// We import reactive APIs dynamically or expect global?
// For an adapter package, we should import from 'vue'.
// Since we don't want to bundle vue, it should be external.
import { reactive, watch, toRefs } from "vue";

/**
 * Custom hook for Vue 3 using Composition API.
 * @template {AnySchema} TSchema
 * @param {TSchema} schema
 * @param {import('@formajs/mold').infer<TSchema>} [initialValues]
 */
export function useForm(schema, initialValues = {}) {
  const state = reactive({
    values: { ...initialValues },
    errors: {},
    isSubmitting: false,
    isValid: true,
  });

  const validate = async () => {
    // @ts-ignore
    const result = await schema.validate(state.values);
    state.errors = result.valid ? {} : result.errors || {};
    state.isValid = result.valid;
    return result;
  };

  const handleSubmit = (fn) => async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    state.isSubmitting = true;
    const result = await validate();
    if (result.valid) {
      await fn(result.value);
    }
    state.isSubmitting = false;
  };

  const register = (path) => {
    // Basic v-model binding helper is tricky in vanilla JS adapter without JSX.
    // But we can return props object.
    return {
      name: path,
      // In Vue, v-model works differently.
      // We usually just expose `values` and let user use v-model="form.values.name"
    };
  };

  // Auto-validate on change
  watch(
    () => state.values,
    () => {
      // Debounce? For now, instant.
      // We might want to only validate touched fields?
      // Simple version: just validate.
      validate();
    },
    { deep: true },
  );

  return {
    ...toRefs(state),
    handleSubmit,
    validate,
  };
}
