// User dashboard routes
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// Dashboard
router.get('/', (req, res) => {
  const user = req.session.user;
  const orders = db.prepare(`
    SELECT * FROM orders WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 5
  `).all(user.id);

  const stats = {
    totalOrders: db.prepare('SELECT COUNT(*) as c FROM orders WHERE user_id = ?').get(user.id).c,
    totalSpent: db.prepare("SELECT COALESCE(SUM(total), 0) as s FROM orders WHERE user_id = ? AND payment_status = 'paid'").get(user.id).s,
    pendingOrders: db.prepare("SELECT COUNT(*) as c FROM orders WHERE user_id = ? AND status IN ('pending', 'paid', 'shipped')").get(user.id).c,
    referralEarnings: db.prepare('SELECT COALESCE(SUM(reward), 0) as r FROM referrals WHERE referrer_id = ?').get(user.id).r
  };

  const referralLink = `${req.protocol}://${req.get('host')}/ref/${user.referral_code}`;

  res.render('user/dashboard', {
    title: '我的帳戶',
    orders,
    stats,
    referralLink
  });
});

// Orders
router.get('/orders', (req, res) => {
  const orders = db.prepare(`
    SELECT * FROM orders WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.session.user.id);

  res.render('user/orders', { title: '我的訂單', orders });
});

router.get('/orders/:id', (req, res) => {
  const order = db.prepare(`
    SELECT * FROM orders WHERE id = ? AND user_id = ?
  `).get(req.params.id, req.session.user.id);

  if (!order) return res.redirect('/user/orders');

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.render('user/order-detail', { title: `訂單 ${order.order_no}`, order, items });
});

// Addresses
router.get('/addresses', (req, res) => {
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC').all(req.session.user.id);
  res.render('user/addresses', { title: '我的地址', addresses });
});

router.post('/addresses', (req, res) => {
  const { label, recipient, phone, district, address, is_default } = req.body;

  if (is_default) {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.session.user.id);
  }

  db.prepare(`
    INSERT INTO addresses (user_id, label, recipient, phone, district, address, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.session.user.id, label, recipient, phone, district, address, is_default ? 1 : 0);

  req.session.flash = { type: 'success', message: '地址已新增' };
  res.redirect('/user/addresses');
});

router.post('/addresses/:id/delete', (req, res) => {
  db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(req.params.id, req.session.user.id);
  req.session.flash = { type: 'success', message: '地址已刪除' };
  res.redirect('/user/addresses');
});

// Profile
router.get('/profile', (req, res) => {
  const user = db.prepare('SELECT id, email, name, phone, referral_code, created_at FROM users WHERE id = ?').get(req.session.user.id);
  res.render('user/profile', { title: '個人資料', user });
});

router.post('/profile', (req, res) => {
  const { name, phone } = req.body;
  db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(name, phone, req.session.user.id);
  req.session.user.name = name;
  req.session.flash = { type: 'success', message: '資料已更新' };
  res.redirect('/user/profile');
});

// Referral program
router.get('/referral', (req, res) => {
  const user = req.session.user;
  const referralLink = `${req.protocol}://${req.get('host')}/ref/${user.referral_code}`;
  const referrals = db.prepare(`
    SELECT r.*, u.name as referee_name, u.email as referee_email, o.order_no
    FROM referrals r
    JOIN users u ON r.referee_id = u.id
    LEFT JOIN orders o ON r.order_id = o.id
    WHERE r.referrer_id = ?
    ORDER BY r.created_at DESC
  `).all(user.id);

  const totalEarnings = referrals.reduce((s, r) => s + r.reward, 0);

  res.render('user/referral', {
    title: '推薦獎賞',
    referralLink,
    referrals,
    totalEarnings
  });
});

module.exports = router;