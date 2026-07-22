import { Module } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { VerifyService } from "./verify.service";

@Module({
  providers: [PaymentsService, VerifyService],
  exports: [PaymentsService, VerifyService],
})
export class SolanaModule {}
