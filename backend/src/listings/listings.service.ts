import { Injectable } from "@nestjs/common";
import { ServiceListingWithPrice, usdToLamports } from "@mercato/shared";
import { LISTINGS } from "./listings.seed";

@Injectable()
export class ListingsService {
  findAll(): ServiceListingWithPrice[] {
    return LISTINGS.map((listing) => ({
      ...listing,
      basePriceLamports: usdToLamports(listing.basePriceUsd),
    }));
  }
}
