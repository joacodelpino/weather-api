import Fastify from "fastify";
import { weatherDateSchema, weatherCitySchema } from "./schemas/weather";
import Redis from "ioredis";
import rateLimit from "@fastify/rate-limit";

const weatherAPIKEY = process.env.WEATHER_API_KEY || "";
const DEF_TTL = 3600;

// Cliente Fastify
const app = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  },
});

// Cliente Redis
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new Redis(redisUrl);

redis.on("error", (err) => {
  console.error("[ioredis] Error de conexión:", err.message);
});

await app.register(rateLimit, {
  max: 10,
  timeWindow: "1 minute",
  // redis: redis,
});

app.get("/", function (request, reply) {
  reply.send({ hello: "world" });
});

const baseURL = process.env.ENDPOINT_URL;

// Ruta para obtener clima de una localidad en los proximos 15 dias
app.get(
  "/weather",
  {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 minute",
      },
    },
  },
  async (req, res) => {
    const { city } = req.query as {
      city: string;
    };

    // 1. Validar que venga una ciudad
    if (!city) {
      res.status(400).send({ error: "Todos los parámetros son requeridos" });
      return;
    }

    // Validacion por separado
    try {
      weatherCitySchema.parse({ city });
    } catch (err) {
      console.error(err);
      res.status(400).send({ message: "Datos invalidos" });
      return;
    }

    // 3. Buscar en cache
    const cacheKey = `cities:${city}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(`\nCACHE HIT\n`);
      res.send(JSON.parse(cachedData));
      return;
    } else {
      // 4. Llamar la API externa
      const url = `${baseURL}/${city}?unitGroup=metric&key=${weatherAPIKEY}`;
      try {
        console.log(`\nCACHE FAILED\n`);
        console.log("Fetching:", url);
        const response = await fetch(url);

        if (!response.ok) {
          res
            .status(response.status)
            .send({ error: "No se pudo obtener el clima para esa ciudad" });
          return;
        }

        const data = await response.json();
        await redis.setex(cacheKey, DEF_TTL, JSON.stringify(data));
        res.send(data);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Error al obtener el clima" });
        return;
      }
    }
  },
);

// Ruta para obtener clima de una localidad entre una fecha especifica
app.get(
  "/weather/period",
  {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 minute",
      },
    },
  },
  async (req, res) => {
    const { city, date1, date2 } = req.query as {
      city: string;
      date1: string;
      date2: string;
    };

    // 1. Validar que vengan los parametros
    if (!city || !date1 || !date2) {
      res.status(400).send({ error: "Todos los parámetros son requeridos" });
      return;
    }

    // Validar input
    try {
      weatherDateSchema.parse({ city, date1, date2 });
      if (new Date(date1) > new Date(date2)) {
        res.status(400).send({ message: "Fecha 1 debe ser menor a fecha 2" });
        return;
      }
    } catch (err) {
      console.error(err);
      res.status(400).send({ message: "Datos invalidos" });
      return;
    }

    // Redis cache
    const cacheKey = `cities:${city}:${date1}:${date2}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(`\nCACHE HIT\n`);
      res.send(JSON.parse(cachedData));
      return;
    }

    const url = `${baseURL}/${city}/${date1}/${date2}?unitGroup=metric&key=${weatherAPIKEY}`;

    // 4. Llamar la API externa
    try {
      console.log("Fetching:", url);
      const response = await fetch(url);

      if (!response.ok) {
        res
          .status(response.status)
          .send({ error: "No se pudo obtener el clima para esa ciudad" });
        return;
      }
      const data = await response.json();
      await redis.setex(cacheKey, DEF_TTL, JSON.stringify(data));
      res.send(data);
    } catch (err) {
      console.error(err);
      res.status(500).send();
      return;
    }
  },
);

// Ruta para ver cuantas ciudades hay cacheadas en Redis - GET /cache/status
app.get("/cache/status", async (req, res) => {
  const keys = await redis.keys("cities:*");
  if (keys.length === 0) {
    res.status(200).send({ message: "No hay ciudades cacheadas" });
    return;
  }

  // Sacar el nombre de la ciudad quitando el prefijo "cities:"
  const ciudades = keys.map((key) => key.replace("cities:", ""));
  res.send({
    message: "Ciudades cacheadas",
    cantidad: ciudades.length,
    ciudades,
  });
});

// Ruta para borrar el cache de una ciudad especifica
app.delete("/cache/:city", async (req, res) => {
  const { city } = req.params as { city: string };
  const cacheKey = `cities:${city}`;

  // Validar input
  try {
    weatherCitySchema.parse({ city });
  } catch (err) {
    console.error(err);
    res.status(400).send({ message: "Datos invalidos" });
    return;
  }
  const deletedCity = await redis.del(cacheKey);

  if (deletedCity !== 1) {
    res.status(404).send({ message: "No se pudo encontrar la ciudad" });
    return;
  }
  res.status(200).send({ message: `Ciudad ${city} borrada correctamente` });
  return;
});

app.listen({ port: 3000, host: "0.0.0.0" }, function (err, address) {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  // Server is now listening on ${address}
});
