import { Module } from '@nestjs/common';
import { InventoryService } from './services/inventory.service';
import { InventoryController } from './controllers/inventory.controller';
import { InventoryProcessor } from './queue/inventory.processor';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryProcessor],
  exports: [InventoryService],
})
export class InventoryModule {}
