import { createClient } from "redis";

const redis = createClient();
redis.on("error", (err) => console.log("Redis Client Error", err));
await redis.connect();

// redis.SET ("CLAVE:id", "VALOR")
await redis.set("bike:1", "BMX Pro 2026");

// redis.GET ("CLAVE:id", "VALOR")
const value = await redis.get("bike:1");
console.log(value);

//====================

// redis.HSET("CLAVE:id", { campo1:"valor1", campo2:"valor2", ... })
const res1 = await redis.hSet("bike:2", {
  model: "Deimos",
  brand: "Ergonom",
  type: "Enduro bikes",
  price: 4972,
});
console.log(res1); // 4

// redis.HGET("CLAVE:id", "campo1")
const res2 = await redis.hGet("bike:2", "model");
console.log(res2); // 'Deimos'

// redis.HGET("CLAVE:id", "campo4")
const res3 = await redis.hGet("bike:2", "price");
console.log(res3); // '4972'

// Muestra todos los campos hash de una clave especifica (aca bike:1)
// redis.hGetAll("CLAVE:id")
const res4 = await redis.hGetAll("bike:2");
console.log(res4);
