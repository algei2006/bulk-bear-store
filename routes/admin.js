// Admin routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

// Admin login
router.get('/login', (req, res) => {
  if (req.session.user?.role === 'admin') return res.redirect('/admin');
  res.render('admin/login', { title: '管理員登入' });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ? AND role = 'admin'").get(email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.render('admin/login', { title: '管理員登入', error: '電郵或密碼錯誤' });
  }

  req.session.user = {
    id: user.id, email: user.email, name: user.name,
    role: user.role, referral_code: user.referral_code
  };
  res.redirect('/admin');
});

router.use(requireAdmin);

// Dashboard
router.get('/', (req, res) => {
  const stats = {
    totalOrders: db.prepare('SELECT COUNT(*) as c FROM orders').get().c,
    totalRevenue: db.prepare("SELECT COALESCE(SUM(total), 0) as s FROM orders WHERE payment_status = 'paid'").get().s,
    totalProducts: db.prepare('SELECT COUNT(*) as c FROM products').get().c,
    totalUsers: db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'customer'").get().c,
    pendingOrders: db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").get().c
  };

  const recentOrders = db.prepare(`
    SELECT o.*, u.name as user_name, u.email
    FROM orders o JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC LIMIT 10
  `).all();

  res.render('admin/dashboard', { title: '後台', stats, recentOrders });
});

// Products
router.get('/products', (req, res) => {
  const products = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
  `).all();
  res.render('admin/products', { title: '產品管理', products });
});

router.get('/products/new', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories WHERE active = 1').all();
  res.render('admin/product-form', { title: '新增產品', product: null, categories });
});

router.post('/products', (req, res) => {
  const { name, sku, slug, category_id, description, price, wholesale_price, min_wholesale_qty, tier2_qty, tier2_price, tier3_qty, tier3_price, stock, image, featured, active } = req.body;

  db.prepare(`
    INSERT INTO products (
      category_id, sku, name, slug, description, image, price,
      wholesale_price, min_wholesale_qty, tier2_qty, tier2_price, tier3_qty, tier3_price,
      stock, featured, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    category_id || null, sku, name, slug, description || null, image || null, price,
    wholesale_price || null, min_wholesale_qty || 10, tier2_qty || null, tier2_price || null,
    tier3_qty || null, tier3_price || null, stock || 0,
    featured ? 1 : 0, active !== '0' ? 1 : 0
  );

  req.session.flash = { type: 'success', message: '產品已新增' };
  res.redirect('/admin/products');
});

router.get('/products/:id/edit', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.redirect('/admin/products');
  const categories = db.prepare('SELECT * FROM categories WHERE active = 1').all();
  res.render('admin/product-form', { title: '編輯產品', product, categories });
});

router.post('/products/:id', (req, res) => {
  const { name, sku, slug, category_id, description, price, wholesale_price, min_wholesale_qty, tier2_qty, tier2_price, tier3_qty, tier3_price, stock, image, featured, active } = req.body;

  db.prepare(`
    UPDATE products SET
      category_id = ?, sku = ?, name = ?, slug = ?, description = ?, image = ?,
      price = ?, wholesale_price = ?, min_wholesale_qty = ?,
      tier2_qty = ?, tier2_price = ?, tier3_qty = ?, tier3_price = ?,
      stock = ?, featured = ?, active = ?
    WHERE id = ?
  `).run(
    category_id || null, sku, name, slug, description || null, image || null, price,
    wholesale_price || null, min_wholesale_qty || 10, tier2_qty || null, tier2_price || null,
    tier3_qty || null, tier3_price || null, stock || 0,
    featured ? 1 : 0, active !== '0' ? 1 : 0, req.params.id
  );

  req.session.flash = { type: 'success', message: '產品已更新' };
  res.redirect('/admin/products');
});

router.post('/products/:id/delete', (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  req.session.flash = { type: 'success', message: '產品已刪除' };
  res.redirect('/admin/products');
});

// Categories
router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  res.render('admin/categories', { title: '分類管理', categories });
});

router.post('/categories', (req, res) => {
  const { name, slug, description, sort_order, active } = req.body;
  db.prepare(`
    INSERT INTO categories (name, slug, description, sort_order, active)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, slug, description || null, sort_order || 0, active ? 1 : 0);
  req.session.flash = { type: 'success', message: '分類已新增' };
  res.redirect('/admin/categories');
});

router.post('/categories/:id', (req, res) => {
  const { name, slug, description, sort_order, active } = req.body;
  db.prepare(`
    UPDATE categories SET name = ?, slug = ?, description = ?, sort_order = ?, active = ?
    WHERE id = ?
  `).run(name, slug, description || null, sort_order || 0, active ? 1 : 0, req.params.id);
  res.redirect('/admin/categories');
});

router.post('/categories/:id/delete', (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.redirect('/admin/categories');
});

// Orders
router.get('/orders', (req, res) => {
  const { status } = req.query;
  let where = '1=1';
  const params = [];
  if (status) { where += ' AND o.status = ?'; params.push(status); }

  const orders = db.prepare(`
    SELECT o.*, u.name as user_name, u.email, u.phone
    FROM orders o JOIN users u ON o.user_id = u.id
    WHERE ${where} ORDER BY o.created_at DESC
  `).all(...params);

  res.render('admin/orders', { title: '訂單管理', orders, status });
});

router.get('/orders/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, u.name as user_name, u.email, u.phone
    FROM orders o JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `).get(req.params.id);
  if (!order) return res.redirect('/admin/orders');

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.render('admin/order-detail', { title: `訂單 ${order.order_no}`, order, items });
});

router.post('/orders/:id/status', (req, res) => {
  const { status, tracking_no } = req.body;
  const updates = ['status = ?'];
  const params = [status];

  if (tracking_no !== undefined) {
    updates.push('tracking_no = ?');
    params.push(tracking_no);
  }
  if (status === 'shipped') updates.push("shipped_at = datetime('now')");
  if (status === 'completed') updates.push("completed_at = datetime('now')");
  if (status === 'paid') updates.push("paid_at = datetime('now')", "payment_status = 'paid'");

  params.push(req.params.id);
  db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  req.session.flash = { type: 'success', message: '訂單狀態已更新' };
  res.redirect(`/admin/orders/${req.params.id}`);
});

// Coupons
router.get('/coupons', (req, res) => {
  const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
  res.render('admin/coupons', { title: '優惠碼管理', coupons });
});

router.post('/coupons', (req, res) => {
  const { code, type, value, min_order, max_uses, valid_until, description } = req.body;
  db.prepare(`
    INSERT INTO coupons (code, type, value, min_order, max_uses, valid_until, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(code.toUpperCase(), type, value, min_order || 0, max_uses || null, valid_until || null, description || null);
  req.session.flash = { type: 'success', message: '優惠碼已新增' };
  res.redirect('/admin/coupons');
});

router.post('/coupons/:id/toggle', (req, res) => {
  db.prepare('UPDATE coupons SET active = 1 - active WHERE id = ?').run(req.params.id);
  res.redirect('/admin/coupons');
});

router.post('/coupons/:id/delete', (req, res) => {
  db.prepare('DELETE FROM coupons WHERE id = ?').run(req.params.id);
  res.redirect('/admin/coupons');
});

// Shipping
router.get('/shipping', (req, res) => {
  const zones = db.prepare('SELECT * FROM shipping_zones ORDER BY id').all();
  res.render('admin/shipping', { title: '送貨設定', zones });
});

router.post('/shipping', (req, res) => {
  const { name, districts, fee, free_threshold, estimated_days, active } = req.body;
  db.prepare(`
    INSERT INTO shipping_zones (name, districts, fee, free_threshold, estimated_days, active)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, districts.join(','), fee, free_threshold || 0, estimated_days || null, active ? 1 : 0);
  res.redirect('/admin/shipping');
});

router.post('/shipping/:id', (req, res) => {
  const { name, districts, fee, free_threshold, estimated_days, active } = req.body;
  db.prepare(`
    UPDATE shipping_zones SET name = ?, districts = ?, fee = ?, free_threshold = ?,
    estimated_days = ?, active = ? WHERE id = ?
  `).run(name, districts.join(','), fee, free_threshold || 0, estimated_days || null, active ? 1 : 0, req.params.id);
  res.redirect('/admin/shipping');
});

router.post('/shipping/:id/delete', (req, res) => {
  db.prepare('DELETE FROM shipping_zones WHERE id = ?').run(req.params.id);
  res.redirect('/admin/shipping');
});

// Users
router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT u.*, (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
    (SELECT COALESCE(SUM(total), 0) FROM orders WHERE user_id = u.id) as total_spent
    FROM users u WHERE u.role = 'customer' ORDER BY u.created_at DESC
  `).all();
  res.render('admin/users', { title: '會員管理', users });
});

router.post('/users/:id/toggle', (req, res) => {
  // Could add a 'banned' column for disabling users
  res.redirect('/admin/users');
});

module.exports = router;