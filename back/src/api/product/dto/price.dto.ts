import { IsNumber, IsPositive } from 'class-validator';

export class UpdatePriceDto {
  @IsNumber()
  @IsPositive()
  public newPrice: number;
}
