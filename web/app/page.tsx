import { lamportsToSol, type ServiceListing } from "@mercato/shared";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

type ListingWithPrice = ServiceListing & { basePriceLamports: number };

async function getListings(): Promise<ListingWithPrice[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/listings`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as ListingWithPrice[];
  } catch {
    return [];
  }
}

export default async function Home() {
  const listings = await getListings();

  return (
    <main style={{ fontFamily: "monospace", padding: "2rem" }}>
      <h1>Mercato</h1>
      <p>Agent-to-agent service marketplace — Solana devnet</p>
      {listings.length === 0 ? (
        <p>No listings (is the backend running on {BACKEND_URL}?)</p>
      ) : (
        <ul>
          {listings.map((l) => (
            <li key={l.name}>
              {l.name} — {l.capability} — ${l.basePriceUsd} (
              {lamportsToSol(l.basePriceLamports)} SOL)
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
