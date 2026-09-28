// Pricing helper for tiered wholesale prices
function getUnitPrice(product, qty) {
  let price = product.price;
  if (product.tier3_qty && qty >= product.tier3_qty && product.tier3_price) {
    price = product.tier3_price;
  } else if (product.tier2_qty && qty >= product.tier2_qty && product.tier2_price) {
    price = product.tier2_price;
  } else if (product.wholesale_price && product.min_wholesale_qty && qty >= product.min_wholesale_qty) {
    price = product.wholesale_price;
  }
  return price;
}

function getPriceTiers(product) {
  const tiers = [{ qty: 1, price: product.price, label: '原價' }];
  if (product.min_wholesale_qty && product.wholesale_price) {
    tiers.push({
      qty: product.min_wholesale_qty,
      price: product.wholesale_price,
      label: `批發價 (${product.min_wholesale_qty}+)`
    });
  }
  if (product.tier2_qty && product.tier2_price) {
    tiers.push({
      qty: product.tier2_qty,
      price: product.tier2_price,
      label: `大量批發 (${product.tier2_qty}+)`
    });
  }
  if (product.tier3_qty && product.tier3_price) {
    tiers.push({
      qty: product.tier3_qty,
      price: product.tier3_price,
      label: `企業批發 (${product.tier3_qty}+)`
    });
  }
  return tiers;
}

module.exports = { getUnitPrice, getPriceTiers };