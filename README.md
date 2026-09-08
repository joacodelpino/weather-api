# Weather API Wrapper Service

Servicio API desarrollado con [Bun](https://bun.com) y [Fastify](https://fastify.dev/) que consulta datos meteorológicos desde la API de Visual Crossing, implementando caché con [Redis](https://redis.io/) y limitación de peticiones (rate limiting).

Proyecto basado en: [roadmap.sh - Weather API Wrapper Service](https://roadmap.sh/projects/weather-api-wrapper-service)

---

## 🛠️ Requisitos Previos

- [Docker](https://www.docker.com/) y **Docker Compose** (recomendado)
- O si prefieres ejecutar localmente:
  - [Bun](https://bun.com/) (v1.2+)
  - Servidor [Redis](https://redis.io/) en el puerto 6379

---

## ⚙️ Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
WEATHER_API_KEY=tu_api_key_aqui
ENDPOINT_URL=https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline
REDIS_URL=redis://localhost:6379
```

> **Nota**: Puedes obtener una API Key gratuita en [Visual Crossing Weather API](https://www.visualcrossing.com/weather-api).

---

## 🚀 Cómo Levantar la Aplicación

### Opción 1: Con Docker Compose (Recomendado)

Levanta la API y Redis automáticamente en sus contenedores:

```bash
docker compose up --build
```

Para ejecutar en segundo plano:

```bash
docker compose up -d --build
```

Para detener los contenedores:

```bash
docker compose down
```

La API estará disponible en `http://localhost:3000`.

---

### Opción 2: En Local con Bun

1. **Instalar dependencias**:
   ```bash
   bun install
   ```

2. **Asegurar que Redis esté corriendo**:
   Si usas Docker para Redis:
   ```bash
   docker run -d --name redis-local -p 6379:6379 redis:7-alpine
   ```

3. **Iniciar la aplicación**:
   - Modo desarrollo (con hot-reload):
     ```bash
     bun run dev
     ```
   - Modo normal:
     ```bash
     bun run start
     ```

---

## 📡 Endpoints de la API

La API corre por defecto en el puerto `3000`.

### 1. Health check / Root
- **Ruta**: `GET /`
- **Ejemplo**:
  ```bash
  curl http://localhost:3000/
  ```
- **Respuesta**:
  ```json
  { "hello": "world" }
  ```

### 2. Clima actual y pronóstico (15 días)
- **Ruta**: `GET /weather?city={ciudad}`
- **Rate Limit**: 5 peticiones / minuto
- **Ejemplo**:
  ```bash
  curl "http://localhost:3000/weather?city=Madrid"
  ```

### 3. Clima por período de fechas
- **Ruta**: `GET /weather/period?city={ciudad}&date1={YYYY-MM-DD}&date2={YYYY-MM-DD}`
- **Rate Limit**: 5 peticiones / minuto
- **Ejemplo**:
  ```bash
  curl "http://localhost:3000/weather/period?city=Madrid&date1=2024-01-01&date2=2024-01-05"
  ```

### 4. Estado de la caché
Consulta las ciudades actualmente almacenadas en caché:
- **Ruta**: `GET /cache/status`
- **Ejemplo**:
  ```bash
  curl http://localhost:3000/cache/status
  ```

### 5. Invalidar caché de una ciudad
Elimina la información en caché de una ciudad específica:
- **Ruta**: `DELETE /cache/{ciudad}`
- **Ejemplo**:
  ```bash
  curl -X DELETE http://localhost:3000/cache/Madrid
  ```
