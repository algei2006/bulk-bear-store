// Cart routes
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { getUnitPrice } = require('../middleware/pricing');

function getCart(req) {
  if (!req.session.cart) {
    req.session.cart = { items: [], subtotal: 0, coupon: null };
  }
  return req.session.cart;
}

function recalcCart(cart) {
  cart.subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
  return cart;
}

// View cart
router.get('/', (req, res) => {
  const cart = getCart(req);
  res.render('cart/index', {
    title: '購物車',
    cart
  });
});

// Add to cart
router.post('/add', (req, res) => {
  const { product_id, qty } = req.body;
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(product_id);

  if (!product) {
    req.session.flash = { type: 'error', message: '產品不存在' };
    return res.redirect('back');
  }

  const q = Math.max(1, parseInt(qty) || 1);
  const cart = getCart(req);

  const existing = cart.items.find(i => i.product_id === product.id);
  if (existing) {
    existing.qty += q;
    existing.unit_price = getUnitPrice(product, existing.qty);
    existing.subtotal = existing.unit_price * existing.qty;
  } else {
    cart.items.push({
      product_id: product.id,
      name: product.name,
      image: product.image,
      sku: product.sku,
      qty: q,
      unit_price: getUnitPrice(product, q),
      subtotal: getUnitPrice(product, q) * q
    });
  }

  recalcCart(cart);
  req.session.flash = { type: 'success', message: `已加入「${product.name}」到購物車` };
  res.redirect('back');
});

// Update cart item
router.post('/update', (req, res) => {
  const { product_id, qty } = req.body;
  const cart = getCart(req);
  const newQty = Math.max(1, parseInt(qty) || 1);
  const item = cart.items.find(i => i.product_id === parseInt(product_id));

  if (item) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
    item.qty = newQty;
    item.unit_price = getUnitPrice(product, newQty);
    item.subtotal = item.unit_price * newQty;
    recalcCart(cart);
  }
  res.redirect('/cart');
});

// Remove item
router.post('/remove', (req, res) => {
  const { product_id } = req.body;
  const cart = getCart(req);
  cart.items = cart.items.filter(i => i.product_id !== parseInt(product_id));
  recalcCart(cart);
  res.redirect('/cart');
});

// Apply coupon
router.post('/coupon', (req, res) => {
  const { code } = req.body;
  const coupon = db.prepare(`
    SELECT * FROM coupons
    WHERE code = ? AND active = 1
    AND (valid_from IS NULL OR datetime(valid_from) <= datetime('now'))
    AND (valid_until IS NULL OR datetime(valid_until) >= datetime('now'))
    AND (max_uses IS NULL OR used_count < max_uses)
  `).get((code || '').toUpperCase());

  const cart = getCart(req);

  if (!coupon) {
    req.session.flash = { type: 'error', message: '優惠碼無效或已過期' };
    return res.redirect('/cart');
  }

  if (coupon.min_order && cart.subtotal < coupon.min_order) {
    req.session.flash = { type: 'error', message: `訂單需滿 ${coupon.min_order} 才能使用此優惠碼` };
    return res.redirect('/cart');
  }

  cart.coupon = coupon;
  req.session.flash = { type: 'success', message: '優惠碼已套用 🐻' };
  res.redirect('/cart');
});

// Remove coupon
router.post('/coupon/remove', (req, res) => {
  const cart = getCart(req);
  cart.coupon = null;
  res.redirect('/cart');
});

module.exports = router;