/* Arjin Reklam: yönetici paneli. Yetki istemciye değil Supabase RLS politikalarına bağlıdır. */
(async () => {
  'use strict';
  const q = id => document.getElementById(id);
  const cfg = window.ARJIN_PHOTO_CONFIG;
  const names = {led:'Işıklı & LED Tabela',kutu:'Kutu Harf & Cephe',baski:'Dijital Baskı & Giydirme',arac:'Araç Giydirme',yon:'Totem & Yönlendirme',ic:'İç Mekân & Dekoratif',diger:'Diğer Reklam Çalışmaları'};
  const configured = cfg && window.supabase && /^https:\/\//.test(cfg.url) && cfg.publishableKey.startsWith('sb_publishable_');
  if(!configured){q('config-panel').hidden=false;return;}
  const client=window.supabase.createClient(cfg.url,cfg.publishableKey);
  const options=(includeAll=false)=>`${includeAll?'<option value="all">Tüm kategoriler</option>':''}`+Object.entries(names).map(([id,label])=>`<option value="${id}">${label}</option>`).join('');
  q('upload-category').innerHTML=options();q('category-filter').innerHTML=options(true);
  let entries=[], original=[], overrides=new Map(), viewCount=30, busy=false;
  const url = path => client.storage.from(cfg.bucket).getPublicUrl(path).data.publicUrl;
  function notice(message,error=false){const el=q('notice');el.hidden=false;el.textContent=message;el.className=`notice ${error?'error':'ok'}`;el.scrollIntoView({block:'nearest',behavior:'smooth'});}
  const setBusy=v=>{busy=v;q('upload-button').disabled=v;};
  const showLogin=()=>{q('login-panel').hidden=false;q('manage-panel').hidden=true;};
  const showManager=()=>{q('login-panel').hidden=true;q('manage-panel').hidden=false;};
  function parseOriginal(html){
    const doc=new DOMParser().parseFromString(html,'text/html');
    return [...doc.querySelectorAll('#real-project-grid .photo-card')].map((el,i)=>({
      key:`static-${String(i+1).padStart(4,'0')}`, legacy_id:`static-${String(i+1).padStart(4,'0')}`, category:el.dataset.category,
      thumb:el.querySelector('.photo-frame img')?.getAttribute('src'),full:el.querySelector('.photo-frame')?.getAttribute('href'),
      alt_text:el.querySelector('.photo-frame img')?.getAttribute('alt')||'',id:null,image_path:null,thumb_path:null,hidden:false
    }));
  }
  function merged(){
    const base=original.map(row=>{
      const change=overrides.get(row.key);return change?{...row,...change,key:row.key,full:change.image_path?url(change.image_path):row.full,thumb:change.thumb_path?url(change.thumb_path):(change.image_path?url(change.image_path):row.thumb)}:row;
    });
    const added=entries.filter(e=>!e.legacy_id).map(e=>({...e,key:e.id,full:url(e.image_path),thumb:url(e.thumb_path||e.image_path)}));
    return [...added.reverse(),...base];
  }
  async function loadData(){
    const [htmlRes,dbRes]=await Promise.all([fetch('projeler.html',{cache:'no-store'}),client.from('arjin_photo_changes').select('*').order('created_at',{ascending:true})]);
    if(!htmlRes.ok)throw new Error('projeler.html yüklenemedi. Paneli Netlify veya Live Server üzerinden açın.');
    if(dbRes.error)throw dbRes.error;
    original=parseOriginal(await htmlRes.text());entries=dbRes.data||[];
    overrides=new Map(entries.filter(e=>e.legacy_id).map(e=>[e.legacy_id,e]));
    render();
  }
  function render(){
    const all=merged();const needle=q('photo-search').value.trim().toLocaleLowerCase('tr');const filter=q('category-filter').value;const showHidden=q('show-hidden').checked;
    const filtered=all.filter(x=>(filter==='all'||x.category===filter)&&(showHidden||!x.hidden)&&(`${x.key} ${x.alt_text||''} ${names[x.category]||''}`.toLocaleLowerCase('tr').includes(needle)));
    q('photo-stats').textContent=`${all.filter(x=>!x.hidden).length} aktif fotoğraf · ${all.filter(x=>x.hidden).length} kaldırılmış · ${filtered.length} sonuç`;
    q('admin-cards').replaceChildren();const fragment=document.createDocumentFragment();
    for(const x of filtered.slice(0,viewCount)){
      const card=document.createElement('article');card.className='card'+(x.hidden?' hidden-photo':'');
      const img=document.createElement('img');img.src=x.thumb;img.alt=x.alt_text||'Proje fotoğrafı';img.loading='lazy';
      const body=document.createElement('div');body.className='cardbody';
      const title=document.createElement('div');title.className='cardtitle';title.textContent=x.legacy_id?`Eski fotoğraf #${x.legacy_id.slice(7)}`:'Yeni eklenen fotoğraf';
      const label=document.createElement('label');label.textContent='Kategori';const select=document.createElement('select');select.innerHTML=options();select.value=x.category;label.append(select);
      const action=document.createElement('div');action.className='card-actions';
      const save=document.createElement('button');save.className='secondary';save.textContent='Kategoriyi Kaydet';save.onclick=()=>update(x,{category:select.value});
      const replace=document.createElement('button');replace.className='secondary';replace.textContent='Fotoğrafı Değiştir';replace.onclick=()=>{const picker=document.createElement('input');picker.type='file';picker.accept='image/jpeg,image/png,image/webp,image/heic,image/heif';picker.onchange=async()=>{if(picker.files?.[0])await update(x,{},picker.files[0]);};picker.click();};
      const hide=document.createElement('button');hide.className=x.hidden?'secondary':'danger';hide.textContent=x.hidden?'Geri Yükle':'Kaldır';hide.onclick=async()=>{
        if(x.legacy_id){if(!x.hidden&&!confirm('Bu fotoğraf sitedeki galeriden kaldırılsın mı? Orijinal dosya GitHub\'da kalır.'))return;await update(x,{hidden:!x.hidden});}
        else {if(!confirm('Bu yeni fotoğraf kalıcı olarak silinsin mi?'))return;await removeNew(x);}
      };
      action.append(save,replace,hide);body.append(title,label,action);card.append(img,body);fragment.append(card);
    }
    q('admin-cards').append(fragment);
    q('more-bar').hidden=filtered.length<=viewCount;
  }
  async function assertAdmin(){const {data,error}=await client.rpc('arjin_is_photo_admin');if(error)throw error;if(data!==true)throw new Error('Bu kullanıcı fotoğraf yönetimi için yetkilendirilmemiş.');}
  async function compress(file,maxW,quality){
    if(file.size>15*1024*1024)throw new Error(`${file.name}: 15 MB sınırı aşıldı.`);
    let bitmap;
    try{bitmap=await createImageBitmap(file);}catch{throw new Error(`${file.name}: tarayıcı bu fotoğraf biçimini açamıyor. JPEG/PNG deneyin.`);}
    const scale=Math.min(1,maxW/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
    if(!blob||blob.type!=='image/webp')throw new Error('Tarayıcı WebP dönüştürmeyi desteklemiyor.');
    return blob;
  }
  async function uploadPhoto(file){
    if(!/^image\//.test(file.type))throw new Error('Yalnızca fotoğraf dosyaları seçilebilir.');
    const uid=crypto.randomUUID();const full=`gallery/${uid}-full.webp`,thumb=`gallery/${uid}-thumb.webp`;
    const fullBlob=await compress(file,1600,.84),thumbBlob=await compress(file,650,.78);const done=[];
    try{
      for(const [path,blob] of [[full,fullBlob],[thumb,thumbBlob]]){
        const {error}=await client.storage.from(cfg.bucket).upload(path,blob,{contentType:'image/webp',cacheControl:'3600',upsert:false});if(error)throw error;done.push(path);
      }
      return {image_path:full,thumb_path:thumb};
    }catch(err){if(done.length)await client.storage.from(cfg.bucket).remove(done);throw err;}
  }
  async function update(item,fields,file){
    if(busy)return;setBusy(true);let paths=null,saved=false;
    try{
      if(file)paths=await uploadPhoto(file);
      const data={category:item.category,hidden:item.hidden,alt_text:item.alt_text||'',image_path:item.image_path,thumb_path:item.thumb_path,...fields,...(paths||{})};
      if(item.legacy_id)data.legacy_id=item.legacy_id;
      const query=item.id?client.from('arjin_photo_changes').update(data).eq('id',item.id):client.from('arjin_photo_changes').upsert(data,{onConflict:'legacy_id'});
      const {error}=await query;if(error)throw error;saved=true;
      // Only remove previous managed Supabase blobs, never original static assets.
      if(paths&&item.image_path){client.storage.from(cfg.bucket).remove([item.image_path,item.thumb_path].filter(Boolean)).catch(console.warn);}
      await loadData();notice(file?'Fotoğraf değiştirildi.':'Değişiklik kaydedildi.');
    }catch(err){if(paths&&!saved)await client.storage.from(cfg.bucket).remove([paths.image_path,paths.thumb_path]).catch(()=>{});notice(err.message||String(err),true);}
    finally{setBusy(false);}
  }
  async function removeNew(item){if(busy)return;setBusy(true);try{
    const {error}=await client.from('arjin_photo_changes').delete().eq('id',item.id);if(error)throw error;
    const {error:storageError}=await client.storage.from(cfg.bucket).remove([item.image_path,item.thumb_path].filter(Boolean));
    await loadData();notice(storageError?'Fotoğraf galeriden kaldırıldı. Depolama dosyası temizlenemedi; yöneticiye bildirin.':'Fotoğraf silindi.',!!storageError);
  }catch(err){notice(err.message||String(err),true);}finally{setBusy(false);}}
  q('upload-form').addEventListener('submit',async(e)=>{
    e.preventDefault();if(busy)return;const files=[...q('upload-files').files];if(!files.length)return;
    if(files.length>12){notice('Tek seferde en fazla 12 fotoğraf seçin.',true);return;}
    const category=q('upload-category').value;setBusy(true);let successes=0;
    for(const file of files){let path;
      try{path=await uploadPhoto(file);const {error}=await client.from('arjin_photo_changes').insert({category,...path,alt_text:`${names[category]} uygulama fotoğrafı`,hidden:false});if(error)throw error;successes++;}
      catch(err){if(path)await client.storage.from(cfg.bucket).remove([path.image_path,path.thumb_path]).catch(()=>{});notice(`${file.name}: ${err.message||err}`,true);break;}
    }
    q('upload-files').value='';setBusy(false);await loadData();if(successes)notice(`${successes} fotoğraf başarıyla eklendi.`);
  });
  for(const id of ['category-filter','photo-search','show-hidden'])q(id).addEventListener(id==='photo-search'?'input':'change',()=>{viewCount=30;render();});
  q('load-more').onclick=()=>{viewCount+=30;render();};
  q('login-form').addEventListener('submit',async e=>{e.preventDefault();
    try{const {error}=await client.auth.signInWithPassword({email:q('login-email').value.trim(),password:q('login-password').value});if(error)throw error;
      await assertAdmin();q('login-password').value='';showManager();await loadData();notice('Giriş başarılı.');}
    catch(err){await client.auth.signOut();showLogin();notice(err.message||String(err),true);}
  });
  q('logout').onclick=async()=>{await client.auth.signOut();showLogin();q('notice').hidden=true;};
  try{const {data}=await client.auth.getSession();if(data?.session){await assertAdmin();showManager();await loadData();}else showLogin();}
  catch(err){await client.auth.signOut();showLogin();notice(err.message||String(err),true);}
})();
