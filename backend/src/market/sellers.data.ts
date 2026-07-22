import { ServiceListing, ServiceListingSchema } from "@mercato/shared";

export type SellerEntry = ServiceListing & { keyFile: string };

const BACKEND_ORIGIN = "http://localhost:4000";

const RAW_SELLERS: SellerEntry[] = [
  {
    name: "Geocoder",
    capability: "geocoder",
    url: `${BACKEND_ORIGIN}/sellers/geocoder`,
    basePriceUsd: 0.002,
    keyFile: "geocoder.json",
  },
  {
    name: "Translator",
    capability: "translator",
    url: `${BACKEND_ORIGIN}/sellers/translator`,
    basePriceUsd: 0.005,
    keyFile: "translator.json",
  },
  {
    name: "Search Cheap",
    capability: "search-cheap",
    url: `${BACKEND_ORIGIN}/sellers/search-cheap`,
    basePriceUsd: 0.003,
    keyFile: "search-cheap.json",
  },
  {
    name: "Search Pro",
    capability: "search-pro",
    url: `${BACKEND_ORIGIN}/sellers/search-pro`,
    basePriceUsd: 0.009,
    keyFile: "search-pro.json",
  },
];

export const SELLERS: SellerEntry[] = RAW_SELLERS.map((seller) => ({
  ...ServiceListingSchema.parse(seller),
  keyFile: seller.keyFile,
}));
