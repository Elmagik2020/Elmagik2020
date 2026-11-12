import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(
  'https://ehswwhonicinexutzruo.supabase.co',
  'sb_publishable_bTedgB2z-k0bFylHHRucTw_1nE6eESZ',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'elmagik-cool-auth' } }
);
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let currentChatOrder = null;
let chatChannel = null;
let managerFilter = 'pending';

function note(id, text, kind='') {
  const el = $(id);
  if (!el) return;
  el.className = kind ? 'notice ' + kind : 'small';
  el.textContent = text;
}
function normalizeEgyptPhone(raw) {
  let n = String(raw || '').replace(/\D/g, '');
  if (n.startsWith('0020')) n = n.slice(2);
  if (n.startsWith('0')) n = '20' + n.slice(1);
  if (!n.startsWith('20')) n = '20' + n;
  return '+' + n;
}
function injectStyles() {
  if ($('workflowStyles')) return;
  const s = document.createElement('style');
  s.id = 'workflowStyles';
  s.textContent = `
    .wf-tabs{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0}
    .wf-tabs button{border:1px solid #126eaa;background:#062957;color:#eaf8ff;border-radius:10px;padding:9px 13px;font-weight:800}
    .wf-tabs button.active{background:#08c9f2;color:#001a36}
    .wf-chat{background:#031a39;border:1px solid #126eaa;border-radius:12px;padding:12px;margin:10px 0}
    .wf-msg{padding:9px 11px;border-radius:10px;margin:7px 0;max-width:92%;white-space:pre-wrap;overflow-wrap:anywhere}
    .wf-msg.customer{background:#084779;margin-right:auto}
    .wf-msg.admin{background:#07543f;margin-left:auto}
    .wf-meta{font-size:11px;color:#bed6eb;margin-top:4px}
    .wf-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
    .wf-actions button{flex:1;min-width:120px}
    .wf-input{width:100%;padding:11px;border-radius:10px;border:1px solid #3379a8;background:#031a39;color:white}
  `;
  document.head.appendChild(s);
}
function injectCustomerPanel() {
  if ($('customerChatAccess')) return;
  const section = document.createElement('section');
  section.id = 'customerChatAccess';
  section.className = 'panel';
  section.innerHTML = `
    <h2>متابعة طلباتك والتواصل مع الإدارة</h2>
    <p class="sub">ادخل برقم الموبايل المسجل في الطلب، وسنرسل كود تحقق SMS لحماية بياناتك ومحادثاتك.</p>
    <div id="customerOtpStart" class="grid">
      <div class="field wide"><label for="customerOtpPhone">رقم الموبايل المسجل في الطلب</label><input id="customerOtpPhone" class="wf-input" type="tel" autocomplete="tel" placeholder="01xxxxxxxxx"></div>
      <div class="wide"><button id="customerSendOtp" class="btn">إرسال كود التحقق</button></div>
    </div>
    <div id="customerOtpVerify" class="grid hide">
      <div class="field wide"><label for="customerOtpCode">كود التحقق المرسل SMS</label><input id="customerOtpCode" class="wf-input" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="أدخل كود التحقق"></div>
      <div class="wide wf-actions"><button id="customerVerifyOtp" class="btn">تأكيد الكود</button><button id="customerResendOtp" class="btn alt">إعادة إرسال الكود</button></div>
    </div>
    <div id="customerOtpMessage" aria-live="polite"></div>
    <div id="customerOrdersPanel" class="hide"><div class="order-head"><b>طلباتك</b><button id="customerChatLogout" class="btn alt">تسجيل الخروج</button></div><div id="customerOrdersList"></div></div>
    <div id="customerChatPanel" class="hide">
      <div class="order-head"><b id="customerChatTitle">محادثة الطلب</b><button id="customerBackOrders" class="btn alt">رجوع للطلبات</button></div>
      <div id="customerChatMessages" class="wf-chat" aria-live="polite"></div>
      <form id="customerChatForm" class="grid"><div class="field wide"><label for="customerChatText">رسالتك للإدارة</label><textarea id="customerChatText" class="wf-input" maxlength="2000" required placeholder="اكتب رسالتك هنا..."></textarea></div><div class="wide"><button class="btn" type="submit">إرسال الرسالة</button></div></form>
    </div>`;
  $('customerView').appendChild(section);
  $('customerSendOtp').addEventListener('click', sendOtp);
  $('customerResendOtp').addEventListener('click', sendOtp);
  $('customerVerifyOtp').addEventListener('click', verifyOtp);
  $('customerChatLogout').addEventListener('click', customerLogout);
  $('customerBackOrders').addEventListener('click', () => {
    $('customerChatPanel').classList.add('hide'); $('customerOrdersPanel').classList.remove('hide'); closeChannel();
  });
  $('customerChatForm').addEventListener('submit', sendCustomerMessage);
}
async function sendOtp() {
  const phone = normalizeEgyptPhone($('customerOtpPhone').value);
  if (!/^\+20(10|11|12|15)\d{8}$/.test(phone)) {
    note('customerOtpMessage','أدخل رقم موبايل مصري صحيحًا مكوّنًا من 11 رقمًا.','err'); return;
  }
  const btn = $('customerSendOtp'); btn.disabled = true; btn.textContent = 'جارٍ إرسال الكود...';
  try {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
    $('customerOtpStart').classList.add('hide'); $('customerOtpVerify').classList.remove('hide');
    note('customerOtpMessage','تم طلب إرسال كود التحقق. إذا لم تصلك رسالة، تأكد من إعداد خدمة SMS وحاول بعد قليل.','ok');
  } catch (e) { note('customerOtpMessage','تعذر إرسال الكود: ' + (e.message || 'تحقق من إعداد خدمة الرسائل. يُرجى عدم مشاركة كود التحقق مع أي شخص.'),'err'); }
  finally { btn.disabled = false; btn.textContent = 'إرسال كود التحقق'; }
}
async function verifyOtp() {
  const phone = normalizeEgyptPhone($('customerOtpPhone').value);
  const token = $('customerOtpCode').value.trim();
  if (!/^\d{4,8}$/.test(token)) { note('customerOtpMessage','أدخل كود التحقق الصحيح.','err'); return; }
  const btn = $('customerVerifyOtp'); btn.disabled = true;
  try {
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) throw error;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user?.phone) throw new Error('لم يتم تأكيد رقم الموبايل من حساب الدخول.');
    $('customerOtpVerify').classList.add('hide');
    await loadCustomerOrders();
    note('customerOtpMessage','تم التحقق من رقمك بنجاح.','ok');
  } catch (e) { note('customerOtpMessage','فشل التحقق: ' + (e.message || 'تأكد من الكود وحاول مرة أخرى.'),'err'); }
  finally { btn.disabled = false; }
}
async function loadCustomerOrders() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user?.phone) throw new Error('سجّل الدخول برقم الموبايل أولًا.');
  const { data, error } = await supabase.from('service_orders').select('id,display_code,created_at,category,service_name,status,manager_status,archived_at,quoted_price,admin_note').order('created_at',{ascending:false}).limit(100);
  if (error) throw error;
  $('customerOtpStart').classList.add('hide'); $('customerOtpVerify').classList.add('hide');
  $('customerOrdersPanel').classList.remove('hide'); $('customerChatPanel').classList.add('hide');
  const root = $('customerOrdersList');
  if (!data?.length) { root.innerHTML = '<p class="small">لا توجد طلبات مرتبطة بهذا الرقم. تأكد أنك استخدمت نفس رقم الموبايل عند إنشاء الطلب.</p>'; return; }
  root.innerHTML = data.map(o => `<article class="order-card"><div class="order-head"><b>${esc(o.display_code)} · ${esc(o.service_name)}</b><span class="pill">${o.manager_status==='completed'?'مكتمل ومؤرشف':o.manager_status==='accepted'?'مقبول من الإدارة':'بانتظار قبول الإدارة'}</span></div><p>${esc(o.category)} · ${esc(o.status)}</p><p>السعر: ${o.quoted_price==null?'لم يحدد بعد':esc(o.quoted_price)+' جنيه'}</p><p>${esc(o.admin_note||'')}</p><button class="btn" data-customer-open-chat="${esc(o.id)}" data-code="${esc(o.display_code)}">فتح المحادثة مع الإدارة</button></article>`).join('');
  root.querySelectorAll('[data-customer-open-chat]').forEach(b => b.addEventListener('click',()=>openChat(b.dataset.customerOpenChat,b.dataset.code,'customer')));
}
async function openChat(orderId, code, role) {
  currentChatOrder = { id: orderId, code, role };
  $('customerOrdersPanel').classList.add('hide'); $('customerChatPanel').classList.remove('hide');
  $('customerChatTitle').textContent = 'محادثة الطلب ' + code;
  await refreshMessages();
  closeChannel();
  chatChannel = supabase.channel('order-chat-' + orderId)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'order_messages',filter:'order_id=eq.'+orderId},payload => {
      const msg=payload.new;
      appendMessage(msg);
    }).subscribe();
}
function appendMessage(m) {
  const root=$('customerChatMessages'); if (!root) return;
  if (root.querySelector('[data-message-id="'+m.id+'"]')) return;
  const item=document.createElement('div');
  item.className='wf-msg '+(m.sender_role==='admin'?'admin':'customer');
  item.dataset.messageId=m.id;
  item.innerHTML='<div>'+esc(m.body)+'</div><div class="wf-meta">'+(m.sender_role==='admin'?'الإدارة':'أنت')+' · '+esc(new Date(m.created_at).toLocaleString('ar-EG'))+'</div>';
  root.appendChild(item); root.scrollTop=root.scrollHeight;
}
async function refreshMessages() {
  $('customerChatMessages').innerHTML='<p class="small">جارٍ تحميل المحادثة...</p>';
  const {data,error}=await supabase.from('order_messages').select('*').eq('order_id',currentChatOrder.id).order('created_at',{ascending:true});
  if(error) { $('customerChatMessages').textContent='تعذر تحميل المحادثة: '+error.message; return; }
  $('customerChatMessages').innerHTML='';
  (data||[]).forEach(appendMessage);
}
async function sendCustomerMessage(e) {
  e.preventDefault(); if(!currentChatOrder) return;
  const body=$('customerChatText').value.trim(); if(!body) return;
  const {data:{user}}=await supabase.auth.getUser();
  const {error}=await supabase.from('order_messages').insert({order_id:currentChatOrder.id,sender_id:user.id,sender_role:'customer',body});
  if(error){note('customerOtpMessage','تعذر إرسال الرسالة: '+error.message,'err');return;}
  $('customerChatText').value='';
}
function closeChannel(){ if(chatChannel){supabase.removeChannel(chatChannel);chatChannel=null;} }
async function customerLogout() {
  closeChannel(); currentChatOrder=null; await supabase.auth.signOut();
  $('customerOrdersPanel').classList.add('hide'); $('customerChatPanel').classList.add('hide');
  $('customerOtpStart').classList.remove('hide'); $('customerOtpVerify').classList.add('hide');
  $('customerOtpCode').value=''; note('customerOtpMessage','تم تسجيل الخروج.');
}
function injectManagerPanel() {
  if ($('managerWorkflowSection')) return;
  const section=document.createElement('section');
  section.id='managerWorkflowSection'; section.className='panel';
  section.innerHTML=`
    <h2>إدارة دورة الطلبات والأرشيف</h2>
    <p class="sub">قبول الإدارة مستقل عن حالة الفني. عند اختيار "تم الإنجاز والأرشفة" يظل سجل المحادثة محفوظًا ويمكن الرجوع إليه.</p>
    <div class="wf-tabs"><button data-wf-filter="pending" class="active">طلبات جديدة</button><button data-wf-filter="accepted">طلبات مقبولة</button><button data-wf-filter="completed">الأرشيف</button><button data-wf-filter="all">الكل</button></div>
    <div id="managerWorkflowOrders"></div>
    <hr style="border-color:#126eaa;margin:18px 0">
    <h2>محادثات العملاء</h2><p class="sub">اختر طلبًا لعرض المحادثة والرد على العميل.</p><div id="managerChatPicker"></div>
    <div id="managerChatBox" class="hide"><div class="order-head"><b id="managerChatTitle"></b><button id="managerCloseChat" class="btn alt">إغلاق المحادثة</button></div><div id="managerChatMessages" class="wf-chat"></div><form id="managerChatForm" class="grid"><div class="field wide"><label for="managerChatText">رد الإدارة</label><textarea id="managerChatText" class="wf-input" maxlength="2000" required></textarea></div><div class="wide"><button class="btn" type="submit">إرسال الرد</button></div></form></div>`;
  $('managerDashboard').appendChild(section);
  section.querySelectorAll('[data-wf-filter]').forEach(b=>b.addEventListener('click',()=>{
    managerFilter=b.dataset.wfFilter;
    section.querySelectorAll('[data-wf-filter]').forEach(x=>x.classList.toggle('active',x===b));
    loadWorkflowOrders();
  }));
  $('managerCloseChat').addEventListener('click',()=>{$('managerChatBox').classList.add('hide');closeChannel();});
  $('managerChatForm').addEventListener('submit',sendAdminMessage);
  loadWorkflowOrders();
}
async function loadWorkflowOrders() {
  if(!activeAdmin()) return;
  const root=$('managerWorkflowOrders'); if(!root) return;
  root.innerHTML='<p class="small">جارٍ تحميل الطلبات...</p>';
  const {data,error}=await supabase.from('service_orders').select('id,display_code,customer_name,customer_phone,service_name,category,status,manager_status,archived_at,accepted_at,manager_completed_at,quoted_price,admin_note').order('created_at',{ascending:false}).limit(150);
  if(error){root.textContent='تعذر تحميل الطلبات: '+error.message;return;}
  const rows=(data||[]).filter(o=>managerFilter==='all'||o.manager_status===managerFilter);
  if(!rows.length){root.innerHTML='<p class="small">لا توجد طلبات في هذا القسم.</p>';return;}
  root.innerHTML=rows.map(o=>`<article class="order-card"><div class="order-head"><b>${esc(o.display_code)} · ${esc(o.customer_name)}</b><span class="pill">${o.manager_status==='completed'?'مكتمل / مؤرشف':o.manager_status==='accepted'?'مقبول إداريًا':'جديد'}</span></div><p>${esc(o.service_name)} · ${esc(o.category)}</p><p>الهاتف: ${esc(o.customer_phone)} · حالة الفني: ${esc(o.status)}</p><p>السعر: ${o.quoted_price==null?'غير محدد':esc(o.quoted_price)+' جنيه'} · ${esc(o.admin_note||'')}</p><div class="wf-actions">${o.manager_status==='pending'?'<button class="btn green" data-manager-accept="'+esc(o.id)+'">قبول الطلب</button>':''}${o.manager_status!=='completed'?'<button class="btn" data-manager-complete="'+esc(o.id)+'">تم الإنجاز والأرشفة</button>':''}<button class="btn alt" data-manager-chat="'+esc(o.id)+'" data-code="'+esc(o.display_code)+'">محادثة العميل</button></div></article>`).join('');
  root.querySelectorAll('[data-manager-accept]').forEach(b=>b.addEventListener('click',()=>setManagerStatus(b.dataset.managerAccept,'accepted')));
  root.querySelectorAll('[data-manager-complete]').forEach(b=>b.addEventListener('click',()=>setManagerStatus(b.dataset.managerComplete,'completed')));
  root.querySelectorAll('[data-manager-chat]').forEach(b=>b.addEventListener('click',()=>openManagerChat(b.dataset.managerChat,b.dataset.code)));
  const picker=$('managerChatPicker');
  picker.innerHTML='<div class="grid">'+(data||[]).map(o=>'<div><button class="btn alt" style="width:100%;margin:3px" data-pick-chat="'+esc(o.id)+'" data-code="'+esc(o.display_code)+'">'+esc(o.display_code)+' · '+esc(o.customer_name)+'</button></div>').join('')+'</div>';
  picker.querySelectorAll('[data-pick-chat]').forEach(b=>b.addEventListener('click',()=>openManagerChat(b.dataset.pickChat,b.dataset.code)));
}
function activeAdmin(){return Boolean(window.__elmagikWorkflowAdmin);}
async function setManagerStatus(id,status) {
  const patch=status==='accepted'?{manager_status:'accepted',accepted_at:new Date().toISOString()}:{manager_status:'completed',manager_completed_at:new Date().toISOString(),archived_at:new Date().toISOString()};
  const {error}=await supabase.from('service_orders').update(patch).eq('id',id);
  if(error){alert('تعذر تحديث الطلب: '+error.message);return;}
  await loadWorkflowOrders();
}
async function openManagerChat(id,code) {
  currentChatOrder={id,code,role:'admin'};
  $('managerChatBox').classList.remove('hide');$('managerChatTitle').textContent='محادثة الطلب '+code;
  await refreshManagerMessages();closeChannel();
  chatChannel=supabase.channel('admin-order-chat-'+id)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'order_messages',filter:'order_id=eq.'+id},payload=>appendManagerMessage(payload.new))
    .subscribe();
}
function appendManagerMessage(m) {
  const root=$('managerChatMessages');if(!root||root.querySelector('[data-message-id="'+m.id+'"]'))return;
  const item=document.createElement('div');item.className='wf-msg '+(m.sender_role==='admin'?'admin':'customer');item.dataset.messageId=m.id;
  item.innerHTML='<div>'+esc(m.body)+'</div><div class="wf-meta">'+(m.sender_role==='admin'?'الإدارة':'العميل')+' · '+esc(new Date(m.created_at).toLocaleString('ar-EG'))+'</div>';
  root.appendChild(item);root.scrollTop=root.scrollHeight;
}
async function refreshManagerMessages() {
  $('managerChatMessages').innerHTML='<p class="small">جارٍ تحميل المحادثة...</p>';
  const {data,error}=await supabase.from('order_messages').select('*').eq('order_id',currentChatOrder.id).order('created_at',{ascending:true});
  if(error){$('managerChatMessages').textContent='تعذر تحميل المحادثة: '+error.message;return;}
  $('managerChatMessages').innerHTML='';(data||[]).forEach(appendManagerMessage);
}
async function sendAdminMessage(e) {
  e.preventDefault();if(!currentChatOrder)return;
  const body=$('managerChatText').value.trim();if(!body)return;
  const {data:{user}}=await supabase.auth.getUser();
  const {error}=await supabase.from('order_messages').insert({order_id:currentChatOrder.id,sender_id:user.id,sender_role:'admin',body});
  if(error){alert('تعذر إرسال الرد: '+error.message);return;}
  $('managerChatText').value='';
}
async function detectAdminSession() {
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.user)return;
  const {data}=await supabase.from('admins').select('user_id').eq('user_id',session.user.id).maybeSingle();
  if(data){window.__elmagikWorkflowAdmin=true;injectManagerPanel();}
}
async function restoreCustomerSession() {
  const {data:{session}} = await supabase.auth.getSession();
  const phone = session?.user?.phone;
  if (!phone) return;
  const {data:admin} = await supabase.from('admins').select('user_id').eq('user_id',session.user.id).maybeSingle();
  if (admin) return;
  $('customerOtpPhone').value = phone.replace(/^\\+20/, '0');
  try { await loadCustomerOrders(); }
  catch (e) { note('customerOtpMessage','تعذر استعادة طلباتك: '+(e.message||'يرجى تسجيل الدخول مرة أخرى.'),'err'); }
}
function boot() {
  injectStyles(); injectCustomerPanel();
  detectAdminSession();
  restoreCustomerSession();
  const dashboard=$('managerDashboard');
  if(dashboard) new MutationObserver(()=>{if(!dashboard.classList.contains('hide'))detectAdminSession();}).observe(dashboard,{attributes:true,attributeFilter:['class','childList']});
  supabase.auth.onAuthStateChange(()=>{setTimeout(()=>{detectAdminSession();restoreCustomerSession();},0);});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
