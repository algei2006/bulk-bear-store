// Checkout routes
const express = require('express');
const router = express.Router();
const { customAlphabet } = require('nanoid');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const nanoid = customAlphabet('0123456789', 10);

router.use(requireAuth);

function calculateOrder(cart, shippingZoneId, coupon) {
  const subtotal = cart.subtotal;
  let discount = 0;

  if (coupon) {
    if (coupon.type === 'percentage') {
      discount = subtotal * (coupon.value / 100);
    } else {
      discount = coupon.value;
    }
    discount = Math.min(discount, subtotal);
  }

  const zone = shippingZoneId
    ? db.prepare('SELECT * FROM shipping_zones WHERE id = ?').get(shippingZoneId)
    : null;

  let shippingFee = zone ? zone.fee : 0;
  if (zone && zone.free_threshold && subtotal >= zone.free_threshold) {
    shippingFee = 0;
  }

  const total = subtotal - discount + shippingFee;
  return { subtotal, discount, shippingFee, total, zone };
}

// Show checkout page
router.get('/', (req, res) => {
  const cart = req.session.cart || { items: [], subtotal: 0 };
  if (cart.items.length === 0) {
    return res.redirect('/cart');
  }

  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC').all(req.session.user.id);
  const zones = db.prepare('SELECT * FROM shipping_zones WHERE active = 1').all();

  let selectedZoneId = parseInt(req.query.zone) || (zones[0]?.id);
  const calc = calculateOrder(cart, selectedZoneId, cart.coupon);

  res.render('checkout/index', {
    title: '結賬',
    cart,
    addresses,
    zones,
    selectedZoneId,
    calc
  });
});

// Place order
router.post('/place', (req, res) => {
  const cart = req.session.cart || { items: [], subtotal: 0 };
  if (cart.items.length === 0) {
    return res.redirect('/cart');
  }

  const { address_id, new_address_recipient, new_address_phone, new_address_district, new_address_address, shipping_zone_id, payment_method, notes } = req.body;
  const user = req.session.user;

  let address;
  if (address_id) {
    address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(address_id, user.id);
  } else if (new_address_recipient && new_address_address) {
    const result = db.prepare(`
      INSERT INTO addresses (user_id, recipient, phone, district, address)
      VALUES (?, ?, ?, ?, ?)
    `).run(user.id, new_address_recipient, new_address_phone, new_address_district, new_address_address);
    address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(result.lastInsertRowid);
  }

  if (!address) {
    req.session.flash = { type: 'error', message: '請提供送貨地址' };
    return res.redirect('/checkout');
  }

  const calc = calculateOrder(cart, shipping_zone_id, cart.coupon);

  // Stock check
  for (const item of cart.items) {
    const product = db.prepare('SELECT stock, name FROM products WHERE id = ?').get(item.product_id);
    if (!product || product.stock < item.qty) {
      req.session.flash = { type: 'error', message: `「${product?.name || item.name}」庫存不足` };
      return res.redirect('/cart');
    }
  }

  const orderNo = 'BB' + Date.now().toString(36).toUpperCase() + nanoid();

  const orderResult = db.prepare(`
    INSERT INTO orders (
      order_no, user_id, subtotal, discount, shipping_fee, total,
      coupon_code, referral_code, payment_method, payment_status,
      shipping_zone_id, address_snapshot, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    orderNo,
    user.id,
    calc.subtotal,
    calc.discount,
    calc.shippingFee,
    calc.total,
    cart.coupon?.code || null,
    req.session.referralCode || null,
    payment_method || 'cod',
    payment_method === 'cod' ? 'pending' : 'pending',
    shipping_zone_id || null,
    JSON.stringify(address),
    notes || null
  );

  const orderId = orderResult.lastInsertRowid;

  // Insert order items + deduct stock
  for (const item of cart.items) {
    db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_snapshot, qty, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(orderId, item.product_id, JSON.stringify({
      name: item.name, sku: item.sku, image: item.image
    }), item.qty, item.unit_price, item.subtotal);

    db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.qty, item.product_id);
  }

  // Update coupon usage
  if (cart.coupon) {
    db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(cart.coupon.id);
  }

  // Process referral reward
  if (req.session.referralCode) {
    const referrer = db.prepare('SELECT id FROM users WHERE referral_code = ?').get(req.session.referralCode);
    if (referrer && referrer.id !== user.id) {
      const reward = calc.subtotal * 0.05; // 5% reward for referrer
      db.prepare(`
        INSERT INTO referrals (referrer_id, referee_id, order_id, reward)
        VALUES (?, ?, ?, ?)
      `).run(referrer.id, user.id, orderId, reward);
    }
  }

  // Clear cart
  req.session.cart = { items: [], subtotal: 0, coupon: null };
  req.session.referralCode = null;

  // Redirect to success/payment
  if (payment_method === 'cod') {
    return res.redirect(`/checkout/success/${orderId}`);
  }
  res.redirect(`/checkout/pay/${orderId}`);
});

// Payment page (mock)
router.get('/pay/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.session.user.id);
  if (!order) return res.redirect('/user/orders');
  res.render('checkout/pay', { title: '付款', order });
});

// Mock payment submit
router.post('/pay/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.session.user.id);
  if (!order) return res.redirect('/user/orders');

  // In production, integrate Stripe here
  db.prepare(`UPDATE orders SET payment_status = 'paid', paid_at = datetime('now'), status = 'paid' WHERE id = ?`).run(order.id);

  res.redirect(`/checkout/success/${order.id}`);
});

// Success page
router.get('/success/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, u.name as user_name, u.email
    FROM orders o JOIN users u ON o.user_id = u.id
    WHERE o.id = ? AND o.user_id = ?
  `).get(req.params.id, req.session.user.id);

  if (!order) return res.redirect('/user/orders');

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

  res.render('checkout/success', {
    title: '訂單成功',
    order,
    items
  });
});

module.exports = router;