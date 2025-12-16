import { reactive, watch, toRefs } from 'vue';

/**
 * @typedef {import('@formajs/mold').AnySchema} AnySchema
 */


/**
 * Custom hook for Vue 3 using Composition API.
 * @template {AnySchema} TSchema
 * @param {TSchema} schema
 * @param {import('@formajs/mold').infer<TSchema>} [initialValues]
 */
function useForm(schema, initialValues = {}) {
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

    // Auto-validate on change
    watch(() => state.values, () => {
        // Debounce? For now, instant.
        // We might want to only validate touched fields?
        // Simple version: just validate.
        validate();
    }, { deep: true });

    return {
        ...toRefs(state),
        handleSubmit,
        validate,
    };
}

export { useForm };
