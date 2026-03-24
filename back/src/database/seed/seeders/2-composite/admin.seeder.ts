import { EntityManager } from 'typeorm';
import { User } from '../../../entities/user.entity';
import { Role } from '../../../entities/role.entity';
import { RoleIds } from '../../../../api/role/enum/role.enum';
import { SeederInterface } from '../../seeder.interface';
import { createValidatedInstance } from '../../helpers/create-instance';
import { hash } from 'bcryptjs';

export class AdminSeeder implements SeederInterface {
  async seed(manager: EntityManager): Promise<void> {
    const adminRole = await manager.findOneBy(Role, { id: RoleIds.Admin });

    if (!adminRole) {
      console.warn('⚠️ Se omite AdminSeeder: Faltan dependencias (Role ADMIN)');
      return;
    }

    const email = 'admin@challenge.com';
    const existingAdmin = await manager.findOneBy(User, { email });

    if (existingAdmin) return;

    const hashedPassword = await hash('password123', 10);

    const adminData: Partial<User> = {
      email,
      password: hashedPassword,
      roles: [adminRole],
    };

    const admin = await createValidatedInstance(User, adminData);
    await manager.save(User, admin);
  }
}
