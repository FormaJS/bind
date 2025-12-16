import { describe, it, expect, vi } from 'vitest';
import { useForm } from '../src/vue.js';
import { f } from '@formajs/mold';
import { nextTick } from 'vue';

describe('useForm (Vue)', () => {
    it('initializes with default values', () => {
        const schema = f.object({
            name: f.string(),
        });
        const { values, errors, isValid } = useForm(schema, { name: 'John' });

        expect(values.value).toEqual({ name: 'John' });
        expect(errors.value).toEqual({});
        expect(isValid.value).toBe(true);
    });

    it('validates on submit', async () => {
        const schema = f.object({
            age: f.number().min(18),
        });
        const { values, errors, handleSubmit } = useForm(schema, { age: 10 });

        const onSubmit = vi.fn();
        const submit = handleSubmit(onSubmit);

        await submit();

        expect(errors.value).toHaveProperty('age');
        expect(onSubmit).not.toHaveBeenCalled();

        values.value.age = 20;
        await submit();

        expect(errors.value).toEqual({});
        expect(onSubmit).toHaveBeenCalledWith({ age: 20 });
    });

    it('updates reactivity correctly', async () => {
        const schema = f.object({
            email: f.string().email(),
        });
        const { values, errors, validate } = useForm(schema);

        values.value.email = 'invalid';
        await validate();

        expect(errors.value).toHaveProperty('email');

        values.value.email = 'test@example.com';
        await validate();

        expect(errors.value).toEqual({});
    });
});
