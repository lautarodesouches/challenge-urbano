# Challenge E-Commerce Urbano (Event-Driven)

Este repositorio es la resolución del **Challenge Sr Fullstack (Microservicios)**, evolucionando un monolito básico en NestJS hacia una arquitectura desacoplada y orientada a eventos.

## 1. Problemas detectados en el diseño original
* **Dependencias Circulares y Crash del CLI:** El sistema de Seeders estaba fuertemente acoplado al módulo principal de la API mediante inyección de dependencias (`@Injectable`). Esto, sumado al uso de *Globs* expansivos (`**/*.ts`), provocaba que el compilador de TypeORM entrara en un bucle infinito al leer su propio archivo de configuración, resultando en un error `Maximum call stack size exceeded` que impedía correr migraciones.
* **Falta de Idempotencia y Type-Safety:** La creación de datos "mock" usaba el anti-patrón `any` y no verificaba la existencia previa de la data, lo que generaba violaciones de Restricciones de Clave Foránea y excepciones silenciosas al ejecutarse múltiples veces.
* **Monolito Procedural Bloqueante:** El Servicio de Productos (`ProductService`) ejecutaba toda la lógica de negocio de manera síncrona pura, imposibilitando la escalabilidad reactiva si se requería notificar a otros sistemas (como Inventario o Correos) tras el alta lógica de un ítem.

## 2. Decisiones técnicas relevantes
* **Orquestación en Monorepo Dockerizado:** Se unificó el ecosistema (Frontend React, Backend NestJS, PostgreSQL y Redis) mediante un `docker-compose.yml` central, garantizando reproductibilidad total sin configuraciones locales tediosas y habilitando volúmenes de _Hot Reload_.
* **Seeders Topológicos Independientes:** Se extirpó toda la inyección de NestJS de la capa de Base de Datos. Los seeders ahora son scripts TypeScript de TypeORM puros (`DataSource`) que respetan la integridad referencial (ej: insertando `Category` antes que `Product`).
* **Gateway WebSockets Híbrido:** Para conectar el Backend Event-Driven con el Frontend React, se implementó `@nestjs/websockets`. Los eventos asíncronos internos de Node.js rebotan transparentemente hacia el exterior en forma de WebSockets garantizando actualizaciones fluidas en las tablas del dashboard.

## 3. Qué eventos se implementaron y por qué
Para romper el monolito publicamos dos eventos de dominio centrales utilizando la asincronía de `@nestjs/event-emitter`:

1. **`product.created`**:
   * **Por qué:** Cuando un comerciante registra un *borrador* de producto nuevo, el sistema logístico debe saberlo anticipadamente para reservar el espacio lógico en la bodega de inventarios.
   * **Consumidor Desacoplado:** `InventoryModule`. Reacciona en el background sin frenar el request HTTP, simulando de forma asíncrona la sincronización del Stock inicial y enviando la confirmación por WebSocket.
2. **`product.activated`**:
   * **Por qué:** Cuando el borrador aprueba las validaciones y se publica en el catálogo público, es vital notificar al ecosistema global para accionar las alertas de venta.
   * **Consumidor Desacoplado:** `NotificationModule`. Atrapa el evento y despacha simulacros de _push notifications_ y _correos_ paralelamente, logrando un tiempo de respuesta de red inmediato asumiendo cargas pesadas.

## 4. Cómo levantar el proyecto
El sistema está 100% dockerizado para un despliegue inmediato.

1. Sitúate en la raíz del proyecto y arranca todo el clúster en segundo plano:
   ```bash
   docker compose up --build -d
   ```
2. Aplica las migraciones estructurales de la Base de Datos:
   ```bash
   docker compose exec backend npm run migration:run
   ```
3. Ejecuta el orquestador independiente para sembrar el catálogo de pruebas:
   ```bash
   docker compose exec backend npm run seed:run
   ```
