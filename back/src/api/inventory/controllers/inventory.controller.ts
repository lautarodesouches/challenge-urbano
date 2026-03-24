import { Body, Controller, Param, Post, Get } from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { UpdateStockDto } from '../dto/inventory.dto';
import { Auth } from '../../auth/guards/auth.decorator';
import { RoleIds } from '../../role/enum/role.enum';
import { CurrentUser } from '../../auth/guards/user.decorator';
import { User } from '../../../database/entities/user.entity';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Auth(RoleIds.Admin, RoleIds.Merchant)
  @Get()
  async getInventory(@CurrentUser() user: User) {
    return this.inventoryService.getInventory(user.id);
  }

  @Auth(RoleIds.Admin, RoleIds.Merchant)
  @Post(':productId/decrement')
  async decrementStock(
    @Param('productId') productId: number,
    @Body() body: UpdateStockDto,
    @CurrentUser() user: User,
  ) {
    return this.inventoryService.decrementStock(
      productId,
      body.quantity,
      user.id,
    );
  }
}
