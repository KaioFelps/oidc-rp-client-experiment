import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import session from 'express-session';
import { RedisClientGuard } from './external/redis.provider';
import { RedisStore } from 'connect-redis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const redisClient = app.get(RedisClientGuard);

  app.use(
  session({
    secret: 'my-secret',
    resave: false,
    saveUninitialized: false,
    store: new RedisStore({ client: redisClient.client }),
    name: "oidc_client_session_cookie",
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
  }),
);

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
