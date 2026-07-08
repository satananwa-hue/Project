// One-off admin bootstrap script - seeds Bangkok + venue categories + a curated
// set of well-known, consistently highly-rated (on Google) Bangkok nightlife
// venues. Idempotent: upserts by slug, safe to re-run.
//
// IMPORTANT CAVEATS:
// - Coordinates are curated approximations, not pulled from the Google Places
//   API (which requires a billed Google Cloud account). Verify positions before
//   a real launch.
// - No ratings are seeded. Ratings on this platform come exclusively from our
//   own reviewer community - importing Google's scores would defeat the whole
//   product premise.
//
// Usage: npm run seed:venues --workspace=api
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';

const CATEGORIES = ['Bar', 'Club', 'Rooftop Bar', 'Live Music'] as const;
type CategoryName = (typeof CATEGORIES)[number];

interface SeedVenue {
  name: string;
  slug: string;
  category: CategoryName;
  address: string;
  lat: number;
  lng: number;
  priceRange: number; // 1-4
  description?: string;
}

const VENUES: SeedVenue[] = [
  // --- Clubs ---
  { name: 'Beam', slug: 'beam', category: 'Club', address: '72 Courtyard, Sukhumvit 55 (Thonglor), Bangkok', lat: 13.7318, lng: 100.5824, priceRange: 3, description: 'Underground electronic music club with a renowned Void sound system.' },
  { name: 'Sing Sing Theater', slug: 'sing-sing-theater', category: 'Club', address: 'Sukhumvit 45, Klongton Nua, Bangkok', lat: 13.7291, lng: 100.5726, priceRange: 3, description: 'Theatrical Shanghai-inspired nightclub with live performances.' },
  { name: 'Levels Club & Lounge', slug: 'levels-club', category: 'Club', address: '35 Sukhumvit Soi 11, Bangkok', lat: 13.7411, lng: 100.5561, priceRange: 3, description: 'Large mainstream club on Sukhumvit Soi 11.' },
  { name: 'Onyx', slug: 'onyx', category: 'Club', address: 'RCA Plaza, Rama IX Rd, Bangkok', lat: 13.7503, lng: 100.5754, priceRange: 3, description: 'EDM superclub in the RCA entertainment district.' },
  { name: 'De Commune', slug: 'de-commune', category: 'Club', address: 'Liberty Plaza, Sukhumvit 55 (Thonglor), Bangkok', lat: 13.7345, lng: 100.5833, priceRange: 2, description: 'Underground techno and house venue.' },
  { name: 'Glow', slug: 'glow', category: 'Club', address: '96/4-5 Sukhumvit Soi 23, Bangkok', lat: 13.7385, lng: 100.5636, priceRange: 2, description: 'Intimate club focused on quality house and techno.' },

  // --- Bars ---
  { name: 'Tropic City', slug: 'tropic-city', category: 'Bar', address: '672/65 Charoen Krung 28, Bang Rak, Bangkok', lat: 13.7269, lng: 100.5148, priceRange: 3, description: 'Tropical cocktail bar, regularly listed among Asia’s 50 Best Bars.' },
  { name: 'BKK Social Club', slug: 'bkk-social-club', category: 'Bar', address: 'Four Seasons Hotel, 300/1 Charoen Krung Rd, Bangkok', lat: 13.7222, lng: 100.5100, priceRange: 4, description: 'Buenos Aires-inspired hotel bar, a fixture of World’s 50 Best Bars lists.' },
  { name: 'Teens of Thailand', slug: 'teens-of-thailand', category: 'Bar', address: '76 Soi Nana, Chinatown, Bangkok', lat: 13.7407, lng: 100.5124, priceRange: 2, description: 'Pioneering gin bar in a converted Chinatown shophouse.' },
  { name: 'Havana Social', slug: 'havana-social', category: 'Bar', address: 'Sukhumvit Soi 11, Bangkok', lat: 13.7420, lng: 100.5555, priceRange: 3, description: '1940s Cuba-themed speakeasy behind a phone-booth entrance.' },
  { name: 'Rabbit Hole', slug: 'rabbit-hole', category: 'Bar', address: '125 Sukhumvit 55 (Thonglor), Bangkok', lat: 13.7286, lng: 100.5789, priceRange: 3, description: 'Three-storey speakeasy cocktail bar in Thonglor.' },
  { name: 'Vesper', slug: 'vesper', category: 'Bar', address: '10/15 Convent Rd, Silom, Bangkok', lat: 13.7259, lng: 100.5330, priceRange: 3, description: 'Classic-leaning cocktail bar near Silom, a 50 Best regular.' },
  { name: 'Iron Balls Distillery & Bar', slug: 'iron-balls', category: 'Bar', address: 'Park Lane, Sukhumvit 63 (Ekkamai), Bangkok', lat: 13.7269, lng: 100.5850, priceRange: 3, description: 'Working gin distillery with an attached industrial-chic parlour.' },
  { name: 'Asia Today', slug: 'asia-today', category: 'Bar', address: '35 Maha Chai Rd, Old Town, Bangkok', lat: 13.7515, lng: 100.5040, priceRange: 2, description: 'Old Town cocktail bar known for Thai ingredients and wild-honey drinks.' },
  { name: 'Mahaniyom Cocktail Bar', slug: 'mahaniyom', category: 'Bar', address: '22 Soi Nana, Chinatown, Bangkok', lat: 13.7401, lng: 100.5130, priceRange: 3, description: 'Zero-waste-minded cocktail bar from the Mahanakhon team.' },
  { name: 'Thaipioka', slug: 'thaipioka', category: 'Bar', address: 'Sathorn, Bangkok', lat: 13.7205, lng: 100.5280, priceRange: 3, description: 'Thai-ingredient-driven cocktail bar with a playful tasting-menu approach.' },

  // --- Rooftop bars ---
  { name: 'Sky Bar at Lebua', slug: 'sky-bar-lebua', category: 'Rooftop Bar', address: 'Lebua at State Tower, 1055 Silom Rd, Bangkok', lat: 13.7215, lng: 100.5165, priceRange: 4, description: 'Iconic 63rd-floor open-air rooftop, famous from The Hangover II.' },
  { name: 'Vertigo & Moon Bar', slug: 'vertigo-moon-bar', category: 'Rooftop Bar', address: 'Banyan Tree Hotel, 21/100 Sathorn Rd, Bangkok', lat: 13.7233, lng: 100.5399, priceRange: 4, description: 'Open-air rooftop restaurant and bar on the 61st floor of the Banyan Tree.' },
  { name: 'Octave Rooftop Lounge', slug: 'octave-rooftop', category: 'Rooftop Bar', address: 'Marriott Hotel, 2 Sukhumvit 57 (Thonglor), Bangkok', lat: 13.7239, lng: 100.5808, priceRange: 3, description: 'Three-level 360-degree rooftop atop the Thonglor Marriott.' },
  { name: 'Tichuca Rooftop Bar', slug: 'tichuca', category: 'Rooftop Bar', address: 'T-One Building, 46th Fl, Sukhumvit 40, Bangkok', lat: 13.7128, lng: 100.5852, priceRange: 3, description: 'Jungle-themed rooftop with a glowing jellyfish-like centrepiece tree.' },
  { name: 'Above Eleven', slug: 'above-eleven', category: 'Rooftop Bar', address: 'Fraser Suites, 38/8 Sukhumvit Soi 11, Bangkok', lat: 13.7430, lng: 100.5563, priceRange: 3, description: 'Peruvian-Japanese rooftop bar overlooking Sukhumvit.' },

  // --- Live music ---
  { name: 'Saxophone Pub', slug: 'saxophone-pub', category: 'Live Music', address: '3/8 Phayathai Rd, Victory Monument, Bangkok', lat: 13.7649, lng: 100.5383, priceRange: 2, description: 'Legendary jazz and blues institution since 1987.' },
  { name: 'Brown Sugar', slug: 'brown-sugar', category: 'Live Music', address: '18 Chakrabongse Rd, Phra Nakhon, Bangkok', lat: 13.7621, lng: 100.4989, priceRange: 2, description: 'Long-running jazz boutique with nightly live bands.' },
  { name: 'Foojohn Building', slug: 'foojohn', category: 'Live Music', address: '831 Charoen Krung Rd, Bang Rak, Bangkok', lat: 13.7286, lng: 100.5162, priceRange: 2, description: 'Heritage-building bar with live jazz, funk and soul nights.' },
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const bangkok = await prisma.city.upsert({
    where: { id: 'bangkok' },
    update: {},
    create: { id: 'bangkok', name: 'Bangkok', country: 'Thailand' },
  });

  const categoryIdByName = new Map<string, string>();
  for (const name of CATEGORIES) {
    const category = await prisma.venueCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryIdByName.set(name, category.id);
  }

  let created = 0;
  let updated = 0;
  for (const venue of VENUES) {
    const existing = await prisma.venue.findUnique({ where: { slug: venue.slug } });
    await prisma.venue.upsert({
      where: { slug: venue.slug },
      update: {
        name: venue.name,
        address: venue.address,
        lat: venue.lat,
        lng: venue.lng,
        priceRange: venue.priceRange,
        description: venue.description,
        categoryId: categoryIdByName.get(venue.category),
      },
      create: {
        slug: venue.slug,
        name: venue.name,
        address: venue.address,
        lat: venue.lat,
        lng: venue.lng,
        priceRange: venue.priceRange,
        description: venue.description,
        cityId: bangkok.id,
        categoryId: categoryIdByName.get(venue.category),
        source: 'SEED',
      },
    });
    existing ? updated++ : created++;
  }

  console.log(
    `Seeded ${VENUES.length} venues in ${bangkok.name} (${created} created, ${updated} updated) across ${CATEGORIES.length} categories.`,
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
