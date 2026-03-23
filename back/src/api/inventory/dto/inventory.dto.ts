import { IsNumber, IsPositive } from 'class-validator';

export class UpdateStockDto {
  @IsNumber()
  @IsPositive()
  quantity: number;
}
