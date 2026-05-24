import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB } from './mongodb';
import Product from './models/Product';
import User from './models/User';
import bcrypt from 'bcryptjs';

// Manually load environment variables from .env.local if not already defined
if (!process.env.MONGODB_URI) {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    console.log('Loading .env.local manually for seed script...');
    const envFileContent = fs.readFileSync(envPath, 'utf-8');
    envFileContent.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const match = trimmed.match(/^([\w.\-_]+)\s*=\s*(.*)?$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Strip surrounding quotes
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        process.env[key] = value.trim();
      }
    });
  }
}

const seedProducts = [
  {
    name: 'Signature Fresh Henna Cone',
    description: 'Hand-rolled and filled with our signature triple-sifted Sojat henna paste. Infused with pure cajeput and lavender essential oils, prepared fresh in small batches to ensure rich, deep mahogany stains. A sensory ritual that respects ancient body art traditions.',
    shortDescription: 'Artisanal fresh henna cone infused with lavender & cajeput oils for dark, rich stains.',
    price: 180,
    compareAtPrice: 220,
    images: [
      {
        url: '/images/products/cone-signature.jpg',
        publicId: 'cone_signature_main',
        alt: 'Signature Fresh Henna Cone close-up view showing handcrafted packaging'
      }
    ],
    category: 'henna-cones' as const,
    tags: ['organic', 'fresh', 'bestseller', 'signature'],
    stock: 80,
    isActive: true,
    isFeatured: true,
    weight: 25, // grams
    ingredients: [
      '100% Organic Lawsonia Inermis (Henna)',
      'Pure Cajeput Essential Oil',
      'Organic Lavender Essential Oil',
      'Raw Cane Sugar',
      'Filtered Water'
    ],
    howToUse: 'Clean skin before application. Apply designs and let dry for 20-30 minutes. Seal with sugar-lemon syrup. Keep paste on skin for 6-8 hours. Scrape off gently (do not wash with water) and apply protective oil.'
  },
  {
    name: 'Triple Mixed Yoga Powder',
    description: 'Sourced directly from our family-run organic farms in Rajasthan, this triple-sifted henna powder is mixed with Amla, Shikakai, and Bhringraj for a holistic hair and scalp therapy. Ground slowly under cold stone rollers to preserve the natural lawsonia content and botanical nutrients.',
    shortDescription: 'Triple-sifted organic henna powder enriched with Amla, Shikakai & Bhringraj for hair health.',
    price: 750,
    compareAtPrice: 900,
    images: [
      {
        url: '/images/products/sojat-powders.jpg',
        publicId: 'yoga_powder_main',
        alt: 'Premium triple-sifted organic henna powder in a jar'
      }
    ],
    category: 'powders' as const,
    tags: ['organic', 'haircare', 'botanical', 'ancient-ritual'],
    stock: 80,
    isActive: true,
    isFeatured: true,
    weight: 250, // grams
    ingredients: [
      'Organic Lawsonia Inermis (Henna) Leaf Powder',
      'Phyllanthus Emblica (Amla) Fruit Powder',
      'Acacia Concinna (Shikakai) Fruit Powder',
      'Eclipta Prostrata (Bhringraj) Powder'
    ],
    howToUse: 'Mix with warm water to a paste consistency. Let it sit for 2-3 hours for dye release. Apply to clean hair and scalp. Leave for 1-2 hours, then rinse thoroughly with water.'
  },
  {
    name: 'Essential Bridal Kit',
    description: 'A curated collection for professional bridal henna applications or intimate wedding celebrations. Featuring our finest fresh cones, specialized sealant spray, botanical aftercare oil, and detailed practice templates inspired by Mughal and Rajasthani court patterns.',
    shortDescription: 'A premium, comprehensive set of fresh cones, aftercare oil, and sealant spray for bridal body art.',
    price: 3800,
    compareAtPrice: 4500,
    images: [
      {
        url: '/images/products/bridal-kit.jpg',
        publicId: 'bridal_kit_main',
        alt: 'Artisanal bridal kit laid out in luxury packaging'
      }
    ],
    category: 'kits' as const,
    tags: ['bridal', 'gift-set', 'professional', 'exclusive'],
    stock: 35,
    isActive: true,
    isFeatured: true,
    weight: 600, // grams
    ingredients: [
      '5 Signature Fresh Henna Cones',
      '1 Premium Eucalyptus Sealant Spray (50ml)',
      '1 Rose Aftercare Oil (30ml)',
      '1 Professional Acrylic Practice Board',
      '2 Design Stencil Sheets'
    ],
    howToUse: 'Use the practice board to sketch your designs. Apply fresh cones onto the skin. Spray sealant once dry. Follow post-care instructions with Rose Aftercare Oil for maximum color expression.'
  },
  {
    name: 'Botanical Hair Strengthening Mask',
    description: 'An ancient Ayurvedic recipe combining henna with Hibiscus, Fenugreek, and Brahmi to nourish, condition, and strengthen hair follicles. It enhances natural highlights and volume without intense orange tinting, making it a perfect ritual for weekly hair care.',
    shortDescription: 'Nourishing Ayurvedic hair mask infused with hibiscus and fenugreek to restore luster and strength.',
    price: 1450,
    images: [
      {
        url: '/images/products/ultimate-kits.jpg',
        publicId: 'hair_mask_main',
        alt: 'Botanical hair mask powder in dynamic packaging'
      }
    ],
    category: 'masks' as const,
    tags: ['haircare', 'nourishing', 'herbal', 'natural'],
    stock: 90,
    isActive: true,
    isFeatured: false,
    weight: 200, // grams
    ingredients: [
      'Lawsonia Inermis (Henna) Leaf Powder',
      'Hibiscus Rosa-Sinensis (Hibiscus) Flower Powder',
      'Trigonella Foenum-Graecum (Fenugreek) Seed Powder',
      'Bacopa Monnieri (Brahmi) Powder'
    ],
    howToUse: 'Mix 3-4 tablespoons of mask powder with warm water or yogurt to form a smooth paste. Apply from roots to tips. Leave on for 45-60 minutes, then wash with a mild shampoo.'
  },
  {
    name: 'Rose & Lavender Aftercare Balm',
    description: 'Handcrafted balm made of pure beeswax and organic coconut oil, infused with steam-distilled rose and Bulgarian lavender. Specially formulated to protect mature henna stains from water exposure and deepen the color to a luscious dark mahogany.',
    shortDescription: 'Artisanal protective barrier balm infused with rose and lavender to deepen and protect henna stains.',
    price: 480,
    images: [
      {
        url: '/images/products/cone-signature.jpg',
        publicId: 'aftercare_balm_main',
        alt: 'Small artisanal glass jar containing rose and lavender aftercare balm'
      }
    ],
    category: 'accessories' as const,
    tags: ['aftercare', 'organic', 'skincare', 'lavender', 'rose'],
    stock: 120,
    isActive: true,
    isFeatured: false,
    weight: 30, // grams
    ingredients: [
      'Organic Cera Alba (Beeswax)',
      'Cocos Nucifera (Coconut) Oil',
      'Rosa Damascena Flower Oil',
      'Lavandula Angustifolia (Lavender) Oil'
    ],
    howToUse: 'Apply a thin layer over dry henna stain before bathing or swimming to prevent premature fading. Apply daily to extend the life of your henna design.'
  },
  {
    name: 'Eucalyptus Henna Sealant Spray',
    description: 'A fine mist spray formulated with therapeutic grade eucalyptus oil and lemon sugar. It locks the henna paste flat onto the skin, ensuring maximum contact and duration for a rich, dark stain, while giving off an earthy, soothing aroma.',
    shortDescription: 'A cooling lemon-sugar mist infused with pure eucalyptus oil to seal fresh henna paste.',
    price: 350,
    compareAtPrice: 400,
    images: [
      {
        url: '/images/products/sojat-powders.jpg',
        publicId: 'sealant_spray_main',
        alt: 'Eucalyptus henna sealant spray bottle with golden label'
      }
    ],
    category: 'accessories' as const,
    tags: ['accessories', 'sealant', 'eucalyptus', 'mist'],
    stock: 110,
    isActive: true,
    isFeatured: false,
    weight: 80, // grams
    ingredients: [
      'Pure Eucalyptus Globulus Leaf Oil',
      'Organic Lemon Juice Concentrate',
      'Raw Sugar Cane',
      'Filtered Water'
    ],
    howToUse: 'Hold 6 inches away from dry henna paste and mist lightly. Let dry. Apply a second coat for intricate or heavy designs. Avoid over-saturating.'
  },
  {
    name: 'Organic Sojat Rajasthani Henna Cone',
    description: 'Made from fresh-harvested Rajasthani henna leaves, these cones are optimized for intricate fine-line mandala work. Hand-rolled with flexible, durable tips, offering a smooth flow and beautiful cherry-red tones.',
    shortDescription: 'Pack of 3 professional fine-line Rajasthani henna cones for precise detailing.',
    price: 450,
    images: [
      {
        url: '/images/products/cone-signature.jpg',
        publicId: 'sojat_cones_main',
        alt: 'Three hand-rolled Rajasthani henna cones bundled in organic twine'
      }
    ],
    category: 'henna-cones' as const,
    tags: ['organic', 'fine-line', 'rajasthani', 'fresh'],
    stock: 130,
    isActive: true,
    isFeatured: false,
    weight: 75, // grams (25g per cone, 3 pack)
    ingredients: [
      'Organic Lawsonia Inermis Leaf Paste',
      'Tea Tree Essential Oil',
      'Sugar',
      'Eucalyptus Oil',
      'Water'
    ],
    howToUse: 'Uncap and squeeze gently. Best for intricate details, mandalas, and bridal extensions. Keep on skin for 6+ hours.'
  },
  {
    name: 'Artisanal Wooden Henna Stand',
    description: 'Hand-carved from seasoned mango wood by rural artisans in Uttar Pradesh, this stand keeps your cones organized and upright during application. Features ornamental floral carvings and holds up to 6 henna cones comfortably.',
    shortDescription: 'Hand-carved mango wood organizer stand holding up to 6 henna cones.',
    price: 850,
    compareAtPrice: 1100,
    images: [
      {
        url: '/images/products/ultimate-kits.jpg',
        publicId: 'wooden_stand_main',
        alt: 'Intricately carved wooden stand with slots holding henna cones'
      }
    ],
    category: 'accessories' as const,
    tags: ['accessories', 'wooden', 'hand-carved', 'artisan-made'],
    stock: 40,
    isActive: true,
    isFeatured: false,
    weight: 350, // grams
    ingredients: [
      '100% Seasoned Mango Wood',
      'Natural Beeswax Finish'
    ],
    howToUse: 'Place on your workstation. Store active henna cones tip-down or tip-up in the designated slots to prevent spillage.'
  }
];

async function main() {
  console.log('Starting seed process...');
  try {
    await connectDB();

    console.log('Clearing existing product data...');
    await Product.deleteMany({});

    console.log(`Inserting ${seedProducts.length} new products...`);
    const inserted = await Product.insertMany(seedProducts);

    console.log(`Successfully seeded database with ${inserted.length} products!`);

    // Output seeded names and slugs to verify auto-generation
    inserted.forEach((prod) => {
      console.log(` - Product: "${prod.name}" | Slug: "${prod.slug}"`);
    });

    console.log('Clearing existing user data...');
    await User.deleteMany({});

    console.log('Seeding default admin user...');
    const adminEmail = 'admin@henna.com';
    const hashedPassword = bcrypt.hashSync('admin123', 10);

    await User.create({
      email: adminEmail,
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Successfully seeded default admin user (admin@henna.com / admin123).');

  } catch (error) {
    console.error('Seeding process failed:', error);
    process.exit(1);
  } finally {
    console.log('Disconnecting from database...');
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

main();
