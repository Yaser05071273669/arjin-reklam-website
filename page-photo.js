/* Arjin Reklam: sadece altı hizmet kartındaki fotoğraflara güvenli Supabase overrides uygular. */
(() => {
  'use strict';
  const cfg=window.ARJIN_PHOTO_CONFIG;
  const page=location.pathname.split('/').pop()==='hizmetler.html'?'services':'home';
  if (!cfg||!window.supabase||!cfg.publishableKey) return;
  const imgs=[...document.querySelectorAll('.service-photo')].slice(0,6);
  if (imgs.length!==6) return;
  const client=window.supabase.createClient(cfg.url,cfg.publishableKey);
  client.from('arjin_page_photos').select('slot_key,image_path,alt_text').eq('page_type',page).then(({data,error})=>{
    if(error){console.warn('Sayfa görsel değişiklikleri yüklenemedi:',error.message);return;}
    for(const item of data||[]){
      const i=Number(item.slot_key?.replace('service-',''))-1;
      if(!Number.isInteger(i)||i<0||i>=6||!item.image_path)continue;
      const img=imgs[i],src=client.storage.from(cfg.bucket).getPublicUrl(item.image_path).data.publicUrl;
      // srcset must be removed so browser does not keep rendering the old image.
      img.removeAttribute('srcset');img.removeAttribute('sizes');img.src=src;
      if(item.alt_text)img.alt=item.alt_text;
      const visual=img.closest('.service-visual');
      if(visual)visual.style.setProperty('--service-photo',`url("${src.replace(/"/g,'%22')}")`);
    }
  });
})();
