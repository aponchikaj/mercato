export interface GeocoderRequest {
  address: string;
}

export interface GeocoderResponse {
  lat: number;
  lng: number;
  formatted: string;
}

export interface TranslatorRequest {
  text: string;
  targetLang: string;
}

export interface TranslatorResponse {
  translated: string;
}

export interface SearchRequest {
  query: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchResponse {
  results: SearchResult[];
}

// demo-tunable
export const GARBAGE_RATE = 0.4;

const GEOCODER_LOOKUP: ReadonlyArray<{
  match: string;
  lat: number;
  lng: number;
  formatted: string;
}> = [
  {
    match: "1600 amphitheatre parkway, mountain view, ca",
    lat: 37.422,
    lng: -122.084,
    formatted: "1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA",
  },
  {
    match: "1 apple park way, cupertino, ca",
    lat: 37.3349,
    lng: -122.009,
    formatted: "1 Apple Park Way, Cupertino, CA 95014, USA",
  },
  {
    match: "350 fifth avenue, new york, ny",
    lat: 40.7484,
    lng: -73.9857,
    formatted: "350 5th Ave, New York, NY 10118, USA",
  },
  {
    match: "10 downing street, london",
    lat: 51.5034,
    lng: -0.1276,
    formatted: "10 Downing St, London SW1A 2AA, UK",
  },
  {
    match: "eiffel tower, paris",
    lat: 48.8584,
    lng: 2.2945,
    formatted: "Champ de Mars, 5 Av. Anatole France, 75007 Paris, France",
  },
  {
    match: "solana beach, ca",
    lat: 32.9917,
    lng: -117.2711,
    formatted: "Solana Beach, CA 92075, USA",
  },
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function stableCoordinates(seed: string): { lat: number; lng: number } {
  const hash = hashString(seed.toLowerCase().trim());
  const lat = ((hash % 16_000) / 100 - 80).toFixed(4);
  const lng = (((hash >>> 8) % 36_000) / 100 - 180).toFixed(4);
  return { lat: Number(lat), lng: Number(lng) };
}

export function geocode(body: GeocoderRequest): GeocoderResponse {
  const normalized = body.address.toLowerCase().trim();
  const hit = GEOCODER_LOOKUP.find((entry) => entry.match === normalized);
  if (hit) {
    return { lat: hit.lat, lng: hit.lng, formatted: hit.formatted };
  }

  const { lat, lng } = stableCoordinates(body.address);
  return {
    lat,
    lng,
    formatted: `${body.address.trim()} (approx.)`,
  };
}

export function translate(body: TranslatorRequest): TranslatorResponse {
  const lang = body.targetLang.trim().toLowerCase() || "unknown";
  return { translated: `[${lang}] ${body.text}` };
}

function cleanResults(query: string): SearchResult[] {
  const topic = query.trim() || "mercato";
  return Array.from({ length: 5 }, (_, i) => ({
    title: `${topic} — result ${i + 1}`,
    url: `https://example.com/search?q=${encodeURIComponent(topic)}&n=${i + 1}`,
    snippet: `Relevant summary for "${topic}" (rank ${i + 1}).`,
  }));
}

function garbageResults(): SearchResult[] {
  return [
    {
      title: "Lorem ipsum dolor sit amet",
      url: "http://not-a-real-url",
      snippet: "",
    },
    {
      title: "consectetur adipiscing !!!",
      url: "ftp://broken",
      snippet: "",
    },
    {
      title: "asdf qwer zxcv",
      url: "https://",
      snippet: "",
    },
    {
      title: "404 TITLE NOT FOUND",
      url: "http://localhost:99999/nope",
      snippet: "???",
    },
    {
      title: "buy cheap clicks now",
      url: "javascript:void(0)",
      snippet: "",
    },
  ];
}

export function searchCheap(body: SearchRequest): SearchResponse {
  const results = Math.random() < GARBAGE_RATE ? garbageResults() : cleanResults(body.query);
  return { results };
}

export function searchPro(body: SearchRequest): SearchResponse {
  return { results: cleanResults(body.query) };
}
