import "reflect-metadata";
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";

// Root .env is the single source of truth for the whole workspace.
loadDotenv({ path: resolve(__dirname, "../../.env") });

import { NestFactory } from "@nestjs/core";
import { parseEnv } from "@mercato/shared";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/global-exception.filter";
import { requestLoggingMiddleware } from "./common/request-logging.middleware";

async function bootstrap(): Promise<void> {
  const env = parseEnv();
  const app = await NestFactory.create(AppModule);
  app.use(requestLoggingMiddleware);
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.enableCors({
    origin: ["http://localhost:3000", "http://localhost:5173", /\.vercel\.app$/],
  });
  await app.listen(env.BACKEND_PORT);
  // eslint-disable-next-line no-console
  console.log(`[mercato-backend] listening on http://localhost:${env.BACKEND_PORT}`);
}

void bootstrap();
