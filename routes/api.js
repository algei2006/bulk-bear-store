// JSON API endpoints (for AJAX/PWA)
const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Calculate shipping for a district
router.get('/shipping/:districtId', (req, res) => {
  const zone = db.prepare(`
    SELECT * FROM shipping_zones
    WHERE districts LIKE ? AND active = 1
    LIMIT 1
  `).get(`%${req.params.districtId}%`);

  if (!zone) return res.json({ error: 'no_shipping_zone' });

  const subtotal = parseFloat(req.query.subtotal) || 0;
  const fee = zone.free_threshold && subtotal >= zone.free_threshold ? 0 : zone.fee;

  res.json({
    zone_id: zone.id,
    name: zone.name,
    fee,
    estimated_days: zone.estimated_days,
    free_shipping: fee === 0
  });
});

// Validate coupon
router.post('/coupon/validate', (req, res) => {
  const { code, subtotal } = req.body;
  const coupon = db.prepare(`
    SELECT * FROM coupons
    WHERE code = ? AND active = 1
    AND (valid_from IS NULL OR datetime(valid_from) <= datetime('now'))
    AND (valid_until IS NULL OR datetime(valid_until) >= datetime('now'))
    AND (max_uses IS NULL OR used_count < max_uses)
  `).get((code || '').toUpperCase());

  if (!coupon) return res.json({ valid: false, error: '無效的優惠碼' });
  if (coupon.min_order && subtotal < coupon.min_order) {
    return res.json({ valid: false, error: `訂單需滿 ${coupon.min_order}` });
  }

  let discount = coupon.type === 'percentage'
    ? subtotal * (coupon.value / 100)
    : coupon.value;

  res.json({
    valid: true,
    code: coupon.code,
    description: coupon.description,
    discount: Math.min(discount, subtotal),
    type: coupon.type
  });
});

// Product quick view (JSON)
router.get('/product/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'not_found' });
  res.json(product);
});

// Live cart count
router.get('/cart/count', (req, res) => {
  const count = (req.session.cart?.items || []).reduce((s, i) => s + i.qty, 0);
  res.json({ count });
});

module.exports = router;