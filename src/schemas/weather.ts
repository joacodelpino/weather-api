import * as z from "zod";

export const weatherDateSchema = z.object({
  city: z.string().min(2).max(50),
  date1: z.coerce
    .date()
    .min(new Date("1900-01-01"), { error: "Too old!" }),
  date2: z.coerce.date().max(new Date(), { error: "Too young!" }),
});

export const weatherCitySchema = z.object({
  city: z.string().min(2).max(50),
});
