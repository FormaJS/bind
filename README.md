# @formajs/bind

> **Mold Meets Magic—Seamlessly.**

The lightweight adapter that seamlessly connects Mold's fluent schemas to React Hook Form, Formik, VeeValidate, and beyond. Effortlessly sync validation, sanitization, and i18n-ready messages to your forms—no custom hooks, just pure FormaJS power unleashed.

## Installation

```bash
npm install @formajs/bind @formajs/mold @formajs/formajs
```

> **Note:** `@formajs/bind` v2 requires `@formajs/mold` ^2.0.0 and `@formajs/formajs` ^2.0.0

## Usage

### React Hook Form

```js
import { useForm } from 'react-hook-form';
import { forma } from '@formajs/mold';
import { rhfBinder } from '@formajs/bind/rhf';

const userSchema = forma.object({
  name: forma.string().trim().validateLength({ min: 3 }),
});

export function UserForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: rhfBinder(userSchema)
  });
  const onSubmit = (data) => console.log(data); // already sanitized
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <p>{errors.name.message}</p>}
      <button type="submit">Submit</button>
    </form>
  );
```

```js
import { forma } from "@formajs/mold";
import { formikBinder } from "@formajs/bind/formik";
const userSchema = forma.object({});
export function UserForm() {
  const validate = formikBinder(userSchema);

  const formik = useFormik({
    initialValues: { name: "" },
    validate,
    onSubmit: (values) => console.log(values),
  });
  return (
    <form onSubmit={formik.handleSubmit}>
      <input
        name="name"
        value={formik.values.name}
        onChange={formik.handleChange}
      />
      {formik.errors.name && <p>{formik.errors.name}</p>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

## API

- `rhfBinder(schema)` → RHF resolver `{ values, errors }`;
  - Errors are flattened in dot notation (`user.email`, `tags.1`).
  - Only the first error per field is returned.
- `formikBinder(schema, { throwOnError? })` → function `validate(values)`;
  - Returns error object in the format Formik expects.
  - If `throwOnError: true`, throws `ValidationError` with `errors`.
- `veeBinder(schema)` → function `validate(values)` for VeeValidate;
  - Returns flattened object `{ 'user.profile.email': 'Message' }`.
  - Focused on simple integration via dot notation.
- `tanstackBinder(schema)` → function `(values) => Promise<Record<string,string>>` for TanStack React Form;
  - Flattened errors, ideal for form-level validate.
- `mantineBinder(schema)` → function `(values) => Promise<ErrorsShape>` for @mantine/form;
  - Hierarchical structure compatible with value shapes.
- `felteBinder(schema)` → function `(values) => Promise<ErrorsShape>` for Felte;
  - Hierarchical structure (similar to Formik / Mantine).

## Quick Examples

### TanStack React Form

```ts
import { tanstackBinder } from "@formajs/bind/tanstack";
const validate = tanstackBinder(userSchema);
// In form config: formOptions = { validator: validate }
```

### Mantine Form

```ts
import { mantineBinder } from "@formajs/bind/mantine";
const form = useForm({ initialValues, validate: mantineBinder(userSchema) });
```

### Felte

```ts
import { felteBinder } from "@formajs/bind/felte";
const validate = felteBinder(userSchema);
// Pass validate when creating the Felte form
```

## Mold v2 Features

### Formatters & i18n

Mold v2 exposes FormaJS v2 formatters for dates, currency, phone numbers, and more:

```js
import { forma } from "@formajs/mold";

// Format dates
const dateSchema = forma
  .string()
  .validateDate()
  .formatDate({ format: "DD/MM/YYYY" });

// Format currency with locale
const priceSchema = forma
  .string()
  .formatCurrency({ locale: "pt-BR", currency: "BRL" });

// Format mobile numbers
const phoneSchema = forma.string().formatMobileNumber({ locale: "pt-BR" });

// Format tax IDs
const taxSchema = forma
  .string()
  .validateTaxId({ locale: "pt-BR", strict: true })
  .formatTaxId({ locale: "pt-BR" });
```

### Locale Support

To use locale-specific validators and formatters with Mold v2, ensure the locale is registered:

```js
import { forma } from "@formajs/mold";
// Register pt-BR locale (opt-in for Forma v2)
import "@formajs/formajs/i18n/pt-BR";

// Or use async registration
await forma.setLocaleAsync("pt-BR");

// Now validators and formatters will use pt-BR rules
const schema = forma.object({
  cpf: forma.string().validateTaxId({ locale: "pt-BR" }),
  phone: forma.string().formatMobileNumber({ locale: "pt-BR" }),
});
```

### Number Formatters

```js
// Convert to percentage
const percentSchema = forma.number().toPercentage({ decimals: 2 });

// Format for accessibility (K, M, B notation)
const countSchema = forma.number().toAccessible({ decimals: 1 });
```

## License

MIT
