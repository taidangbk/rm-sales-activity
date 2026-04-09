// ========== CYBER VIB - APP LOGIC ==========

const TEAM_DATA = {
  "Hoa Lý": ["Mỹ Duyên", "Trúc Linh", "Minh Nhật", "Hoàng Huy"],
  "Văn Thạch": ["Quế Đô", "Văn Trí", "Hồng Nhung", "Thùy Dung"],
  "Đức Tài": ["Mỹ Thẩm", "Chiu Sa", "Tuấn Thanh", "Tuấn Kiệt", "Kim Phượng", "Trang Đài"]
};

const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwZZRM1Eukb6zRRDAPseKxfr-tl3TVP1koYAMHcUtCEDY3nvYSM9aZEoy5oLCcE5ZIZ/exec";

let rawData = [];
let userIdentity = JSON.parse(localStorage.getItem('vib_rm_identity') || '{}');

// 1. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  checkIdentity();
  updateClock();
  setInterval(updateClock, 1000);
  setGreeting();
  renderChecklist();
  fetchGlobalData(); // To render Hall of Fame & Personal Stats
});

// 2. IDENTITY SYSTEM (Zero-Login)
function checkIdentity() {
  const modal = document.getElementById('identity-modal');
  if (!userIdentity.name) {
    modal.style.display = 'flex';
  } else {
    modal.style.display = 'none';
    document.getElementById('user-display').textContent = `RM: ${userIdentity.name}`;
    // Auto-fill report fields
    const smInput = document.getElementById('diary-sm');
    const rmInput = document.getElementById('diary-rm');
    if(smInput) smInput.value = userIdentity.sm;
    if(rmInput) rmInput.value = userIdentity.name;
  }
}

function updateSetupRMList(sm) {
  const rmSelect = document.getElementById('setup-rm');
  const ctvArea = document.getElementById('ctv-area');
  const rmLabel = document.getElementById('setup-rm-label');
  
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
  optCtv.textContent = "⭐️ Member / CTV Mới";
  rmSelect.appendChild(optCtv);

  rmSelect.onchange = (e) => {
    if (e.target.value === "CTV") {
      ctvArea.style.display = 'block';
      rmLabel.style.display = 'none';
    } else {
      ctvArea.style.display = 'none';
      rmLabel.style.display = 'block';
    }
  };
}

function saveIdentity() {
  const sm = document.getElementById('setup-sm').value;
  const rmSelect = document.getElementById('setup-rm').value;
  const ctvName = document.getElementById('setup-ctv-name').value.trim();
  
  let finalName = rmSelect;
  if (rmSelect === "CTV") {
    if (!ctvName) return alert("Vui lòng nhập họ tên CTV!");
    finalName = "CTV " + ctvName;
  }

  if (!sm || !finalName || finalName === "CTV") return alert("Vui lòng chọn đầy đủ SM và Tên!");

  userIdentity = { sm: sm, name: finalName, isNew: rmSelect === "CTV" };
  localStorage.setItem('vib_rm_identity', JSON.stringify(userIdentity));
  
  // Hide modal with effect
  document.getElementById('identity-modal').style.opacity = '0';
  setTimeout(() => {
    checkIdentity();
    showToast(`Chào mừng ${finalName} gia nhập Hub! 🚀`);
  }, 300);
}

// 3. UI & NAVIGATION
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  const navBtn = document.querySelector(`[data-page="${id}"]`);
  if (navBtn) navBtn.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleCard(header) {
  const body = header.nextElementSibling;
  const icon = header.querySelector('.icon');
  if (body.style.display === 'none') {
    body.style.display = 'block';
    icon.textContent = '▲';
  } else {
    body.style.display = 'none';
    icon.textContent = '▼';
  }
}

function openAccordion(id) {
  showPage('sales');
  setTimeout(() => {
    const el = document.getElementById(id);
    if(el) {
       const body = el.querySelector('.card-body');
       if(body) {
           body.style.display = 'block';
           el.scrollIntoView({ behavior: 'smooth' });
       }
    }
  }, 100);
}

// 4. DATA FETCHING & HALL OF FAME
async function fetchGlobalData() {
  try {
    const res = await fetch(WEBHOOK_URL);
    if (!res.ok) return;
    rawData = await res.json();
    renderHallOfFame();
    renderPersonalDashboard();
  } catch (e) { console.warn("Lỗi kết nối Dashboard"); }
}

function renderHallOfFame() {
  const container = document.getElementById('hall-of-fame-container');
  const todayStr = new Date().toLocaleDateString('vi-VN');
  
  // 1. Filter today's activity
  const todayData = rawData.filter(d => d['Thời gian'] && d['Thời gian'].includes(todayStr));
  
  if (todayData.length === 0) {
    container.innerHTML = `
      <div class="card glass" style="text-align:center; padding:20px; border:1px dashed var(--border);">
        <p style="font-size:13px; color:var(--text-dim);">Chưa có hoạt động nào hôm nay. Hãy là người đầu tiên bứt phá! 🚀</p>
      </div>
    `;
    return;
  }

  // 2. Aggregate counts per RM
  const activityMap = {};
  todayData.forEach(d => {
    const name = d['Tên RM'];
    if (!activityMap[name]) activityMap[name] = { name, count: 0, sm: d['SM (Quản lý)'] };
    activityMap[name].count++;
  });

  // 3. Find the King
  const sorted = Object.values(activityMap).sort((a, b) => b.count - a.count);
  const king = sorted[0];

  container.innerHTML = `
    <div class="card fame-card glass">
      <div class="fame-content">
        <div class="fame-crown">👑</div>
        <div>
          <div style="font-size:11px; font-weight:700; color:var(--text-dim); text-transform:uppercase;">Vua Hoạt Động Hôm Nay</div>
          <div class="fame-name">${king.name.toUpperCase()}</div>
          <div class="fame-stats">🔥 ${king.count} Tương tác | Team ${king.sm}</div>
        </div>
      </div>
    </div>
  `;
}

function renderPersonalDashboard() {
  if (!userIdentity.name) return;
  
  const myData = rawData.filter(d => d['Tên RM'] === userIdentity.name);
  
  // Total Pipeline
  let pipeline = 0;
  myData.forEach(d => {
     if(d['Số tiền vay']) pipeline += parseFloat(d['Số tiền vay']) || 0;
  });
  
  // Tasks (Deals not finished)
  const taskDeals = myData.filter(d => 
    d['Sản phẩm'] === 'LENDING' && 
    d['Tiến độ hồ sơ'] !== 'Chờ giải ngân' && 
    d['Tiến độ hồ sơ'] !== 'Đã phê duyệt'
  ).length;

  document.getElementById('personal-pipeline').textContent = pipeline.toFixed(1);
  document.getElementById('personal-tasks').textContent = taskDeals;
}

// 5. CLOCK & GREETING
function updateClock() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');
  const clock = document.getElementById('clock');
  if(clock) clock.textContent = `${h}:${m}:${s}`;
}

function setGreeting() {
  const h = new Date().getHours();
  let g = '🌅 Chào buổi sáng';
  if (h >= 12 && h < 18) g = '☀️ Chào buổi chiều';
  else if (h >= 18) g = '🌙 Chào buổi tối';

  const name = userIdentity.name ? `, ${userIdentity.name.split(' ').pop()}` : '';
  const greetingText = document.getElementById('greeting-text');
  if(greetingText) greetingText.textContent = g + name + '!';
  
  const dateText = document.getElementById('today-date');
  if(dateText) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateText.textContent = new Date().toLocaleDateString('vi-VN', options);
  }
}

// 6. REPORTING SYSTEM
function toggleLendingFields(product) {
  const fields = document.getElementById('lending-fields');
  if (!fields) return;
  fields.style.display = (product === 'LENDING') ? 'block' : 'none';
}

async function submitDiary() {
  const sm = document.getElementById('diary-sm').value;
  const rm = document.getElementById('diary-rm').value;
  const customer = document.getElementById('diary-customer').value.trim();
  const type = document.getElementById('diary-type').value;
  const product = document.getElementById('diary-product').value;
  const method = document.getElementById('diary-method').value;
  const result = document.getElementById('diary-result').value.trim();
  const amount = document.getElementById('diary-amount').value;
  const progress = document.getElementById('diary-progress').value;
  
  if (!customer || !result) return showToast("⚠️ Thiếu tên khách hoặc ghi chú!");

  const btn = document.getElementById('btn-submit-diary');
  btn.innerHTML = '⏳ ĐANG ĐỒNG BỘ...';
  btn.disabled = true;

  const payload = {
    date: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN'),
    sm, rm, customer, type, product, method, result,
    amount: product === 'LENDING' ? amount : '',
    progress: product === 'LENDING' ? progress : ''
  };

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    showToast('🚀 Báo cáo thành công! Check King ngay!');
    btn.innerHTML = '✅ ĐÃ GỬI THÀNH CÔNG';
    
    // Refresh stats
    fetchGlobalData();
    
    setTimeout(() => {
      btn.innerHTML = 'XÁC NHẬN & GỬI 🚀';
      btn.disabled = false;
      document.getElementById('diary-customer').value = '';
      document.getElementById('diary-result').value = '';
    }, 2000);
  } catch (e) {
    showToast('❌ Lỗi gửi dữ liệu!');
    btn.disabled = false;
  }
}

// 7. COUNTERS & STATS
let localStats = JSON.parse(localStorage.getItem('vib_daily_stats') || '{}');
const todayKey = new Date().toDateString();

if (localStats.date !== todayKey) {
  localStats = { date: todayKey, calls: 0, meets: 0, files: 0, refs: 0 };
}

function incrementStat(key) {
  localStats[key]++;
  localStorage.setItem('vib_daily_stats', JSON.stringify(localStats));
  updateStatUI();
  // Effect
  const el = document.getElementById('stat-' + key);
  el.style.color = 'var(--neon-green)';
  setTimeout(() => el.style.color = 'var(--neon-blue)', 500);
}

function updateStatUI() {
  if(document.getElementById('stat-calls')) {
    document.getElementById('stat-calls').textContent = localStats.calls;
    document.getElementById('stat-meets').textContent = localStats.meets;
    document.getElementById('stat-files').textContent = localStats.files;
    document.getElementById('stat-refs').textContent = localStats.refs;
  }
}
updateStatUI();

// 8. HELPERS
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function renderChecklist() {
    const list = document.getElementById('checklist-daily');
    if(!list) return;
    const items = [
        "08:00 - Review Pipeline & Gọi Lead mới",
        "10:00 - Đi gặp khách hàng/định giá",
        "14:00 - Tư vấn giải pháp vốn SME/BĐS",
        "16:30 - Chăm sóc KH cũ & Xin Referral",
        "17:30 - Báo cáo & Lên lịch ngày mai"
    ];
    list.innerHTML = items.map((it, i) => `
        <div style="display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid var(--border);">
            <input type="checkbox" style="width:20px; height:20px; accent-color:var(--neon-blue);">
            <span style="font-size:13px; color:var(--text);">${it}</span>
        </div>
    `).join('');
}

// 9. AI CHAT (PROXY)
async function sendGemini() {
    const input = document.getElementById('ai-chat-input');
    const text = input.value.trim();
    if(!text) return;
    
    addMsg('user', text);
    input.value = '';
    
    // Simple mock logic for AI feedback (User can integrate actual Gemini key if needed)
    setTimeout(() => {
        addMsg('bot', "🤖 Tôi đang phân tích yêu cầu của bạn... Để chốt deal này hiệu quả, hãy nhấn mạnh vào biên độ lãi suất 3.0% cố định của VIB nhé!");
    }, 1000);
}

function addMsg(role, text) {
    const chat = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.style.marginBottom = '10px';
    div.style.textAlign = role === 'user' ? 'right' : 'left';
    div.innerHTML = `<span style="display:inline-block; padding:8px 14px; border-radius:12px; background:${role === 'user' ? 'var(--neon-blue)' : 'var(--surface)'}; font-size:13px;">${text}</span>`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}
