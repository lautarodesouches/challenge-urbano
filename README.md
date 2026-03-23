# E-Commerce Monorepo

Este repositorio es la resolución del **Challenge Sr Fullstack (Microservicios)**, que toma como punto de partida un monolito básico en NestJS y evoluciona su arquitectura hacia un modelo desacoplado y orientado a eventos (Event-Driven).

## Avance Actual (Fase Inicial & Diagnóstico)

En cumplimiento con la primera etapa del desafío (*1. Descargar el repositorio, 2. Diagnóstico inicial*), se han realizado las siguientes reestructuraciones y correcciones fundamentales para tener una base robusta y lista para evolucionar:

### 1. Migración a Monorepo Activo
* El entorno fue rediseñado de un monolito estándar a un monorepo lógico dividiendo responsabilidades en las carpetas `/back` y `/front`.
* Se crearon reglas estrictas de `.gitignore` en la raíz para proteger credenciales (`.env`) y volúmenes de datos temporales (Docker).
* La configuración del linter y prettier ha sido correctamente acotada a cada proyecto para evitar conflictos de estilo entre NestJS y React.

### 2. Infraestructura como Código (Docker)
Para resolver la orquestación, se creó un robusto archivo `docker-compose.yml` en la raíz que unifica todo el ecosistema:
* **PostgreSQL (15):** Ejecutando los scripts iniciales y mapeado mediante un volumen permanente.
* **Redis:** Instanciado y listo para actuar como el *Message Broker* central de la nueva arquitectura de eventos.
* **Backend:** Expuesto y configurado para tomar todas sus credenciales (de BD y Redis) de forma limpia a través de variables de entorno.
* **Frontend:** Servido a través de un contenedor, con _Hot Reload_ y mapeo de volúmenes funcional.

---

### Cómo levantar el proyecto localmente (Docker)

Todo el ecosistema (Frontend, Backend, PostgreSQL y Redis) está 100% dockerizado y configurado para levantarse con un solo comando.

1. **(Opcional - Para tu Editor)**: Para que VS Code reconozca las dependencias y tipos correctamente en tu máquina Windows, ejecuta `npm install` dentro de la carpeta `/back` y `pnpm install` dentro de `/front`. (Ambas carpetas ya tienen un estricto `.dockerignore` y `.gitignore` configurados).
2. **Levantar la suite completa**: Sitúate en la raíz del proyecto y ejecuta:
   ```bash
   docker compose up --build
   ```
   > **Nota Técnica:** El frontend utilizará internamente `node:22-alpine` para ser compatible con Vite 6+.
3. **Poblar la automatización (Seeds)**: Dado que el boilerplate original contiene dependencias circulares intratables por NestJS en su CLI independiente, se ha mitigado esto explícitamente y se han habilitado las tablas dinámicas (`synchronize`). Para instalar datos de prueba rápidamente, la mejor práctica en este entorno es incluir sentencias SQL planas en el archivo `back/init.sql`, el cual es consumido automáticamente al crear el contenedor Postgres.
