import { describe, it, expect } from 'vitest';
import { forma } from '@formajs/mold';
import { formikBinder, ValidationError } from '../src/formik.js';

describe('formikBinder', () => {
  it('retorna objeto vazio quando válido', async () => {
    const schema = forma.object({ name: forma.string().validateLength({ min: 3 }) });
    const validate = formikBinder(schema);
    const errors = await validate({ name: 'Abc' });
    expect(errors).toEqual({});
  });

  it('retorna mensagem simples para campo inválido', async () => {
    const schema = forma.object({ name: forma.string().validateLength({ min: 3 }) });
    const validate = formikBinder(schema);
    const errors = await validate({ name: 'A' });
    expect(typeof errors.name).toBe('string');
  });

  it('estrutura aninhada preservada', async () => {
    const schema = forma.object({
      user: forma.object({ profile: forma.object({ email: forma.string().validateEmail() }) }),
      tags: forma.array(forma.string().validateNotEmpty())
    });
    const validate = formikBinder(schema);
  const errors = await validate({ user: { profile: { email: 'invalid' } }, tags: ['ok', ''] });
  expect(errors.user.profile.email).toBeTruthy();
    expect(errors.tags['1']).toBeTruthy();
  });

  it('lança ValidationError quando throwOnError=true', async () => {
    const schema = forma.object({ name: forma.string().validateNotEmpty() });
    const validate = formikBinder(schema, { throwOnError: true });
    let thrown;
    try {
      await validate({ name: '' });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(ValidationError);
    expect(thrown.errors.name).toBeTruthy();
  });

  it('handles empty input gracefully', async () => {
    const schema = forma.object({ name: forma.string().validateNotEmpty() });
    const validate = formikBinder(schema);
    const errors = await validate({});
    expect(errors.name).toBeTruthy();
  });

  it('handles null/undefined input', async () => {
    const schema = forma.object({ name: forma.string().validateNotEmpty() });
    const validate = formikBinder(schema);
    const errors1 = await validate(null);
    const errors2 = await validate(undefined);

    // Mold v2 produces errors for null/undefined inputs
    expect(typeof errors1).toBe('string');
    expect(typeof errors2).toBe('string');
  });

  it('preserves valid nested values when some fields invalid', async () => {
    const schema = forma.object({
      user: forma.object({
        name: forma.string().validateNotEmpty(),
        email: forma.string().validateEmail()
      })
    });
    const validate = formikBinder(schema);
    const errors = await validate({
      user: { name: 'John', email: 'invalid' }
    });

    expect(errors.user.name).toBeUndefined();
    expect(errors.user.email).toBeTruthy();
  });

  it('handles complex array structures', async () => {
    const itemSchema = forma.object({
      name: forma.string().validateNotEmpty(),
      quantity: forma.number().min(1)
    });

    const schema = forma.object({
      items: forma.array(itemSchema)
    });

    const validate = formikBinder(schema);
    const errors = await validate({
      items: [
        { name: 'Item 1', quantity: 2 },
        { name: '', quantity: 0 },
        { name: 'Item 3', quantity: 1 }
      ]
    });

    expect(errors.items['1'].name).toBeTruthy();
    expect(errors.items['1'].quantity).toBeTruthy();
    expect(errors.items['0']).toBeUndefined();
    expect(errors.items['2']).toBeUndefined();
  });

  it('handles deeply nested structures', async () => {
    const schema = forma.object({
      company: forma.object({
        departments: forma.array(
          forma.object({
            name: forma.string().validateNotEmpty(),
            employees: forma.array(
              forma.object({
                name: forma.string().validateNotEmpty(),
                skills: forma.array(forma.string().validateNotEmpty())
              })
            )
          })
        )
      })
    });

    const validate = formikBinder(schema);
    const errors = await validate({
      company: {
        departments: [
          {
            name: 'Engineering',
            employees: [
              { name: 'John', skills: ['JS', ''] },
              { name: '', skills: ['Python'] }
            ]
          }
        ]
      }
    });

    expect(errors.company.departments['0'].employees['0'].skills['1']).toBeTruthy();
    expect(errors.company.departments['0'].employees['1'].name).toBeTruthy();
  });

  it('returns first error message from multiple errors', async () => {
    const schema = forma.object({
      field: forma.string()
        .validateLength({ min: 5 })
        .validateContains({ seed: 'special' })
    });

    const validate = formikBinder(schema);
    const errors = await validate({ field: 'abc' });

    expect(typeof errors.field).toBe('string');
    expect(errors.field.length).toBeGreaterThan(0);
  });

  it('handles ValidationError with correct structure', async () => {
    const schema = forma.object({
      name: forma.string().validateNotEmpty(),
      email: forma.string().validateEmail()
    });

    const validate = formikBinder(schema, { throwOnError: true });

    try {
      await validate({ name: '', email: 'invalid' });
      expect.fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors.name).toBeTruthy();
      expect(error.errors.email).toBeTruthy();
      expect(error.message).toBe('Validation failed');
    }
  });

  it('works without throwOnError option', async () => {
    const schema = forma.object({ name: forma.string().validateNotEmpty() });
    const validate = formikBinder(schema);
    const errors = await validate({ name: '' });

    expect(errors.name).toBeTruthy();
    expect(errors).not.toBeInstanceOf(ValidationError);
  });

  it('handles schema with formatters', async () => {
    const schema = forma.object({
      name: forma.string().trim()
    });

    const validate = formikBinder(schema);
    const errors = await validate({
      name: '  john  '
    });

    expect(errors).toEqual({});
  });
});
