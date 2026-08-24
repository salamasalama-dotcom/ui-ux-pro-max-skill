let PRODUCTS = [];

window.PRODUCTS_READY = (async () => {
  try {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    PRODUCTS = data || [];
  } catch (err) {
    console.error('Ürünler yüklenemedi:', err.message || err);
    PRODUCTS = [];
  }
  return PRODUCTS;
})();
