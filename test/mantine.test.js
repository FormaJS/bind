import { describe, it, expect } from 'vitest';
import { forma } from '@formajs/mold';
import { mantineBinder } from '../src/mantine.js';

describe('mantineBinder', () => {
  it('retorna {} quando válido', async () => {
    const schema = forma.object({ name: forma.string().validateNotEmpty() });
    const validate = mantineBinder(schema);
    const errors = await validate({ name: 'Ok' });
    expect(errors).toEqual({});
  });

  it('estrutura hierárquica', async () => {
    const schema = forma.object({ user: forma.object({ email: forma.string().validateEmail() }) });
    const validate = mantineBinder(schema);
    const errors = await validate({ user: { email: 'invalid' } });
    expect(errors.user.email).toBeTruthy();
  });

  it('handles simple field errors', async () => {
    const schema = forma.object({
      name: forma.string().validateNotEmpty(),
      email: forma.string().validateEmail()
    });
    const validate = mantineBinder(schema);
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
            email: forma.string().validateEmail(),
            phone: forma.string().validateMobileNumber()
          })
        })
      })
    });

    const validate = mantineBinder(schema);
    const errors = await validate({
      user: {
        profile: {
          name: '',
          contact: {
            email: 'invalid',
            phone: '123'
          }
        }
      }
    });

    expect(typeof errors.user.profile.name).toBe('string');
    expect(typeof errors.user.profile.contact.email).toBe('string');
    expect(typeof errors.user.profile.contact.phone).toBe('string');
  });

  it('handles array errors with hierarchical structure', async () => {
    const schema = forma.object({
      tags: forma.array(forma.string().validateNotEmpty())
    });
    const validate = mantineBinder(schema);
    const errors = await validate({
      tags: ['valid', '', 'another']
    });

    expect(typeof errors.tags['1']).toBe('string');
    expect(errors.tags['0']).toBeUndefined();
  });

  it('handles complex array of objects', async () => {
    const itemSchema = forma.object({
      name: forma.string().validateNotEmpty(),
      price: forma.number().min(0)
    });

    const schema = forma.object({
      items: forma.array(itemSchema)
    });

    const validate = mantineBinder(schema);
    const errors = await validate({
      items: [
        { name: 'Item 1', price: 10 },
        { name: '', price: -5 }
      ]
    });

    expect(typeof errors.items['1'].name).toBe('string');
    expect(typeof errors.items['1'].price).toBe('string');
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
                name: forma.string().validateNotEmpty()
              })
            )
          })
        )
      })
    });

    const validate = mantineBinder(schema);
    const errors = await validate({
      company: {
        departments: [
          {
            name: '',
            employees: [
              { name: 'John' },
              { name: '' }
            ]
          }
        ]
      }
    });

    expect(typeof errors.company.departments['0'].name).toBe('string');
    expect(typeof errors.company.departments['0'].employees['1'].name).toBe('string');
    expect(errors.company.departments['0'].employees['0']).toBeUndefined();
  });

  it('handles empty input', async () => {
    const schema = forma.object({
      name: forma.string().validateNotEmpty()
    });
    const validate = mantineBinder(schema);
    const errors = await validate({});

    expect(typeof errors.name).toBe('string');
  });

  it('handles null/undefined input', async () => {
    const schema = forma.object({
      name: forma.string().validateNotEmpty()
    });
    const validate = mantineBinder(schema);
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

    const validate = mantineBinder(schema);
    const errors = await validate({ password: 'short' });

    expect(typeof errors.password).toBe('string');
    expect(errors.password.length).toBeGreaterThan(0);
  });
});
