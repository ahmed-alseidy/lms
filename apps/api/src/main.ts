import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

const multipart = require("@fastify/multipart");

async function bootstrap() {
  const adapter = new FastifyAdapter({
    logger: true,
  });
  await adapter.register(multipart);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter
  );

  app.enableCors({
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle("LMS API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, documentFactory);

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT || 3001, "0.0.0.0");
}

bootstrap();
