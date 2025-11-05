import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import User from '../models/User.js';
import Listing from '../models/Listing.js';

const TARGET_EMAIL = 'atharv.patil@somaiya.edu';

// Load environment variables from backend/.env or project root .env
(() => {
  const searchPaths = [
    path.resolve(process.cwd(), '..', '..', '.env'),
    path.resolve(process.cwd(), '..', '.env'),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const envPath of searchPaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      return;
    }
  }

  dotenv.config();
})();

const newListings = [
  {
    title: 'Sky Garden Residence in Malabar Hill',
    description:
      'Elegant duplex with wraparound terrace garden, private study, and floor-to-ceiling glazing facing the Arabian Sea.',
    location: 'Malabar Hill, Mumbai',
    price: 245000,
    bedrooms: 4,
    bathrooms: 4,
    roommates: { current: 2, max: 4 },
    images: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80'],
    amenities: ['wifi', 'parking', 'gym', 'pool', 'security'],
    roomType: 'Private Room',
    availableFrom: new Date('2025-02-15'),
  },
  {
    title: 'Seaside Micro Loft in Juhu',
    description:
      'Compact loft with retractable bed, smart storage, and breezy balcony steps from the Juhu shoreline.',
    location: 'Juhu, Mumbai',
    price: 56000,
    bedrooms: 1,
    bathrooms: 1,
    roommates: { current: 0, max: 1 },
    images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80'],
    amenities: ['wifi', 'furnished', 'laundry', 'security'],
    roomType: 'Studio',
    availableFrom: new Date('2024-12-28'),
  },
  {
    title: 'Clubhouse Residency in Andheri East',
    description:
      'High-rise apartment in a gated community with clubhouse access, rooftop jogging track, and dedicated coworking lounge.',
    location: 'Andheri East, Mumbai',
    price: 88000,
    bedrooms: 3,
    bathrooms: 2,
    roommates: { current: 1, max: 3 },
    images: ['https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80'],
    amenities: ['wifi', 'parking', 'furnished', 'gym', 'security'],
    roomType: 'Shared Room',
    availableFrom: new Date('2025-01-20'),
  },
  {
    title: 'Warehouse Loft Conversion in Byculla',
    description:
      'Industrial-chic loft with exposed brick, double-height ceilings, and curated art pieces in a heritage warehouse.',
    location: 'Byculla, Mumbai',
    price: 99000,
    bedrooms: 2,
    bathrooms: 2,
    roommates: { current: 1, max: 2 },
    images: ['https://images.unsplash.com/photo-1529429617124-aee01cda3be7?auto=format&fit=crop&w=1200&q=80'],
    amenities: ['wifi', 'furnished', 'balcony', 'laundry'],
    roomType: 'Private Room',
    availableFrom: new Date('2025-02-05'),
  },
  {
    title: 'Sunlit Corner 2BHK in Parel',
    description:
      'Corner residence with wraparound windows, modular kitchen, and dedicated yoga nook in a premium Parel tower.',
    location: 'Lower Parel, Mumbai',
    price: 76000,
    bedrooms: 2,
    bathrooms: 2,
    roommates: { current: 1, max: 2 },
    images: ['https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80'],
    amenities: ['wifi', 'furnished', 'gym', 'security'],
    roomType: 'Shared Room',
    availableFrom: new Date('2025-01-12'),
  },
  {
    title: 'Lakeview Condo in Powai Heights',
    description:
      'Modern condo with panoramic lakeview deck, smart lighting, and in-house barista counter.',
    location: 'Hiranandani Gardens, Powai',
    price: 112000,
    bedrooms: 3,
    bathrooms: 3,
    roommates: { current: 2, max: 3 },
    images: ['https://images.unsplash.com/photo-1512914890250-353c97c9e8a0?auto=format&fit=crop&w=1200&q=80'],
    amenities: ['wifi', 'parking', 'furnished', 'gym', 'pool'],
    roomType: 'Private Room',
    availableFrom: new Date('2025-02-01'),
  },
  {
    title: 'Smart Shared Suite in Kurla Nehru Nagar',
    description:
      'Tech-enabled shared suite with biometric access, shared pantry, and daily housekeeping near business parks.',
    location: 'Nehru Nagar, Kurla',
    price: 38000,
    bedrooms: 3,
    bathrooms: 2,
    roommates: { current: 2, max: 3 },
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'],
    amenities: ['wifi', 'laundry', 'security'],
    roomType: 'Shared Room',
    availableFrom: new Date('2024-12-22'),
  },
  {
    title: 'Creative Pod in Kala Ghoda',
    description:
      'Stylish studio perched over an art gallery with designer interiors, skylights, and inspiration around every corner.',
    location: 'Kala Ghoda, Mumbai',
    price: 72000,
    bedrooms: 1,
    bathrooms: 1,
    roommates: { current: 0, max: 1 },
    images: ['https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=1200&q=80'],
    amenities: ['wifi', 'furnished', 'laundry', 'security'],
    roomType: 'Studio',
    availableFrom: new Date('2025-01-08'),
  },
  {
    title: 'Executive Duplex near Terminal 2',
    description:
      'Soundproof executive duplex with private meeting room, concierge desk, and chauffeur lounge minutes from the airport.',
    location: 'Sahar, Andheri East',
    price: 138000,
    bedrooms: 3,
    bathrooms: 3,
    roommates: { current: 1, max: 3 },
    images: ['https://images.unsplash.com/photo-1523755231516-e43fd2e8dca5?auto=format&fit=crop&w=1200&q=80'],
    amenities: ['wifi', 'parking', 'gym', 'security'],
    roomType: 'Private Room',
    availableFrom: new Date('2025-03-01'),
  },
  {
    title: 'Wellness Retreat Flat in Mulund',
    description:
      'Biophilic-inspired apartment with dedicated meditation alcove, herbal tea bar, and access to wellness clubhouse.',
    location: 'Mulund West, Mumbai',
    price: 54000,
    bedrooms: 2,
    bathrooms: 2,
    roommates: { current: 1, max: 2 },
    images: ['https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80'],
    amenities: ['wifi', 'furnished', 'gym', 'security'],
    roomType: 'Shared Room',
    availableFrom: new Date('2025-01-25'),
  },
];

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flatmate_finder';
  await mongoose.connect(mongoURI);
};

const run = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const landlord = await User.findOne({ email: TARGET_EMAIL.toLowerCase() });

    if (!landlord) {
      console.error(`❌ Could not find user with email ${TARGET_EMAIL}.`);
      const sampleUsers = await User.find({}, 'email role').limit(5).lean();
      if (sampleUsers.length) {
        console.log('ℹ️  Sample users in current database connection:');
        sampleUsers.forEach((user) => {
          console.log(` • ${user.email} (${user.role})`);
        });
      } else {
        console.log('ℹ️  No users found at all. Check that MONGODB_URI points to your main database.');
      }
      console.log('ℹ️  Tip: run this script from the backend folder so backend/.env is loaded, or export MONGODB_URI manually.');
      process.exit(1);
    }

    if (landlord.role !== 'landlord') {
      landlord.role = 'landlord';
      await landlord.save();
      console.log('🔄 Updated user role to landlord');
    }

    const existing = await Listing.find({ landlord: landlord._id }, 'title');
    const existingTitles = new Set(existing.map((item) => item.title));

    const listingsToCreate = newListings
      .filter((listing) => !existingTitles.has(listing.title))
      .map((listing) => ({
        ...listing,
        landlord: landlord._id,
      }));

    if (!listingsToCreate.length) {
      console.log('ℹ️  No new listings to create; all seed titles already exist for this landlord.');
      process.exit(0);
    }

    const created = await Listing.insertMany(listingsToCreate);
  console.log(`🏠 Created ${created.length} listings for ${landlord.email}`);

    created.forEach((listing) => {
      console.log(` • ${listing.title} (${listing.location}) — ₹${listing.price}/month`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed listings:', err);
    process.exit(1);
  }
};

run();
