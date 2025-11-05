import { Global, Module } from "@nestjs/common";
import { RedisClientGuard } from "./redis.provider";

@Global()
@Module({
    providers: [RedisClientGuard],
    exports: [RedisClientGuard]
})
export class ExternalModule {}
