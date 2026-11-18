/* Dinamik fotoğraflar, mevcut 338 statik kartı bozmaz. */
(() => {
  'use strict';
  const config = window.ARJIN_PHOTO_CONFIG;
  const grid = document.querySelector('#real-project-grid');
  if (!grid || !config || !window.supabase || !/^https:\/\//.test(config.url) || !config.publishableKey.startsWith('sb_publishable_')) return;
  const labels = {
    led:'Işıklı & LED Tabela', kutu:'Kutu Harf & Cephe', baski:'Dijital Baskı & Giydirme',
    arac:'Araç Giydirme', yon:'Totem & Yönlendirme', ic:'İç Mekân & Dekoratif', diger:'Diğer Reklam Çalışmaları'
  };
  const client = window.supabase.createClient(config.url, config.publishableKey);
  const staticCards = [...grid.querySelectorAll('.photo-card')];
  staticCards.forEach((card,i) => {card.dataset.cmsId = `static-${String(i+1).padStart(4,'0')}`;});
  const publicUrl = path => client.storage.from(config.bucket).getPublicUrl(path).data.publicUrl;
  const elem = (name,cls,txt) => {const el=document.createElement(name);if(cls)el.className=cls;if(txt!==undefined)el.textContent=txt;return el;};
  function applyPhoto(card,entry) {
    card.dataset.category = entry.category;
    card.querySelector('.photo-meta span').textContent = labels[entry.category] || labels.diger;
    const a=card.querySelector('.photo-frame'), img=a.querySelector('img');
    if(entry.image_path) {a.href=publicUrl(entry.image_path);img.src=publicUrl(entry.thumb_path||entry.image_path);}
    if(entry.alt_text)img.alt=entry.alt_text;
    a.setAttribute('aria-label', `${labels[entry.category]} fotoğrafını büyüt`);
    const bg=a.querySelector('.photo-backdrop');
    if(bg) { bg.removeAttribute('data-bg');bg.style.backgroundImage=`url("${img.src.replace(/"/g,'%22')}")`; }
  }
  function createCard(entry) {
    const card=elem('article','project-card photo-card');card.dataset.category=entry.category;card.dataset.cmsId=entry.id;
    const anchor=elem('a','photo-frame');anchor.href=publicUrl(entry.image_path);
    anchor.setAttribute('aria-label',`${labels[entry.category]||'Proje'} fotoğrafını büyüt`);
    const bg=elem('span','photo-backdrop');bg.setAttribute('aria-hidden','true');bg.style.backgroundImage=`url("${publicUrl(entry.thumb_path||entry.image_path)}")`;
    const img=elem('img'); img.src=publicUrl(entry.thumb_path||entry.image_path);img.alt=entry.alt_text||`${labels[entry.category]} uygulama fotoğrafı`;img.loading='lazy';img.decoding='async';
    const zoom=elem('span','photo-zoom','↗ Büyüt');zoom.setAttribute('aria-hidden','true');
    anchor.append(bg,img,zoom);const meta=elem('div','photo-meta');meta.append(elem('span','',labels[entry.category]||labels.diger));card.append(anchor,meta);return card;
  }
  function refreshCounts() {
    const cards=[...grid.querySelectorAll('.photo-card')];const tally={all:cards.length};
    cards.forEach(card=>{tally[card.dataset.category]=(tally[card.dataset.category]||0)+1;});
    document.querySelectorAll('.real-filter-row .filter-btn').forEach(btn=>{const count=btn.querySelector('.filter-total');if(count)count.textContent=String(tally[btn.dataset.filter]||0);});
    document.querySelectorAll('.projects-counter strong').forEach(el=>el.textContent=String(cards.length));
    const selected=document.querySelector('.real-filter-row .filter-btn.active')||document.querySelector('.real-filter-row .filter-btn[data-filter="all"]');
    if(selected) selected.click();
    else {const results=document.getElementById('gallery-results');if(results)results.textContent=`${cards.length} fotoğraf gösteriliyor`;}
  }
  async function load() {
    const {data,error}=await client.from('arjin_photo_changes').select('id,legacy_id,category,image_path,thumb_path,alt_text,hidden').order('created_at',{ascending:true});
    if(error)throw error;
    const originals=new Map(staticCards.map(el=>[el.dataset.cmsId,el]));
    for(const edit of (data||[])) {
      if(edit.legacy_id) {
        const card=originals.get(edit.legacy_id);if(!card)continue;
        if(edit.hidden){card.remove();continue;}applyPhoto(card,edit);
      } else if(!edit.hidden && edit.image_path && labels[edit.category]) grid.append(createCard(edit));
    }
    refreshCounts();
  }
  load().catch(err=>{console.warn('Fotoğraf güncellemeleri yüklenemedi; orijinal galeri korunuyor.',err);});
})();
