import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventsGateway } from '../../events/events.gateway';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly eventsGateway: EventsGateway) { }

  @OnEvent('product.created', { async: true })
  async handleProductCreated(payload: { productId: number; categoryId: number; merchantId: number }) {
    this.logger.debug(
      `[Notification Consumer] Simulando envío de Email al Merchant ID ${payload.merchantId}: "Tu borrador de producto (ID: ${payload.productId}) se ha creado y está pendiente de activación."`,
    );

    this.eventsGateway.broadcast('notification:email_sent', {
      type: 'product_draft_created',
      productId: payload.productId,
      merchantId: payload.merchantId,
    });
  }

  @OnEvent('product.activated', { async: true })
  async handleProductActivated(payload: { productId: number; isActive: boolean; timestamp: Date }) {
    this.logger.debug(
      `[Notification Consumer] Simulando notificación PUSH global: "El Producto ID ${payload.productId} ya está en vivo en la tienda (${payload.timestamp})."`,
    );

    this.eventsGateway.broadcast('notification:push_sent', {
      type: 'product_live_alert',
      productId: payload.productId,
      time: payload.timestamp,
    });
  }

  @OnEvent('inventory.low_stock', { async: true })
  async handleLowStock(payload: { productId: number; productTitle: string; remainingQuantity: number; timestamp: Date }) {
    this.logger.warn(
      `[Notification Consumer] Simulando alerta PUSH a Gerencia: "Stock Crítico (${payload.remainingQuantity} uds) para el producto ${payload.productTitle}"`,
    );

    this.eventsGateway.broadcast('inventory:low_stock', {
      type: 'critical_stock_alert',
      productId: payload.productId,
      productTitle: payload.productTitle,
      remainingQuantity: payload.remainingQuantity,
      time: payload.timestamp,
    });
  }
}
