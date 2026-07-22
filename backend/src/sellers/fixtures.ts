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

interface CannedTopic {
  keywords: readonly string[];
  headline: string;
  fact: string;
  slug: string;
  supports: readonly { title: string; host: string; path: string; snippet: string }[];
}

const CANNED_TOPICS: readonly CannedTopic[] = [
  {
    keywords: ["downing"],
    headline: "10 Downing Street — residence of the British Prime Minister",
    fact: "Number 10 has been the Prime Minister's official residence since 1735. The Georgian townhouse stands at the corner of Downing Street and Horse Guards Road, behind its famous black door.",
    slug: "10_Downing_Street",
    supports: [
      {
        title: "Downing Street — history and security",
        host: "www.britannica.com",
        path: "/place/Downing-Street",
        snippet:
          "The street was built in the 1680s by Sir George Downing; access has been restricted since the 20th century, with steel gates installed in 1989.",
      },
      {
        title: "Inside the Prime Minister's residence",
        host: "www.atlasobscura.com",
        path: "/places/10-downing-street",
        snippet:
          "The building connects to a larger mansion at 12 Downing Street; the Cabinet Room and state dining room occupy the ground and first floors.",
      },
      {
        title: "Whitehall and Westminster walking guide",
        host: "www.nationalgeographic.com",
        path: "/travel/article/whitehall-london",
        snippet:
          "Downing Street sits off Whitehall, a few minutes' walk from Parliament Square and the Thames embankment.",
      },
      {
        title: "Prime Minister's Office — official overview",
        host: "www.gov.uk",
        path: "/government/organisations/prime-ministers-office-10-downing-street",
        snippet:
          "The PM's office coordinates government policy from Downing Street, supported by the Cabinet Secretariat and No. 10 political staff.",
      },
    ],
  },
  {
    keywords: ["pennsylvania", "white house"],
    headline: "1600 Pennsylvania Avenue NW — the White House",
    fact: "Every U.S. president since John Adams in 1800 has lived at 1600 Pennsylvania Avenue. The Neoclassical mansion was rebuilt after the British burned Washington in 1814.",
    slug: "White_House",
    supports: [
      {
        title: "White House architecture and expansion",
        host: "en.wikipedia.org",
        path: "/wiki/White_House",
        snippet:
          "The West Wing was added in 1902; the Oval Office has been the president's formal workspace since William Howard Taft's administration.",
      },
      {
        title: "Pennsylvania Avenue — America's Main Street",
        host: "www.britannica.com",
        path: "/place/Pennsylvania-Avenue",
        snippet:
          "The avenue links the Capitol to the White House and was paved and landscaped during Pierre L'Enfant's 1791 plan for Washington, D.C.",
      },
      {
        title: "Public tours and the East Wing",
        host: "www.whitehouse.gov",
        path: "/about-the-white-house/tours-events",
        snippet:
          "Guided tours of the public rooms are arranged through members of Congress; the Blue Room and State Dining Room are among the highlights.",
      },
      {
        title: "Lafayette Square and the Ellipse",
        host: "www.atlasobscura.com",
        path: "/places/lafayette-square-washington-dc",
        snippet:
          "The park north of the White House has been a protest and gathering site since the 19th century, with views of the North Portico.",
      },
    ],
  },
  {
    keywords: ["rustaveli", "tbilisi"],
    headline: "Rustaveli Avenue — central boulevard of Tbilisi",
    fact: "Shota Rustaveli Avenue runs through the heart of Tbilisi past Parliament, the Rustaveli Theatre, and the former Hotel Majestic. It is named for Georgia's medieval epic poet.",
    slug: "Rustaveli_Avenue",
    supports: [
      {
        title: "Tbilisi city centre — travel guide",
        host: "www.lonelyplanet.com",
        path: "/articles/best-things-to-do-tbilisi",
        snippet:
          "Rustaveli connects Freedom Square to the university district, with cafés, museums, and 19th-century facades along a wide tree-lined corridor.",
      },
      {
        title: "Georgian Parliament building on Rustaveli",
        host: "en.wikipedia.org",
        path: "/wiki/Georgian_Parliament_Building,_Tbilisi",
        snippet:
          "The current parliament seat on Rustaveli opened in 2012; the avenue has been a focal point for political demonstrations and public celebrations.",
      },
      {
        title: "Shota Rustaveli — poet of The Knight in the Panther's Skin",
        host: "www.britannica.com",
        path: "/biography/Shota-Rustaveli",
        snippet:
          "Rustaveli is Georgia's national poet; the 12th-century romance he authored remains central to Georgian literary identity.",
      },
      {
        title: "Soviet-era architecture on Rustaveli",
        host: "www.atlasobscura.com",
        path: "/places/rustaveli-avenue-tbilisi",
        snippet:
          "Stalinist classical fronts sit beside Art Nouveau survivors from Tbilisi's fin-de-siècle boom as a regional trade hub.",
      },
    ],
  },
  {
    keywords: ["eiffel"],
    headline: "Eiffel Tower — iron lattice tower on the Champ de Mars",
    fact: "Built for the 1889 Exposition Universelle, the tower rises 330 m including its antenna. Gustave Eiffel's firm completed it in just over two years.",
    slug: "Eiffel_Tower",
    supports: [
      {
        title: "Construction and engineering of the tower",
        host: "www.britannica.com",
        path: "/topic/Eiffel-Tower-Paris-France",
        snippet:
          "More than 18,000 iron parts were joined with 2.5 million rivets; the structure was intended as a temporary exhibit but became a permanent symbol of Paris.",
      },
      {
        title: "Views from Trocadéro and the Seine",
        host: "www.nationalgeographic.com",
        path: "/travel/article/eiffel-tower-paris",
        snippet:
          "The tower's lighting display runs nightly; the Champ de Mars lawns draw picnickers with postcard views of the iron arches.",
      },
      {
        title: "Eiffel Tower visitor information",
        host: "www.toureiffel.paris",
        path: "/en",
        snippet:
          "Summit access is by elevator from the second floor; advance booking is recommended during peak summer weeks.",
      },
      {
        title: "Art Nouveau metro entrances nearby",
        host: "www.atlasobscura.com",
        path: "/places/paris-metro-entrances",
        snippet:
          "Hector Guimard's green cast-iron awnings survive at several stations serving the 7th arrondissement around the tower.",
      },
    ],
  },
  {
    keywords: ["solana"],
    headline: "Solana Beach — coastal city in San Diego County",
    fact: "Solana Beach incorporated in 1986 and sits on bluffs above the Pacific, with Cedros Avenue's design district and a Coaster rail stop linking to San Diego.",
    slug: "Solana_Beach,_California",
    supports: [
      {
        title: "North County coastal communities",
        host: "www.sandiego.org",
        path: "/neighborhoods/north-county-coastal",
        snippet:
          "The stretch from Del Mar through Encinitas offers cliffside trails, tide pools, and weekday commuter trains on the LOSSAN corridor.",
      },
      {
        title: "Cedros Avenue — shops and galleries",
        host: "www.atlasobscura.com",
        path: "/places/cedros-avenue",
        snippet:
          "The design district occupies a former industrial strip inland from the bluffs, with furniture showrooms and weekend farmers' markets.",
      },
      {
        title: "Surf breaks of San Diego County",
        host: "www.surfer.com",
        path: "/features/san-diego-county-guide",
        snippet:
          "Table Tops and nearby reef breaks work on a mid-tide northwest swell; locals share the lineup with Cardiff and Del Mar crews.",
      },
      {
        title: "Coastal bluff stabilization",
        host: "www.nationalgeographic.com",
        path: "/environment/article/coastal-erosion-california",
        snippet:
          "San Diego County municipalities fund seawall and drainage projects where railroad tracks and homes sit atop actively retreating sandstone cliffs.",
      },
    ],
  },
  {
    keywords: ["cupertino", "apple park"],
    headline: "Cupertino and Apple Park — Silicon Valley campus",
    fact: "Apple Park opened in 2017 in Cupertino, with its ring-shaped main building designed by Foster + Partners and a site once dominated by Hewlett-Packard's campus.",
    slug: "Apple_Park",
    supports: [
      {
        title: "Cupertino — city history",
        host: "en.wikipedia.org",
        path: "/wiki/Cupertino,_California",
        snippet:
          "Named for Arroyo San José de Cupertino, the city grew with orchards before semiconductor firms arrived in the 1960s and 1970s.",
      },
      {
        title: "Architecture of the spaceship campus",
        host: "www.archdaily.com",
        path: "/915853/apple-park-foster-plus-partners",
        snippet:
          "The main ring spans 260,000 m² under a continuous curved roof; the campus runs largely on renewable energy with on-site solar.",
      },
      {
        title: "Silicon Valley corporate headquarters tour",
        host: "www.britannica.com",
        path: "/place/Silicon-Valley-region-California",
        snippet:
          "Major tech campuses cluster along Interstate 280 and the Stevens Creek corridor between San Jose and Palo Alto.",
      },
      {
        title: "Visitor Center and public cafe",
        host: "www.apple.com",
        path: "/apple-park",
        snippet:
          "The visitor center offers an augmented-reality model of the ring building and a rooftop terrace overlooking the landscaped grounds.",
      },
    ],
  },
  {
    keywords: ["amphitheatre", "mountain view", "google"],
    headline: "1600 Amphitheatre Parkway — Googleplex headquarters",
    fact: "Google's global headquarters occupies the former Silicon Graphics campus at 1600 Amphitheatre Parkway in Mountain View, acquired as the company outgrew its Stanford garage origins.",
    slug: "Googleplex",
    supports: [
      {
        title: "Mountain View city profile",
        host: "en.wikipedia.org",
        path: "/wiki/Mountain_View,_California",
        snippet:
          "The city anchors the north end of Santa Clara County, bordered by the San Francisco Bay shoreline and the NASA Ames Research Center.",
      },
      {
        title: "Stanford Research Park legacy",
        host: "www.britannica.com",
        path: "/place/Stanford-University",
        snippet:
          "Fred Terman's encouragement of student-founded firms helped seed the firms that later filled office parks along Amphitheatre Parkway.",
      },
      {
        title: "Charleston Campus and Shoreline Amphitheatre",
        host: "www.atlasobscura.com",
        path: "/places/shoreline-amphitheatre",
        snippet:
          "The outdoor venue next to the Googleplex hosts the annual I/O developer conference keynote and summer concert series.",
      },
      {
        title: "Bay Trail cycling route",
        host: "www.nationalgeographic.com",
        path: "/travel/article/san-francisco-bay-trail",
        snippet:
          "A paved segment runs past Shoreline Park, linking Mountain View's transit center to wetlands restored from salt ponds.",
      },
    ],
  },
  {
    keywords: ["fifth avenue", "empire state"],
    headline: "Fifth Avenue and Midtown Manhattan",
    fact: "Fifth Avenue between 34th and 59th Streets concentrates flagship retail, the New York Public Library, and Rockefeller Center; the Empire State Building stands at 350 Fifth Avenue.",
    slug: "Fifth_Avenue",
    supports: [
      {
        title: "Empire State Building — Art Deco icon",
        host: "www.esbnyc.com",
        path: "/about",
        snippet:
          "Completed in 1931, the 102-story tower was the world's tallest building for nearly 40 years; its observatories draw more than four million visitors annually.",
      },
      {
        title: "Midtown zoning and street wall",
        host: "www.britannica.com",
        path: "/place/Fifth-Avenue",
        snippet:
          "The avenue's luxury retail corridor developed after the 1916 zoning resolution encouraged setbacks and tower forms above a broad base.",
      },
      {
        title: "New York Public Library — Stephen A. Schwarzman Building",
        host: "www.nypl.org",
        path: "/locations/schwarzman",
        snippet:
          "The Beaux-Arts flagship at 42nd Street opened in 1911; its Rose Main Reading Room spans nearly a city block under a coffered ceiling.",
      },
      {
        title: "Holiday window displays along Fifth Avenue",
        host: "www.nationalgeographic.com",
        path: "/travel/article/new-york-city-holiday",
        snippet:
          "Department stores along the corridor compete with elaborate seasonal displays that draw crowds from Thanksgiving through New Year's.",
      },
    ],
  },
];

const FALLBACK_HOSTS = [
  "en.wikipedia.org",
  "www.britannica.com",
  "www.atlasobscura.com",
  "www.nationalgeographic.com",
  "www.architecturaldigest.com",
] as const;

const FALLBACK_ANGLES = [
  {
    titleSuffix: " — historical overview",
    snippet:
      "Archival records, municipal documents, and peer-reviewed histories describe long-term development, notable figures, and preservation efforts connected to this subject.",
  },
  {
    titleSuffix: " — geography and landmarks",
    snippet:
      "Maps, elevation data, and field guides note surrounding districts, transit links, and points of interest frequently cited in travel and urban-planning literature.",
  },
  {
    titleSuffix: " — architecture and design",
    snippet:
      "Building permits, facade studies, and conservation reports document structural materials, stylistic influences, and renovation campaigns undertaken since initial construction.",
  },
  {
    titleSuffix: " — culture and public life",
    snippet:
      "Local newspapers, festival programs, and museum collections record how residents and visitors interact with the site across seasons and civic events.",
  },
  {
    titleSuffix: " — further reading",
    snippet:
      "Cross-referenced bibliographies list academic monographs, documentary films, and primary sources recommended by regional historical societies.",
  },
] as const;

const EN_FR_DICTIONARY: Readonly<Record<string, string>> = {
  a: "un",
  about: "sur",
  address: "adresse",
  and: "et",
  avenue: "avenue",
  british: "britannique",
  building: "bâtiment",
  city: "ville",
  fact: "fait",
  french: "français",
  from: "de",
  history: "histoire",
  house: "maison",
  in: "dans",
  interesting: "intéressant",
  is: "est",
  london: "Londres",
  of: "de",
  old: "ancien",
  on: "sur",
  report: "rapport",
  street: "rue",
  the: "le",
  this: "ce",
  to: "à",
  translated: "traduit",
  translation: "traduction",
  was: "était",
  with: "avec",
  an: "un",
  at: "à",
  be: "être",
  by: "par",
  for: "pour",
  has: "a",
  have: "avoir",
  it: "il",
  its: "son",
  located: "situé",
  near: "près",
  new: "nouveau",
  not: "pas",
  official: "officiel",
  one: "un",
  prime: "premier",
  minister: "ministre",
  north: "nord",
  south: "sud",
  west: "ouest",
  east: "est",
  very: "très",
  were: "étaient",
  which: "qui",
  who: "qui",
  year: "année",
};

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

function matchTopic(query: string): CannedTopic | undefined {
  const q = query.toLowerCase();
  return CANNED_TOPICS.find((topic) =>
    topic.keywords.some((keyword) => q.includes(keyword)),
  );
}

function slugify(text: string): string {
  const cleaned = text
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 48);
  return cleaned || "Topic";
}

function cleanResults(query: string): SearchResult[] {
  const trimmed = query.trim();
  const q = trimmed.toLowerCase();
  const matched = matchTopic(q);

  if (matched) {
    return [
      {
        title: matched.headline,
        url: `https://en.wikipedia.org/wiki/${matched.slug}`,
        snippet: matched.fact,
      },
      ...matched.supports.map((item) => ({
        title: item.title,
        url: `https://${item.host}${item.path}`,
        snippet: item.snippet,
      })),
    ];
  }

  return fallbackResults(trimmed, q);
}

function fallbackResults(displayQuery: string, q: string): SearchResult[] {
  const hash = hashString(q || "general");
  const topic = displayQuery || "this topic";
  const slug = slugify(topic);

  return FALLBACK_ANGLES.map((angle, index) => {
    const host = FALLBACK_HOSTS[(hash + index) % FALLBACK_HOSTS.length] ?? FALLBACK_HOSTS[0];
    const path =
      index === 0
        ? `/wiki/${slug}`
        : `/article/${slug.toLowerCase()}-${index + 1}`;
    return {
      title: `${topic}${angle.titleSuffix}`,
      url: `https://${host}${path}`,
      snippet: `${angle.snippet} Query context: "${topic}".`,
    };
  });
}

function preserveCase(source: string, replacement: string): string {
  if (source.toUpperCase() === source) {
    return replacement.toUpperCase();
  }
  if (source[0]?.toUpperCase() === source[0]) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function translateWord(token: string): string {
  const lower = token.toLowerCase();
  const hit = EN_FR_DICTIONARY[lower];
  if (!hit) {
    return token;
  }
  return preserveCase(token, hit);
}

function translateToFrench(text: string): string {
  const parts = text.split(/(\b[\w']+\b)/);
  const body = parts.map((part) => {
    if (/^\w/.test(part)) {
      return translateWord(part);
    }
    return part;
  }).join("");

  return `Traduction : ${body.trim()} — rédigé en français pour votre rapport.`;
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
  if (lang === "fr" || lang === "french") {
    return { translated: translateToFrench(body.text) };
  }
  return {
    translated: `(traduction ${lang}) ${body.text}`,
  };
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
