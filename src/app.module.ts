import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OidcRPModule } from './oidcrp/oidcrp.module';

@Module({
  imports: [OidcRPModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
