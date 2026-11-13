import { neon } from '@neondatabase/serverless'

const databaseUrl = 'postgresql://neondb_owner:npg_RP9imfKp3vtB@ep-long-queen-ayni55fw-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require'
const sql = neon(databaseUrl)

async function inspect() {
  const farmers = await sql`SELECT id, name, phone, village, photo_url FROM farmers`
  const products = await sql`SELECT id, name, price, stock, farmer_id, category_id, images FROM products`
  const categories = await sql`SELECT id, name, slug, is_active FROM categories`
  console.log('Categories detail:', categories)
  console.log('Farmers count:', farmers.length, farmers.map(f => `${f.name} (${f.phone})`))
  console.log('Products count:', products.length, products.map(p => `${p.name} (₹${p.price})`))
}

inspect().catch(console.error)
