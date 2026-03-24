import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
} from 'typeorm';

@Entity()
export class Country {
  @PrimaryColumn({ type: 'varchar', length: 7 })
  public code!: string;

  @Column({ type: 'varchar' })
  public name: string;

  @CreateDateColumn({ type: 'timestamp' })
  public createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  public updatedAt!: Date;
}

export enum CountryCodes {
  Egypt = 'EG',
  UnitedStates = 'US',
}

export enum Countries {
  Egypt = 'Egypt',
  UnitedStates = 'United States',
}
