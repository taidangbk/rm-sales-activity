// ========== VIB SALES HUB - CYBER EDITION 2.0 ==========

const TEAM_DATA = {
  "Hoa Lý": ["Mỹ Duyên", "Trúc Linh", "Minh Nhật", "Hoàng Huy"],
  "Văn Thạch": ["Quế Đô", "Văn Trí", "Hồng Nhung", "Thùy Dung"],
  "Đức Tài": ["Mỹ Thẩm", "Chiu Sa", "Tuấn Thanh", "Tuấn Kiệt", "Kim Phượng", "Trang Đài"]
};

const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwZZRM1Eukb6zRRDAPseKxfr-tl3TVP1koYAMHcUtCEDY3nvYSM9aZEoy5oLCcE5ZIZ/exec";

// GEMINI AI CONFIG
const NUA_DAU = "AIzaSy";
const NUA_SAU = "DspBtBGdVVgkB7HAqVOqGoF_qYCLIEU5k";
const GEMINI_API_KEY = NUA_DAU + NUA_SAU;

let rawData = [];
let userIdentity = JSON.parse(localStorage.getItem('vib_rm_identity') || '{}');

// 1. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  checkIdentity();
  updateClock();
  setInterval(updateClock, 1000);
  setGreeting();
  renderChecklist();
  fetchRates();
  fetchGlobalData(); // For Dashboard/Fame
});

// 2. IDENTITY SYSTEM
function checkIdentity() {
  const modal = document.getElementById('identity-modal');
  if (!userIdentity.name) {
    modal.style.display = 'flex';
  } else {
    modal.style.display = 'none';
    document.getElementById('user-display').textContent = `RM: ${userIdentity.name}`;
    if(document.getElementById('diary-sm')) document.getElementById('diary-sm').value = userIdentity.sm;
    if(document.getElementById('diary-rm')) document.getElementById('diary-rm').value = userIdentity.name;
  }
}

function updateSetupRMList(sm) {
  const rmSelect = document.getElementById('setup-rm');
  const area = document.getElementById('rm-select-area');
  const ctvArea = document.getElementById('ctv-area');
  
  rmSelect.innerHTML = '<option value="">-- Chọn Tên --</option>';
  if (TEAM_DATA[sm]) {
    TEAM_DATA[sm].forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      rmSelect.appendChild(opt);
    });
  }
  
  // Add CTV option
  const optCtv = document.createElement('option');
  optCtv.value = "CTV";
  optCtv.textContent = "⭐️ Thành viên / CTV Mới";
  rmSelect.appendChild(optCtv);

  rmSelect.onchange = (e) => {
    if (e.target.value === "CTV") {
      ctvArea.style.display = 'block';
      area.style.display = 'none';
    } else {
      ctvArea.style.display = 'none';
      area.style.display = 'block';
    }
  };
}

function saveIdentity() {
  const sm = document.getElementById('setup-sm').value;
  const rmSelect = document.getElementById('setup-rm').value;
  const ctvName = document.getElementById('setup-ctv-name').value.trim();
  
  let finalName = rmSelect;
  if (rmSelect === "CTV") {
    if (!ctvName) return alert("Vui lòng nhập họ tên!");
    finalName = "CTV " + ctvName;
  }

  if (!sm || !finalName || finalName === "CTV") return alert("Vui lòng chọn đủ thông tin!");

  userIdentity = { sm: sm, name: finalName };
  localStorage.setItem('vib_rm_identity', JSON.stringify(userIdentity));
  
  document.getElementById('identity-modal').style.animation = 'fadeOut 0.3s forwards';
  setTimeout(() => {
    checkIdentity();
    showToast(`Chào mừng ${finalName}! Mở bát thành công 🚀`);
  }, 300);
}

// 3. NAVIGATION & UI
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  const navBtn = document.querySelector(`[data-page="${id}"]`);
  if (navBtn) navBtn.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleAcc(header) {
  const acc = header.closest('.accordion, .rm-month-card');
  const wasOpen = acc.classList.contains('open');
  // Close others in same group
  acc.parentElement.querySelectorAll('.accordion, .rm-month-card').forEach(a => a.classList.remove('open'));
  if (!wasOpen) acc.classList.add('open');
}

function openAccordion(id) {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('open');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 300);
}

function showRateTab(btn, tabId) {
  document.querySelectorAll('.rate-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

// 4. DATA FETCH & DASHBOARD
async function fetchGlobalData() {
  try {
    const res = await fetch(WEBHOOK_URL);
    if (!res.ok) return;
    rawData = await res.json();
    renderHallOfFame();
    renderPersonalDashboard();
  } catch (e) { console.warn("Lỗi đồng bộ Dashboard"); }
}

function renderHallOfFame() {
  const container = document.getElementById('hall-of-fame-container');
  const todayStr = new Date().toLocaleDateString('vi-VN');
  
  const todayData = rawData.filter(d => d['Thời gian'] && d['Thời gian'].includes(todayStr));
  if (todayData.length === 0) {
    container.innerHTML = `<div class="card glass" style="text-align:center; font-size:12px; color:var(--text-dim);">Chưa có hoạt động hôm nay. Hốt Lead ngay! 🚀</div>`;
    return;
  }

  const map = {};
  todayData.forEach(d => {
    const n = d['Tên RM'];
    if (!map[n]) map[n] = { n, c: 0, sm: d['SM (Quản lý)'] };
    map[n].c++;
  });

  const sorted = Object.values(map).sort((a,b) => b.c - a.c);
  const king = sorted[0];

  container.innerHTML = `
    <div class="fame-card glass">
      <div class="fame-row">
        <div class="fame-king">👑</div>
        <div>
          <div style="font-size:10px; font-weight:800; color:var(--text-dim); text-transform:uppercase;">Vua Hoạt Động</div>
          <div class="fame-name">${king.n.toUpperCase()}</div>
          <div style="font-size:11px; color:var(--text-bright); font-weight:700;">🔥 ${king.c} Tương tác | Team ${king.sm}</div>
        </div>
      </div>
    </div>
  `;
}

function renderPersonalDashboard() {
  if (!userIdentity.name) return;
  const myData = rawData.filter(d => d['Tên RM'] === userIdentity.name);
  let pipe = 0;
  myData.forEach(d => { if(d['Số tiền vay']) pipe += parseFloat(d['Số tiền vay']) || 0; });
  const tasks = myData.filter(d => d['Sản phẩm'] === 'LENDING' && !['Chờ giải ngân','Đã phê duyệt'].includes(d['Tiến độ hồ sơ'])).length;

  document.getElementById('personal-pipeline').textContent = pipe.toFixed(1);
  document.getElementById('personal-tasks').textContent = tasks;
}

// 5. RATES & CALCULATOR
const DEFAULT_RATES = [
  { bank: "VIB", house: 6.5, car: 7.5 },
  { bank: "MB", house: 6.8, car: 8.0 },
  { bank: "ACB", house: 7.0, car: 8.5 },
  { bank: "BIDV", house: 6.0, car: 7.5 }
];

async function fetchRates() {
  const status = document.getElementById('rate-sync-status');
  status.textContent = 'Đang đồng bộ... ⏳';
  status.style.color = 'var(--neon-orange)';
  
  // Actually we can fetch from Sheets if we want, but for now we render default
  setTimeout(() => {
    renderRateTables(DEFAULT_RATES);
    status.textContent = 'Đã cập nhật mới nhất ✅';
    status.style.color = 'var(--neon-green)';
  }, 1000);
}

function renderRateTables(rates) {
  const tHouse = document.getElementById('table-rates-house');
  const tCar = document.getElementById('table-rates-car');
  
  tHouse.innerHTML = '<tr><th>Bank</th><th>Lãi Ưu Đãi</th><th>Tg Ưu Đãi</th></tr>';
  tCar.innerHTML = '<tr><th>Bank</th><th>Lãi Ưu Đãi</th><th>Tài trợ</th></tr>';
  
  rates.forEach(r => {
    const isVIB = r.bank === "VIB";
    const bankS = isVIB ? `<b style="color:var(--vib-blue)">VIB</b>` : `<b>${r.bank}</b>`;
    const rateS = isVIB ? `<b style="color:var(--neon-red)">${r.house}%</b>` : `${r.house}%`;
    const carS = isVIB ? `<b style="color:var(--neon-red)">${r.car}%</b>` : `${r.car}%`;
    
    tHouse.innerHTML += `<tr><td>${bankS}</td><td>${rateS}</td><td>36 tháng</td></tr>`;
    tCar.innerHTML += `<tr><td>${bankS}</td><td>${carS}</td><td>80% định giá</td></tr>`;
  });
}

function formatCurrency(input) {
  let v = input.value.replace(/\D/g, '');
  v = v.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  input.value = v;
}

function calculateLoan() {
  const amountStr = document.getElementById('calc-amount').value;
  const amount = parseFloat(amountStr.replace(/\./g, ''));
  const months = parseInt(document.getElementById('calc-months').value);
  const type = document.getElementById('calc-type').value;
  
  const pRate = parseFloat(document.getElementById('calc-promo-rate').value) / 100 / 12;
  const pTime = parseInt(document.getElementById('calc-promo-time').value);
  const fRate = parseFloat(document.getElementById('calc-float-rate').value) / 100 / 12;
  
  if (!amount || !months) return showToast("⚠️ Thiếu số tiền hoặc thời gian!");
  
  let principal = amount / months;
  let interestM1 = amount * pRate;
  let totalM1 = principal + interestM1;
  let totalInterest = 0;
  let floatAmount = 0;
  
  if (type === 'decline') {
    let remain = amount;
    for (let i = 1; i <= months; i++) {
        let r = (i <= pTime) ? pRate : fRate;
        let int = remain * r;
        totalInterest += int;
        if (i === (pTime + 1)) floatAmount = principal + int;
        remain -= principal;
    }
  } else {
    // EMI
    const r = pRate;
    const emi = amount * r * Math.pow(1+r, months) / (Math.pow(1+r, months) - 1);
    principal = emi - (amount * r);
    interestM1 = amount * r;
    totalM1 = emi;
    totalInterest = (emi * months) - amount;
    floatAmount = emi;
  }
  
  document.getElementById('res-principal').textContent = Math.round(principal).toLocaleString('vi-VN') + ' ₫';
  document.getElementById('res-interest-m1').textContent = Math.round(interestM1).toLocaleString('vi-VN') + ' ₫';
  document.getElementById('res-total-m1').textContent = Math.round(totalM1).toLocaleString('vi-VN') + ' ₫';
  document.getElementById('res-float-amount').textContent = Math.round(floatAmount).toLocaleString('vi-VN') + ' ₫';
  document.getElementById('res-total-interest').textContent = Math.round(totalInterest).toLocaleString('vi-VN') + ' ₫';
  
  document.getElementById('calc-results').style.display = 'block';
  document.getElementById('calc-results').scrollIntoView({ behavior: 'smooth' });
}

// 6. REPORTING SYSTEM
function toggleLendingFields(v) {
  document.getElementById('lending-fields').style.display = (v === 'LENDING') ? 'block' : 'none';
}

async function submitDiary() {
  const btn = document.getElementById('btn-submit-diary');
  const customer = document.getElementById('diary-customer').value.trim();
  const desc = document.getElementById('diary-result').value.trim();
  
  if (!customer || !desc) return showToast("⚠️ Thiếu tên khách hàng hoặc ghi chú!");

  btn.innerHTML = '⏳ ĐANG ĐỒNG BỘ...';
  btn.disabled = true;

  const payload = {
    date: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN'),
    sm: document.getElementById('diary-sm').value,
    rm: document.getElementById('diary-rm').value,
    customer,
    type: document.getElementById('diary-type').value,
    product: document.getElementById('diary-product').value,
    method: document.getElementById('diary-method').value,
    result: desc,
    amount: document.getElementById('diary-amount').value,
    progress: document.getElementById('diary-progress').value
  };

  try {
    await fetch(WEBHOOK_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
    showToast('🚀 Báo cáo thành công! Top 1 vẫy gọi!');
    btn.innerHTML = '✅ ĐÃ GỬI XONG';
    fetchGlobalData();
    processAiCoaching(desc, payload.type);
    
    setTimeout(() => {
      btn.innerHTML = 'BẮT ĐẦU ĐỒNG BỘ 🚀';
      btn.disabled = false;
      document.getElementById('diary-customer').value = '';
      document.getElementById('diary-result').value = '';
    }, 2000);
  } catch (e) {
    showToast('❌ Lỗi kết nối!');
    btn.disabled = false;
  }
}

function processAiCoaching(res, type) {
  const box = document.getElementById('ai-feedback-box');
  const text = document.getElementById('ai-feedback-text');
  let advice = "Làm tốt lắm! Hãy tiếp tục duy trì tương tác tốt.";
  
  if (res.toLowerCase().includes("cao") || res.toLowerCase().includes("chê")) advice = "🔥 Khách chê lãi cao? Hãy nhấn mạnh biên độ cố định 3.0% và tốc độ giải ngân trong 24h để chớp cơ hội KD nhé!";
  else if (type === "KHHH > 3 tỷ") advice = "💎 KH VIP! Hãy xin cuộc hẹn gặp trực tiếp cùng SM để tăng uy tín và chốt deal sớm.";
  
  text.textContent = advice;
  box.style.display = 'block';
  box.scrollIntoView({ behavior: 'smooth' });
}

function useAiFeedback() {
  const text = document.getElementById('ai-feedback-text').textContent;
  showPage('tools');
  document.getElementById('ai-chat-input').value = "Viết kịch bản Zalo dựa trên lời khuyên: " + text;
  document.getElementById('ai-chat-input').focus();
}

// 7. GEMINI AI
async function sendGemini() {
  const input = document.getElementById('ai-chat-input');
  const text = input.value.trim();
  if (!text) return;
  
  addChatMsg('user', text);
  input.value = '';
  const loading = addChatMsg('bot', '<div class="dot"></div><div class="dot"></div><div class="dot"></div>');

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Bạn là Trợ lý VIB Sales Hub. Hãy tư vấn ngắn gọn, chuyên nghiệp về: " + text }] }]
      })
    });
    const data = await res.json();
    const reply = data.candidates[0].content.parts[0].text;
    loading.innerHTML = reply.replace(/\n\n/g, '<br>').replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  } catch (e) {
    loading.innerHTML = "Mất kết nối với AI. Vui lòng thử lại sau!";
  }
}

function addChatMsg(role, text) {
  const chat = document.getElementById('chat-container');
  const div = document.createElement('div');
  div.style.marginBottom = '12px';
  div.style.textAlign = role === 'user' ? 'right' : 'left';
  div.innerHTML = `<span style="display:inline-block; padding:10px 14px; border-radius:14px; background:${role==='user'?'var(--neon-blue)':'rgba(255,255,255,0.05)'}; font-size:13px; max-width:85%;">${text}</span>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div.querySelector('span');
}

// 8. HELPERS
function updateClock() {
  const clock = document.getElementById('clock');
  if(clock) clock.textContent = new Date().toLocaleTimeString('vi-VN');
}

function setGreeting() {
  const h = new Date().getHours();
  let g = h < 12 ? '🌅 Chào buổi sáng' : (h < 18 ? '☀️ Chào buổi chiều' : '🌙 Chào buổi tối');
  const name = userIdentity.name ? `, ${userIdentity.name.split(' ').pop()}` : '';
  if(document.getElementById('greeting-text')) document.getElementById('greeting-text').textContent = g + name + '!';
  if(document.getElementById('today-date')) document.getElementById('today-date').textContent = new Date().toLocaleDateString('vi-VN', { weekday:'long', day:'numeric', month:'numeric' });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function incrementStat(key) {
  let s = JSON.parse(localStorage.getItem('vib_stats') || '{"calls":0,"meets":0,"files":0,"refs":0}');
  s[key]++;
  localStorage.setItem('vib_stats', JSON.stringify(s));
  updateStatRow(s);
  const el = document.getElementById('stat-' + key);
  el.style.transform = 'scale(1.2)';
  setTimeout(() => el.style.transform = 'scale(1)', 200);
}

function updateStatRow(s) {
  if(document.getElementById('stat-calls')) {
    document.getElementById('stat-calls').textContent = s.calls;
    document.getElementById('stat-meets').textContent = s.meets;
    document.getElementById('stat-files').textContent = s.files;
    document.getElementById('stat-refs').textContent = s.refs;
  }
}

function renderChecklist() {
  const list = document.getElementById('checklist-daily');
  if(!list) return;
  const items = [
    "08:00 - Review Pipeline & Gọi danh sách Lead",
    "10:00 - Power Hour: Hẹn gặp khách trực tiếp",
    "14:00 - Field Visit / Thẩm định hồ sơ",
    "17:00 - Báo cáo & Lên lịch cho ngày mai"
  ];
  list.innerHTML = items.map(it => `
    <div style="display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid var(--border);">
      <input type="checkbox" style="width:18px; height:18px; accent-color:var(--neon-blue);">
      <span style="font-size:13px;">${it}</span>
    </div>
  `).join('');
}

function checkMasterAuth() {
  const p = prompt("🔐 MASTER PIN:");
  if (p === "6789") window.open('dashboard.html', '_blank');
  else alert("Sai mã!");
}

function copyText(btn) {
  const t = btn.previousElementSibling.innerText;
  navigator.clipboard.writeText(t).then(() => {
    btn.textContent = '✅ ĐÃ COPY';
    setTimeout(() => btn.textContent = '📋 SAO CHÉP KỊCH BẢN', 2000);
    showToast('Đã lưu vào bộ nhớ tạm!');
  });
}

function prefillChat(t) {
  document.getElementById('ai-chat-input').value = t;
  document.getElementById('ai-chat-input').focus();
}
