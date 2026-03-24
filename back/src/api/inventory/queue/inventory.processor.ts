import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PRODUCT_QUEUE } from '../../queue/queue.constants';
import { ProductActivatedPayload } from '../../queue/queue.dto';
import { EventsGateway } from '../../events/events.gateway';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Product } from '../../../database/entities/product.entity';

@Processor(PRODUCT_QUEUE)
export class InventoryProcessor extends WorkerHost {
  private readonly logger = new Logger(InventoryProcessor.name);

  constructor(
    private readonly eventsGateway: EventsGateway,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'product.activated':
        return this.handleProductActivation(
          job.data as ProductActivatedPayload,
        );
      case 'product.deactivated':
        return this.handleProductDeactivation(
          job.data as ProductActivatedPayload,
        );
      default:
        // No hacemos nada si el Job no corresponde a Inventario.
        break;
    }
  }

  private async handleProductActivation(payload: ProductActivatedPayload) {
    this.logger.log(
      `[Inventory Processor Worker] Procesando Job de activación para Producto ID ${payload.productId}.`,
    );

    // Tarea 3: Lógica de Idempotencia. Validar contra la BD si el trabajo tiene sentido ahora.
    const product = await this.entityManager.findOne(Product, {
      where: { id: payload.productId, isActive: true },
    });

    if (!product) {
      this.logger.warn(
        `Idempotencia fallida: El producto ${payload.productId} ya no figura activo en el monolito.`,
      );
      return;
    }

    // Work heavy load test
    await new Promise((resolve) => setTimeout(resolve, 1500));

    this.logger.log(
      `[Inventory Processor Worker] Catálogo sincronizado exitosamente para el Producto ID ${payload.productId}.`,
    );

    this.eventsGateway.broadcast('inventory:synced', {
      message: `Worker procesó 'product.activated' via Redis: Inventario acoplado al Catálogo para SKU ${payload.productId}.`,
      productCode: payload.productId,
      timestamp: new Date().toISOString(),
      action: 'SYNC_COMPLETE',
    });
  }

  private async handleProductDeactivation(payload: ProductActivatedPayload) {
    this.logger.log(
      `[Inventory Processor Worker] Procesando Job de desactivación para Producto ID ${payload.productId}.`,
    );

    const product = await this.entityManager.findOne(Product, {
      where: { id: payload.productId, isActive: false },
    });

    if (!product) {
      this.logger.warn(
        `Idempotencia fallida: El producto ${payload.productId} ya no figura inactivo en el monolito.`,
      );
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));

    this.logger.log(
      `[Inventory Processor Worker] Catálogo actualizado exitosamente para el Producto Inactivo ID ${payload.productId}.`,
    );

    this.eventsGateway.broadcast('inventory:synced', {
      message: `Worker procesó 'product.deactivated' via Redis: Inventario pausado para SKU ${payload.productId}.`,
      productCode: payload.productId,
      timestamp: new Date().toISOString(),
      action: 'SYNC_COMPLETE',
    });
  }
}
