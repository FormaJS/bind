import { AnySchema, infer as Infer } from '@formajs/mold';
import { Ref } from 'vue';

export declare function useForm<TSchema extends AnySchema>(
    schema: TSchema,
    initialValues?: Infer<TSchema>
): {
    values: Ref<Infer<TSchema>>;
    errors: Ref<Record<string, any>>;
    isValid: Ref<boolean>;
    isSubmitting: Ref<boolean>;
    handleSubmit: (fn: (values: Infer<TSchema>) => void | Promise<void>) => (e?: Event) => Promise<void>;
    validate: () => Promise<import('@formajs/mold').ValidationResult<Infer<TSchema>>>;
};
