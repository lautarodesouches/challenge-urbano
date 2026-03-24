import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';

export async function createValidatedInstance<T extends object>(
  entityClass: ClassConstructor<T>,
  plainData: Partial<T>,
): Promise<T> {
  const instance = plainToInstance(entityClass, plainData);
  await validateOrReject(instance, {
    skipMissingProperties: true,
    forbidUnknownValues: false,
  });
  return instance;
}
