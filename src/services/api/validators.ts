import {Asserts, BaseSchema} from 'yup'

export const validateAttributes = <T extends BaseSchema>(
  item: unknown,
  schema: T,
): Asserts<T> =>
    schema
    .validate(item, {
      stripUnknown: true,
      abortEarly: false,
    })
