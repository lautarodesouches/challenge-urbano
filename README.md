# Challenge E-Commerce Urbano (Event-Driven)

Este repositorio es la resolución del **Challenge Sr Fullstack (Microservicios)**, evolucionando un backend monolítico inicial en NestJS hacia una arquitectura distribuida, resiliente y orientada a eventos, acompañada de un dashboard reactivo.

## 1. Problemas detectados en el diseño original
* **Dependencias Circulares y Crash del CLI:** El sistema de de población de BD (Seeders) estaba fuertemente acoplado al módulo principal de la API mediante inyección de dependencias (`@Injectable`). Esto provocaba un bucle infinito al leer su propio archivo de configuración, resultando en un error de Stack Trace que impedía correr migraciones.
* **Vulneración de Integridad e Idempotencia:** La creación de datos mock usaba el anti-patrón `any` y no verificaba la existencia previa. Esto generaba violaciones de Claves Foráneas (FK) y duplicación de datos al ejecutarse múltiples veces.
* **Fallas de Seguridad en Autenticación:** El sistema no separaba lógicamente a los administradores de los usuarios normales, permitiendo brechas de escalamiento de privilegios en endpoints críticos.
* **Monolito Procedural Bloqueante:** Toda la lógica de negocio (Inventario, Productos, Notificaciones) se ejecutaba de manera síncrona, imposibilitando la escalabilidad horizontal y ralentizando los tiempos de respuesta del cliente.

## 2. Decisiones técnicas relevantes
* **Refactor a Arquitectura de Colas Persistentes (BullMQ + Redis):** Se eliminaron los emisores de eventos volátiles en memoria nativa de Node. Ahora la comunicación asíncrona fluye a través de **BullMQ**, garantizando persistencia contra caídas, reintentos exponenciales en caso de fallos y capacidades genuinas de escalado a Microservicios.
* **Idempotencia en Consumidores (Workers):** Los nuevos decoradores `@Processor` validan estados previos en la base de datos PostgreSQL antes de mutar información desde Redis, previniendo inconsistencias si un mensaje se envía duplicado por problemas de red.
* **Role-Based Access Control (RBAC):** Se separó estructuralmente los perfiles de `Admin` y `Usuario Normal` tanto en la siembra de base de datos como bloqueando los Controladores mediante JWT Auth Guards decorados con `@Auth(RoleIds.Admin)`.
* **Gateway WebSockets Activo:** Conexión estricta en tiempo real entre el Backend y la capa visual (Vite + React) disociando a los emisores para que actúen como verdaderos nodos PUSH sin sobrecargar HTTP.
* **Seeders Topológicos Aislados:** Se migró a `DataSource` puros para inicializar los catálogos en orden jerárquico perfecto sin comprometer el Application Context de NestJS.

## 3. Qué eventos se implementaron y por qué
Se diseñó un sistema asíncrono robusto (Pattern: **Fanout Queueing**) con 4 eventos de dominio medulares:

1. **`inventory.low_stock`**:
   * **Por qué:** Reducir el inventario es crítico. Si al confirmar una compra el sistema detecta inventario `<= 5`, se debe notificar alarmantemente a los gerentes de suministro inmediatamente sin demorar el ticket del comprador final.
   * **Consumidor:** `NotificationProcessor` despacha una alerta visual severa (roja) tipo PUSH en el dashboard en vivo.
2. **`product.price_changed`**:
   * **Por qué:** Permitir tácticas dinámicas de marketing. Un cambio de precio de administrador es una operación silenciosa que dispara eventos reactivos listos para enviar correos a las "Wishlists" de clientes a futuro.
   * **Consumidor:** React Dashboard lo atrapa e imprime el diferencial exacto para auditoría ejecutiva.
3. **`product.created` & `product.activated`**:
   * **Por qué:** Sincronización asíncrona inter-dominios. El Catálogo informa a Bodega (Inventario) para inicializar bases de datos anexas asumiendo grandes cargas lógicas sin afectar la UI.

## 4. Cómo levantar el proyecto
El sistema está 100% dockerizado. Todos los servicios (Postgres, Redis, React, NestJS) orquestan juntos con un solo comando.

1. Sitúate en la raíz del proyecto y arranca todo el ecosistema en segundo plano:
   ```bash
   pnpm run compose:build # O si no tienes el script: docker compose up --build -d
   ```
2. Ejecuta simultáneamente migraciones y semillas para inicializar data robusta:
   ```bash
   docker compose exec backend npm run typeorm migration:run
   docker compose exec backend npm run seed:run
   ```
3. Accede al sistema:
   * **Dashboard Analítico Reactivo:** `http://localhost:3001` (Credencial Admin: `admin@challenge.com` / `password123`)
   * **Core API Endpoint:** `http://localhost:3000`
