import { ConfigService } from "@nestjs/config";
import z from "zod";

export const envScheme = z.object({
    REDIS_HOST: z.string(),
    REDIS_PORT: z.coerce.number(),
    REDIS_PASSWORD: z.string(),
    REDIS_USER: z.string()
});

export type EnvSchema = z.infer<typeof envScheme>;
