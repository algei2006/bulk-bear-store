// Main server file - 批發熊 Bulk Bear E-commerce
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const { customAlphabet } = require('nanoid');

const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;
const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 10);

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Security & utilities
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '7d'
}));

// Sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'bulk-bear-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// Make user data available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.cart = req.session.cart || { items: [], subtotal: 0 };
  res.locals.cartCount = (req.session.cart?.items || []).reduce((sum, i) => sum + i.qty, 0);
  res.locals.store = {
    name: process.env.STORE_NAME || '批發熊 Bulk Bear',
    tagline: process.env.STORE_TAGLINE || 'Save More, Smile More',
    currency: process.env.STORE_CURRENCY_SYMBOL || 'HK$'
  };
  res.locals.path = req.path;
  res.locals.query = req.query;
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// Routes
app.use('/', require('./routes/shop'));
app.use('/cart', require('./routes/cart'));
app.use('/checkout', require('./routes/checkout'));
app.use('/auth', require('./routes/auth'));
app.use('/user', require('./routes/user'));
app.use('/api', require('./routes/api'));
app.use('/admin', require('./routes/admin'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - 找不到頁面',
    message: '您要找嘅頁面唔存在 🐻'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', {
    title: '500 - 系統錯誤',
    message: '系統出現問題，請稍後再試'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🐻 批發熊 Bulk Bear running at http://localhost:${PORT}`);
  console.log(`   Admin: http://localhost:${PORT}/admin/login`);
  console.log(`   Default admin: ${process.env.ADMIN_EMAIL}`);
});