import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

const databaseUrl = 'postgresql://neondb_owner:npg_RP9imfKp3vtB@ep-long-queen-ayni55fw-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require'
const sql = neon(databaseUrl)

async function seedCleanCatalog() {
  console.log('Cleaning old farmer and product data...')

  // Clean dependent tables first
  await sql`DELETE FROM order_items`
  await sql`DELETE FROM cart_items`
  await sql`DELETE FROM wishlists`
  await sql`DELETE FROM products`
  await sql`DELETE FROM farmers`

  console.log('Old products, cart items, wishlists, and farmers removed successfully.')

  // Fetch or ensure categories
  let existingCats = await sql`SELECT id, name, slug FROM categories WHERE is_active = true`
  if (existingCats.length === 0) {
    console.log('Inserting default categories...')
    await sql`
      INSERT INTO categories (name, slug, sort_order) VALUES
      ('Pulses & Dals', 'pulses', 1),
      ('Millets & Superfoods', 'millets', 2),
      ('Organic Grains & Rice', 'grains', 3),
      ('Farm Combos & Baskets', 'combos', 4),
      ('Cold-Pressed Oils & Ghee', 'oils', 5)
    `
    existingCats = await sql`SELECT id, name, slug FROM categories WHERE is_active = true`
  }

  const getCatId = (slugHint) => {
    const found = existingCats.find(c => c.slug.toLowerCase().includes(slugHint.toLowerCase()) || c.name.toLowerCase().includes(slugHint.toLowerCase()))
    return found ? found.id : existingCats[0].id
  }

  const pulsesCatId = getCatId('pulses')
  const milletsCatId = getCatId('millet')
  const grainsCatId = getCatId('grain')
  const combosCatId = getCatId('combo')

  const passwordHash = bcrypt.hashSync('Test@123', 10)

  console.log('Inserting verified organic farmers...')

  // Farmer 1 (Primary Demo Farmer - phone: 1234567890)
  const [farmer1] = await sql`
    INSERT INTO farmers (
      name, age, phone, password_hash,
      photo_url, banner_url,
      bio, village, district, state, pincode,
      land_area_acres, experience_years, upi_id,
      certification_status, certified_by_connect_to_farm
    ) VALUES (
      'Ramesh Patel', 46, '1234567890', ${passwordHash},
      'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
      'Third generation organic cultivator in Warangal specializing in zero-pesticide indigenous red gram, green gram, and rainfed millets.',
      'Geekonda', 'Warangal', 'Telangana', '506001',
      8.5, 22, 'ramesh.farmer@upi',
      'certified', true
    ) RETURNING id, name
  `

  // Farmer 2: Anjaneyulu Reddy (Guntur)
  const [farmer2] = await sql`
    INSERT INTO farmers (
      name, age, phone, password_hash,
      photo_url, banner_url,
      bio, village, district, state, pincode,
      land_area_acres, experience_years, upi_id,
      certification_status, certified_by_connect_to_farm
    ) VALUES (
      'Anjaneyulu Reddy', 52, '9876543210', ${passwordHash},
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
      'Pioneer of natural zero-budget farming in Guntur delta. Focuses on unpolished foxtail millet, pearl millet, and organic whole wheat.',
      'Tenali', 'Guntur', 'Andhra Pradesh', '522201',
      12.0, 28, 'anjaneyulu@oksbi',
      'certified', true
    ) RETURNING id, name
  `

  // Farmer 3: Lakshmi Narayana (Mandya)
  const [farmer3] = await sql`
    INSERT INTO farmers (
      name, age, phone, password_hash,
      photo_url, banner_url,
      bio, village, district, state, pincode,
      land_area_acres, experience_years, upi_id,
      certification_status, certified_by_connect_to_farm
    ) VALUES (
      'Lakshmi Narayana', 48, '9123456780', ${passwordHash},
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=80',
      'Dedicated Mandya organic paddy cultivator using river Cauvery natural canal irrigation. Pure Sona Masoori raw rice and heritage red rice.',
      'Srirangapatna', 'Mandya', 'Karnataka', '571438',
      10.0, 24, 'lakshmi.mandya@okhdfcbank',
      'certified', true
    ) RETURNING id, name
  `

  console.log(`Created farmers: ${farmer1.name}, ${farmer2.name}, ${farmer3.name}`)

  console.log('Inserting freshly curated organic products with realistic images...')

  const productsToInsert = [
    // Pulses (Farmer 1: Ramesh Patel)
    {
      name: 'Unpolished Toor Dal (కందులు)',
      slug: 'unpolished-toor-dal-kandulu',
      categoryId: pulsesCatId,
      farmerId: farmer1.id,
      price: '135.00',
      unit: 'kg',
      stock: 120,
      gradeTag: 'Grade A Organic',
      processTag: 'Sun Dried & Machine Cleaned',
      harvestDate: '2026-10-15',
      description: 'Indigenous desi red gram cultivated without chemical fertilizers. Sun-dried and unpolished to retain natural proteins and rich aroma.',
      images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80'],
    },
    {
      name: 'Whole Green Moong Dal (పెసలు)',
      slug: 'whole-green-moong-dal-pesalu',
      categoryId: pulsesCatId,
      farmerId: farmer1.id,
      price: '145.00',
      unit: 'kg',
      stock: 95,
      gradeTag: 'Organic Export Quality',
      processTag: 'Naturally Harvested',
      harvestDate: '2026-10-20',
      description: 'Nutrient-dense whole green gram, ideal for healthy sprouts and daily dal. High dietary fiber and zero pesticide residue.',
      images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80'],
    },
    {
      name: 'Black Urad Dal Whole (మినుములు)',
      slug: 'black-urad-dal-whole-minumulu',
      categoryId: pulsesCatId,
      farmerId: farmer1.id,
      price: '160.00',
      unit: 'kg',
      stock: 80,
      gradeTag: 'Farm Fresh Standard',
      processTag: 'Stone Cleaned',
      harvestDate: '2026-10-05',
      description: 'Traditional whole black gram grown organically in Warangal. Perfect for protein-rich idli, dosa, and authentic dal makhani.',
      images: ['https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80'],
    },
    {
      name: 'Organic Chana Dal / Chickpeas (శనగలు)',
      slug: 'organic-chana-dal-chickpeas-sanagalu',
      categoryId: pulsesCatId,
      farmerId: farmer1.id,
      price: '110.00',
      unit: 'kg',
      stock: 140,
      gradeTag: 'Grade A Organic',
      processTag: 'Direct Farm Harvest',
      harvestDate: '2026-10-25',
      description: 'Golden yellow unpolished Bengal gram dal with natural nutty taste. Tested 100% free of artificial color or polishing agents.',
      images: ['https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80'],
    },

    // Millets (Farmer 2: Anjaneyulu Reddy)
    {
      name: 'Organic Foxtail Millet (కొర్రలు)',
      slug: 'organic-foxtail-millet-korralu',
      categoryId: milletsCatId,
      farmerId: farmer2.id,
      price: '95.00',
      unit: 'kg',
      stock: 150,
      gradeTag: 'Siridhanya Certified',
      processTag: 'Unpolished Gluten Free',
      harvestDate: '2026-11-01',
      description: 'Ancient healing millet rich in dietary fiber, iron, and magnesium. Excellent low-glycemic healthy alternative to white rice.',
      images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80'],
    },
    {
      name: 'Pure Finger Millet / Ragi (రాగులు)',
      slug: 'pure-finger-millet-ragi-ragulu',
      categoryId: milletsCatId,
      farmerId: farmer2.id,
      price: '85.00',
      unit: 'kg',
      stock: 200,
      gradeTag: 'Grade A Organic',
      processTag: 'Traditionally Sun-Dried',
      harvestDate: '2026-10-18',
      description: 'Calcium-packed whole ragi grains from Guntur rainfed lands. Ideal for wholesome ragi mudde, porridge, and nutritious rotis.',
      images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80'],
    },
    {
      name: 'Pearl Millet Whole / Bajra (సజ్జలు)',
      slug: 'pearl-millet-whole-bajra-sajjalu',
      categoryId: milletsCatId,
      farmerId: farmer2.id,
      price: '90.00',
      unit: 'kg',
      stock: 110,
      gradeTag: 'Export Quality',
      processTag: 'Cold Cleaned',
      harvestDate: '2026-10-12',
      description: 'High energy winter superfood grains. Grown in mineral-rich soils with zero synthetic inputs for peak wholesome nutrition.',
      images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80'],
    },

    // Grains & Rice (Farmer 3: Lakshmi Narayana)
    {
      name: 'Mandya Heritage Sona Masoori Rice (వరి బియ్యం)',
      slug: 'mandya-heritage-sona-masoori-rice',
      categoryId: grainsCatId,
      farmerId: farmer3.id,
      price: '88.00',
      unit: 'kg',
      stock: 300,
      gradeTag: 'Single Origin Mandya',
      processTag: 'Aged 12 Months',
      harvestDate: '2026-09-30',
      description: 'Aromatic, lightweight raw Sona Masoori rice naturally aged for 12 months. Cultivated with traditional organic compost in Mandya canal basin.',
      images: ['https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=800&q=80'],
    },
    {
      name: 'Whole Grain Sharbati Wheat (గోధుమలు)',
      slug: 'whole-grain-sharbati-wheat-godhumalu',
      categoryId: grainsCatId,
      farmerId: farmer3.id,
      price: '75.00',
      unit: 'kg',
      stock: 220,
      gradeTag: 'Grade A Farm Fresh',
      processTag: 'Sun Dried Golden Kernel',
      harvestDate: '2026-10-10',
      description: 'Premium golden whole wheat kernels with natural sweet taste. Yields fluffy, soft rotis rich in original bran and wheat germ.',
      images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80'],
    },

    // Combos & Farm Baskets
    {
      name: 'Organic Super 5 Millet Basket Combo (5 x 1kg)',
      slug: 'organic-super-5-millet-basket-combo',
      categoryId: combosCatId,
      farmerId: farmer2.id,
      price: '460.00',
      unit: 'pack',
      stock: 45,
      gradeTag: 'Best Value Farm Pack',
      processTag: 'Assorted Siridhanya',
      harvestDate: '2026-11-05',
      description: 'Wholesome 5kg family starter pack containing 1kg each of Foxtail, Little, Kodo, Barnyard, and Browntop unpolished millets.',
      images: ['https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80'],
    },
    {
      name: 'Daily Dal Duo Pack: Toor Dal & Moong Dal (2kg)',
      slug: 'daily-dal-duo-pack-toor-moong',
      categoryId: combosCatId,
      farmerId: farmer1.id,
      price: '270.00',
      unit: 'pack',
      stock: 60,
      gradeTag: 'Essential Kitchen Pack',
      processTag: 'Unpolished Duo',
      harvestDate: '2026-10-22',
      description: 'Handpicked pair of 1kg unpolished Warangal toor dal and 1kg whole green moong. 100% natural, chemical-free farm harvest.',
      images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80'],
    },
  ]

  for (const p of productsToInsert) {
    await sql`
      INSERT INTO products (
        name, slug, category_id, farmer_id,
        price, unit, stock,
        grade_tag, process_tag, harvest_date, description,
        images, is_certified_no_pesticides, is_active
      ) VALUES (
        ${p.name}, ${p.slug}, ${p.categoryId}, ${p.farmerId},
        ${p.price}, ${p.unit}, ${p.stock},
        ${p.gradeTag}, ${p.processTag}, ${p.harvestDate}, ${p.description},
        ${JSON.stringify(p.images)}, true, true
      )
    `
  }

  console.log(`Successfully added ${productsToInsert.length} fresh organic products!`)
}

seedCleanCatalog()
  .then(() => {
    console.log('Database refresh completed perfectly.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Seed error:', err)
    process.exit(1)
  })
