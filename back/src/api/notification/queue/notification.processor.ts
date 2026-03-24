import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NOTIFICATION_QUEUE } from '../../queue/queue.constants';
import { LowStockPayload, PriceChangedPayload, ProductActivatedPayload, ProductCreatedPayload } from '../../queue/queue.dto';
import { EventsGateway } from '../../events/events.gateway';

@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly eventsGateway: EventsGateway) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'product.created':
        return this.handleProductCreated(job.data as ProductCreatedPayload);
      case 'product.activated':
        return this.handleProductActivation(job.data as ProductActivatedPayload);
      case 'inventory.low_stock':
        return this.handleLowStock(job.data as LowStockPayload);
      case 'product.price_changed':
        return this.handlePriceChanged(job.data as PriceChangedPayload);
      default:
        this.logger.warn(`No handler for job ${job.name} en NotificationProcessor`);
    }
  }

  private handleProductCreated(payload: ProductCreatedPayload) {
    this.logger.log(`Worker procesó product.created. Notificando a admins...`);
    this.eventsGateway.broadcast('notification:push_sent', {
      type: 'INFO',
      message: `El vendedor ID ${payload.merchantId} acaba de dar de alta un nuevo producto (ID: ${payload.productId}).`,
      timestamp: new Date().toISOString(),
    });
  }

  private handleProductActivation(payload: ProductActivatedPayload) {
    this.logger.log(`Worker procesó product.activated. Producto ${payload.productId} online.`);
  }

  private handleLowStock(payload: LowStockPayload) {
    this.logger.log(`Worker procesó inventory.low_stock. Alerta crítica para SKU ${payload.productId}.`);
    
    // Convertimos el Payload DTO al formato que espera React
    this.eventsGateway.broadcast('inventory:low_stock', {
      productTitle: payload.productTitle,
      remainingQuantity: payload.remainingQuantity,
      time: payload.timestamp,
    });
  }

  private handlePriceChanged(payload: PriceChangedPayload) {
    this.logger.log(`Worker procesó product.price_changed para ${payload.productTitle}.`);
    
    this.eventsGateway.broadcast('product:price_changed', {
      productTitle: payload.productTitle,
      oldPrice: payload.oldPrice,
      newPrice: payload.newPrice,
      time: payload.timestamp,
    });
  }
}
