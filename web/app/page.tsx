import { lamportsToSol } from "@mercato/shared";
import { getBackendUrl } from "../lib/env";
import { fetchListings } from "../lib/listings";

export default async function Home() {
  const listings = await fetchListings();
  const backendUrl = getBackendUrl();

  return (
    <main style={{ fontFamily: "monospace", padding: "2rem" }}>
      <h1>Mercato</h1>
      <p>Agent-to-agent service marketplace — Solana devnet</p>
      {listings.length === 0 ? (
        <p>No listings (is the backend running on {backendUrl}?)</p>
      ) : (
        <ul>
          {listings.map((listing) => (
            <li key={listing.name}>
              {listing.name} — {listing.capability} — ${listing.basePriceUsd} (
              {lamportsToSol(listing.basePriceLamports)} SOL)
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
