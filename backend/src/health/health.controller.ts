import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get("health")
  health(): { ok: true; network: "solana-devnet" } {
    return { ok: true, network: "solana-devnet" };
  }
}
