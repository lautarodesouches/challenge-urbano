# Challenge E-Commerce Urbano (Event-Driven)

Este repositorio es la resolución del **Challenge Sr Fullstack (Microservicios)**, evolucionando un backend monolítico inicial en NestJS hacia una arquitectura distribuida, resiliente y orientada a eventos, acompañada de un dashboard reactivo.

## 1. Problemas detectados y resueltos
* **Dependencias Circulares y Crash del CLI:** El sistema de población de BD (Seeders) estaba fuertemente acoplado. Se migró a `DataSource` puro para inicializar los catálogos en orden jerárquico perfecto sin comprometer el Application Context de NestJS.
* **Vulneración de Integridad:** Se agregó control estricto de tipos e Idempotencia en la siembra de base de datos.
* **Seguridad en Autenticación:** Se implementó **Role-Based Access Control (RBAC)** separando administradores de usuarios normales mediantes JWT Auth Guards (`@Auth(RoleIds.Admin)`).
* **Monolito Procedural Bloqueante:** Toda la lógica de negocio (Inventario, Productos, Notificaciones) se ejecutaba sincrónicamente. Esto impedía la escalabilidad.

## 2. Decisiones Arquitectónicas Core
* **Deconstrucción de Dominio:** Se separó lógicamente el Catálogo (Productos) de la Bodega (Inventario). Las operaciones de lectura masiva atacan el Catálogo, mientras la Bodega se maneja transaccionalmente de forma aislada.
* **Patrón de Colas Persistentes (BullMQ + Redis):** La comunicación asíncrona fluye a través de **BullMQ**, garantizando persistencia contra caídas, y capacidades de escalado horizontal (Microservicios).
* **Idempotencia en Consumidores (Workers):** Los decoradores `@Processor` validan estados previos en PostgreSQL antes de mutar información desde Redis, previniendo inconsistencias si un mensaje se envía duplicado por problemas de red.
* **Gateway WebSockets Activo e Invalidation Híbrida:** Conexión en tiempo real estructurada. El frontend (Vite + React + React Query) no recarga la UI adivinando tiempos; escucha los WebSockets (`inventory:synced`) del servidor de colas para invalidar inteligentemente su caché cuando los Workers terminan tareas pesadas.

## 3. Topología de Eventos (Fanout Queueing)
El ecosistema empuja 4 eventos de dominio medulares:

1. **`inventory.low_stock`**:
   * **Por qué:** Reducir el inventario es crítico. Si al confirmar una compra el sistema detecta inventario `<= 5` (los productos inician con 10), se notifica como alerta en tiempo real en la Terminal de Órdenes.
2. **`product.price_changed`**:
   * **Por qué:** Un diferencial asíncrono azul notifica a la plataforma sobre tácticas dinámicas de marketing para actualizar carritos activos o enviar correos a las "Wishlists".
3. **`product.activated` & `product.created`**:
   * **Por qué:** El Catálogo informa a Bodega para inicializar el stock (10 unidades por defecto) asumiendo cargas pesadas asincrónicamente sin bloquear la petición HTTP inicial de creación.
4. **`product.deactivated`**:
   * **Por qué:** Pausa operaciones de red de suministro asincrónicamente y propaga la indisponibilidad sin sobrecargar el hilo principal.

## 4. Cómo levantar el proyecto
El sistema está 100% dockerizado. Todos los servicios (Postgres, Redis, React, NestJS) orquestan juntos con un solo comando.

1. Sitúate en la raíz del proyecto y arranca todo el ecosistema (el modo watch está optimizado en Vite previendo sobrecargas de CPU en Windows):
   ```bash
   pnpm run compose:build # O: docker compose up --build -d
   ```
2. Ejecuta simultáneamente migraciones y semillas para inicializar data robusta:
   ```bash
   docker compose exec backend npm run typeorm migration:run
   docker compose exec backend npm run seed:run
   ```
3. Accede al sistema:
   * **Dashboard Analítico Reactivo:** `http://localhost:3001` (Credencial Admin: `admin@challenge.com` / `password123`)
   * **Core API Endpoint:** `http://localhost:3000`
