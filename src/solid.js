import { createStore } from "solid-js/store";
import { flattenMoldErrorsToRHF } from "./utils.js";

/**
 * Creates a reactive form primitive for SolidJS using @formajs/mold.
 * @param {object} schema - Mold schema instance.
 * @param {object} [initialValues={}] - Initial form values.
 * @returns {{
 *   form: object,
 *   errors: object,
 *   handleChange: (field: string, value: any) => void,
 *   handleSubmit: (fn: (values: object) => void) => (e: Event) => void,
 *   isValid: boolean,
 *   isSubmitting: boolean
 * }}
 */
export function solidBinder(schema, initialValues = {}) {
  if (!schema || typeof schema.validate !== "function") {
    throw new Error(
      "solidBinder requires a mold schema with a validate method",
    );
  }

  const [state, setState] = createStore({
    values: initialValues,
    errors: {},
    isSubmitting: false,
    isValid: true,
  });

  const validate = async (values) => {
    const result = await schema.validate(values);
    if (result.valid) {
      setState({ errors: {}, isValid: true });
      return { valid: true, values: result.value };
    } else {
      const flatErrors = flattenMoldErrorsToRHF(result.errors);
      // Convert { "field": { message: "msg" } } to { "field": "msg" } for simplicity or keep consistent?
      // RHF utility returns { "field": { message: "..." } }.
      // Let's keep consistency.
      setState({ errors: flatErrors, isValid: false });
      return { valid: false, errors: flatErrors };
    }
  };

  const handleChange = (field, value) => {
    setState("values", field, value);
    // Validating on change could be optional, but for now let's keep it simple (validate on submit or manual)
    // If we want real-time validation:
    // validate({ ...state.values, [field]: value });
  };

  const handleSubmit = (onSubmit) => async (e) => {
    e?.preventDefault();
    setState({ isSubmitting: true });

    try {
      const result = await validate(state.values);
      if (result.valid) {
        await onSubmit(result.values);
      }
    } finally {
      setState({ isSubmitting: false });
    }
  };

  return {
    get values() {
      return state.values;
    },
    get errors() {
      return state.errors;
    },
    get isSubmitting() {
      return state.isSubmitting;
    },
    get isValid() {
      return state.isValid;
    },
    handleChange,
    handleSubmit,
    validate: () => validate(state.values),
  };
}
