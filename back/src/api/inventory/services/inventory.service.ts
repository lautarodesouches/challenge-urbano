import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { EventsGateway } from '../../events/events.gateway';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly eventsGateway: EventsGateway,
  ) { }

  @OnEvent('product.activated', { async: true })
  async handleProductActivation(payload: { productId: number; isActive: boolean; timestamp: Date }) {
    this.logger.log(`[Inventory Consumer] Evento de activación recibido para Producto ID ${payload.productId}. Sincronizando catálogo con el almacén central...`);

    // Simulation of heavy asynchronous processing or communication to another microservice (e.g., Logistics ERP)
    await new Promise(resolve => setTimeout(resolve, 1500));

    this.logger.log(`[Inventory Consumer] Catálogo sincronizado exitosamente. Producto ID ${payload.productId} está listo para tener existencias gestionadas.`);

    // Broadcast por WebSocket
    this.eventsGateway.broadcast('inventory:synced', {
      message: `El Inventario remolcó el Catálogo para el Producto ${payload.productId}. Listo para operar.`,
      productCode: payload.productId,
      timestamp: new Date().toISOString(),
      action: 'SYNC_COMPLETE'
    });
  }
}
