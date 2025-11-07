import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { RedisClientType } from "@redis/client";
import { createClient } from "redis";
import { EnvService } from "src/configs/env/env.service";

@Injectable()
export class RedisClientGuard implements OnModuleInit, OnModuleDestroy {
    public readonly client: RedisClientType

    public constructor(env: EnvService) {
        const user = env.get("REDIS_USER");
        const host= env.get("REDIS_HOST");
        const port= env.get("REDIS_PORT");
        const password= env.get("REDIS_PASSWORD");

        const url = `redis://${user}:${password}@${host}:${port}`;
        const client = createClient({ url })

        this.client = client as RedisClientType;
    }

    onModuleDestroy() {
        this.client.destroy();
    }

    async onModuleInit() {
        await this.client.connect();
    }
}