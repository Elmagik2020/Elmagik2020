import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const SUPABASE_URL = 'https://ehswwhonicinexutzruo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bTedgB2z-k0bFylHHRucTw_1nE6eESZ';
const configured = SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('PASTE_') && !SUPABASE_ANON_KEY.includes('PASTE_');
const $ = id => document.getElementById(id);
let supabase = null, currentUser = null;
let settings = { bg:'#031b3b', accent:'#08c9f2', hero:null, featuredWork:null, gallery:[], galleryHashes:[], galleryDisplay:{mode:'grid',desktopColumns:4,tabletColumns:3,mobileColumns:3,imageHeight:160,mobileHeight:110,gap:10,radius:13,fit:'cover'}, content:{} };
let savingSettings = false;
if (configured) {
 supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 await loadPublicData();
 supabase.channel('elmagik-live-site')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => loadPublicData())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => loadPublicData())
  .subscribe();
 supabase.auth.onAuthStateChange((event) => {
  if(event==='PASSWORD_RECOVERY') showPasswordRecovery();
 });
} else {
 const hint = document.querySelector('#reviewForm .hint');
 if (hint) hint.textContent = 'نموذج التقييم سيعمل بعد إكمال ربط قاعدة البيانات.';
}
window.openAdmin = async () => {
 $('admin').classList.add('open');
 if (!configured) { $('loginMsg').textContent='يلزم إعداد مشروع Supabase. راجع ملف SETUP-AR.txt.'; return; }
 const {data:{session}} = await supabase.auth.getSession();
 if(session) await showAdmin();
};
window.closeAdmin = () => $('admin').classList.remove('open');

window.adminSendRecovery = async () => {
 if(!configured)return;
 const entered=$('adminEmail').value.trim();
 const email=resolveAdminEmail(entered);
 if(!email){$('loginMsg').textContent='اكتب البريد الإلكتروني المسجل أو رقم الهاتف المرتبط بحساب المدير أولًا.';return;}
 $('loginMsg').textContent='جارٍ إرسال رابط استعادة كلمة المرور إلى Gmail...';
 const redirectTo=window.location.origin+window.location.pathname;
 const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo});
 $('loginMsg').textContent=error
  ? 'تعذر إرسال رابط الاستعادة. تأكد من إعداد Redirect URLs وحد الإرسال في Supabase، ثم حاول لاحقًا.'
  : 'تم طلب إرسال رابط الاستعادة إلى '+email+'. افتح الرسالة واضغط الرابط، ثم عيّن كلمة مرور جديدة هنا.';
};
function resolveAdminEmail(value){
 const v=String(value||'').trim();
 if(v.includes('@'))return v;
 const digits=v.replace(/\D/g,'');
 // رقم الهاتف المسجل كاختصار للدخول، بينما المصادقة الفعلية تتم بحساب Gmail المرتبط.
 if(['20120489622','0120489622','+20120489622'].includes(digits)||digits==='20120489622')return 'elmagikcool@gmail.com';
 return '';
}
function validNewPassword(a,b){
 if(!a||a.length<8){$('loginMsg').textContent='كلمة المرور يجب ألا تقل عن 8 أحرف.';return false;}
 if(a!==b){$('loginMsg').textContent='تأكيد كلمة المرور غير مطابق.';return false;}
 return true;
}
window.adminSetRecoveredPassword=async()=>{
 const a=$('recoveryPassword').value,b=$('recoveryPasswordConfirm').value;
 if(!validNewPassword(a,b))return;
 $('loginMsg').textContent='جارٍ تحديث كلمة المرور...';
 const {error}=await supabase.auth.updateUser({password:a});
 if(error){$('loginMsg').textContent='تعذر تحديث كلمة المرور: '+error.message;return;}
 $('recoveryPassword').value='';$('recoveryPasswordConfirm').value='';
 await supabase.auth.signOut();
 $('passwordRecovery').classList.add('hide');
 $('adminPanel').classList.add('hide');$('adminLogin').classList.remove('hide');
 $('loginMsg').textContent='تم تحديث كلمة المرور بنجاح. سجّل الدخول بكلمة المرور الجديدة.';
};
window.adminChangePassword=async()=>{
 const a=$('changePassword').value,b=$('changePasswordConfirm').value;
 if(!validNewPassword(a,b))return;
 $('adminMsg').textContent='جارٍ تغيير كلمة المرور...';
 const {error}=await supabase.auth.updateUser({password:a});
 if(error){$('adminMsg').textContent='تعذر تغيير كلمة المرور: '+error.message;return;}
 $('changePassword').value='';$('changePasswordConfirm').value='';
 $('adminMsg').textContent='تم تغيير كلمة مرور المدير بنجاح.';
};
function showPasswordRecovery(){
 $('admin').classList.add('open');
 $('adminPanel').classList.add('hide');
 $('adminLogin').classList.remove('hide');
 $('passwordRecovery').classList.remove('hide');
 $('loginMsg').textContent='تم التحقق من رابط الاستعادة. أدخل كلمة المرور الجديدة.';
}
window.adminSignIn = async () => {
 if(!configured)return;
 $('loginMsg').textContent='جارٍ التحقق...';
 const loginEmail=resolveAdminEmail($('adminEmail').value);
 if(!loginEmail){$('loginMsg').textContent='اكتب البريد الإلكتروني أو رقم الهاتف المسجل للمدير.';return;}
 const {data,error}=await supabase.auth.signInWithPassword({email:loginEmail,password:$('adminPassword').value});
 if(error){$('loginMsg').textContent='تعذر تسجيل الدخول. راجع البريد وكلمة المرور.';return;}
 currentUser=data.user; await showAdmin();
};
window.adminSignOut = async () => {
 await supabase.auth.signOut(); currentUser=null;
 $('adminPanel').classList.add('hide'); $('adminLogin').classList.remove('hide');
 $('passwordRecovery').classList.add('hide');
 $('adminPassword').value='';
};
async function showAdmin(){
 const {data:{user}}=await supabase.auth.getUser(); currentUser=user;
 const {data:admin,error}=await supabase.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();
 if(error||!admin){await supabase.auth.signOut();$('loginMsg').textContent='هذا الحساب غير مصرح له بإدارة الموقع.';return;}
 $('adminLogin').classList.add('hide'); $('adminPanel').classList.remove('hide');
 $('bgColor').value=settings.bg; $('accentColor').value=settings.accent;
 $('editHeroTitle').value=settings.content?.heroTitle || $('siteHeroTitle').innerText;
 $('editPhone').value=settings.content?.phone || '01092909037';
 $('editWhatsApp').value=settings.content?.whatsapp || '201092909037';
 $('editFacebook').value=settings.content?.facebook || 'https://www.facebook.com/profile.php?id=100004365726715';
 $('editAddress').value=settings.content?.address || $('siteAddress').textContent.trim();
 const gd=normalizeGalleryDisplay(settings.galleryDisplay);
 $('galleryMode').value=gd.mode; $('galleryFit').value=gd.fit;
 $('galleryDesktopCols').value=String(gd.desktopColumns); $('galleryTabletCols').value=String(gd.tabletColumns); $('galleryMobileCols').value=String(gd.mobileColumns);
 $('galleryHeight').value=gd.imageHeight; $('galleryHeightMobile').value=gd.mobileHeight; $('galleryGap').value=gd.gap; $('galleryRadius').value=gd.radius;
 const featured=normalizeFeaturedWork(settings.featuredWork);
 featured.forEach((item,i)=>{const n=i+1;$(`featuredTitle${n}`).value=item.title;$(`featuredVisible${n}`).checked=item.visible;$(`featuredPreview${n}`).src=publicUrl(item.image);});
 await renderModeration(); renderGalleryManager();
}
function publicUrl(path){return !path||path.startsWith('assets/')||path.startsWith('http')?path:supabase.storage.from('site-media').getPublicUrl(path).data.publicUrl;}
async function loadPublicData(){
 if(!supabase)return;
 const {data}=await supabase.from('site_settings').select('config').eq('id',1).maybeSingle();
 if(data?.config){settings={...settings,...data.config};settings.featuredWork=normalizeFeaturedWork(settings.featuredWork);applySettings();}else{applySettings();}
 const {data:reviews}=await supabase.from('reviews').select('name,rating,comment,created_at').eq('status','approved').order('created_at',{ascending:false}).limit(100);
 const list=$('reviewList');
 if(list){
  list.innerHTML='';
  (reviews||[]).forEach(r=>{
   const el=document.createElement('article');el.className='review';
   const stars=document.createElement('div');stars.className='stars';stars.textContent='★'.repeat(r.rating)+'☆'.repeat(5-r.rating);
   const p=document.createElement('p');p.textContent=r.comment;
   const b=document.createElement('b');b.textContent=r.name;
   const small=document.createElement('small');small.textContent='عميل';
   el.append(stars,p,b,document.createElement('br'),small);list.append(el);
  });
  const note=document.querySelector('.demo-note');
  if(note) note.textContent=reviews?.length?'آراء العملاء المنشورة بعد مراجعة إدارة الشركة.':'كن أول من يشاركنا رأيه في خدماتنا.';
 }
}
function normalizeGalleryDisplay(value={}){
 const n=(v,d,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(v))?Number(v):d));
 return {mode:['grid','masonry','slider'].includes(value.mode)?value.mode:'grid',fit:['cover','contain'].includes(value.fit)?value.fit:'cover',desktopColumns:n(value.desktopColumns,4,2,6),tabletColumns:n(value.tabletColumns,3,2,4),mobileColumns:n(value.mobileColumns,3,1,4),imageHeight:n(value.imageHeight,160,70,600),mobileHeight:n(value.mobileHeight,110,60,400),gap:n(value.gap,10,0,40),radius:n(value.radius,13,0,40)};
}
function applyGalleryDisplay(){
 const el=$('userGallery'); if(!el)return;
 const d=normalizeGalleryDisplay(settings.galleryDisplay);
 el.classList.remove('gallery-masonry','gallery-slider');
 if(d.mode==='masonry')el.classList.add('gallery-masonry');
 if(d.mode==='slider')el.classList.add('gallery-slider');
 const st=el.style;
 st.setProperty('--gallery-desktop-cols',d.desktopColumns);st.setProperty('--gallery-tablet-cols',d.tabletColumns);st.setProperty('--gallery-mobile-cols',d.mobileColumns);
 st.setProperty('--gallery-height',d.imageHeight+'px');st.setProperty('--gallery-height-mobile',d.mobileHeight+'px');st.setProperty('--gallery-gap',d.gap+'px');st.setProperty('--gallery-radius',d.radius+'px');st.setProperty('--gallery-fit',d.fit);
}
window.previewGallerySettings=()=>{settings.galleryDisplay=readGalleryDisplayControls();applyGalleryDisplay();};
function readGalleryDisplayControls(){return normalizeGalleryDisplay({mode:$('galleryMode').value,fit:$('galleryFit').value,desktopColumns:$('galleryDesktopCols').value,tabletColumns:$('galleryTabletCols').value,mobileColumns:$('galleryMobileCols').value,imageHeight:$('galleryHeight').value,mobileHeight:$('galleryHeightMobile').value,gap:$('galleryGap').value,radius:$('galleryRadius').value});}
function normalizeFeaturedWork(value){
 const defaults=[
  {image:'assets/work-control.jpg',title:'قسم لوحات الكنترول والـ PLC',visible:true},
  {image:'assets/work-install.jpg',title:'فريق الصيانة والتركيبات',visible:true},
  {image:'assets/work-factory.jpg',title:'طوارئ المصانع والمطاعم',visible:true}
 ];
 return defaults.map((d,i)=>{const v=Array.isArray(value)?value[i]:null;return {image:typeof v?.image==='string'&&v.image?v.image:d.image,title:typeof v?.title==='string'?v.title:d.title,visible:typeof v?.visible==='boolean'?v.visible:true};});
}
function renderFeaturedWork(){
 const root=$('featuredGallery');if(!root)return;root.innerHTML='';
 normalizeFeaturedWork(settings.featuredWork).filter(x=>x.visible).forEach(item=>{
  const card=document.createElement('div');card.className='work-card';
  const img=document.createElement('img');img.src=publicUrl(item.image);img.alt=item.title;img.loading='lazy';
  const title=document.createElement('b');title.textContent=item.title;card.append(img,title);root.append(card);
 });
}
function applySettings(){
 document.documentElement.style.setProperty('--bg',settings.bg||'#031b3b');
 document.documentElement.style.setProperty('--cyan',settings.accent||'#08c9f2');
 if(settings.hero) document.querySelector('.hero-photo').style.backgroundImage=`linear-gradient(90deg,transparent 65%,var(--bg) 100%),url("${publicUrl(settings.hero)}")`;
 const c=settings.content||{};
 if(c.heroTitle && $('siteHeroTitle')) $('siteHeroTitle').textContent=c.heroTitle;
 if(c.phone && $('sitePhoneLink')) {$('sitePhoneLink').textContent=c.phone;$('sitePhoneLink').href='tel:'+c.phone.replace(/\s/g,'');}
 if(c.whatsapp && $('siteWhatsAppLink')) {$('siteWhatsAppLink').textContent=c.whatsapp;$('siteWhatsAppLink').href='https://wa.me/'+c.whatsapp.replace(/\D/g,'');}
 if(c.whatsapp){document.querySelectorAll('.float-wa,.nav-actions a[href*="wa.me"]').forEach(a=>a.href='https://wa.me/'+c.whatsapp.replace(/\D/g,''));}
 if(c.facebook){document.querySelectorAll('a[href*="facebook.com"]').forEach(a=>{a.href=c.facebook;a.target='_blank';a.rel='noopener';});}
 if(c.address && $('siteAddress')) $('siteAddress').textContent=c.address;
 settings.gallery=[...new Set(settings.gallery||[])];
 settings.galleryDisplay=normalizeGalleryDisplay(settings.galleryDisplay);
 applyGalleryDisplay();
 renderFeaturedWork();
 if($('userGallery')) {
  $('userGallery').innerHTML='';
  (settings.gallery||[]).forEach(path=>{
   const card=document.createElement('div');card.className='work-card';
   const img=document.createElement('img');img.src=publicUrl(path);img.alt='من أعمال الشركة';img.loading='lazy';
   const b=document.createElement('b');b.textContent='من أعمالنا';card.append(img,b);$('userGallery').append(card);
  });
 }
}
for(let i=1;i<=3;i++){
 const picker=$(`featuredUpload${i}`);
 picker?.addEventListener('change',()=>{const file=picker.files?.[0];if(file)$(`featuredPreview${i}`).src=URL.createObjectURL(file);});
}
$('reviewForm').addEventListener('submit',async e=>{
 e.preventDefault();e.stopImmediatePropagation();
 if(!configured){alert('نموذج التقييم غير مفعل بعد.');return;}
 const item={name:$('reviewName').value.trim(),rating:Number($('reviewRating').value),comment:$('reviewText').value.trim(),status:'pending'};
 const {error}=await supabase.from('reviews').insert(item);
 if(error){alert('تعذر إرسال التقييم الآن. حاول مرة أخرى لاحقًا.');return;}
 e.target.reset();alert('شكرًا لك. وصل تقييمك وسيظهر بعد مراجعته من إدارة الشركة.');
},true);
async function renderModeration(){
 const {data,error}=await supabase.from('reviews').select('id,name,rating,comment,created_at').eq('status','pending').order('created_at',{ascending:false});
 if(error){$('adminMsg').textContent='تعذر تحميل التقييمات الجديدة.';return;}
 $('moderationList').innerHTML='';
 (data||[]).forEach(r=>{
  const card=document.createElement('div');card.className='review';
  const stars=document.createElement('div');stars.className='stars';stars.textContent='★'.repeat(r.rating);
  const p=document.createElement('p');p.textContent=r.comment;
  const b=document.createElement('b');b.textContent=r.name;
  const approve=document.createElement('button');approve.className='btn';approve.textContent='موافقة ونشر';approve.onclick=()=>moderate(r.id,'approved');
  const reject=document.createElement('button');reject.className='btn outline';reject.textContent='رفض';reject.onclick=()=>moderate(r.id,'rejected');
  card.append(stars,p,b,document.createElement('br'),approve,reject);$('moderationList').append(card);
 });
 if(!data?.length)$('moderationList').textContent='لا توجد تقييمات جديدة للمراجعة.';
 const {data:pub}=await supabase.from('reviews').select('id,name,rating,comment').eq('status','approved').order('created_at',{ascending:false}).limit(100);
 $('publishedAdminList').innerHTML='';
 (pub||[]).forEach(r=>{
  const card=document.createElement('div');card.className='review';
  const stars=document.createElement('div');stars.className='stars';stars.textContent='★'.repeat(r.rating);
  const p=document.createElement('p');p.textContent=r.comment;
  const b=document.createElement('b');b.textContent=r.name;
  const del=document.createElement('button');del.className='btn outline';del.textContent='حذف التقييم';del.onclick=()=>deleteReview(r.id);
  card.append(stars,p,b,document.createElement('br'),del);$('publishedAdminList').append(card);
 });
}
async function moderate(id,status){
 const {error}=await supabase.from('reviews').update({status}).eq('id',id);
 if(error){$('adminMsg').textContent='تعذر تحديث حالة التقييم.';return;}
 await renderModeration(); await loadPublicData();
}
async function deleteReview(id){
 if(!confirm('هل تريد حذف هذا التقييم نهائيًا؟'))return;
 const {error}=await supabase.from('reviews').delete().eq('id',id);
 if(error){$('adminMsg').textContent='تعذر حذف التقييم.';return;}
 await renderModeration();await loadPublicData();
}
window.addAdminReview=async()=>{
 if(!currentUser)return;
 const name=$('adminReviewName').value.trim(),comment=$('adminReviewText').value.trim(),rating=Number($('adminReviewRating').value);
 if(!name||!comment){$('adminMsg').textContent='اكتب اسم العميل ونص التقييم أولًا.';return;}
 const {error}=await supabase.from('reviews').insert({name,rating,comment,status:'approved'});
 if(error){$('adminMsg').textContent='تعذر إضافة التقييم. تحقق من صلاحيات الإدارة.';return;}
 $('adminReviewName').value='';$('adminReviewText').value='';
 $('adminMsg').textContent='تم إضافة التقييم ونشره على الموقع.';
 await renderModeration();await loadPublicData();
};
function renderGalleryManager(){
 const root=$('galleryManager');if(!root)return;root.innerHTML='';
 settings.gallery=[...new Set(settings.gallery||[])];
 (settings.gallery||[]).forEach((path,i)=>{
  const item=document.createElement('div');item.className='gallery-admin-item';
  const img=document.createElement('img');img.src=publicUrl(path);img.alt='صورة المعرض';
  const label=document.createElement('small');label.textContent=`صورة ${i+1}`;
  const del=document.createElement('button');del.className='btn outline';del.textContent='حذف الصورة';del.onclick=()=>removeGalleryImage(path);
  item.append(img,label,del);root.append(item);
 });
 if(!(settings.gallery||[]).length)root.textContent='لم تتم إضافة صور بعد.';
}
window.scanGalleryDuplicates=async()=>{
 if(!currentUser)return;
 const paths=[...new Set(settings.gallery||[])];
 if(paths.length<2){$('adminMsg').textContent='لا توجد صور كافية لفحص التكرار.';return;}
 $('adminMsg').textContent=`جارٍ فحص ${paths.length} صورة...`;
 const keep=[],hashes=new Set();let duplicates=0,failed=0;
 for(let i=0;i<paths.length;i++){
  const path=paths[i];
  const {data,error}=await supabase.storage.from('site-media').download(path);
  if(error||!data){keep.push(path);failed++;continue;}
  try{
   const digest=await crypto.subtle.digest('SHA-256',await data.arrayBuffer());
   const hash=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
   if(hashes.has(hash)){duplicates++;continue;}
   hashes.add(hash);keep.push(path);
  }catch{keep.push(path);failed++;}
  $('adminMsg').textContent=`تم فحص ${i+1} من ${paths.length} صورة...`;
 }
 if(!duplicates){settings.gallery=keep;settings.galleryHashes=[...hashes];const saved=await supabase.from('site_settings').update({config:settings,updated_at:new Date().toISOString()}).eq('id',1);if(saved.error){$('adminMsg').textContent='لم يتم العثور على تكرار، لكن تعذر حفظ بصمات الصور.';return;}$('adminMsg').textContent=`لم يتم العثور على صور مكررة، وتم حفظ بصماتها لمنع تكرارها مستقبلًا.${failed?` تعذر فحص ${failed} صورة`:''}`;return;}
 if(!confirm(`تم العثور على ${duplicates} صورة مكررة. هل تريد إخفاء النسخ المكررة من المعرض؟ لن نحذف الملفات من التخزين.`))return;
 settings.gallery=keep;settings.galleryHashes=[...hashes];
 const {error}=await supabase.from('site_settings').update({config:settings,updated_at:new Date().toISOString()}).eq('id',1);
 if(error){$('adminMsg').textContent='تعذر حفظ تنظيف المعرض: '+error.message;return;}
 applySettings();renderGalleryManager();
 $('adminMsg').textContent=`تم تنظيف المعرض وإخفاء ${duplicates} نسخة مكررة. احتفظنا بالملفات الأصلية في التخزين ولم نحذفها.${failed?` تعذر فحص ${failed} صورة وتم الإبقاء عليها`:''}`;
};
async function removeGalleryImage(path){
 if(!currentUser)return;
 if(!confirm('حذف هذه الصورة من معرض الموقع؟'))return;
 const {error}=await supabase.storage.from('site-media').remove([path]);
 if(error){$('adminMsg').textContent='تعذر حذف ملف الصورة من التخزين.';return;}
 settings.gallery=(settings.gallery||[]).filter(x=>x!==path);
 const saved=await supabase.from('site_settings').update({config:settings,updated_at:new Date().toISOString()}).eq('id',1);
 if(saved.error){$('adminMsg').textContent='حذفت الصورة من التخزين لكن تعذر تحديث إعدادات المعرض.';return;}
 applySettings();renderGalleryManager();$('adminMsg').textContent='تم حذف الصورة من المعرض.';
}
window.saveSettings=async()=>{
 if(!currentUser||savingSettings)return;
 savingSettings=true;
 const saveButton=document.querySelector('.admin-actions .btn:not(.outline)');
 if(saveButton)saveButton.disabled=true;
 try{
  $('adminMsg').textContent='جارٍ حفظ التعديلات ورفع الصور...';
  settings.bg=$('bgColor').value;settings.accent=$('accentColor').value;
  settings.galleryDisplay=readGalleryDisplayControls();
  settings.featuredWork=normalizeFeaturedWork(settings.featuredWork).map((item,i)=>({image:item.image,title:$(`featuredTitle${i+1}`).value.trim()||item.title,visible:$(`featuredVisible${i+1}`).checked}));
  settings.content={...(settings.content||{}),heroTitle:$('editHeroTitle').value.trim(),phone:$('editPhone').value.trim(),whatsapp:$('editWhatsApp').value.trim(),facebook:$('editFacebook').value.trim(),address:$('editAddress').value.trim()};
  for(let i=0;i<3;i++){
   const file=$(`featuredUpload${i+1}`).files[0];
   if(!file)continue;
   if(!file.type.startsWith('image/')||file.size>6*1024*1024){$('adminMsg').textContent=`الصورة الرئيسية رقم ${i+1} يجب أن تكون صورة وأقل من 6 ميجابايت.`;return;}
   const path=`featured/${Date.now()}-${i}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
   const up=await supabase.storage.from('site-media').upload(path,file,{upsert:false,contentType:file.type});
   if(up.error){$('adminMsg').textContent=`تعذر رفع الصورة الرئيسية رقم ${i+1}: ${up.error.message}`;return;}
   settings.featuredWork[i].image=path;
   $(`featuredUpload${i+1}`).value='';
  }
  const heroFile=$('heroUpload').files[0];
  if(heroFile){
   if(!heroFile.type.startsWith('image/')||heroFile.size>6*1024*1024){$('adminMsg').textContent='صورة الواجهة يجب أن تكون صورة وأقل من 6 ميجابايت.';return;}
   const path=`hero/${Date.now()}-${heroFile.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
   const up=await supabase.storage.from('site-media').upload(path,heroFile,{upsert:false,contentType:heroFile.type});
   if(up.error){$('adminMsg').textContent='تعذر رفع صورة الواجهة: '+up.error.message;return;}
   settings.hero=path;$('heroUpload').value='';
  }
  const files=Array.from($('galleryUpload').files||[]);
  const invalid=files.find(f=>!f.type.startsWith('image/')||f.size>6*1024*1024);
  if(invalid){$('adminMsg').textContent=`الملف ${invalid.name} ليس صورة أو حجمه أكبر من 6 ميجابايت.`;return;}
  settings.gallery=[...new Set(settings.gallery||[])];
  settings.galleryHashes=Array.isArray(settings.galleryHashes)?settings.galleryHashes:[];
  const seen=new Set(settings.galleryHashes);let uploaded=0,skipped=0;
  for(let i=0;i<files.length;i++){
   const f=files[i];
   let fingerprint;
   try{const bytes=await f.arrayBuffer();const digest=await crypto.subtle.digest('SHA-256',bytes);fingerprint=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');}
   catch{fingerprint=[f.name,f.size,f.lastModified].join(':');}
   if(seen.has(fingerprint)){skipped++;continue;}
   seen.add(fingerprint);
   const safeName=f.name.replace(/[^a-zA-Z0-9._-]/g,'_');
   const path=`gallery/${Date.now()}-${i}-${fingerprint.slice(0,12)}-${safeName}`;
   const up=await supabase.storage.from('site-media').upload(path,f,{upsert:false,contentType:f.type});
   if(up.error){$('adminMsg').textContent=`تم رفع ${uploaded} صورة وتجاوز ${skipped} مكررة. فشل رفع ${f.name}: ${up.error.message}`;return;}
   settings.gallery.push(path);settings.galleryHashes.push(fingerprint);uploaded++;
   $('adminMsg').textContent=`تم رفع ${uploaded} من ${files.length-skipped} صورة جديدة...`;
  }
  $('galleryUpload').value='';
  const {error}=await supabase.from('site_settings').update({config:settings,updated_at:new Date().toISOString()}).eq('id',1);
  if(error){$('adminMsg').textContent='تعذر حفظ الإعدادات في قاعدة البيانات.';return;}
  applySettings();renderGalleryManager();
  $('adminMsg').textContent=`تم حفظ الإعدادات وتطبيقها على الموقع. رُفعت ${uploaded} صورة جديدة${skipped?` وتم تجاهل ${skipped} صورة مكررة`:''}.`;
 } finally {savingSettings=false;if(saveButton)saveButton.disabled=false;}
};
