import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { parseEnv } from "@mercato/shared";

loadDotenv({ path: resolve(__dirname, "../../.env") });

export const env = parseEnv();
export const BACKEND_URL = `http://localhost:${env.BACKEND_PORT}`;
