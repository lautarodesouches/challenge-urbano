import { EntityManager } from 'typeorm';
import { User } from '../../../entities/user.entity';
import { Role } from '../../../entities/role.entity';
import { RoleIds } from '../../../../api/role/enum/role.enum';
import { SeederInterface } from '../../seeder.interface';
import { createValidatedInstance } from '../../helpers/create-instance';
import { hash } from 'bcrypt';

export class UserSeeder implements SeederInterface {
  async seed(manager: EntityManager): Promise<void> {
    const customerRole = await manager.findOneBy(Role, { id: RoleIds.Customer });

    if (!customerRole) {
      console.warn('⚠️ Se omite UserSeeder: Faltan dependencias (Role CUSTOMER)');
      return;
    }

    const email = 'user@challenge.com';
    const existingUser = await manager.findOneBy(User, { email });

    if (existingUser) return;

    const hashedPassword = await hash('password123', 10);

    const userData: Partial<User> = {
      email,
      password: hashedPassword,
      roles: [customerRole],
    };

    const user = await createValidatedInstance(User, userData);
    await manager.save(User, user);
  }
}
