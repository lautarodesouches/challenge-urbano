import { Module } from '@nestjs/common';
import { NotificationService } from './services/notification.service';
import { NotificationProcessor } from './queue/notification.processor';

@Module({
  providers: [NotificationService, NotificationProcessor],
  exports: [NotificationService],
})
export class NotificationModule {}
