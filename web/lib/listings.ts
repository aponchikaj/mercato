import {
  ServiceListingListSchema,
  type ServiceListingWithPrice,
} from "@mercato/shared";
import { getBackendUrl } from "./env";

export async function fetchListings(): Promise<ServiceListingWithPrice[]> {
  try {
    const res = await fetch(`${getBackendUrl()}/listings`, { cache: "no-store" });
    if (!res.ok) return [];
    const parsed = ServiceListingListSchema.safeParse(await res.json());
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}
