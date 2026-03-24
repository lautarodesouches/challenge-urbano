import { Injectable, Logger } from '@nestjs/common';
import { EventsGateway } from '../../events/events.gateway';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly eventsGateway: EventsGateway) {}
}
