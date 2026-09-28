// Authentication middleware
function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: '請先登入' };
    return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/admin/login');
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).render('error', {
      title: '403 - 權限不足',
      message: '您沒有權限訪問此頁面'
    });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };