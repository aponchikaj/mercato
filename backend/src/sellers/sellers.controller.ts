import {
  Controller,
  Headers,
  Body,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { AgentEvent } from "@mercato/shared";
import { EventsBusService } from "../events/events.bus";
import { SurgeService } from "../pricing/surge.service";
import { SellersService } from "./sellers.service";
import { verifyPayment } from "./verify.mock";

@Controller("sellers")
export class SellersController {
  constructor(
    private readonly sellers: SellersService,
    private readonly surge: SurgeService,
    private readonly events: EventsBusService,
  ) {}

  @Post(":capability")
  @HttpCode(HttpStatus.OK)
  async handle(
    @Param("capability") capability: string,
    @Headers("x-payment") paymentHeader: string | undefined,
    @Headers("x-quote-id") quoteIdHeader: string | undefined,
    @Body() body: unknown,
  ): Promise<unknown> {
    const seller = this.sellers.findSeller(capability);
    if (!seller) {
      throw new NotFoundException(`Unknown seller capability: ${capability}`);
    }

    if (!paymentHeader) {
      const requirements = this.sellers.issuePaymentRequirements(seller);
      throw new HttpException(requirements, HttpStatus.PAYMENT_REQUIRED);
    }

    const quote =
      this.sellers.resolveQuote(capability, quoteIdHeader) ??
      this.sellers.issuePaymentRequirements(seller);
    const verification = await verifyPayment(paymentHeader, quote);

    if (!verification.ok) {
      const fresh = this.sellers.issuePaymentRequirements(seller);
      throw new HttpException(
        { reason: verification.reason, ...fresh },
        HttpStatus.PAYMENT_REQUIRED,
      );
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
        txSignature: paymentHeader || "mock",
        timestamp,
      },
      timestamp,
    };
    this.events.emit(event);
    return fixture;
  }
}
