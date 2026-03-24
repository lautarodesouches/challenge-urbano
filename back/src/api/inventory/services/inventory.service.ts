import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Inventory } from '../../../database/entities/inventory.entity';
import { Product } from '../../../database/entities/product.entity';
import { EventsGateway } from '../../events/events.gateway';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { INVENTORY_QUEUE, NOTIFICATION_QUEUE } from '../../queue/queue.constants';
import { LowStockPayload } from '../../queue/queue.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly eventsGateway: EventsGateway,
    @InjectQueue(INVENTORY_QUEUE) private readonly inventoryQueue: Queue,
    @InjectQueue(NOTIFICATION_QUEUE) private readonly notificationQueue: Queue,
  ) {}

  async getInventory(merchantId: number) {
    // Retorna todo el inventario, idealmente filtrado por merchantId
    // Para simplificar, traemos de la base mediante QueryBuilder para armar el DTO esperado por el front.
    return this.entityManager
      .createQueryBuilder(Inventory, 'inventory')
      .innerJoinAndSelect('inventory.productVariation', 'variation')
      .innerJoinAndSelect('variation.product', 'product')
      .where('product.merchantId = :merchantId', { merchantId })
      .getMany();
  }

  async decrementStock(
    productId: number,
    quantity: number,
    merchantId: number,
  ) {
    // 1. Validar que el producto exista y pertenezca al merchant
    const product = await this.entityManager.findOne(Product, {
      where: { id: productId, merchantId },
    });
    if (!product)
      throw new NotFoundException('Producto no encontrado o no autorizado');

    // 2. Transacción de restado de Inventario (o creación si no existe)
    // Buscamos el inventario basándonos en la variación del producto
    let inventory = await this.entityManager
      .createQueryBuilder(Inventory, 'inventory')
      .innerJoinAndSelect('inventory.productVariation', 'variation')
      .where('variation.productId = :productId', { productId })
      .getOne();

    if (!inventory) {
      // Setup inicial si no hubo stock cargado (Simulación 10 unidades iniciales)
      const { ProductVariation } = await import(
        '../../../database/entities/productVariation.entity'
      );
      let variation = await this.entityManager.findOneBy(ProductVariation, {
        productId,
      });
      if (!variation) {
        throw new BadRequestException(
          'El producto no tiene variaciones configuradas.',
        );
      }
      inventory = this.entityManager.create(Inventory, {
        productVariation: variation,
        quantity: 10,
        countryCode: 'US',
      });
    }

    if (inventory.quantity < quantity) {
      throw new BadRequestException(
        `Stock insuficiente. Solo quedan ${inventory.quantity} unidades.`,
      );
    }

    inventory.quantity -= quantity;
    await this.entityManager.save(Inventory, inventory);

    this.logger.log(
      `Stock decrementado. Nuevo balance para Producto ${productId}: ${inventory.quantity}`,
    );

    // 3. Regla de Negocio: Umbral de Stock Crítico
    if (inventory.quantity <= 5) {
      this.logger.warn(
        `¡Alerta de Stock Crítico! Producto ${productId} ha caído a ${inventory.quantity} unidades.`,
      );

      await this.notificationQueue.add(
        'inventory.low_stock',
        {
          productId: product.id,
          productTitle: product.title,
          remainingQuantity: inventory.quantity,
          timestamp: new Date(),
        } as LowStockPayload,
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        },
      );
    }

    return inventory;
  }
}
