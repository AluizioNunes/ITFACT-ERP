import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsEnv = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177';
  const origins = corsEnv.split(',').map((o) => o.trim()).filter(Boolean);
  const originCfg: any = origins.includes('*') ? true : (origins.length > 1 ? origins : origins[0]);
  app.enableCors({ origin: originCfg, credentials: true });

  const port = Number(process.env.NEST_PORT) || 3000;
  await app.listen(port);
  console.log(`Nest API listening on http://localhost:${port}`);
}

bootstrap();