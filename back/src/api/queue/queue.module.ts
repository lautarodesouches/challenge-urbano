import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  INVENTORY_QUEUE,
  PRODUCT_QUEUE,
  NOTIFICATION_QUEUE,
} from './queue.constants';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: PRODUCT_QUEUE },
      { name: INVENTORY_QUEUE },
      { name: NOTIFICATION_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
