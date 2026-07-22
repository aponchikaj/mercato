import { ServiceListing, ServiceListingSchema } from "@mercato/shared";

const RAW_LISTINGS: ServiceListing[] = [
  {
    name: "Summarizer",
    capability: "summarize",
    url: "http://localhost:4001/summarize",
    basePriceUsd: 0.5,
  },
];

export const LISTINGS: ServiceListing[] = RAW_LISTINGS.map((listing) =>
  ServiceListingSchema.parse(listing),
);
