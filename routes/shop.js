// Shop routes (public storefront)
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { getUnitPrice, getPriceTiers } = require('../middleware/pricing');

// Home page
router.get('/', (req, res) => {
  const featured = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.featured = 1 AND p.active = 1
    LIMIT 8
  `).all();

  const categories = db.prepare(`
    SELECT * FROM categories WHERE active = 1 ORDER BY sort_order LIMIT 6
  `).all();

  res.render('shop/home', {
    title: '首頁',
    featured,
    categories
  });
});

// Product list
router.get('/products', (req, res) => {
  const { category, q, sort, page } = req.query;
  const limit = 12;
  const offset = ((parseInt(page) || 1) - 1) * limit;

  let where = 'p.active = 1';
  const params = [];

  if (category) {
    where += ' AND c.slug = ?';
    params.push(category);
  }

  if (q) {
    where += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }

  let orderBy = 'p.created_at DESC';
  if (sort === 'price_asc') orderBy = 'p.price ASC';
  else if (sort === 'price_desc') orderBy = 'p.price DESC';
  else if (sort === 'name') orderBy = 'p.name ASC';

  const products = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const total = db.prepare(`
    SELECT COUNT(*) as count
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE ${where}
  `).get(...params).count;

  const categories = db.prepare('SELECT * FROM categories WHERE active = 1').all();

  res.render('shop/list', {
    title: '所有產品',
    products,
    categories,
    category,
    q,
    sort,
    pagination: {
      page: parseInt(page) || 1,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Product detail
router.get('/products/:slug', (req, res) => {
  const product = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.slug = ? AND p.active = 1
  `).get(req.params.slug);

  if (!product) {
    return res.status(404).render('error', {
      title: '找不到產品',
      message: '此產品不存在或已下架'
    });
  }

  const tiers = getPriceTiers(product);
  const related = db.prepare(`
    SELECT * FROM products
    WHERE category_id = ? AND id != ? AND active = 1
    LIMIT 4
  `).all(product.category_id, product.id);

  res.render('shop/detail', {
    title: product.name,
    product,
    tiers,
    related
  });
});

// Category page
router.get('/categories/:slug', (req, res) => {
  res.redirect(`/products?category=${req.params.slug}`);
});

// About
router.get('/about', (req, res) => {
  res.render('shop/about', { title: '關於批發熊' });
});

// Apply referral code (from URL ?ref=XXX)
router.get('/ref/:code', (req, res) => {
  req.session.referralCode = req.params.code;
  res.redirect('/');
});

module.exports = router;