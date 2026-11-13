import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const SUPABASE_URL='https://ehswwhonicinexutzruo.supabase.co';
const SUPABASE_KEY='sb_publishable_bTedgB2z-k0bFylHHRucTw_1nE6eESZ';
const db=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'elmagik-cool-auth'}});
window.__elmagikSupabase=db;
const $=id=>document.getElementById(id);
const catalog={
 'التكييف والتبريد':['صيانة وتركيب التكييف المنزلي','صيانة التكييف المركزي والدكت','صيانة أنظمة VRV / VRF','غرف التبريد والتجميد','الثلاجات التجارية والفريزرات','سيارات النقل المبردة','مصانع الثلج ومعدات التبريد'],
 'الأجهزة المنزلية':['صيانة الثلاجات المنزلية','صيانة الغسالات','صيانة البوتاجاز','صيانة السخان الغاز','صيانة السخان الكهربائي'],
 'المصانع والأنظمة الصناعية':['صيانة مصانع الأغذية والتجميد','صيانة مصانع الثلج','صيانة غرف التجميد الصناعية','صيانة معدات المطاعم والفنادق'],
 'الكهرباء والكنترول':['صيانة الأعطال الكهربائية','لوحات الكنترول و PLC','أنظمة التحكم والحماية','توصيلات وفحص الدوائر الكهربائية'],
 'خدمات الورش والمعدات':['لف وإصلاح المحركات الكهربائية','عمرات وصيانة الكباسات','صيانة المضخات والمعدات']
};
const statusNames={new:'طلب جديد',assigned:'تم إسناد فني',accepted:'الفني وافق على الطلب',in_progress:'جارٍ التنفيذ',completed:'تم الإنجاز',cancelled:'ملغي'};
let activeUser=null,activeRole=null,technicians=[];
function showMessage(id,msg,type=''){const el=$(id);el.className=type?'notice '+type:'small';el.textContent=msg;}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function code(){return 'EM-'+Array.from(crypto.getRandomValues(new Uint8Array(4))).map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();}
function selectedType(){return document.querySelector('input[name="requestType"]:checked')?.value||'immediate';}
function setView(name){document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.view===name));['customer','technician','manager','join'].forEach(v=>$(v+'View').classList.toggle('hide',v!==name));}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$('category').addEventListener('change',()=>{
 const list=catalog[$('category').value]||[];const select=$('serviceName');select.innerHTML='<option value="">اختر نوع الخدمة</option>'+list.map(x=>'<option>'+esc(x)+'</option>').join('');select.disabled=!list.length;
});
document.querySelectorAll('input[name="requestType"]').forEach(x=>x.addEventListener('change',()=>{
 const scheduled=selectedType()==='scheduled';$('scheduleFields').classList.toggle('hide',!scheduled);$('scheduleDate').required=scheduled;$('scheduleTime').required=scheduled;
}));
$('orderForm').addEventListener('submit',async e=>{
 e.preventDefault();const btn=$('submitOrder');btn.disabled=true;btn.textContent='جارٍ إرسال الطلب...';
 try{
  const address=$('address').value.trim();
  if(address.length<5)throw new Error('من فضلك أدخل عنوانًا تفصيليًا لا يقل عن 5 أحرف.');
  if(address.length>300)throw new Error('العنوان طويل جدًا. الحد الأقصى 300 حرف.');
  const type=selectedType();let scheduled_for=null;
  if(type==='scheduled'){
   const date=$('scheduleDate').value,time=$('scheduleTime').value;
   if(!date||!time)throw new Error('اختر تاريخ ووقت الموعد المطلوب.');
   const local=new Date(date+'T'+time);
   if(Number.isNaN(local.getTime())||local.getTime()<Date.now()-60000)throw new Error('موعد الحجز يجب أن يكون في المستقبل.');
   scheduled_for=local.toISOString();
  }
  const display_code=code();
  const payload={display_code,customer_name:$('customerName').value.trim(),customer_phone:$('customerPhone').value.trim(),category:$('category').value,service_name:$('serviceName').value,request_type:type,scheduled_for,address,details:$('details').value.trim()||null,payment_method:$('paymentMethod').value,status:'new'};
  const {error}=await db.from('service_orders').insert(payload);
  if(error)throw error;
  $('orderForm').reset();$('serviceName').innerHTML='<option value="">اختر مجال الخدمة أولًا</option>';$('serviceName').disabled=true;$('scheduleFields').classList.add('hide');$('scheduleDate').required=false;$('scheduleTime').required=false;
  showMessage('orderMessage','تم استلام طلبك بنجاح. رقم الطلب: '+display_code+' – احتفظ بالرقم، وسيتواصل معك فريق ELmagik Cool لتأكيد التفاصيل.','ok');
 }catch(err){showMessage('orderMessage','لم نتمكن من إرسال الطلب: '+(err.message||'تحقق من الاتصال وحاول مرة أخرى.'),'err');}
 finally{btn.disabled=false;btn.innerHTML='إرسال طلب الصيانة ←';}
});
$('technicianApplicationForm').addEventListener('submit',async e=>{
 e.preventDefault();const btn=$('joinSubmit');btn.disabled=true;btn.textContent='جارٍ إرسال الطلب...';
 try{
  const email=$('joinEmail').value.trim().toLowerCase(),password=$('joinPassword').value;
  const specialties=Array.from($('joinSpecialties').selectedOptions).map(o=>o.value);
  if(!specialties.length)throw new Error('اختر تخصصًا واحدًا على الأقل.');
  const idFront=$('joinIdFront').files[0],idBack=$('joinIdBack').files[0];
  if(!idFront||!idBack)throw new Error('ارفع صورة الوجه الأمامي والخلفي للبطاقة.');
  if(!$('joinIdConsent').checked)throw new Error('يجب الموافقة على استخدام صور البطاقة للتحقق من الهوية.');
  const allowed=['image/jpeg','image/png','image/webp'];
  for(const f of [idFront,idBack]){if(!allowed.includes(f.type))throw new Error('صور البطاقة يجب أن تكون JPG أو PNG أو WEBP.');if(f.size>5*1024*1024)throw new Error('حجم كل صورة يجب ألا يتجاوز 5 ميجابايت.');}
  const experience=Number($('joinExperience').value);
  if(!Number.isInteger(experience)||experience<0||experience>60)throw new Error('أدخل عدد سنوات خبرة صحيحًا.');
  let {data:{session}}=await db.auth.getSession();
  if(!session){
   const signup=await db.auth.signUp({email,password,options:{data:{display_name:$('joinName').value.trim()}}});
   if(signup.error){
    const login=await db.auth.signInWithPassword({email,password});
    if(login.error)throw new Error(signup.error.message.includes('already registered')?'هذا البريد مسجل بالفعل. استخدم بيانات الدخول الصحيحة لإرسال طلبك.':signup.error.message);
    session=login.data.session;
   }else if(!signup.data.session){
    showMessage('joinMessage','تم إنشاء حساب الدخول. افتح رسالة تأكيد البريد الإلكتروني أولًا، ثم ارجع إلى هذه الصفحة وسجّل بنفس البريد وكلمة المرور واضغط إرسال طلب الانضمام مرة أخرى. لم يتم تفعيل أي صلاحيات فني حتى الآن.','ok');
    return;
   }else session=signup.data.session;
  }
  if(!session?.user?.id)throw new Error('تعذر تأكيد حسابك. سجّل الدخول بعد تأكيد البريد الإلكتروني ثم أعد إرسال الطلب.');
  const {data:existing}=await db.from('technician_applications').select('status').eq('user_id',session.user.id).maybeSingle();
  if(existing){await db.auth.signOut();showMessage('joinMessage',existing.status==='pending'?'طلبك موجود بالفعل وهو بانتظار مراجعة الإدارة.':existing.status==='approved'?'تم قبول طلبك بالفعل. استخدم بوابة دخول الفني.':'سبق مراجعة طلبك. تواصل مع الإدارة إذا أردت إعادة التقديم.','ok');return;}
  const bucket=db.storage.from('technician-id-documents');
  const ext=f=>f.type==='image/jpeg'?'jpg':f.type==='image/png'?'png':'webp';
  const idFrontPath=session.user.id+'/front-'+Date.now()+'.'+ext(idFront);
  const idBackPath=session.user.id+'/back-'+Date.now()+'.'+ext(idBack);
  const upFront=await bucket.upload(idFrontPath,idFront,{contentType:idFront.type,upsert:false});
  if(upFront.error)throw new Error('تعذر رفع الوجه الأمامي للبطاقة: '+upFront.error.message);
  const upBack=await bucket.upload(idBackPath,idBack,{contentType:idBack.type,upsert:false});
  if(upBack.error){await bucket.remove([idFrontPath]);throw new Error('تعذر رفع الوجه الخلفي للبطاقة: '+upBack.error.message);}
  const payload={user_id:session.user.id,display_name:$('joinName').value.trim(),email,phone:$('joinPhone').value.trim(),governorate:$('joinGovernorate').value.trim(),area:$('joinArea').value.trim(),specialties,years_experience:experience,notes:$('joinNotes').value.trim()||null,id_front_path:idFrontPath,id_back_path:idBackPath,status:'pending'};
  const {error}=await db.from('technician_applications').insert(payload);
  if(error){await bucket.remove([idFrontPath,idBackPath]);throw error;}
  await db.auth.signOut();
  $('technicianApplicationForm').reset();
  showMessage('joinMessage','وصل طلب انضمامك بنجاح. حسابك الآن بانتظار مراجعة الإدارة، ولن تتمكن من استقبال الطلبات إلا بعد الموافقة.','ok');
 }catch(err){showMessage('joinMessage','تعذر إرسال الطلب: '+(err.message||'حاول مرة أخرى.'),'err');}
 finally{btn.disabled=false;btn.textContent='إرسال طلب الانضمام';}
});
async function login(email,password,messageId){
 const {data,error}=await db.auth.signInWithPassword({email:email.trim(),password});
 if(error)throw new Error('بيانات الدخول غير صحيحة أو الحساب غير مفعل.');
 activeUser=data.user;
 const {data:admin}=await db.from('admins').select('user_id').eq('user_id',activeUser.id).maybeSingle();
 if(admin){activeRole='admin';return 'admin';}
 const {data:tech}=await db.from('technicians').select('user_id,display_name,active').eq('user_id',activeUser.id).maybeSingle();
 if(tech?.active){activeRole='technician';return 'technician';}
 await db.auth.signOut();activeUser=null;activeRole=null;throw new Error('هذا الحساب غير مسجل كمدير أو فني معتمد.');
}
// استعادة/إنشاء كلمة مرور حساب المدير الأساسي عبر رابط آمن على البريد المسجل.
$('managerForgotBtn').addEventListener('click',async()=>{
 const btn=$('managerForgotBtn');btn.disabled=true;btn.textContent='جارٍ إرسال الرابط...';
 try{
  const email='elmagikcool@gmail.com';
  const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:'https://elmagikcool.vercel.app/app.html'});
  if(error)throw error;
  showMessage('managerMessage','تم طلب رابط إنشاء كلمة مرور جديدة. افحص صندوق الوارد والرسائل غير المرغوب فيها للبريد '+email+'. افتح الرابط من نفس الجهاز لإكمال تعيين كلمة المرور.','ok');
 }catch(err){showMessage('managerMessage','تعذر إرسال رابط الاستعادة: '+(err.message||'حاول لاحقًا. إذا ظهر حدّ الإرسال، انتظر قليلًا قبل إعادة المحاولة.'),'err');}
 finally{btn.disabled=false;btn.textContent='إنشاء / استعادة كلمة المرور';}
});
db.auth.onAuthStateChange((event,session)=>{
 if(event==='PASSWORD_RECOVERY'&&session?.user?.email?.toLowerCase()==='elmagikcool@gmail.com'){
  setView('manager');
  $('managerResetPanel').classList.remove('hide');
  $('managerLogin').classList.add('hide');
  showMessage('managerResetMessage','تم التحقق من رابط الاستعادة. أدخل كلمة مرور جديدة لا تقل عن 8 أحرف.','ok');
 }
});
$('managerResetForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const password=$('managerNewPassword').value,confirm=$('managerConfirmPassword').value,btn=$('managerSavePasswordBtn');
 if(password.length<8){showMessage('managerResetMessage','كلمة المرور يجب ألا تقل عن 8 أحرف.','err');return;}
 if(password!==confirm){showMessage('managerResetMessage','تأكيد كلمة المرور غير مطابق.','err');return;}
 btn.disabled=true;btn.textContent='جارٍ حفظ كلمة المرور...';
 try{
  const {data:{user},error}=await db.auth.getUser();
  if(error||!user||user.email?.toLowerCase()!=='elmagikcool@gmail.com')throw new Error('رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.');
  const {error:updateError}=await db.auth.updateUser({password});
  if(updateError)throw updateError;
  await db.auth.signOut();
  $('managerResetForm').reset();$('managerResetPanel').classList.add('hide');$('managerLogin').classList.remove('hide');
  showMessage('managerMessage','تم حفظ كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول إلى إعدادات الإدارة بالبريد المحدد وكلمة المرور الجديدة.','ok');
 }catch(err){showMessage('managerResetMessage','تعذر حفظ كلمة المرور: '+(err.message||'حاول مرة أخرى.'),'err');}
 finally{btn.disabled=false;btn.textContent='حفظ كلمة المرور';}
});
// تغيير كلمة مرور المدير من داخل لوحة الإدارة بعد إعادة التحقق بكلمة المرور الحالية.
$('managerChangePasswordForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const current=$('managerCurrentPassword').value;
 const next=$('managerChangeNewPassword').value;
 const confirm=$('managerChangeConfirmPassword').value;
 const btn=$('managerChangePasswordBtn');
 if(next.length<8){showMessage('managerChangePasswordMessage','كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف.','err');return;}
 if(next!==confirm){showMessage('managerChangePasswordMessage','تأكيد كلمة المرور الجديدة غير مطابق.','err');return;}
 if(current===next){showMessage('managerChangePasswordMessage','اختر كلمة مرور مختلفة عن الحالية.','err');return;}
 btn.disabled=true;btn.textContent='جارٍ تغيير كلمة المرور...';
 try{
  const email='elmagikcool@gmail.com';
  const {data:{user},error:userError}=await db.auth.getUser();
  if(userError||!user||user.email?.toLowerCase()!==email)throw new Error('يجب تسجيل الدخول بحساب المدير الأساسي لتغيير كلمة المرور.');
  const {error:verifyError}=await db.auth.signInWithPassword({email,password:current});
  if(verifyError)throw new Error('كلمة المرور الحالية غير صحيحة.');
  const {error:updateError}=await db.auth.updateUser({password:next});
  if(updateError)throw updateError;
  $('managerChangePasswordForm').reset();
  showMessage('managerChangePasswordMessage','تم تغيير كلمة المرور بنجاح. استخدم كلمة المرور الجديدة في تسجيل الدخول القادم.','ok');
 }catch(err){showMessage('managerChangePasswordMessage','تعذر تغيير كلمة المرور: '+(err.message||'حاول مرة أخرى.'),'err');}
 finally{btn.disabled=false;btn.textContent='حفظ كلمة المرور الجديدة';}
});
// استعادة جلسة المدير/الفني المحفوظة بأمان على نفس الجهاز دون تخزين كلمة المرور كنص.
async function restoreSavedSession(){
 try{
  const {data:{session},error}=await db.auth.getSession();
  if(error||!session?.user)return;
  activeUser=session.user;
  const {data:admin,error:adminError}=await db.from('admins').select('user_id').eq('user_id',activeUser.id).maybeSingle();
  if(!adminError&&admin){
   activeRole='admin';$('managerLogin').classList.add('hide');$('managerDashboard').classList.remove('hide');
   await loadManagerOrders();await loadManagerApplications();if(window.__elmagikRefreshWorkflow)await window.__elmagikRefreshWorkflow();showMessage('managerMessage','تم استعادة جلسة الإدارة المحفوظة على هذا الجهاز.');
   return;
  }
  const {data:tech,error:techError}=await db.from('technicians').select('user_id,display_name,active').eq('user_id',activeUser.id).maybeSingle();
  if(!techError&&tech?.active){
   activeRole='technician';$('techLogin').classList.add('hide');$('techDashboard').classList.remove('hide');
   await loadTechOrders();showMessage('techMessage','تم استعادة جلسة الفني المحفوظة على هذا الجهاز.');
   return;
  }
  activeUser=null;activeRole=null;
 }catch(err){console.error('Session restore failed:',err);}
}
$('managerLoginBtn').addEventListener('click',async()=>{
 const btn=$('managerLoginBtn');btn.disabled=true;
 try{const role=await login($('managerEmail').value,$('managerPassword').value,'managerMessage');if(role!=='admin'){await logout();throw new Error('الحساب ليس حساب مدير.');}$('managerLogin').classList.add('hide');$('managerDashboard').classList.remove('hide');await loadManagerOrders();showMessage('managerMessage','تم تسجيل الدخول بنجاح.');await loadManagerApplications();if(window.__elmagikRefreshWorkflow)await window.__elmagikRefreshWorkflow();}
 catch(err){showMessage('managerMessage',err.message,'err');}
 finally{btn.disabled=false;}
});
$('techLoginBtn').addEventListener('click',async()=>{
 const btn=$('techLoginBtn');btn.disabled=true;
 try{const role=await login($('techEmail').value,$('techPassword').value,'techMessage');if(role!=='technician'){await logout();throw new Error('الحساب ليس حساب فني.');}$('techLogin').classList.add('hide');$('techDashboard').classList.remove('hide');await loadTechOrders();showMessage('techMessage','تم تسجيل الدخول بنجاح.');}
 catch(err){showMessage('techMessage',err.message,'err');}
 finally{btn.disabled=false;}
});
async function loadManagerOrders(){
 const root=$('managerOrders');root.innerHTML='<p class="loader">جارٍ تحميل الطلبات...</p>';
 const [ordersResult,techniciansResult]=await Promise.all([db.from('service_orders').select('*').order('created_at',{ascending:false}).limit(100),db.from('technicians').select('user_id,display_name,active').eq('active',true).order('display_name')]);
 const {data,error}=ordersResult;
 if(error){root.textContent='تعذر تحميل الطلبات: '+error.message;showMessage('managerMessage','فشل تحميل طلبات العملاء: '+error.message,'err');return;}
 if(techniciansResult.error){technicians=[];showMessage('managerMessage','تعذر تحميل قائمة الفنيين: '+techniciansResult.error.message,'err');}
 else{technicians=Array.isArray(techniciansResult.data)?techniciansResult.data:[];}
 if(!data?.length){root.textContent='لا توجد طلبات حتى الآن.';return;}
 root.innerHTML=data.map(o=>managerCard(o)).join('');
 root.querySelectorAll('[data-save-order]').forEach(b=>b.addEventListener('click',()=>saveManagerOrder(b.dataset.saveOrder,b)));
}
async function loadManagerApplications(){
 const root=$('managerApplications');if(!root)return;root.innerHTML='<p class="loader">جارٍ تحميل طلبات الانضمام...</p>';
 const {data,error}=await db.from('technician_applications').select('*').order('created_at',{ascending:false}).limit(100);
 if(error){root.textContent='تعذر تحميل طلبات الفنيين: '+error.message;return;}
 if(!data?.length){root.textContent='لا توجد طلبات انضمام حاليًا.';return;}
 const bucket=db.storage.from('technician-id-documents');
 const cards=await Promise.all(data.map(async a=>{
  let frontUrl=null,backUrl=null;
  if(a.id_front_path){const r=await bucket.createSignedUrl(a.id_front_path,60);if(!r.error)frontUrl=r.data.signedUrl;}
  if(a.id_back_path){const r=await bucket.createSignedUrl(a.id_back_path,60);if(!r.error)backUrl=r.data.signedUrl;}
  return '<article class="order-card"><div class="order-head"><b>'+esc(a.display_name)+'</b><span class="pill">'+(a.status==='pending'?'بانتظار المراجعة':a.status==='approved'?'تم القبول':'مرفوض')+'</span></div><p>البريد: '+esc(a.email)+'<br>الهاتف: '+esc(a.phone)+'<br>المحافظة: '+esc(a.governorate)+' – '+esc(a.area)+'</p><p>الخبرة: '+esc(a.years_experience)+' سنة<br>التخصصات: '+esc((a.specialties||[]).join('، '))+'</p><p>نبذة: '+esc(a.notes||'لا توجد نبذة')+'</p>'+'<p>صور البطاقة: '+(frontUrl?'<a href="'+esc(frontUrl)+'" target="_blank" rel="noopener">الوجه الأمامي</a>':'غير مرفوع')+' · '+(backUrl?'<a href="'+esc(backUrl)+'" target="_blank" rel="noopener">الوجه الخلفي</a>':'غير مرفوع')+'</p>'+(a.status==='pending'?'<div class="order-actions"><button class="btn green" data-approve-tech="'+esc(a.id)+'">قبول وتفعيل الفني</button><button class="btn alt" data-reject-tech="'+esc(a.id)+'">رفض الطلب</button></div>':'')+'</article>';
 })).join('');
 root.innerHTML=cards;
 root.querySelectorAll('[data-approve-tech]').forEach(b=>b.addEventListener('click',()=>reviewTechnicianApplication(b.dataset.approveTech,'approved')));
 root.querySelectorAll('[data-reject-tech]').forEach(b=>b.addEventListener('click',()=>reviewTechnicianApplication(b.dataset.rejectTech,'rejected')));
}
async function reviewTechnicianApplication(id,decision){
 const {data:app,error:readError}=await db.from('technician_applications').select('*').eq('id',id).single();
 if(readError||!app){showMessage('managerMessage','تعذر العثور على طلب الفني.','err');return;}
 if(app.status!=='pending'){showMessage('managerMessage','تمت مراجعة هذا الطلب من قبل.','err');return;}
 if(decision==='approved'){
  const {error}=await db.from('technicians').upsert({user_id:app.user_id,display_name:app.display_name,phone:app.phone,active:true},{onConflict:'user_id'});
  if(error){showMessage('managerMessage','تعذر تفعيل الفني: '+error.message,'err');return;}
 }
 const {error:updateError}=await db.from('technician_applications').update({status:decision,reviewed_at:new Date().toISOString()}).eq('id',id).eq('status','pending');
 if(updateError){showMessage('managerMessage','تم تجهيز حساب الفني لكن تعذر تحديث حالة الطلب: '+updateError.message,'err');return;}
 showMessage('managerMessage',decision==='approved'?'تم قبول الفني وتفعيل حسابه، ويمكنه الآن تسجيل الدخول.':'تم رفض طلب الانضمام.');
 await loadManagerApplications();
}
function managerCard(o){
 const safeTechnicians=Array.isArray(technicians)?technicians:[];
 const opts=safeTechnicians.map(t=>'<option value="'+esc(t.user_id)+'" '+(t.user_id===o.assigned_technician?'selected':'')+'>'+esc(t.display_name)+'</option>').join('');
 return '<article class="order-card"><div class="order-head"><b>'+esc(o.display_code)+' · '+esc(o.customer_name)+'</b><span class="pill">'+esc(statusNames[o.status]||o.status)+'</span></div><p>'+esc(o.category)+' — '+esc(o.service_name)+'</p><p>طريقة الدفع: '+esc(({cash:'نقدًا',instapay:'إنستا باي',vodafone_cash:'فودافون كاش'})[o.payment_method]||'غير محددة')+'</p><p>الهاتف: '+esc(o.customer_phone)+'<br>العنوان: '+esc(o.address)+'</p><p>نوع الطلب: '+(o.request_type==='immediate'?'فوري':'حجز مسبق')+(o.scheduled_for?' · '+esc(new Date(o.scheduled_for).toLocaleString('ar-EG')):'')+'</p><p>التفاصيل: '+esc(o.details||'لا توجد تفاصيل إضافية')+'</p><div class="order-actions"><div class="field"><label>الفني المسؤول</label><select id="tech-'+esc(o.id)+'"><option value="">لم يتم التعيين</option>'+opts+'</select></div><div class="field"><label>السعر (جنيه)</label><input id="price-'+esc(o.id)+'" type="number" min="0" step="0.01" value="'+(o.quoted_price??'')+'" placeholder="يحدد بواسطة الإدارة"></div><div class="field"><label>حالة الطلب</label><select id="status-'+esc(o.id)+'">'+Object.entries(statusNames).map(([k,v])=>'<option value="'+k+'" '+(o.status===k?'selected':'')+'>'+v+'</option>').join('')+'</select></div><div class="field"><label>ملاحظة الإدارة</label><input id="note-'+esc(o.id)+'" maxlength="1000" value="'+esc(o.admin_note||'')+'"></div></div><button class="btn submit" data-save-order="'+esc(o.id)+'">حفظ وتحديث الطلب</button></article>';
}
async function saveManagerOrder(id,button=null){
 const btn=button||document.querySelector('[data-save-order="'+id+'"]');
 try{
  const tech=$('tech-'+id),statusInput=$('status-'+id),priceInput=$('price-'+id),noteInput=$('note-'+id);
  if(!tech||!statusInput||!priceInput||!noteInput)throw new Error('تعذر قراءة بيانات الطلب. حدّث الصفحة وحاول مرة أخرى.');
  const assigned=tech.value||null,status=statusInput.value,raw=priceInput.value;
  const quoted_price=raw===''?null:Number(raw),admin_note=noteInput.value.trim()||null;
  if(!assigned)throw new Error('اختر الفني المسؤول أولًا حتى يتم قبول الطلب إداريًا.');
  if(quoted_price===null||!Number.isFinite(quoted_price)||quoted_price<0)throw new Error('حدد سعر الخدمة أولًا حتى يتم قبول الطلب إداريًا.');
  let finalStatus=status;
  if(finalStatus==='new')finalStatus='assigned';
  if(finalStatus==='assigned'&&!assigned)finalStatus='new';
  const patch={assigned_technician:assigned,status:finalStatus,quoted_price,admin_note};
  if(btn){btn.disabled=true;btn.textContent='جارٍ حفظ وقبول الطلب...';}
  const {data:current,error:readError}=await db.from('service_orders').select('manager_status,accepted_at').eq('id',id).maybeSingle();
  if(readError)throw readError;
  if(!current)throw new Error('الطلب غير موجود أو لا تملك صلاحية الوصول إليه.');
  if(current.manager_status==='pending'){
   patch.manager_status='accepted';
   patch.accepted_at=current.accepted_at||new Date().toISOString();
  }
  const {data,error}=await db.from('service_orders').update(patch).eq('id',id).select('id').maybeSingle();
  if(error)throw error;
  if(!data)throw new Error('لم يتم تحديث الطلب. تأكد من تسجيل الدخول بحساب المدير وأن صلاحيات الإدارة مفعّلة.');
  showMessage('managerMessage',current.manager_status==='pending'?'تم حفظ الطلب وقبوله إداريًا ونقله إلى الطلبات المقبولة.':'تم حفظ بيانات الطلب بنجاح.','ok');
  await loadManagerOrders();
  if(window.__elmagikRefreshWorkflow)await window.__elmagikRefreshWorkflow();
 }catch(err){
  console.error('ELmagik save manager order failed:',err);
  showMessage('managerMessage','تعذر حفظ الطلب: '+(err?.message||'حدث خطأ غير معروف. حاول مرة أخرى.'),'err');
 }finally{
  if(btn){btn.disabled=false;btn.textContent='حفظ وتحديث الطلب';}
 }
}
async function loadTechOrders(){
 const root=$('techOrders');root.innerHTML='<p class="loader">جارٍ تحميل الطلبات...</p>';
 const {data,error}=await db.from('service_orders').select('*').eq('assigned_technician',activeUser.id).order('created_at',{ascending:false});
 if(error){root.textContent='تعذر تحميل الطلبات: '+error.message;return;}
 if(!data?.length){root.textContent='لا توجد طلبات مسندة إليك حاليًا.';return;}
 root.innerHTML=data.map(o=>{const options=o.status==='assigned'?'<option value="accepted">قبول الطلب</option><option value="in_progress">بدء التنفيذ</option>':o.status==='accepted'?'<option value="in_progress">بدء التنفيذ</option><option value="completed">تم الإنجاز</option>':o.status==='in_progress'?'<option value="completed">تم الإنجاز</option>':'';return '<article class="order-card"><div class="order-head"><b>'+esc(o.display_code)+' · '+esc(o.service_name)+'</b><span class="pill">'+esc(statusNames[o.status]||o.status)+'</span></div><p>العميل: '+esc(o.customer_name)+' · '+esc(o.customer_phone)+'</p><p>العنوان: '+esc(o.address)+'</p><p>التفاصيل: '+esc(o.details||'لا توجد تفاصيل إضافية')+'</p>'+ (options?'<div class="order-actions"><div class="field"><label>تحديث الحالة</label><select id="tech-status-'+esc(o.id)+'">'+options+'</select></div><div class="field"><label>ملاحظات الفني</label><input id="tech-note-'+esc(o.id)+'" maxlength="1000" value="'+esc(o.technician_note||'')+'"></div></div><button class="btn submit" data-tech-save="'+esc(o.id)+'">تحديث الحالة</button>':'<p class="pill">لا توجد إجراءات متاحة لهذا الطلب</p>')+'</article>';}).join('');
 root.querySelectorAll('[data-tech-save]').forEach(b=>b.addEventListener('click',()=>saveTechOrder(b.dataset.techSave)));
}
async function saveTechOrder(id){
 const status=$('tech-status-'+id).value;const technician_note=$('tech-note-'+id).value.trim()||null;
 const {error}=await db.from('service_orders').update({status,technician_note}).eq('id',id);
 if(error){showMessage('techMessage','تعذر تحديث الحالة: '+error.message,'err');return;}
 showMessage('techMessage','تم تحديث حالة الطلب.');await loadTechOrders();
}
async function logout(){
 await db.auth.signOut();activeUser=null;activeRole=null;
 $('managerDashboard').classList.add('hide');$('managerLogin').classList.remove('hide');$('managerPassword').value='';
 $('techDashboard').classList.add('hide');$('techLogin').classList.remove('hide');$('techPassword').value='';
}
$('managerLogout').addEventListener('click',logout);$('techLogout').addEventListener('click',logout);
restoreSavedSession();
document.querySelectorAll('[data-manager-section]').forEach(button=>button.addEventListener('click',()=>{
 const target=button.dataset.managerSection;
 ['orders','applications','password'].forEach(name=>{
  $('manager'+(name==='orders'?'Orders':name==='applications'?'Applications':'Password')+'Section').classList.toggle('hide',name!==target);
  button.parentElement.querySelector('[data-manager-section="'+name+'"]').classList.toggle('alt',name!==target);
 });
 if(target==='orders')loadManagerOrders();
 if(target==='applications')loadManagerApplications();
}));
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
