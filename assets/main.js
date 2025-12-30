// ====== Nav active ======
(function () {
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.classList.add("active");
  });
})();

// ====== Login state in nav (簡易 mock) ======
(function () {
  try {
    const user = sessionStorage.getItem("greensure_user");
    const links = Array.from(document.querySelectorAll(".nav-links a"));
    const loginLink = links.find((a) =>
      (a.getAttribute("href") || "").toLowerCase().includes("login.html")
    );
    if (!loginLink) return;

    if (user) {
      loginLink.textContent = "登出";
      loginLink.addEventListener("click", (e) => {
        e.preventDefault();
        sessionStorage.removeItem("greensure_user");
        location.reload();
      });
    }
  } catch (e) {
    /* noop */
  }
})();

// ====== Helpers ======
function $(sel, root = document) {
  return root.querySelector(sel);
}
function $all(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function setValidity(el, ok, msgSel) {
  if (!el) return;
  el.classList.remove("valid", "invalid");
  const msg = msgSel ? $(msgSel) : null;

  if (ok) {
    el.classList.add("valid");
    if (msg) msg.style.display = "none";
  } else {
    el.classList.add("invalid");
    if (msg) msg.style.display = "block";
  }
}

// ====== Contact form live validation ======
(function () {
  const form = $("#contactForm");
  if (!form) return;

  const nameEl = $("#name");
  const emailEl = $("#email");
  const topicEl = $("#topic");
  const msgEl = $("#message");

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateName() {
    const ok = (nameEl.value || "").trim().length >= 2;
    setValidity(nameEl, ok, "#errName");
    return ok;
  }
  function validateEmail() {
    const ok = emailRe.test((emailEl.value || "").trim());
    setValidity(emailEl, ok, "#errEmail");
    return ok;
  }
  function validateMsg() {
    const ok = (msgEl.value || "").trim().length >= 10;
    setValidity(msgEl, ok, "#errMsg");
    return ok;
  }

  nameEl?.addEventListener("input", validateName);
  emailEl?.addEventListener("input", validateEmail);
  msgEl?.addEventListener("input", validateMsg);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const ok = [validateName(), validateEmail(), validateMsg()].every(Boolean);
    if (!ok) {
      alert("請先完成表單必填欄位（紅框處）");
      return;
    }

    // 若表單有設定外部 action（例如 Formspree / FormSubmit）就交由瀏覽器送出
    const action = (form.getAttribute("action") || "").toLowerCase();
    if (action && (action.includes("formspree.io") || action.includes("formsubmit.co"))) {
      // 使用原生 submit()，避免再次觸發 submit handler
      form.submit();
      return;
    }

    // 預設前端模擬行為
    alert("已送出（前端模擬）！我們已收到你的訊息。");
    form.reset();
    [nameEl, emailEl, topicEl, msgEl].forEach((el) => el?.classList.remove("valid", "invalid"));
    ["#errName", "#errEmail", "#errMsg"].forEach((sel) => {
      const m = $(sel);
      if (m) m.style.display = "none";
    });
  });
})();

// ====== Quote calculator (UI-only) ======
(function () {
  const calc = $("#quoteCalc");
  if (!calc) return;

  const planEl = $("#qPlan");
  const sumEl = $("#qSumInsured");
  const riskEl = $("#qRisk");
  const cyberEl = $("#qCyber");
  const sensorEl = $("#qSensor");

  const outPremium = $("#outPremium");
  const outBreakdown = $("#outBreakdown");

  function formatTWD(n) {
    return "NT$ " + Math.round(n).toLocaleString("zh-Hant");
  }

  function compute() {
    const sum = Number(sumEl?.value || 0); // 以萬為單位（示意）
    const plan = planEl?.value;

    const baseRateMap = {
      ev: 38,
      greenhome: 22,
      renew: 45,
      envliab: 30,
      cyber: 28,
    };
    const baseRate = baseRateMap[plan] ?? 30;

    const riskMap = { low: 0.9, mid: 1.0, high: 1.25 };
    const riskK = riskMap[riskEl?.value] ?? 1.0;

    let add = 0;
    if (cyberEl?.checked) add += 480;
    if (sensorEl?.checked) add -= 220;

    const base = sum * baseRate;
    const premium = Math.max(680, base * riskK + add);

    if (outPremium) outPremium.textContent = formatTWD(premium);

    if (outBreakdown) {
      const lines = [
        { k: "估算基礎費用", v: formatTWD(base) },
        { k: "風險係數", v: `× ${riskK}` },
        { k: "加減項（示意）", v: (add >= 0 ? "+" : "-") + formatTWD(Math.abs(add)) },
      ];
      outBreakdown.innerHTML = lines
        .map(
          (x) => `
          <div class="kv"><span>${x.k}</span><b>${x.v}</b></div>
        `
        )
        .join("");
    }

    return premium;
  }

  ["change", "input"].forEach((evt) => {
    [planEl, sumEl, riskEl, cyberEl, sensorEl].forEach((el) => el?.addEventListener(evt, compute));
  });

  // 初次計算
  compute();

  // 送出試算（不真送）
  const btn = $("#btnQuote");
  btn?.addEventListener("click", () => {
    const p = compute();
    alert(`已完成估算（前端模擬）\n預估年保費：${formatTWD(p)}\n\n提醒：此為作業展示用，實際保費以核保為準。`);
  });
})();

// ====== Product details modal ======
(function () {
  // 只有 products.html 需要，但放在全站也沒關係
  const modal = document.createElement("div");
  modal.className = "modal";
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

  const titleEl = modal.querySelector(".modal-title");
  const bodyEl = modal.querySelector(".modal-body");
  const closeBtn = modal.querySelector(".modal-close");

  function openDetail(targetId) {
    const tpl = document.getElementById(targetId);
    if (!tpl) return;

    titleEl.textContent = tpl.querySelector("h3")?.textContent || "";
    bodyEl.innerHTML = tpl.innerHTML;

    // 移除 body 內第一個 h3，避免重複
    const firstH = bodyEl.querySelector("h3");
    if (firstH) firstH.remove();

    modal.classList.add("open");
  }

  function close() {
    modal.classList.remove("open");
  }

  // bind product cards
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-target");
      if (id) openDetail(id);
    });
  });

  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
})();

// ====== Login UI-only ======
(function () {
  const wrap = $("#loginUI");
  if (!wrap) return;

  const tabs = $all("[data-tab]", wrap);
  const panes = $all("[data-pane]", wrap);

  function setTab(key) {
    tabs.forEach((b) => b.classList.toggle("active", b.dataset.tab === key));
    panes.forEach((p) => p.classList.toggle("hidden", p.dataset.pane !== key));
  }

  tabs.forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));

  setTab("personal");

  $all("form", wrap).forEach((f) => {
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = (f.querySelector('input[type="email"]')?.value || "").trim() || "demo@local";
      sessionStorage.setItem("greensure_user", email);
      alert("登入成功（UI 模擬）！將導回首頁。");
      location.href = "index.html";
    });
  });
})();

// ===== FAQ accordion (ONLY ONE handler, no double toggle) =====
// 特色：點一下開啟；再點同一題會關閉；同時會自動關閉其他題
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".faq-q");
  if (!btn) return;

  const item = btn.closest(".faq-item");
  if (!item) return;

  const isOpen = item.classList.contains("open");

  // 關閉其他題
  document.querySelectorAll(".faq-item.open").forEach((i) => {
    if (i !== item) i.classList.remove("open");
  });

  // 切換自己
  if (isOpen) item.classList.remove("open");
  else item.classList.add("open");
});
//test
(function(){
  const log = document.getElementById("chatLog");
  const input = document.getElementById("chatInput");
  const send = document.getElementById("chatSend");
  const hint = document.getElementById("chatHint");
  if(!log || !input || !send) return;

  const MODEL = "mistral:latest";
  const API = "http://127.0.0.1:11434/api/chat";

  function add(role, text){
    const div = document.createElement("div");
    div.className = "card";
    div.style.boxShadow = "none";
    div.style.borderRadius = "12px";
    div.innerHTML = `<b>${role==="user" ? "你" : "GreenSure AI"}</b><div class="small" style="margin-top:6px; white-space:pre-wrap;">${text}</div>`;
    log.appendChild(div);
    div.scrollIntoView({behavior:"smooth", block:"end"});
  }

  async function ask(msg){
    add("user", msg);
    hint.textContent = "AI 回覆中…（需本機 Ollama 開啟）";

    const payload = {
      model: MODEL,
      stream: false,
      messages: [
        { role:"system", content:"你是 GreenSure 綠色保險展示網站的 AI 客服。請用繁體中文、條列清楚、回答聚焦在：綠色保險、永續、資安、產品情境、投保流程、FAQ。若問題超出範圍，請引導使用者到 FAQ/產品頁。" },
        { role:"user", content: msg }
      ]
    };

    try{
      const res = await fetch(API, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(payload)
      });
      if(!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      add("assistant", data?.message?.content || "（沒有回覆內容）");
      hint.textContent = "";
    }catch(err){
      hint.textContent = "連不到本機 Ollama（可能 CORS 或 Ollama 沒開）。建議用 VSCode Live Server 在本機展示。";
      add("assistant", "目前無法連線到本機 AI（展示用）。");
      console.error(err);
    }
  }

  send.addEventListener("click", ()=>{
    const msg = input.value.trim();
    if(!msg) return;
    input.value = "";
    ask(msg);
  });
  input.addEventListener("keydown", (e)=>{ if(e.key==="Enter") send.click(); });

  add("assistant", "嗨！我是 GreenSure AI（本機示範）。你可以問：綠色保險與傳統差異？為何要納入資安？投保流程怎麼走？");
})();

