import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS — allow the Vite dev server and production frontend
  const corsOrigins = [
    'http://localhost:3000',   // Vite dev server (frontend/)
    'http://localhost:5173',   // Vite fallback port
    'http://127.0.0.1:3000',
  ];

  // Allow the deployed Cloudflare Pages frontend
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  if (frontendUrl) corsOrigins.push(frontendUrl);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe — strips unknown fields, transforms types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter — consistent error shape
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global transform interceptor — _id → id, removes __v
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.listen(port, '0.0.0.0');
  console.log(`SoloFlow API running on http://0.0.0.0:${port}/api`);
  if (nodeEnv === 'development') {
    console.log(`Environment: development`);
  }
}

bootstrap().catch((err) => {
  console.error('Failed to start SoloFlow backend:', err);
  process.exit(1);
});
