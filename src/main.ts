import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.setGlobalPrefix('api');

  const configService =
    app.get(ConfigService);

  const frontendUrl =
    configService.get<string>(
      'FRONTEND_URL',
    );

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 5000;


  await app.listen(port, '0.0.0.0');

  console.log(`Application running on port ${port}`);
}

bootstrap();