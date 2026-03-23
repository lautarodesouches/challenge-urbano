import { Body, Controller, Param, Post } from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { UpdateStockDto } from '../dto/inventory.dto';
import { Auth } from 'src/api/auth/guards/auth.decorator';
import { RoleIds } from 'src/api/role/enum/role.enum';
import { CurrentUser } from 'src/api/auth/guards/user.decorator';
import { User } from 'src/database/entities/user.entity';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Auth(RoleIds.Admin, RoleIds.Merchant)
  @Post(':productId/decrement')
  async decrementStock(
    @Param('productId') productId: number,
    @Body() body: UpdateStockDto,
    @CurrentUser() user: User,
  ) {
    return this.inventoryService.decrementStock(productId, body.quantity, user.id);
  }
}
