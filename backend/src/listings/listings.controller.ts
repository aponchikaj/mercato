import { Controller, Get } from "@nestjs/common";
import { ServiceListingWithPrice } from "@mercato/shared";
import { ListingsService } from "./listings.service";

@Controller()
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get("listings")
  findAll(): ServiceListingWithPrice[] {
    return this.listings.findAll();
  }
}
