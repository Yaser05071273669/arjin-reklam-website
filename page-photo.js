/* Arjin Reklam fotoğraf alanları: ana sayfa / hizmetler güncelleme. */
(() => {
  'use strict';
  const config = window.ARJIN_PHOTO_CONFIG;
  const path = decodeURIComponent(location.pathname).toLowerCase();
  const page = path.endsWith('/hizmetler.html') || path.endsWith('/hizmetler/') ? 'services' : 'home';
  const photos = [...document.querySelectorAll('.service-grid .service-card .service-photo')].slice(0, 6);
  if (!config || !config.url || !config.publishableKey || !window.supabase) {
    console.warn('Arjin fotoğraf bağlantısı henüz yüklenmedi.');
    return;
  }
  if (photos.length !== 6) {
    console.warn('Arjin: Bu sayfada 6 hizmet görseli bulunamadı.', photos.length);
    return;
  }
  const client = window.supabase.createClient(config.url, config.publishableKey);
  (async () => {
    const { data, error } = await client.from('arjin_page_photos')
      .select('page_type,slot_key,image_path,alt_text,updated_at')
      .eq('page_type', page);
    if (error) {
      console.warn('Arjin: Hizmet fotoğrafları alınamadı:', error.message);
      return;
    }
    for (const item of (data || [])) {
      const match = /^service-0?([1-6])$/.exec(item.slot_key || '');
      if (!match || !item.image_path) continue;
      const img = photos[Number(match[1]) - 1];
      const publicUrl = client.storage.from(config.bucket).getPublicUrl(item.image_path).data.publicUrl;
      if (!publicUrl) continue;
      // The original HTML uses srcset; it must be removed to allow the new src to appear.
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      img.setAttribute('src', publicUrl);
      if (item.alt_text) img.setAttribute('alt', item.alt_text);
      const box = img.closest('.service-visual');
      if (box) box.style.setProperty('--service-photo', `url("${publicUrl.replace(/"/g,'%22')}")`);
    }
    console.info(`Arjin ${page}: ${(data || []).length} fotoğraf değişikliği yüklendi.`);
  })().catch(error => console.warn('Arjin fotoğraf yükleme hatası:', error));
})();
