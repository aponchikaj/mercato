import {
  Controller,
  Headers,
  Body,
  NotFoundException,
  Param,
  Post,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { AgentEvent } from "@mercato/shared";
import { EventsBusService } from "../events/events.bus";
import { SurgeService } from "../pricing/surge.service";
import { VerifyService } from "../solana/verify.service";
import { SellersService } from "./sellers.service";

@Controller("sellers")
export class SellersController {
  constructor(
    private readonly sellers: SellersService,
    private readonly surge: SurgeService,
    private readonly events: EventsBusService,
    private readonly verify: VerifyService,
  ) {}

  @Post(":capability")
  async handle(
    @Param("capability") capability: string,
    @Headers("x-payment") paymentHeader: string | undefined,
    @Headers("x-quote-id") quoteIdHeader: string | undefined,
    @Body() body: unknown,
    @Res() res: Response,
  ): Promise<void> {
    const seller = this.sellers.findSeller(capability);
    if (!seller) {
      throw new NotFoundException(`Unknown seller capability: ${capability}`);
    }

    if (!paymentHeader) {
      res.status(402).json(this.sellers.issuePaymentRequirements(seller));
      return;
    }

    if (!quoteIdHeader) {
      res.status(402).json(this.sellers.issuePaymentRequirements(seller));
      return;
    }

    const quote = this.sellers.resolveQuote(capability, quoteIdHeader);
    if (!quote) {
      res.status(402).json(this.sellers.issuePaymentRequirements(seller));
      return;
    }

    const verification = await this.verify.verifyPayment(paymentHeader, quote);
    if (!verification.ok) {
      const fresh = this.sellers.issuePaymentRequirements(seller);
      res.status(402).json({ reason: verification.reason, ...fresh });
      return;
    }

    this.surge.recordRequest(capability);
    const fixture = this.sellers.serveFixture(capability, body);
    const timestamp = Date.now();
    const event: AgentEvent = {
      kind: "purchase",
      payload: {
        seller: seller.name,
        capability,
        amountLamports: quote.amountLamports,
        txSignature: paymentHeader,
        timestamp,
      },
      timestamp,
    };
    this.events.emit(event);
    res.status(200).json(fixture);
  }
}
