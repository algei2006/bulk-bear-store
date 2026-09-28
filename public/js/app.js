// Bulk Bear - Main App JS
(function() {
  'use strict';

  // Auto-dismiss flash messages
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      document.querySelectorAll('.flash').forEach(f => {
        f.style.transition = 'opacity 0.3s';
        f.style.opacity = '0';
        setTimeout(() => f.remove(), 300);
      });
    }, 4000);
  });

  // Smooth scroll for anchors
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });

  // Add to cart with loading state
  document.querySelectorAll('form[action="/cart/add"]').forEach(form => {
    form.addEventListener('submit', e => {
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = '加入中...';
      }
    });
  });

  // Quantity +/- buttons
  window.qtyChange = function(delta) {
    const input = document.getElementById('qtyInput');
    if (!input) return;
    const newVal = Math.max(parseInt(input.min) || 1, Math.min(parseInt(input.max) || 9999, (parseInt(input.value) || 1) + delta));
    input.value = newVal;
  };

  // Confirm before delete
  document.querySelectorAll('form[data-confirm]').forEach(form => {
    form.addEventListener('submit', e => {
      if (!confirm(form.dataset.confirm)) e.preventDefault();
    });
  });

  // Format prices
  document.querySelectorAll('[data-price]').forEach(el => {
    const val = parseFloat(el.dataset.price);
    el.textContent = val.toFixed(2);
  });

  // Add stagger animation to product grid
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  });

  document.querySelectorAll('.product-card, .category-card').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 0.4s ease ${i * 0.05}s, transform 0.4s ease ${i * 0.05}s`;
    observer.observe(el);
  });
})();