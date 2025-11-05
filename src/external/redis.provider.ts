import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { EnvService } from "src/configs/env/env.service";

@Injectable()
export class RedisClient extends Redis implements OnModuleInit, OnModuleDestroy {

    public constructor(env: EnvService) {
        super({
            host: env.get("REDIS_HOST"),
            port: env.get("REDIS_PORT"),
            password: env.get("REDIS_PASSWORD"),
            lazyConnect: true,
        })
    }

    onModuleDestroy() {
        this.disconnect();
    }

    async onModuleInit() {
        await this.connect();
    }
}