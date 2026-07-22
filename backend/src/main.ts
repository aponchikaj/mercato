import "reflect-metadata";
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";

// Root .env is the single source of truth for the whole workspace.
loadDotenv({ path: resolve(__dirname, "../../.env") });

import { NestFactory } from "@nestjs/core";
import { parseEnv } from "@mercato/shared";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const env = parseEnv();
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: "http://localhost:3000" });
  await app.listen(env.BACKEND_PORT);
  // eslint-disable-next-line no-console
  console.log(`[mercato-backend] listening on http://localhost:${env.BACKEND_PORT}`);
}

void bootstrap();
