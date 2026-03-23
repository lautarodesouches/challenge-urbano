import { EntityManager } from 'typeorm';

export interface SeederInterface {
  seed(manager: EntityManager): Promise<void>;
}
