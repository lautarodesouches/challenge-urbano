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

### Cómo levantar el proyecto localmente
1. Copiar el entorno: `cp back/src/common/envs/development.env .env` (y asegurarse de configurar las credenciales base).
2. Orquestar la infraestructura: `docker-compose up -d postgres redis`
3. Instalar dependencias en front y back a través de `pnpm install` en sus respectivas carpetas.
4. Levantar la suite completa: `docker-compose up -d` o individualmente en local.
