import { EntityManager } from 'typeorm';
import { Role } from '../../../entities/role.entity';
import { RoleIds, Roles } from '../../../../api/role/enum/role.enum';
import { SeederInterface } from '../../seeder.interface';

export class RoleSeeder implements SeederInterface {
  async seed(manager: EntityManager): Promise<void> {
    const roles: Partial<Role>[] = [
      { id: RoleIds.Admin, name: Roles.Admin },
      { id: RoleIds.Customer, name: Roles.Customer },
      { id: RoleIds.Merchant, name: Roles.Merchant },
    ];

    await manager.getRepository(Role).upsert(roles, {
      conflictPaths: ['id'],
      skipUpdateIfNoValuesChanged: true,
    });
  }
}
