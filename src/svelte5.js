import { writable, get } from 'svelte/store';
import { flattenMoldErrorsToRHF } from './utils.js';

/**
 * Creates a Svelte store-based form binder.
 * Compatible with Svelte 4 and 5.
 * @param {object} schema - Mold schema instance.
 * @param {object} [initialValues={}] - Initial form values.
 * @returns {object} { form, errors, isSubmitting, handleChange, handleSubmit }
 */
export function svelteBinder(schema, initialValues = {}) {
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
