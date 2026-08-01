import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon("postgresql://neondb_owner:npg_RP9imfKp3vtB@ep-long-queen-ayni55fw-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require");

async function run() {
  const phone = '1234567890';
  const rawPassword = 'Test@123';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  console.log(`Setting credentials for Admin and Farmer to Phone: ${phone}, Password: ${rawPassword}...`);

  // Update existing admins or insert default admin
  await sql`
    INSERT INTO admins (name, phone, password_hash, role, is_active)
    VALUES ('ConnectToFarm Admin', ${phone}, ${passwordHash}, 'super_admin', true)
    ON CONFLICT (phone) DO UPDATE
    SET password_hash = EXCLUDED.password_hash, is_active = true;
  `;

  // Also update any existing admin passwords to Test@123
  await sql`
    UPDATE admins SET password_hash = ${passwordHash}, is_active = true;
  `;

  // Update existing farmers or insert default farmer
  await sql`
    INSERT INTO farmers (name, phone, password_hash, certification_status, is_active)
    VALUES ('Mandya Organic Farmer', ${phone}, ${passwordHash}, 'certified', true)
    ON CONFLICT (phone) DO UPDATE
    SET password_hash = EXCLUDED.password_hash, is_active = true;
  `;

  // Also update any existing farmer passwords to Test@123
  await sql`
    UPDATE farmers SET password_hash = ${passwordHash}, is_active = true;
  `;

  console.log("SUCCESS: Admin & Farmer login credentials set to Phone: 1234567890, Password: Test@123 in NeonDB!");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
