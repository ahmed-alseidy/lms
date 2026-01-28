import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // List of allowed origins
      const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];

      // Allow any subdomain of localhost:3000 (e.g., teacher1.localhost:3000)
      const localhostSubdomainPattern =
        /^http:\/\/[a-zA-Z0-9-]+\.localhost:3000$/;

      if (
        allowedOrigins.includes(origin) ||
        localhostSubdomainPattern.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
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
