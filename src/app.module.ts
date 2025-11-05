import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OidcRPModule } from './oidcrp/oidcrp.module';
import { AppConfigsModule } from './configs/app-configs.module';
import { ExternalModule } from './external/external.module';

@Module({
  imports: [
    AppConfigsModule,
    ExternalModule,
    OidcRPModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
