import { Module } from '@nestjs/common';
import { OidcRPController } from './oidcrp.controller';
import { IAuthServer, IClient } from './auth-server.provider';
import { getAuthServer } from './helpers';
import { OidcClientConfig } from 'src/configs/client';

@Module({
    controllers: [OidcRPController],
    providers: [
        { provide: IAuthServer, useFactory: getAuthServer },
        { provide: IClient, useFactory: () => ({ client_id: OidcClientConfig.clientId }) }
    ]
})
export class OidcRPModule {}

