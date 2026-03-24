import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Inventory } from '../../../database/entities/inventory.entity';
import { Product } from '../../../database/entities/product.entity';
import { EventsGateway } from '../../events/events.gateway';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { INVENTORY_QUEUE } from '../../queue/queue.constants';
import { LowStockPayload } from '../../queue/queue.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly eventsGateway: EventsGateway,
    @InjectQueue(INVENTORY_QUEUE) private readonly inventoryQueue: Queue,
  ) { }

  async decrementStock(productId: number, quantity: number, merchantId: number) {
    // 1. Validar que el producto exista y pertenezca al merchant
    const product = await this.entityManager.findOne(Product, {
      where: { id: productId, merchantId },
    });
    if (!product) throw new NotFoundException('Producto no encontrado o no autorizado');

    // 2. Transacción de restado de Inventario (o creación si no existe)
    let inventory = await this.entityManager.findOne(Inventory, {
      where: { product: { id: productId } } as any,
      relations: ['product'],
    });

    if (!inventory) {
      // Setup inicial si no hubo stock cargado (Simulación 10 unidades iniciales)
      inventory = this.entityManager.create(Inventory, { product, quantity: 10 });
    }

    if (inventory.quantity < quantity) {
      throw new BadRequestException(`Stock insuficiente. Solo quedan ${inventory.quantity} unidades.`);
    }

    inventory.quantity -= quantity;
    await this.entityManager.save(Inventory, inventory);

    this.logger.log(`Stock decrementado. Nuevo balance para Producto ${productId}: ${inventory.quantity}`);

    // 3. Regla de Negocio: Umbral de Stock Crítico
    if (inventory.quantity <= 5) {
      this.logger.warn(`¡Alerta de Stock Crítico! Producto ${productId} ha caído a ${inventory.quantity} unidades.`);
      
      await this.inventoryQueue.add('inventory.low_stock', {
        productId: product.id,
        productTitle: product.title,
        remainingQuantity: inventory.quantity,
        timestamp: new Date(),
      } as LowStockPayload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 }
      });
    }

    return inventory;
  }
}
