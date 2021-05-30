import { Asserts, BaseSchema } from 'yup';

export const validateResponseAttributes = <T extends BaseSchema>(
  item: unknown,
  schema: T,
): Asserts<T> =>
  schema.validate(item, {
    stripUnknown: true,
    abortEarly: true,
  });
