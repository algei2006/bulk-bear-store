// Authentication routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { customAlphabet } = require('nanoid');
const db = require('../db/database');

const codeGen = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

// Login
router.get('/login', (req, res) => {
  res.render('auth/login', {
    title: '登入',
    redirect: req.query.redirect || ''
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.render('auth/login', {
      title: '登入',
      error: '電郵或密碼錯誤',
      email,
      redirect: req.body.redirect || ''
    });
  }

  req.session.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    referral_code: user.referral_code
  };

  if (user.role === 'admin') {
    return res.redirect('/admin');
  }
  res.redirect(req.body.redirect || '/user');
});

// Register
router.get('/register', (req, res) => {
  res.render('auth/register', {
    title: '註冊',
    referralCode: req.session.referralCode || req.query.ref || ''
  });
});

router.post('/register', async (req, res) => {
  const { email, password, name, phone, referralCode } = req.body;

  if (!email || !password || !name) {
    return res.render('auth/register', {
      title: '註冊',
      error: '請填寫所有必填欄位',
      form: req.body
    });
  }

  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    return res.render('auth/register', {
      title: '註冊',
      error: '此電郵已被註冊',
      form: req.body
    });
  }

  const hashed = bcrypt.hashSync(password, 10);
  const myReferralCode = codeGen();
  let referredBy = null;

  if (referralCode) {
    const referrer = db.prepare('SELECT id FROM users WHERE referral_code = ?').get(referralCode.toUpperCase());
    if (referrer) referredBy = referrer.id;
  }

  const result = db.prepare(`
    INSERT INTO users (email, password, name, phone, role, referral_code, referred_by)
    VALUES (?, ?, ?, ?, 'customer', ?, ?)
  `).run(email, hashed, name, phone || null, myReferralCode, referredBy);

  req.session.user = {
    id: result.lastInsertRowid,
    email,
    name,
    role: 'customer',
    referral_code: myReferralCode
  };

  req.session.flash = { type: 'success', message: '註冊成功！歡迎加入批發熊 🐻' };
  res.redirect('/user');
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;