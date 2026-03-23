import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(@InjectEntityManager() private readonly entityManager: EntityManager) { }

  @OnEvent('product.activated', { async: true })
  async handleProductActivation(payload: { productId: number; isActive: boolean; timestamp: Date }) {
    this.logger.log(`[Inventory Consumer] Evento de activación recibido para Producto ID ${payload.productId}. Sincronizando catálogo con el almacén central...`);

    // Simulation of heavy asynchronous processing or communication to another microservice (e.g., Logistics ERP)
    await new Promise(resolve => setTimeout(resolve, 1500));

    this.logger.log(`[Inventory Consumer] Catálogo sincronizado exitosamente. Producto ID ${payload.productId} está listo para tener existencias gestionadas.`);
  }
}
