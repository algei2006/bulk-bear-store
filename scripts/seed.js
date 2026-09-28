// Seed script - initialize database with sample data
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { customAlphabet } = require('nanoid');

const codeGen = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  db.exec(`
    DELETE FROM referrals;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM addresses;
    DELETE FROM products;
    DELETE FROM categories;
    DELETE FROM coupons;
    DELETE FROM shipping_zones;
    DELETE FROM users;
  `);

  // Create admin
  const adminPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'BulkBear2024!', 10);
  db.prepare(`
    INSERT INTO users (email, password, name, phone, role, referral_code)
    VALUES (?, ?, ?, ?, 'admin', ?)
  `).run(
    process.env.ADMIN_EMAIL || 'admin@bulk-bear.com',
    adminPassword,
    '系統管理員',
    '91234567',
    'ADMIN01'
  );
  console.log('✓ Admin user created');

  // Create sample customers
  const customerPassword = bcrypt.hashSync('demo1234', 10);
  const customers = [
    ['demo@bulk-bear.com', '示範客戶', '98765432', 'CUSTOM1'],
    ['alice@example.com', 'Alice Chan', '91234567', 'ALICE01']
  ];
  customers.forEach(([email, name, phone, refCode]) => {
    db.prepare(`
      INSERT INTO users (email, password, name, phone, role, referral_code)
      VALUES (?, ?, ?, ?, 'customer', ?)
    `).run(email, customerPassword, name, phone, refCode);
  });
  console.log('✓ Demo customers created');

  // Categories
  const categories = [
    ['包裝用品', 'packaging', '紙箱、氣泡袋、封箱膠紙等包裝材料', 1],
    ['文具', 'stationery', '筆、簿、文件夾等辦公文具', 2],
    ['家居清潔', 'household', '廚房、清潔、個人護理產品', 3],
    ['食品飲料', 'food', '零食、飲品、咖啡茶包', 4],
    ['個人護理', 'personal', '洗髮、沐浴、口腔護理', 5],
    ['節日派對', 'party', '裝飾、餐具、禮品包裝', 6]
  ];

  const catIds = {};
  categories.forEach(([name, slug, desc, order]) => {
    const result = db.prepare(`
      INSERT INTO categories (name, slug, description, sort_order)
      VALUES (?, ?, ?, ?)
    `).run(name, slug, desc, order);
    catIds[slug] = result.lastInsertRowid;
  });
  console.log('✓ 6 categories created');

  // Products (with tiered wholesale pricing)
  const products = [
    // Packaging
    ['pkg-001', '牛皮紙箱 S號 (30x20x15cm)', 'kraft-box-s', catIds.packaging, '環保牛皮紙，可回收重用。每包 50 個。',
      28.00, 22.00, 10, 100, 18.00, 500, 15.00, 1000, 'featured'],
    ['pkg-002', '牛皮紙箱 M號 (40x30x25cm)', 'kraft-box-m', catIds.packaging, '中型紙箱，適合電商發貨。每包 25 個。',
      42.00, 35.00, 10, 50, 30.00, 200, 26.00, 500, 'featured'],
    ['pkg-003', '氣泡袋 25x35cm', 'bubble-bag', catIds.packaging, '緩衝保護氣泡袋。每包 100 個。',
      35.00, 28.00, 10, 100, 24.00, 500, 20.00, 100, 'normal'],
    ['pkg-004', '封箱膠紙 48mmx100m', 'packing-tape', catIds.packaging, '透明封箱膠紙，強力粘性。每箱 36 卷。',
      88.00, 72.00, 5, 36, 60.00, 144, 52.00, 500, 'featured'],
    ['pkg-005', '白色快遞袋 (大) 35x45cm', 'mailer-bag-l', catIds.packaging, '防水白色快遞袋，撕拉條設計。每包 100 個。',
      45.00, 38.00, 10, 100, 32.00, 500, 28.00, 200, 'normal'],

    // Stationery
    ['sta-001', '黑色原子筆 0.5mm', 'pen-black', catIds.stationery, '順滑書寫原子筆。每盒 50 支。',
      65.00, 55.00, 5, 50, 45.00, 200, 38.00, 1000, 'featured'],
    ['sta-002', 'A4 影印紙 80g (5包/箱)', 'a4-paper', catIds.stationery, 'A4 80gsm 白色影印紙。每箱 5 包 x 500 張。',
      145.00, 128.00, 3, 10, 115.00, 50, 98.00, 200, 'featured'],
    ['sta-003', 'L型文件夾 A4', 'l-folder', catIds.stationery, '透明 L 型文件夾。每包 50 個。',
      38.00, 30.00, 10, 50, 25.00, 200, 22.00, 500, 'normal'],
    ['sta-004', '便利貼 76x76mm (黃色)', 'sticky-notes', catIds.stationery, '黃色便利貼，多色可選。每包 12 本。',
      42.00, 35.00, 5, 12, 30.00, 48, 26.00, 100, 'normal'],
    ['sta-005', '白板筆 (4色裝)', 'whiteboard-marker', catIds.stationery, '可擦拭白板筆，黑紅藍綠4色。每盒 12 套。',
      96.00, 80.00, 5, 12, 68.00, 48, 58.00, 100, 'normal'],

    // Household
    ['hh-001', '廚房紙巾 2層 (6卷裝)', 'kitchen-tissue', catIds.household, '強力吸水廚房紙。每箱 12 組。',
      78.00, 65.00, 5, 12, 56.00, 48, 48.00, 100, 'featured'],
    ['hh-002', '垃圾袋 大號 (50個/卷)', 'trash-bag-l', catIds.household, '加厚垃圾袋。每箱 20 卷。',
      88.00, 72.00, 5, 20, 62.00, 100, 52.00, 200, 'normal'],
    ['hh-003', '洗碗海綿 (6件裝)', 'sponge', catIds.household, '雙面洗碗海綿。每箱 24 包。',
      48.00, 40.00, 10, 24, 34.00, 96, 28.00, 200, 'normal'],
    ['hh-004', '萬用清潔劑 1L', 'cleaner-1l', catIds.household, '多功能萬用清潔劑。每箱 12 瓶。',
      120.00, 100.00, 5, 12, 88.00, 48, 76.00, 100, 'featured'],

    // Food
    ['fd-001', '礦泉水 500ml (24支/箱)', 'mineral-water', catIds.food, '天然礦泉水。',
      48.00, 40.00, 5, 10, 35.00, 50, 30.00, 100, 'featured'],
    ['fd-002', '即溶咖啡 三合一 (100包)', 'coffee-3in1', catIds.food, '馬來西亞進口三合一即溶咖啡。',
      88.00, 75.00, 5, 10, 65.00, 30, 55.00, 100, 'normal'],
    ['fd-003', '薯片綜合包 (30包/箱)', 'chips-mix', catIds.food, '多種口味薯片綜合包裝。',
      95.00, 80.00, 3, 10, 70.00, 30, 60.00, 100, 'normal'],

    // Personal care
    ['pc-001', '洗手液 500ml', 'hand-wash', catIds.personal, '抗菌洗手液，溫和配方。每箱 12 瓶。',
      96.00, 80.00, 5, 12, 68.00, 48, 58.00, 100, 'normal'],
    ['pc-002', '紙巾 3層 (5包裝)', 'tissue-3ply', catIds.personal, '3 層加厚紙巾。每箱 24 包。',
      78.00, 65.00, 5, 24, 56.00, 96, 48.00, 200, 'featured'],

    // Party
    ['pt-001', '生日派對裝飾套裝', 'party-deco', catIds.party, '生日派對佈置套裝，含橫幅、氣球、彩帶。',
      58.00, 48.00, 5, 10, 40.00, 50, 35.00, 100, 'normal'],
    ['pt-002', '一次性紙杯 230ml (50個)', 'paper-cup', catIds.party, '環保一次性紙杯。每箱 20 包。',
      65.00, 55.00, 5, 20, 48.00, 100, 42.00, 200, 'normal']
  ];

  products.forEach(([sku, name, slug, catId, desc, price, wsPrice, minQty, t2Qty, t2Price, t3Qty, t3Price, stock, featured]) => {
    db.prepare(`
      INSERT INTO products (
        category_id, sku, name, slug, description, price,
        wholesale_price, min_wholesale_qty, tier2_qty, tier2_price, tier3_qty, tier3_price,
        stock, featured, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(catId, sku, name, slug, desc, price, wsPrice, minQty, t2Qty, t2Price, t3Qty, t3Price, stock, featured === 'featured' ? 1 : 0);
  });
  console.log(`✓ ${products.length} products created`);

  // Shipping zones
  const zones = [
    ['香港島及九龍', '香港島,九龍', 30, 500, '1-2 個工作天'],
    ['新界', '新界', 50, 800, '2-3 個工作天'],
    ['離島', '離島', 100, 1000, '3-5 個工作天'],
    ['澳門', '澳門', 150, 1500, '3-5 個工作天']
  ];

  zones.forEach(([name, districts, fee, threshold, days]) => {
    db.prepare(`
      INSERT INTO shipping_zones (name, districts, fee, free_threshold, estimated_days, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(name, districts, fee, threshold, days);
  });
  console.log('✓ 4 shipping zones created');

  // Coupons
  const coupons = [
    ['WELCOME10', 'percentage', 10, 0, 100, null, '新會員迎新優惠 10% 折扣'],
    ['SAVE50', 'fixed', 50, 200, 200, null, '滿 HK$200 減 HK$50'],
    ['VIP20', 'percentage', 20, 500, 50, null, 'VIP 會員專屬 20% 折扣'],
    ['FREESHIP', 'fixed', 30, 0, 500, null, '運費優惠券 (折抵 HK$30 運費)']
  ];

  coupons.forEach(([code, type, value, minOrder, maxUses, validUntil, description]) => {
    db.prepare(`
      INSERT INTO coupons (code, type, value, min_order, max_uses, valid_until, description, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(code, type, value, minOrder, maxUses, validUntil, description);
  });
  console.log('✓ 4 coupons created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📌 Default Accounts:');
  console.log(`   Admin: ${process.env.ADMIN_EMAIL || 'admin@bulk-bear.com'} / ${process.env.ADMIN_PASSWORD || 'BulkBear2024!'}`);
  console.log('   Customer: demo@bulk-bear.com / demo1234');
}

seed();