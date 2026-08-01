import { pgTable, uuid, varchar, text, integer, numeric, boolean, timestamp, jsonb, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core'

// ---------- Enums ----------
export const certificationStatusEnum = pgEnum('certification_status', ['pending', 'certified', 'rejected'])
export const orderStatusEnum = pgEnum('order_status', ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'])
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded'])
export const adminRoleEnum = pgEnum('admin_role', ['super_admin', 'admin'])

// ---------- Admins ----------
// Internal ops users. Only admins can onboard farmers and manage catalog.
export const admins = pgTable('admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 15 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  totpSecret: text('totp_secret'),
  role: adminRoleEnum('role').notNull().default('admin'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  phoneIdx: uniqueIndex('admins_phone_idx').on(t.phone),
}))

// ---------- Farmers ----------
// Intentionally minimal fields per business decision: no complex geo-hierarchy.
// Login credentials are issued by an admin during onboarding (phone + password).
export const farmers = pgTable('farmers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  age: integer('age'),
  phone: varchar('phone', { length: 15 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  photoUrl: text('photo_url'),
  bannerUrl: text('banner_url'),
  bio: text('bio'),
  area: varchar('area', { length: 150 }),
  village: varchar('village', { length: 120 }),
  district: varchar('district', { length: 120 }),
  state: varchar('state', { length: 120 }),
  pincode: varchar('pincode', { length: 10 }),
  landAreaAcres: numeric('land_area_acres', { precision: 6, scale: 2 }),
  experienceYears: integer('experience_years'),
  upiId: varchar('upi_id', { length: 100 }),
  certificationStatus: certificationStatusEnum('certification_status').notNull().default('pending'),
  certifiedByConnectToFarm: boolean('certified_by_connect_to_farm').notNull().default(true),
  certificateUrl: text('certificate_url'),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by').references(() => admins.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  phoneIdx: uniqueIndex('farmers_phone_idx').on(t.phone),
}))

// ---------- Customers ----------
// Phone-only auth backed by Firebase; no password stored.
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 15 }).notNull(),
  firebaseUid: varchar('firebase_uid', { length: 128 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  phoneIdx: uniqueIndex('users_phone_idx').on(t.phone),
  firebaseUidIdx: uniqueIndex('users_firebase_uid_idx').on(t.firebaseUid),
}))

// ---------- Catalog ----------
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull(),
  iconUrl: text('icon_url'),
  bannerUrl: text('banner_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  slugIdx: uniqueIndex('categories_slug_idx').on(t.slug),
}))

// One product maps to exactly one farmer (business rule).
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').notNull().references(() => categories.id),
  farmerId: uuid('farmer_id').notNull().references(() => farmers.id),
  name: varchar('name', { length: 150 }).notNull(),
  slug: varchar('slug', { length: 180 }).notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  stock: integer('stock').notNull().default(0),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  harvestDate: varchar('harvest_date', { length: 50 }),
  gradeTag: varchar('grade_tag', { length: 100 }),
  processTag: varchar('process_tag', { length: 150 }),
  isCertifiedNoPesticides: boolean('is_certified_no_pesticides').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  slugIdx: uniqueIndex('products_slug_idx').on(t.slug),
}))

// ---------- Customer addresses ----------
// Delivery is surface-only from a single store (LB Nagar, Hyderabad); lat/lng kept
// for distance display and Ola Maps reverse-geocoding, not multi-warehouse routing.
export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  label: varchar('label', { length: 40 }).notNull().default('Home'),
  line1: varchar('line1', { length: 200 }).notNull(),
  line2: varchar('line2', { length: 200 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  pincode: varchar('pincode', { length: 10 }).notNull(),
  receiverName: varchar('receiver_name', { length: 100 }),
  receiverPhone: varchar('receiver_phone', { length: 20 }),
  lat: numeric('lat', { precision: 9, scale: 6 }),
  lng: numeric('lng', { precision: 9, scale: 6 }),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ---------- Cart ----------
export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userProductIdx: uniqueIndex('cart_items_user_product_idx').on(t.userId, t.productId),
}))

// ---------- Orders ----------
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: varchar('order_number', { length: 20 }).notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
  addressId: uuid('address_id').notNull().references(() => addresses.id),
  status: orderStatusEnum('status').notNull().default('placed'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  razorpayOrderId: varchar('razorpay_order_id', { length: 64 }),
  razorpayPaymentId: varchar('razorpay_payment_id', { length: 64 }),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  orderNumberIdx: uniqueIndex('orders_order_number_idx').on(t.orderNumber),
}))

// Snapshots product/farmer/price at time of purchase so later catalog edits don't rewrite history.
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  farmerId: uuid('farmer_id').notNull().references(() => farmers.id),
  productName: varchar('product_name', { length: 150 }).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
})

// ---------- Shipments (NimbusPost, surface transport only) ----------
export const shipments = pgTable('shipments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  nimbuspostShipmentId: varchar('nimbuspost_shipment_id', { length: 64 }),
  awbNumber: varchar('awb_number', { length: 64 }),
  courierName: varchar('courier_name', { length: 100 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  labelUrl: text('label_url'),
  trackingEvents: jsonb('tracking_events').$type<Record<string, unknown>[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  orderIdx: uniqueIndex('shipments_order_idx').on(t.orderId),
}))

// ---------- Customer Wishlist / Liked Items ----------
export const wishlists = pgTable('wishlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userProductIdx: uniqueIndex('wishlists_user_product_idx').on(t.userId, t.productId),
}))
