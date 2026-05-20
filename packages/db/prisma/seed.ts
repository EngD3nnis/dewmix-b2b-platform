// packages/db/prisma/seed.ts
import { PrismaClient, ProductStatus } from '@prisma/client'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

const CATEGORIES = [
  { slug: 'power-tools',        name: 'Power Tools',        icon: 'Drill' },
  { slug: 'hand-tools',         name: 'Hand Tools',         icon: 'Wrench' },
  { slug: 'building-materials', name: 'Building Materials', icon: 'Brick' },
  { slug: 'paint-coatings',     name: 'Paint & Coatings',   icon: 'PaintBucket' },
  { slug: 'electrical',         name: 'Electrical',         icon: 'Zap' },
  { slug: 'plumbing',           name: 'Plumbing',           icon: 'Droplet' },
  { slug: 'roofing',            name: 'Roofing',            icon: 'Home' },
  { slug: 'safety-gear',        name: 'Safety Gear',        icon: 'HardHat' },
  { slug: 'fasteners',          name: 'Fasteners',          icon: 'Bolt' },
  { slug: 'hardware-fittings',  name: 'Hardware Fittings',  icon: 'Settings' },
]

const BRANDS = [
  { slug: 'bosch', name: 'Bosch' },
  { slug: 'makita', name: 'Makita' },
  { slug: 'dewalt', name: 'DeWalt' },
  { slug: 'stanley', name: 'Stanley' },
  { slug: 'crown-berger', name: 'Crown Berger' },
  { slug: 'sadolin', name: 'Sadolin' },
  { slug: 'dulux', name: 'Dulux' },
  { slug: 'bamburi', name: 'Bamburi' },
  { slug: 'mabati-rolling', name: 'Mabati Rolling Mills' },
  { slug: 'devki', name: 'Devki Steel' },
]

const PRODUCTS = [
  { sku: 'BSH-GSB13RE', name: 'Bosch GSB 13 RE Impact Drill 600W', category: 'power-tools', brand: 'bosch', featured: true, minOrderQty: 1, specs: { Power: '600W', 'Chuck Size': '13mm', 'Max RPM': '2800', Weight: '1.8kg', Voltage: '220-240V' } },
  { sku: 'MKT-HP1631K', name: 'Makita HP1631K Hammer Drill 710W', category: 'power-tools', brand: 'makita', featured: true, minOrderQty: 1, specs: { Power: '710W', 'Chuck Size': '13mm', 'Max RPM': '2800', Weight: '1.9kg', Voltage: '220V' } },
  { sku: 'DWT-DCD771C2', name: 'DeWalt DCD771C2 20V Cordless Drill Kit', category: 'power-tools', brand: 'dewalt', featured: true, minOrderQty: 1, specs: { Voltage: '20V Max', 'Chuck Size': '13mm', 'Max RPM': '1500', Weight: '1.49kg', Battery: 'Li-Ion 1.3Ah' } },
  { sku: 'BSH-GWS750', name: 'Bosch GWS 750-100 Angle Grinder 750W', category: 'power-tools', brand: 'bosch', featured: false, minOrderQty: 1, specs: { Power: '750W', 'Disc Diameter': '100mm', 'No-load Speed': '11000 rpm', Weight: '1.7kg' } },
  { sku: 'MKT-MT870', name: 'Makita MT870 Circular Saw 1200W', category: 'power-tools', brand: 'makita', featured: false, minOrderQty: 1, specs: { Power: '1200W', 'Blade Diameter': '185mm', 'Max Cutting Depth': '66mm', Weight: '3.8kg' } },
  { sku: 'STN-67-552', name: 'Stanley FatMax Adjustable Wrench 250mm', category: 'hand-tools', brand: 'stanley', featured: true, minOrderQty: 5, specs: { Length: '250mm', 'Jaw Opening': '31mm', Material: 'Chrome Vanadium Steel', Finish: 'Chrome plated' } },
  { sku: 'STN-51-624', name: 'Stanley 16oz Claw Hammer', category: 'hand-tools', brand: 'stanley', featured: false, minOrderQty: 5, specs: { Weight: '16oz / 450g', Handle: 'Fibreglass', Head: 'Forged Steel', Length: '320mm' } },
  { sku: 'STN-94-248', name: 'Stanley 65-Piece Socket Set', category: 'hand-tools', brand: 'stanley', featured: true, minOrderQty: 1, specs: { Pieces: '65', Drive: '1/4" & 1/2"', Material: 'Chrome Vanadium', Case: 'Blow-moulded case' } },
  { sku: 'BMB-OPC-50', name: 'Bamburi Nguvu OPC Cement 50kg', category: 'building-materials', brand: 'bamburi', featured: true, minOrderQty: 10, specs: { Weight: '50kg', Grade: 'OPC 42.5N', Standard: 'KS 02-1253', Application: 'General construction' } },
  { sku: 'DVK-Y16', name: 'Devki Y16 Deformed Steel Bar 12m', category: 'building-materials', brand: 'devki', featured: false, minOrderQty: 20, specs: { Diameter: '16mm', Length: '12m', Grade: 'B500B', Standard: 'KS 572', Weight: '18.96kg/bar' } },
  { sku: 'DVK-Y12', name: 'Devki Y12 Deformed Steel Bar 12m', category: 'building-materials', brand: 'devki', featured: false, minOrderQty: 20, specs: { Diameter: '12mm', Length: '12m', Grade: 'B500B', Standard: 'KS 572', Weight: '10.68kg/bar' } },
  { sku: 'CBR-SUP-4L', name: 'Crown Berger Supergloss 4L White', category: 'paint-coatings', brand: 'crown-berger', featured: true, minOrderQty: 6, specs: { Volume: '4 Litres', Finish: 'Gloss', Coverage: '~40m² per coat', Coats: '2 recommended', Drying: '4-6 hours' } },
  { sku: 'SDL-WALL-20L', name: 'Sadolin Wall Master 20L Magnolia', category: 'paint-coatings', brand: 'sadolin', featured: true, minOrderQty: 2, specs: { Volume: '20 Litres', Finish: 'Matt', Coverage: '~200m²', Type: 'Interior emulsion', Drying: '2-4 hours' } },
  { sku: 'DUL-WTH-4L', name: 'Dulux Weathershield 4L Brilliant White', category: 'paint-coatings', brand: 'dulux', featured: false, minOrderQty: 6, specs: { Volume: '4 Litres', Finish: 'Smooth Matt', Coverage: '~56m²', Type: 'Exterior masonry', Drying: '4 hours' } },
  { sku: 'ELE-CBL-2.5', name: '2.5mm² Single Core Copper Cable 100m Roll', category: 'electrical', brand: null, featured: false, minOrderQty: 5, specs: { 'Cross Section': '2.5mm²', Length: '100m roll', Conductor: 'Annealed copper', Voltage: '450/750V', Standard: 'BS EN 50525' } },
  { sku: 'ELE-MCB-32', name: '32A Single Pole MCB Circuit Breaker', category: 'electrical', brand: null, featured: false, minOrderQty: 10, specs: { Rating: '32A', Poles: 'Single Pole', 'Trip Curve': 'Type B', 'Breaking Capacity': '6kA', Standard: 'IEC 60898-1' } },
  { sku: 'ELE-SOC-13', name: '13A Twin Switched Socket White', category: 'electrical', brand: null, featured: false, minOrderQty: 20, specs: { Rating: '13A 250V', Type: '2-gang switched', Finish: 'White', Standard: 'BS 1363', Material: 'Polycarbonate' } },
  { sku: 'PLB-PPR-25', name: 'PPR Pipe 25mm × 4m Length', category: 'plumbing', brand: null, featured: false, minOrderQty: 10, specs: { Diameter: '25mm OD', Length: '4m', Material: 'PP-R Type 3', Pressure: 'PN20', Standard: 'DIN 8077/8078' } },
  { sku: 'PLB-TAP-BASIN', name: 'Chrome Basin Pillar Tap', category: 'plumbing', brand: null, featured: false, minOrderQty: 5, specs: { Finish: 'Chrome plated', Connection: '1/2" BSP', Type: 'Pillar tap', Handle: 'Cross head', Material: 'Brass body' } },
  { sku: 'MRM-IBR-30', name: 'Mabati Rolling Mills IBR Sheet 3m × 0.5mm', category: 'roofing', brand: 'mabati-rolling', featured: true, minOrderQty: 20, specs: { Length: '3 metres', Gauge: '0.5mm', Profile: 'IBR', Coverage: '686mm effective width', Finish: 'Zincalume AZ150' } },
  { sku: 'MRM-RIDGE', name: 'Galvanized Ridge Cap 2m', category: 'roofing', brand: 'mabati-rolling', featured: false, minOrderQty: 10, specs: { Length: '2 metres', Material: 'Galvanized steel', Gauge: '0.4mm', Profile: 'Cranked ridge cap' } },
  { sku: 'SAF-HARDHAT', name: 'Industrial Safety Helmet Yellow', category: 'safety-gear', brand: null, featured: false, minOrderQty: 10, specs: { Material: 'HDPE shell', Class: 'Class E', Standard: 'EN 397', Suspension: '6-point ratchet', Color: 'Yellow' } },
  { sku: 'SAF-GLOVES', name: 'Heavy Duty Work Gloves Pair', category: 'safety-gear', brand: null, featured: false, minOrderQty: 24, specs: { Material: 'Leather palm, cotton back', Sizes: 'L / XL', Standard: 'EN 388', Protection: 'Cut & abrasion resistant' } },
]

async function main() {
  console.log('🌱  Seeding Dewmix Hardware catalog...\n')

  // Admin user.
  // Password source priority:
  //   1. $SEED_ADMIN_PASSWORD env var (used in production seeds)
  //   2. Random 24-char password printed once below (dev convenience)
  // Either way the value is hashed before it touches the DB.
  // Customer login is OTP-only — this password is only useful if/when a
  // password login path is later added for staff.
  const seedAdminPassword =
    process.env.SEED_ADMIN_PASSWORD ??
    Array.from({ length: 24 }, () =>
      'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'.charAt(
        Math.floor(Math.random() * 54),
      ),
    ).join('')
  const adminHash = await argon2.hash(seedAdminPassword)
  await prisma.user.upsert({
    where: { phone: '+254787151516' },
    create: {
      phone: '+254787151516',
      passwordHash: adminHash,
      firstName: 'Dewmix',
      lastName: 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      phoneVerified: new Date(),
    },
    update: { role: 'ADMIN', status: 'ACTIVE' },
  })
  console.log('   ✓ Admin user: +254787151516 (log in via /login with phone OTP)')
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(`   ⚠  Admin password (save this NOW, only shown once):`)
    console.log(`      ${seedAdminPassword}`)
    console.log(`      In production, set SEED_ADMIN_PASSWORD before running this script.`)
  }

  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'KENOL-MAIN' },
    create: { code: 'KENOL-MAIN', name: 'Kenol Main Warehouse', city: 'Kenol', address: 'Kenol Road, Kenya', isActive: true },
    update: {},
  })
  console.log(`   ✓ Warehouse: ${warehouse.name}`)

  for (const [i, c] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, name: c.name, iconName: c.icon, path: c.slug, depth: 0, sortOrder: i, isActive: true, metaTitle: `${c.name} — Dewmix Hardware`, metaDescription: `Browse ${c.name.toLowerCase()} from Kenya's leading hardware supplier.` },
      update: { name: c.name, iconName: c.icon, sortOrder: i },
    })
  }
  console.log(`   ✓ ${CATEGORIES.length} categories`)

  for (const b of BRANDS) {
    await prisma.brand.upsert({ where: { slug: b.slug }, create: { slug: b.slug, name: b.name, isFeatured: true }, update: { name: b.name } })
  }
  console.log(`   ✓ ${BRANDS.length} brands`)

  let count = 0
  for (const p of PRODUCTS) {
    const category = await prisma.category.findUnique({ where: { slug: p.category } })
    const brand = p.brand ? await prisma.brand.findUnique({ where: { slug: p.brand } }) : null
    if (!category) continue

    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      create: {
        sku: p.sku, slug: p.sku.toLowerCase(), name: p.name,
        shortDescription: p.name,
        description: `${p.name} — supplied by Dewmix Hardware, Kenol Road, Kenya. Contact us via WhatsApp for pricing and availability.`,
        categoryId: category.id, brandId: brand?.id,
        priceCents: 0, currency: 'KES',
        status: ProductStatus.ACTIVE,
        isFeatured: p.featured,
        minOrderQty: p.minOrderQty,
        specs: p.specs,
        popularityScore: Math.random() * 100,
      },
      update: { name: p.name, isFeatured: p.featured, minOrderQty: p.minOrderQty, specs: p.specs },
    })

    await prisma.inventory.upsert({
      where: { productId_variantId_warehouseId: { productId: product.id, variantId: null as any, warehouseId: warehouse.id } },
      create: { productId: product.id, warehouseId: warehouse.id, quantity: 50 + Math.floor(Math.random() * 200), reorderLevel: 10 },
      update: {},
    })
    count++
  }
  console.log(`   ✓ ${count} catalog products\n`)
  console.log('✅  Done.\n')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
