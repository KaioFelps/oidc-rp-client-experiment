import { Global, Module } from "@nestjs/common";
import { EnvService } from "./env/env.service";
import { envScheme } from "./env/env-scheme";
import { ConfigModule } from "@nestjs/config";

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: envScheme.parse,
            validationSchema: envScheme,
            expandVariables: true,
        }),
    ],
    providers: [EnvService],
    exports: [EnvService]
})
export class AppConfigsModule {}