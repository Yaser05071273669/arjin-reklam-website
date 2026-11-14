/* ARJİN REKLAM · Multi-step quote request: no backend, no price calculations.
   The visitor explicitly sends the prefilled request through WhatsApp. */
(() => {
  'use strict';
  const form = document.getElementById('professional-quote');
  if (!form) return;
  const get = s => form.querySelector(s);
  const steps = [...form.querySelectorAll('.quote-step')];
  const service = get('#q-service');
  const next = get('#quote-next');
  const prev = get('#quote-prev');
  const send = get('#quote-send');
  const errors = get('#quote-errors');
  const unknown = get('#q-unknown-measure');
  const summary = get('#quote-summary');
  const fallback = get('#quote-fallback');
  const manual = get('#quote-manual-link');
  const copy = get('#quote-copy-message');
  let step = 1;
  let currentMessage = '';
  const stepNames = ['Hizmet seçimi','Ölçü ve teknik bilgiler','Tasarım ve montaj','İletişim ve gönderim'];
  const serviceLabels = {
    tabela: 'Tabela Sistemleri / Türü Belirlenmedi', isikli: 'Işıklı / LED Tabela',
    isiksiz: 'Işıksız Tabela', kutu: 'Kutu Harf',
    baski: 'Dijital Baskı / Branda / Folyo', arac: 'Araç Giydirme',
    totem: 'Totem / Yönlendirme Tabelası', ic: 'İç Mekân / Neon / Dekoratif',
    uygulama: 'Reklam / Vitrin Uygulamaları', diger: 'Diğer / Emin Değilim'
  };
  const param = new URLSearchParams(window.location.search).get('service');
  const serviceAliases = {led:'isikli',tabela:'tabela',baski:'baski',kutu:'kutu',arac:'arac',uygulama:'uygulama',isiksiz:'isiksiz',totem:'totem',ic:'ic',diger:'diger'};
  if (param && serviceAliases[param]) service.value=serviceAliases[param];
  function field(name) {return get(`[name="${name}"]`);}
  function value(name) {const el=field(name); return el && !el.disabled ? String(el.value||'').trim() : '';}
  function showConditions() {
    const chosen=service.value;
    form.querySelectorAll('[data-service-scope]').forEach(box=>{
      const visible=box.dataset.serviceScope.split(' ').includes(chosen);
      box.hidden=!visible;
      box.querySelectorAll('input, select, textarea').forEach(el=>{el.disabled=!visible;});
    });
  }
  service.addEventListener('change',()=>{showConditions();errors.textContent='';});
  unknown.addEventListener('change',()=>{
    ['width','height'].forEach(n=>{
      const el=field(n);el.disabled=unknown.checked;
      if(unknown.checked)el.value='';
    });
  });
  function line(lines,title,text) {if(text && text.trim())lines.push(`${title}: ${text.trim()}`);}
  function createMessage() {
    const lines=['ARJİN REKLAM – YENİ TEKLİF TALEBİ','','HİZMET'];
    line(lines,'Hizmet',serviceLabels[service.value] || 'Belirtilmedi');
    lines.push('', 'ÖLÇÜ VE TEKNİK DETAYLAR');
    const w=value('width'),h=value('height');
    if(unknown.checked) lines.push('Ölçü: Henüz belli değil, destek istiyorum');
    else if(w || h) lines.push(`Ölçü (cm): En ${w || '?'} × Boy ${h || '?'}`);
    line(lines,'Adet',value('quantity'));
    const opt={colors:'Renkler',sign_material:'Tabela malzemesi',lighting:'Aydınlatma',letter_height:'Harf yüksekliği (cm)',totem_kind:'Totem türü',print_type:'Baskı/kaplama türü',finishing:'Baskı sonrası işlem',vehicle_model:'Araç marka/model',vehicle_year:'Araç model yılı',vehicle_wrap:'Araç kaplama alanı',interior_kind:'İç mekân türü'};
    for (const [name,title] of Object.entries(opt)) line(lines,title,value(name));
    lines.push('','TASARIM VE MONTAJ');
    for(const [name,title] of Object.entries({design_status:'Tasarım durumu',installation:'Montaj',location:'Konum',timeline:'İstenen zaman',reference_link:'Tasarım/fotoğraf linki',details:'Proje açıklaması'}))line(lines,title,value(name));
    lines.push('','MÜŞTERİ İLETİŞİM');
    for(const [name,title] of Object.entries({customer_name:'Ad Soyad',customer_company:'Firma',customer_phone:'Telefon',customer_email:'E-posta'}))line(lines,title,value(name));
    lines.push('','Not: Varsa logo, fotoğraf veya PDF dosyamı WhatsApp mesajına ayrıca ekleyeceğim. Fiyat ve teknik detaylar firma tarafından değerlendirilecektir.');
    return lines.join('\n');
  }
  function validateVisible() {
    if(step===1 && !service.value){errors.textContent='Lütfen bir hizmet seçin.'; service.focus();return false;}
    const inputs=[...steps[step-1].querySelectorAll('input,select,textarea')];
    for(const el of inputs) {
      if(el.disabled || el.closest('[hidden]')) continue;
      if (!el.checkValidity()) {el.reportValidity();errors.textContent='Lütfen işaretli alanları kontrol edin.';return false;}
    }
    if(step===4 && value('customer_phone').replace(/\D/g,'').length<10){
      errors.textContent='Lütfen geçerli bir telefon numarası yazın.';field('customer_phone').focus();return false;
    }
    errors.textContent=''; return true;
  }
  function showStep(number) {
    step=Math.max(1,Math.min(4,number));
    steps.forEach((el,i)=>el.hidden=i!==step-1);
    document.getElementById('quote-step-label').textContent=`Adım ${step} / 4`;
    document.getElementById('quote-progress-label').textContent=stepNames[step-1];
    document.getElementById('quote-progress-bar').style.width=(step*25)+'%';
    prev.hidden=step===1;
    next.hidden=step===4;
    send.hidden=step!==4;
    errors.textContent='';
    if(step===4){currentMessage=createMessage();summary.textContent=currentMessage;fallback.hidden=true;}
    document.querySelector('.quote-form-card').scrollIntoView({behavior:'smooth',block:'start'});
  }
  next.addEventListener('click',()=>{if(validateVisible())showStep(step+1);});
  prev.addEventListener('click',()=>showStep(step-1));
  form.addEventListener('submit',e=>{e.preventDefault();if(step<4){if(validateVisible())showStep(step+1);}else send.click();});
  send.addEventListener('click',()=>{
    if(!validateVisible())return;
    currentMessage=createMessage();summary.textContent=currentMessage;
    const url=`https://wa.me/905437447347?text=${encodeURIComponent(currentMessage)}`;
    manual.href=url;
    fallback.hidden=false;
    // This click is an explicit gesture by the customer; WhatsApp still requires pressing Send.
    const opened=window.open(url,'_blank');
    if(opened){opened.opener=null;errors.textContent='WhatsApp açıldı. Mesajı göndermek için WhatsApp içindeki Gönder düğmesine basın.';}
    else {errors.textContent='WhatsApp yeni sekmede açılmadı. Aşağıdaki bağlantıyı kullanın.';}
  });
  form.addEventListener('input', () => {
    if (step === 4) { currentMessage=createMessage(); summary.textContent=currentMessage; }
  });
  copy.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(currentMessage);errors.textContent='Talep metni kopyalandı.';}
    catch(e){errors.textContent='Kopyalama engellendi. Yukarıdaki özeti seçerek kopyalayabilirsiniz.';}
  });
  showConditions();
  // Do not auto-scroll when entering the page from a service link.
  steps.forEach((el,i)=>el.hidden=i!==0);
  document.getElementById('quote-step-label').textContent='Adım 1 / 4';
})();
