import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EnvSchema } from "./env-scheme";

@Injectable()
export class EnvService {
    @Inject()
    private configService: ConfigService<EnvSchema, true>;

    public get<T extends keyof EnvSchema>(key: T): EnvSchema[T] {
        return this.configService.get(key, { infer: true });
    }
}