import { describe, it, expect } from 'vitest';
import { forma } from '@formajs/mold';
import { felteBinder } from '../src/felte.js';

describe('felteBinder', () => {
  it('retorna {} quando válido', async () => {
    const schema = forma.object({ name: forma.string().validateLength({ min: 3 }) });
    const validate = felteBinder(schema);
    const errors = await validate({ name: 'Abc' });
    expect(errors).toEqual({});
  });

  it('estrutura hierárquica', async () => {
    const schema = forma.object({ user: forma.object({ email: forma.string().validateEmail() }) });
    const validate = felteBinder(schema);
    const errors = await validate({ user: { email: 'invalid' } });
    expect(errors.user.email).toBeTruthy();
  });

  it('handles simple field errors', async () => {
    const schema = forma.object({
      name: forma.string().validateNotEmpty(),
      email: forma.string().validateEmail()
    });
    const validate = felteBinder(schema);
    const errors = await validate({ name: '', email: 'invalid' });

    expect(typeof errors.name).toBe('string');
    expect(typeof errors.email).toBe('string');
  });

  it('preserves nested object structure', async () => {
    const schema = forma.object({
      user: forma.object({
        profile: forma.object({
          name: forma.string().validateNotEmpty(),
          contact: forma.object({
            email: forma.string().validateEmail()
          })
        })
      })
    });

    const validate = felteBinder(schema);
    const errors = await validate({
      user: {
        profile: {
          name: '',
          contact: { email: 'invalid' }
        }
      }
    });

    expect(typeof errors.user.profile.name).toBe('string');
    expect(typeof errors.user.profile.contact.email).toBe('string');
  });

  it('handles array errors with hierarchical structure', async () => {
    const schema = forma.object({
      tags: forma.array(forma.string().validateNotEmpty())
    });
    const validate = felteBinder(schema);
    const errors = await validate({
      tags: ['valid', '', 'another']
    });

    expect(typeof errors.tags['1']).toBe('string');
    expect(errors.tags['0']).toBeUndefined();
  });

  it('handles complex array of objects', async () => {
    const itemSchema = forma.object({
      name: forma.string().validateNotEmpty(),
      quantity: forma.number().min(1)
    });

    const schema = forma.object({
      items: forma.array(itemSchema)
    });

    const validate = felteBinder(schema);
    const errors = await validate({
      items: [
        { name: 'Item 1', quantity: 2 },
        { name: '', quantity: 0 }
      ]
    });

    expect(typeof errors.items['1'].name).toBe('string');
    expect(typeof errors.items['1'].quantity).toBe('string');
    expect(errors.items['0']).toBeUndefined();
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

    const validate = felteBinder(schema);
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

    expect(typeof errors.company.departments['0'].employees['0'].skills['1']).toBe('string');
    expect(typeof errors.company.departments['0'].employees['1'].name).toBe('string');
  });

  it('handles empty input', async () => {
    const schema = forma.object({
      name: forma.string().validateNotEmpty()
    });
    const validate = felteBinder(schema);
    const errors = await validate({});

    expect(typeof errors.name).toBe('string');
  });

  it('handles null/undefined input', async () => {
    const schema = forma.object({
      name: forma.string().validateNotEmpty()
    });
    const validate = felteBinder(schema);
    const errors1 = await validate(null);
    const errors2 = await validate(undefined);

    // Mold v2 produces errors for null/undefined inputs
    expect(typeof errors1).toBe('string');
    expect(typeof errors2).toBe('string');
  });

  it('returns first error message from multiple validations', async () => {
    const schema = forma.object({
      password: forma.string()
        .validateLength({ min: 8 })
        .validateContains({ seed: 'special' })
    });

    const validate = felteBinder(schema);
    const errors = await validate({ password: 'short' });

    expect(typeof errors.password).toBe('string');
    expect(errors.password.length).toBeGreaterThan(0);
  });
});
