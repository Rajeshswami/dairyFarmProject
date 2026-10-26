import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
const cors = require('cors');
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  // Unified NestJS CORS setup handling both local and production environments
  app.enableCors({
    origin: [
      'http://localhost:5173',
      frontendUrl, // This will dynamically pull 'https://taupe-bublanina-84eb1d.netlify.app' from your .env
    ].filter(Boolean), // Filters out any undefined values safely
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
