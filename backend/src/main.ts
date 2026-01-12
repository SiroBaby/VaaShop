import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import * as express from 'express';
import { join } from 'path';
import cookieParser from 'cookie-parser';

const corsOptions: CorsOptions = {
  origin: [
    'https://vaashop.vercel.app',
    'https://vaashop.io.vn',
    'http://localhost:3000',
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders:
    'Content-Type,Authorization,Apollo-Require-Preflight,x-apollo-operation-name',
  credentials: true,
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use((req, res, next) => {
    console.log(
      'Incoming request:',
      req.method,
      req.url,
      req.body,
      'Files:',
      req.files,
    );
    next();
  });

  app.enableCors(corsOptions);
  app.use('/img', express.static(join(__dirname, '..', 'img')));

  await app.init();
  return app;
}

// Local development
if (require.main === module) {
  bootstrap().then(app => {
    app.listen(process.env.PORT ?? 3302);
    console.log(`Application is running on port ${process.env.PORT ?? 3301}`);
  });
}

// Vercel serverless export
export default async (req, res) => {
  const app = await bootstrap();
  const instance = app.getHttpAdapter().getInstance();
  return instance(req, res);
};
