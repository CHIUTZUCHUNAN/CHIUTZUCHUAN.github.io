// ====== Nav active ======
(function(){
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav-links a").forEach(a=>{
    const href = (a.getAttribute("href") || "").toLowerCase();
    if(href === path) a.classList.add("active");
  });
})();

// ====== Login state in nav (簡易 mock) ======
(function(){
  try{
    const user = sessionStorage.getItem('greensure_user');
    const links = Array.from(document.querySelectorAll('.nav-links a'));
    const loginLink = links.find(a=> (a.getAttribute('href')||'').toLowerCase().includes('login.html'));
    if(loginLink){
      if(user){
        loginLink.textContent = '登出';
        loginLink.addEventListener('click', (e)=>{ e.preventDefault(); sessionStorage.removeItem('greensure_user'); location.reload(); });
      }
    }
  }catch(e){ /* noop */ }
})();

// ====== Helpers ======
function $(sel, root=document){ return root.querySelector(sel); }
function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

function setValidity(el, ok, msgSel){
  if(!el) return;
  el.classList.remove("valid","invalid");
  const msg = msgSel ? $(msgSel) : null;
  if(ok){
    el.classList.add("valid");
    if(msg){ msg.style.display="none"; }
  }else{
    el.classList.add("invalid");
    if(msg){ msg.style.display="block"; }
  }
}

// ====== FAQ accordion ======
// (removed inline handlers in favor of a single safe initializer at bottom)

// ====== Contact form live validation ======
(function(){
  const form = $("#contactForm");
  if(!form) return;

  const nameEl = $("#name");
  const emailEl = $("#email");
  const topicEl = $("#topic");
  const msgEl = $("#message");

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateName(){
    const ok = (nameEl.value || "").trim().length >= 2;
    setValidity(nameEl, ok, "#errName");
    return ok;
  }
  function validateEmail(){
    const ok = emailRe.test((emailEl.value || "").trim());
    setValidity(emailEl, ok, "#errEmail");
    return ok;
  }
  function validateMsg(){
    const ok = (msgEl.value || "").trim().length >= 10;
    setValidity(msgEl, ok, "#errMsg");
    return ok;
  }

  nameEl.addEventListener("input", validateName);
  emailEl.addEventListener("input", validateEmail);
  msgEl.addEventListener("input", validateMsg);

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const ok = [validateName(), validateEmail(), validateMsg()].every(Boolean);
    if(!ok){
      alert("請先完成表單必填欄位（紅框處）");
      return;
    }
    // 若表單有設定外部 action（例如 Formspree），就交由瀏覽器送出
    const action = (form.getAttribute('action') || '').toLowerCase();
    if(action && (action.includes('formspree.io') || action.includes('formsubmit.co'))){
      // 使用原生 submit() 直接送出（不會觸發 submit 事件處理器），避免重入
      form.submit();
      return;
    }

    // 預設前端模擬行為
    alert("已送出（前端模擬）！我們已收到你的訊息。");
    form.reset();
    [nameEl,emailEl,topicEl,msgEl].forEach(el=> el?.classList.remove("valid","invalid"));
    ["#errName","#errEmail","#errMsg"].forEach(sel=>{ const m=$(sel); if(m) m.style.display="none"; });
  });
})();

// ====== Quote calculator (UI-only) ======
(function(){
  const calc = $("#quoteCalc");
  if(!calc) return;

  const planEl = $("#qPlan");
  const sumEl = $("#qSumInsured");
  const riskEl = $("#qRisk");
  const cyberEl = $("#qCyber");
  const sensorEl = $("#qSensor");

  const outPremium = $("#outPremium");
  const outBreakdown = $("#outBreakdown");

  function formatTWD(n){
    return "NT$ " + Math.round(n).toLocaleString("zh-Hant");
  }

  function compute(){
    // 基礎保費：保額 * baseRate（不同方案不同）
    const sum = Number(sumEl.value || 0); // 以萬為單位
    const plan = planEl.value;

    const baseRateMap = {
      ev: 38,       // 每「萬」的基礎費率
      greenhome: 22,
      renew: 45,
      envliab: 30,
      cyber: 28
    };
    const baseRate = baseRateMap[plan] ?? 30;

    // 風險係數
    const riskMap = { low: 0.9, mid: 1.0, high: 1.25 };
    const riskK = riskMap[riskEl.value] ?? 1.0;

    // 附加選項（前端模擬）
    let add = 0;
    if(cyberEl.checked) add += 480;      // 資安韌性加值
    if(sensorEl.checked) add -= 220;     // 有監測/維護 → 風險改善折扣（示意）

    // 計算
    const base = sum * baseRate;         // 以「元」示意（純前端估算）
    const premium = Math.max(680, base * riskK + add);

    // 顯示拆解
    const lines = [
      {k:"估算基礎費用", v: formatTWD(base)},
      {k:"風險係數", v: `× ${riskK}`},
      {k:"加減項（示意）", v: (add>=0?"+":"-") + formatTWD(Math.abs(add))}
    ];

    outPremium.textContent = formatTWD(premium);
    outBreakdown.innerHTML = lines.map(x=>`
      <div class="kv"><span>${x.k}</span><b>${x.v}</b></div>
    `).join("");

    return premium;
  }

  ["change","input"].forEach(evt=>{
    [planEl,sumEl,riskEl,cyberEl,sensorEl].forEach(el=> el.addEventListener(evt, compute));
  });

  // 初次計算
  compute();

  // 送出試算（不真送）
  const btn = $("#btnQuote");
  btn?.addEventListener("click", ()=>{
    const p = compute();
    alert(`已完成估算（前端模擬）\n預估年保費：${formatTWD(p)}\n\n提醒：此為作業展示用，實際保費以核保為準。`);
  });
})();

// ====== Product details modal ======
(function(){
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-dialog" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3 class="modal-title"></h3>
        <button class="modal-close" aria-label="關閉">✕</button>
      </div>
      <div class="modal-body"></div>
    </div>
  `;
  document.body.appendChild(modal);

  const titleEl = modal.querySelector('.modal-title');
  const bodyEl = modal.querySelector('.modal-body');
  const closeBtn = modal.querySelector('.modal-close');

  function openDetail(targetId){
    const tpl = document.getElementById(targetId);
    if(!tpl) return;
    titleEl.textContent = tpl.querySelector('h3')?.textContent || '';
    bodyEl.innerHTML = tpl.innerHTML;
    // remove the title inside body to avoid duplicate
    const firstH = bodyEl.querySelector('h3'); if(firstH) firstH.remove();
    modal.classList.add('open');
  }

  function close(){ modal.classList.remove('open'); }

  // bind product cards
  document.querySelectorAll('.product-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      const id = card.getAttribute('data-target');
      if(id) openDetail(id);
    });
  });

  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', (e)=>{ if(e.target===modal) close(); });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });

})();

// NOTE: FAQ accordion initialization moved to a single safe initializer below.

// ====== Login UI-only ======
(function(){
  const wrap = $("#loginUI");
  if(!wrap) return;

  const tabs = $all("[data-tab]");
  const panes = $all("[data-pane]");

  function setTab(key){
    tabs.forEach(b=> b.classList.toggle("active", b.dataset.tab===key));
    panes.forEach(p=> p.classList.toggle("hidden", p.dataset.pane!==key));
  }

  tabs.forEach(b=>{
    b.addEventListener("click", ()=> setTab(b.dataset.tab));
  });

  // 預設
  setTab("personal");

  // 假登入
  $all("form", wrap).forEach(f=>{
    f.addEventListener("submit", (e)=>{
      e.preventDefault();
      const email = (f.querySelector('input[type="email"]')?.value || '').trim() || 'demo@local';
      sessionStorage.setItem('greensure_user', email);
      alert("登入成功（UI 模擬）！將導回首頁。");
      location.href = 'index.html';
    });
  });
})();

// ===== FAQ accordion (single delegation, no double-toggle) =====
document.addEventListener('click', (e) => {
  const btn = e.target.closest?.('.faq-q');
  if (!btn) return;

  const item = btn.closest('.faq-item');
  if (!item) return;

  // close others
  document.querySelectorAll('.faq-item').forEach(i => {
    if (i !== item) i.classList.remove('open');
  });

  // toggle current
  item.classList.toggle('open');
});


// Ensure init runs whether script loaded before or after DOM
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', ()=>{
    initFaq();
    console.log('FAQ init after DOMContentLoaded');
  });
} else {
  // DOM already ready
  initFaq();
  console.log('FAQ init immediate');
}

// Delegated fallback: if individual handlers fail, this will still toggle
document.addEventListener('click', (e)=>{
  const q = e.target.closest && e.target.closest('.faq-q');
  if(!q) return;
  const item = q.closest('.faq-item');
  if(!item) return;
  const items = document.querySelectorAll('.faq-item');
  items.forEach(i => { if(i !== item) i.classList.remove('open'); });
  item.classList.toggle('open');
  console.log('delegation toggled faq ->', item.classList.contains('open'));
});
