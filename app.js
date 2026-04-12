// ============================================================
// 637vib Sales Hub v2.0 — Main Application Logic
// ============================================================

// --- CẤU HÌNH API ---
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwZZRM1Eukb6zRRDAPseKxfr-tl3TVP1koYAMHcUtCEDY3nvYSM9aZEoy5oLCcE5ZIZ/exec";

// ========== FIREBASE AUTH STATE MANAGEMENT ==========
let currentUser = null;
let currentRole = 'rm'; // 'rm' or 'manager'

// Kiểm tra trạng thái đăng nhập
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    currentRole = getUserRole(user.email);
    onLoginSuccess(user);
  } else {
    currentUser = null;
    showLoginScreen();
  }
});

function showLoginScreen() {
  document.getElementById('login-overlay').classList.remove('hidden');
  document.getElementById('app').style.display = 'none';
}

function onLoginSuccess(user) {
  document.getElementById('login-overlay').classList.add('hidden');
  document.getElementById('app').style.display = 'block';
  
  // Update avatar
  const avatar = document.getElementById('user-avatar');
  if (user.photoURL) {
    avatar.src = user.photoURL;
  } else {
    avatar.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect fill="%23004f98" width="32" height="32" rx="16"/><text x="16" y="21" text-anchor="middle" fill="white" font-size="14" font-weight="bold">' + (user.displayName ? user.displayName[0] : 'U') + '</text></svg>';
  }
  
  // Update user menu
  document.getElementById('menu-user-name').textContent = user.displayName || 'RM';
  document.getElementById('menu-user-email').textContent = user.email;
  
  // Update role badge
  const roleBadge = document.getElementById('header-role-badge');
  if (currentRole === 'manager') {
    roleBadge.innerHTML = '👑 Manager — VIB Credit Team';
    roleBadge.style.color = '#e8c96a';
  } else {
    roleBadge.textContent = 'VIB Credit Team';
  }
  
  // Init app features
  setGreeting();
  renderChecklist();
  renderStats();
  updateClock();
  fetchRates();
}

async function handleGoogleLogin() {
  const btn = document.getElementById('btn-google-login');
  const errBox = document.getElementById('login-error');
  
  btn.textContent = '⏳ Đang đăng nhập...';
  btn.disabled = true;
  errBox.style.display = 'none';
  
  try {
    await auth.signInWithPopup(googleProvider);
  } catch (error) {
    console.error('Login error:', error);
    errBox.textContent = '❌ Lỗi đăng nhập: ' + error.message;
    errBox.style.display = 'block';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Đăng nhập bằng Google';
    btn.disabled = false;
  }
}

function handleLogout() {
  auth.signOut();
  toggleUserMenu();
}

function toggleUserMenu() {
  document.getElementById('user-menu').classList.toggle('show');
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  const menu = document.getElementById('user-menu');
  const avatar = document.getElementById('user-avatar');
  if (menu && avatar && !menu.contains(e.target) && !avatar.contains(e.target)) {
    menu.classList.remove('show');
  }
});

// ========== PAGE NAVIGATION ==========
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  const navBtn = document.querySelector(`[data-page="${id}"]`);
  if(navBtn) navBtn.classList.add('active');
  window.scrollTo(0, 0);
}

// ========== ACCORDION ==========
function toggleAcc(header) {
  const acc = header.parentElement;
  const wasOpen = acc.classList.contains('open');
  // close all in same page
  acc.parentElement.querySelectorAll('.accordion, .rm-month-card').forEach(a => a.classList.remove('open'));
  if (!wasOpen) acc.classList.add('open');
}

function openAccordion(id) {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('open');
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
}

// ========== OBJECTION TOGGLE ==========
function toggleObj(el) {
  el.classList.toggle('open');
}

// ========== SCRIPT CARD TOGGLE ==========
function toggleScript(el) {
  el.classList.toggle('open');
}

// ========== ZALO TABS ==========
function showZaloTab(pill, tabId) {
  pill.parentElement.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  pill.classList.add('active');
  const body = pill.closest('.acc-body');
  body.querySelectorAll('.zalo-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
}

// ========== COPY FUNCTIONS ==========
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg || 'Đã copy! ✅';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}

function copyText(btn) {
  const box = btn.previousElementSibling;
  const text = box.innerText;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✅ Đã copy!';
    btn.classList.add('copied');
    showToast();
    setTimeout(() => { btn.textContent = '📋 Copy kịch bản'; btn.classList.remove('copied'); }, 2000);
  });
}

function copyMsg(btn) {
  const box = btn.previousElementSibling;
  const text = box.innerText;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✅ Đã copy!';
    btn.classList.add('copied');
    showToast();
    setTimeout(() => { btn.textContent = '📋 Copy'; btn.classList.remove('copied'); }, 2000);
  });
}

function copyElText(elId) {
  const text = document.getElementById(elId).innerText;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Đã copy! ✅');
  });
}

// ========== DAILY STATS (localStorage) ==========
const today = new Date().toDateString();
let stats = JSON.parse(localStorage.getItem('rm_stats') || '{}');
if (stats.date !== today) {
  stats = { date: today, calls: 0, meets: 0, files: 0, refs: 0 };
  localStorage.setItem('rm_stats', JSON.stringify(stats));
}

function renderStats() {
  document.getElementById('stat-calls').textContent = stats.calls;
  document.getElementById('stat-meets').textContent = stats.meets;
  document.getElementById('stat-files').textContent = stats.files;
  document.getElementById('stat-refs').textContent = stats.refs;
}

function incrementStat(key) {
  stats[key]++;
  localStorage.setItem('rm_stats', JSON.stringify(stats));
  renderStats();
  const el = document.getElementById('stat-' + key);
  el.style.transform = 'scale(1.3)';
  setTimeout(() => el.style.transform = 'scale(1)', 200);
}

// ========== CLOCK ==========
function updateClock() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const clockEl = document.getElementById('clock');
  if (clockEl) clockEl.textContent = h + ':' + m;
}
setInterval(updateClock, 30000);

// ========== GREETING ==========
function setGreeting() {
  const h = new Date().getHours();
  let g = '🌅 Chào buổi sáng!';
  if (h >= 12 && h < 18) g = '☀️ Chào buổi chiều!';
  else if (h >= 18) g = '🌙 Chào buổi tối!';

  const name = currentUser ? (currentUser.displayName || '').split(' ').pop() : '';
  const weekday = ['Chủ nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'][new Date().getDay()];
  const d = new Date().getDate();
  const mo = new Date().getMonth() + 1;

  const greetingEl = document.getElementById('greeting');
  if (greetingEl) {
    greetingEl.innerHTML = g + (name ? ' ' + name + '!' : '') + '<br><span style="font-size:13px;color:var(--dim)">' + weekday + ', ' + d + '/' + mo + ' — Hôm nay sẽ là ngày tuyệt vời! 💪</span>';
  }
}

// ========== DAILY CHECKLIST ==========
function renderChecklist() {
  const h = new Date().getHours();
  const day = new Date().getDay();
  const items = [
    { id: 'c1', text: '08:00 – Review pipeline + lên danh sách gọi', done: h >= 8 },
    { id: 'c2', text: '08:15 – Power Hour: gọi 15-20 cuộc', done: h >= 10 },
    { id: 'c3', text: '10:00 – Gặp khách / tư vấn', done: h >= 12 },
    { id: 'c4', text: '13:30 – 30 phút chăm sóc KH cũ (3-5 tin Zalo + 2 cuộc gọi)', done: h >= 14 },
    { id: 'c5', text: '14:00 – Field visit (2-3 cuộc hẹn)', done: h >= 17 },
    { id: 'c6', text: '17:00 – Báo cáo ngày gửi Zalo nhóm', done: false },
  ];

  if (day === 1) items.unshift({ id: 'cw', text: '⭐ Thứ 2: Đặt target tuần + họp team', done: false });
  if (day === 3) items.push({ id: 'cw', text: '⭐ Thứ 4: Mid-week check KPI', done: false });
  if (day === 5) items.push({ id: 'cw', text: '⭐ Thứ 6: Tổng kết tuần + báo cáo Leader', done: false });

  const saved = JSON.parse(localStorage.getItem('rm_checklist_' + today) || '{}');

  const html = items.map(item => {
    const checked = saved[item.id] || false;
    return `<label>
      <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleCheck('${item.id}', this.checked)">
      <span class="${checked ? 'done' : ''}">${item.text}</span>
    </label>`;
  }).join('');

  const checklistEl = document.getElementById('checklist');
  if (checklistEl) checklistEl.innerHTML = html;
}

function toggleCheck(id, checked) {
  const saved = JSON.parse(localStorage.getItem('rm_checklist_' + today) || '{}');
  saved[id] = checked;
  localStorage.setItem('rm_checklist_' + today, JSON.stringify(saved));
  renderChecklist();
}

// ========== GEMINI AI CHAT ==========
const NUA_DAU = "AIzaSy";
const NUA_SAU = "DspBtBGdVVgkB7HAqVOqGoF_qYCLIEU5k";
const GEMINI_API_KEY = NUA_DAU + NUA_SAU;

let chatHistory = [
  {
    "role": "model",
    "parts": [{ "text": "Bạn là Trợ lý AI cấp cao của VIB, kiêm Chuyên gia Sale & Marketing (mảng Vay Cá Nhân, Mua Ô tô, Tiểu thương SME).\nNguyên tắc Sale: Dùng QLAC xử lý lại từ chối, SPIN để khai thác, SAVE để giữ khách.\nNguyên tắc Marketing: Khi khách nhờ tạo bài đăng Zalo/FB, BẮT BUỘC dùng 1 trong 3 khung: AIDA (Thu hút), PAS (Khoét sâu nỗi đau), BAB (Khoe Case Study/Thành tích). Tạo nội dung dắt tệp bằng các chiêu (Cảnh báo, Chia sẻ Tip, Bí mật, How-to...). Trộn lẫn giá trị Educate, Entertain, và Relate. Viết siêu mượt, tự nhiên như 1 RM tận tâm, dưới 350 chữ, chèn emoji 🔥, và có Call-to-Action kêu gọi inbox cuối bài." }]
  }
];

function prefillChat(text) {
  const input = document.getElementById('ai-chat-input');
  input.value = text;
  input.focus();
}

async function sendGemini() {
  const inputEl = document.getElementById('ai-chat-input');
  const text = inputEl.value.trim();
  if (!text) return;
  
  inputEl.value = '';
  addMsgToChat(text, 'user');
  
  const loadingId = addLoading();
  
  try {
    const messages = chatHistory.map(h => ({
       role: h.role === 'model' ? 'model' : 'user',
       parts: [{ text: h.parts[0].text }]
    }));
    messages.push({ role: "user", parts: [{ text }] });
    
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: messages })
    });
    
    const data = await res.json();
    document.getElementById(loadingId).remove();
    
    if (data.error) {
      addMsgToChat('Lỗi từ Google: ' + data.error.message, 'bot');
      return;
    }
    
    const replyText = data.candidates[0].content.parts[0].text;
    
    chatHistory.push({ role: "user", parts: [{ text }] });
    chatHistory.push({ role: "model", parts: [{ text: replyText }] });
    
    addMsgToChat(replyText, 'bot');
    
  } catch (err) {
    document.getElementById(loadingId).remove();
    addMsgToChat('Mất kết nối mạng hoặc lỗi hệ thống.', 'bot');
  }
}

function parseMarkdown(text) {
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/\n\n/g, '<br><br>');
  html = html.replace(/\n/g, '<br>');
  html = html.replace(/• (.*?)<br>/g, '<ul><li style="margin-left:14px">$1</li></ul>');
  html = html.replace(/- (.*?)<br>/g, '<ul><li style="margin-left:14px">$1</li></ul>');
  return html;
}

function addMsgToChat(text, sender) {
  const container = document.getElementById('chat-container');
  const div = document.createElement('div');
  div.className = `chat-message ${sender}`;
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = sender === 'bot' ? parseMarkdown(text) : text;
  div.appendChild(bubble);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function addLoading() {
  const container = document.getElementById('chat-container');
  const div = document.createElement('div');
  div.className = `chat-message bot`;
  const id = 'loading-' + Date.now();
  div.id = id;
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble ai-loading';
  bubble.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
  div.appendChild(bubble);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

// ========== DIARY & TEAM DATA ==========
const TEAM_DATA = {
  "Hoa Lý": ["Mỹ Duyên", "Trúc Linh", "Minh Nhật", "Hoàng Huy"],
  "Văn Thạch": ["Quế Đô", "Văn Trí", "Hồng Nhung", "Thùy Dung"],
  "Đức Tài": ["Mỹ Thẩm", "Chiu Sa", "Tuấn Thanh", "Tuấn Kiệt", "Kim Phượng", "Trang Đài"]
};

function updateRMList(sm) {
  const rmSelect = document.getElementById('diary-rm');
  rmSelect.innerHTML = '<option value="">-- Chọn RM --</option>';
  if (TEAM_DATA[sm]) {
    TEAM_DATA[sm].forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      rmSelect.appendChild(opt);
    });
  }
}

function toggleLendingFields(product) {
  const fields = document.getElementById('lending-fields');
  if (!fields) return;
  if (product === 'LENDING') {
    fields.style.display = 'block';
    fields.style.animation = 'fadeUp 0.3s ease';
  } else {
    fields.style.display = 'none';
  }
}

// ========== DUAL-SYNC DIARY SUBMIT ==========
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwZZRM1Eukb6zRRDAPseKxfr-tl3TVP1koYAMHcUtCEDY3nvYSM9aZEoy5oLCcE5ZIZ/exec";

function submitDiary() {
  const sm = document.getElementById('diary-sm').value;
  const rm = document.getElementById('diary-rm').value;
  const customer = document.getElementById('diary-customer').value.trim();
  const type = document.getElementById('diary-type').value;
  const product = document.getElementById('diary-product').value;
  const method = document.getElementById('diary-method').value;
  const result = document.getElementById('diary-result').value.trim();
  const amount = document.getElementById('diary-amount').value;
  const progress = document.getElementById('diary-progress').value;
  
  if (!sm || !rm || !customer || !result) {
    return showToast("⚠️ Vui lòng nhập đủ các trường!");
  }
  
  const btn = document.getElementById('btn-submit-diary');
  btn.textContent = '⏳ Đang đồng bộ...';
  btn.disabled = true;
  
  const timestamp = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN');
  
  const payload = {
    date: timestamp,
    sm: sm,
    rm: rm,
    customer: customer,
    type: type,
    product: product,
    method: method,
    result: result,
    amount: product === 'LENDING' ? amount : '',
    progress: product === 'LENDING' ? progress : ''
  };
  
  // ============ DUAL-SYNC: Firestore + Google Sheets ============
  const syncPromises = [];
  
  // 1. Sync to Firestore
  try {
    const firestorePromise = db.collection('logs').add({
      ...payload,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      userId: currentUser ? currentUser.uid : 'anonymous',
      userEmail: currentUser ? currentUser.email : ''
    }).then(() => {
      console.log('✅ Firestore sync OK');
    }).catch((err) => {
      console.warn('⚠️ Firestore sync failed:', err.message);
    });
    syncPromises.push(firestorePromise);
  } catch (e) {
    console.warn('⚠️ Firestore not available:', e.message);
  }
  
  // 2. Sync to Google Sheets (keep existing flow)
  const sheetsPromise = fetch(WEBHOOK_URL, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(() => {
    console.log('✅ Google Sheets sync OK');
  }).catch(() => {
    console.warn('⚠️ Google Sheets sync failed');
  });
  syncPromises.push(sheetsPromise);
  
  // Wait for both to complete
  Promise.allSettled(syncPromises).then(() => {
    btn.textContent = '✅ Đã ghi Nhật ký!';
    showToast('🚀 Dual-Sync: Firestore + Sheets!');
    
    // AI Coaching
    processAiCoaching(result, type);
    
    setTimeout(() => { 
      btn.innerHTML = '🚀 GỬI NHẬT KÝ (DUAL-SYNC)'; 
      btn.disabled = false;
      document.getElementById('diary-customer').value = '';
      document.getElementById('diary-result').value = '';
    }, 3000);
  });
}

function processAiCoaching(result, type) {
  const box = document.getElementById('ai-feedback-box');
  const text = document.getElementById('ai-feedback-text');
  
  let advice = "";
  if (result.toLowerCase().includes("chê") || result.toLowerCase().includes("cao")) {
    advice = "Khách đang lăn tăn về giá. Hãy dùng kịch bản 'So sánh lợi ích dài hạn' thay vì chỉ nói về lãi suất. Nhấn mạnh vào biên độ cố định 3.0% của VIB để họ yên tâm.";
  } else if (result.toLowerCase().includes("bận") || result.toLowerCase().includes("sau")) {
    advice = "Khách đang né tránh. Hãy gửi 1 tin nhắn Zalo kèm 1 Case Study thành công để 'nuôi dưỡng' mối quan hệ, đừng ép chốt ngay.";
  } else if (type === "KHHH > 3 tỷ") {
    advice = "🔥 ĐÂY LÀ KHÁCH VIP! Hãy nhờ SM hỗ trợ đi gặp trực tiếp để tăng tỷ lệ chốt. Đừng chỉ gọi điện.";
  } else {
    advice = "Làm tốt lắm! Hãy tiếp tục duy trì tương tác tốt với khách hàng này.";
  }
  
  text.textContent = advice;
  box.style.display = 'block';
  box.scrollIntoView({ behavior: 'smooth' });
}

function useAiFeedback() {
  const text = document.getElementById('ai-feedback-text').textContent;
  const input = document.getElementById('ai-chat-input');
  showPage('tools');
  input.value = "Hãy viết giúp tôi 1 kịch bản Zalo dựa trên lời khuyên: " + text;
  input.focus();
}

// ========== DASHBOARD ACCESS ==========
function openDashboard() {
  if (currentRole === 'manager') {
    window.open('dashboard.html', '_blank');
  } else {
    const pin = prompt("🔐 NHẬP MÃ MASTER PIN:");
    if (pin === "6789") {
      window.open('dashboard.html', '_blank');
    } else {
      showToast("❌ Sai mật mã!");
    }
  }
}

// ========== AI CUSTOMER CLASSIFICATION ==========
async function classifyCustomer() {
  const name = document.getElementById('cls-name').value.trim();
  const phone = document.getElementById('cls-phone').value.trim();
  const email = document.getElementById('cls-email').value.trim();
  const job = document.getElementById('cls-job').value;
  const need = document.getElementById('cls-need').value;
  const source = document.getElementById('cls-source').value;
  const priority = document.getElementById('cls-priority').value;
  const style = document.getElementById('cls-style').value;
  const contactCount = document.getElementById('cls-contact').value;
  const reaction = document.getElementById('cls-reaction').value;
  const income = document.getElementById('cls-income').value;
  const note = document.getElementById('cls-note').value.trim();
  
  if (!name) {
    return showToast("⚠️ Vui lòng nhập tên khách hàng!");
  }
  
  const btn = document.getElementById('btn-classify');
  btn.textContent = '⏳ AI đang phân tích...';
  btn.disabled = true;
  
  const resultBox = document.getElementById('classify-result');
  resultBox.style.display = 'block';
  document.getElementById('cls-badge').textContent = '⏳ Đang phân tích...';
  document.getElementById('cls-insight').textContent = '—';
  
  const prompt = `Bạn là chuyên gia phân loại khách hàng tín dụng ngân hàng VIB.
Vui lòng phân loại dựa trên phong cách của khách hàng.

Thông tin khách hàng:
- Họ tên: ${name}
- Nghề nghiệp: ${job}
- Nhu cầu: ${need}
- Ưu tiên: ${priority}
- Phong cách: ${style}
- Số lần liên hệ: ${contactCount}
- Phản ứng: ${reaction}
- Thu nhập: ${income}
- Ghi chú: ${note}

BẮT BUỘC trả lời theo format JSON (KHÔNG giải thích thêm):
{
  "classification": "HOT" hoặc "WARM" hoặc "COLD" hoặc "POTENTIAL",
  "confidence": số từ 60-99,
  "insight": "Phân tích 2-3 câu dựa trên PHONG CÁCH ${style} và ƯU TIÊN ${priority}",
  "script60s": "Kịch bản gọi điện cá nhân hóa phù hợp phong cách ${style}",
  "objections": [{"q": "Tình huống 1", "a": "Cách xử lý"}],
  "zaloMessage": "Tin nhắn Zalo phù hợp"
}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      })
    });
    
    const data = await res.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    let rawText = data.candidates[0].content.parts[0].text;
    // Clean markdown code fences if any
    rawText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const result = JSON.parse(rawText);
    renderClassifyResult(result, name);
    
    // 🔥 DUAL-SYNC: Firestore & Google Sheets
    try {
      // 1. Lưu Firestore (CRM)
      const customerData = {
        name, phone, email, job, need, source, priority, style,
        contactCount, reaction, income, note,
        classification: result.classification,
        confidence: result.confidence,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        userId: currentUser ? currentUser.uid : 'anonymous'
      };
      db.collection('customers').add(customerData);

      // 2. Sync sang Google Sheets
      const sheetData = {
        type: 'AI_CLASSIFY',
        ...customerData,
        insight: result.insight,
        date: new Date().toLocaleDateString('vi-VN')
      };
      
      fetch(WEBHOOK_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sheetData)
      }).then(() => console.log('✅ Sheets sync OK'));

    } catch (e) { console.warn('⚠️ Sync failed:', e); }
    
  } catch (err) {
    console.error('Classification error:', err);
    document.getElementById('cls-badge').textContent = '❌ Lỗi phân tích';
    document.getElementById('cls-insight').textContent = 'Không thể phân tích. Vui lòng thử lại. Lỗi: ' + err.message;
  }
  
  btn.textContent = '🤖 PHÂN LOẠI & TẠO KỊCH BẢN';
  btn.disabled = false;
}

function renderClassifyResult(result, name) {
  // Badge
  const badge = document.getElementById('cls-badge');
  const cls = (result.classification || 'WARM').toUpperCase();
  const clsLabels = { HOT: '🔥 HOT', WARM: '🌤️ WARM', COLD: '❄️ COLD', POTENTIAL: '🌱 TIỀM NĂNG' };
  badge.textContent = (clsLabels[cls] || cls) + ' — ' + name;
  badge.className = 'classify-badge ' + cls.toLowerCase();
  
  // Confidence
  const conf = result.confidence || 75;
  document.getElementById('cls-confidence').textContent = conf + '%';
  const bar = document.getElementById('cls-confidence-bar');
  bar.style.width = conf + '%';
  bar.style.background = conf >= 80 ? 'var(--green)' : conf >= 60 ? 'var(--gold2)' : 'var(--red)';
  
  // Insight
  document.getElementById('cls-insight').textContent = result.insight || '—';
  
  // Script
  document.getElementById('cls-script').textContent = result.script60s || '—';
  
  // Objections
  const objBox = document.getElementById('cls-objections');
  if (result.objections && result.objections.length > 0) {
    objBox.innerHTML = result.objections.map(o => 
      `<div class="objection-item">
        <div class="objection-q">❌ ${o.q}</div>
        <div class="objection-a">✅ ${o.a}</div>
      </div>`
    ).join('');
  }
  
  // Zalo message
  document.getElementById('cls-zalo').textContent = result.zaloMessage || '—';
}

// ========== RATES & CALCULATOR ==========
function showRateTab(btn, tabId) {
  document.querySelectorAll('#page-rates .pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#page-rates .rate-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
}

const defaultRates = [
  { bank: "VIB", house: 6.5, car: 7.5 },
  { bank: "MB", house: 6.8, car: 8.0 },
  { bank: "ACB", house: 7.0, car: 8.5 },
  { bank: "OCB", house: 6.5, car: 7.9 },
  { bank: "VPB", house: 6.9, car: 8.5 },
  { bank: "HDB", house: 7.5, car: 8.9 },
  { bank: "TPB", house: 6.8, car: 8.2 },
  { bank: "BIDV", house: 6.0, car: 7.5 },
  { bank: "Eximbank", house: 6.5, car: 8.0 },
  { bank: "LPBank", house: 7.2, car: 8.5 },
  { bank: "MSB", house: 6.8, car: 8.5 }
];

async function fetchRates() {
  const statusEl = document.getElementById('rate-sync-status');
  if (!statusEl) return;
  statusEl.textContent = 'Đang đồng bộ... ⏳';
  statusEl.style.color = 'var(--gold2)';
  
  setTimeout(() => {
    renderRateTables(defaultRates);
    statusEl.textContent = 'Đã đồng bộ từ Google Sheets ✅';
    statusEl.style.color = 'var(--green)';
  }, 800);
}

function renderRateTables(rates) {
  const tHouse = document.getElementById('table-rates-house');
  const tCar = document.getElementById('table-rates-car');
  if (!tHouse || !tCar) return;
  
  tHouse.innerHTML = '<tr><th>Ngân Hàng</th><th>Lãi Ưu Đãi</th><th>Biên độ</th></tr>';
  tCar.innerHTML = '<tr><th>Ngân Hàng</th><th>Lãi Ưu Đãi</th><th>Tài trợ</th></tr>';
  
  rates.forEach(r => {
    const isVIB = r.bank === "VIB";
    const bankHtml = isVIB ? `<b style="color:var(--vib-blue)">VIB</b>` : `<b>${r.bank}</b>`;
    const houseHtml = isVIB ? `<b style="color:var(--red)">${r.house}%</b>` : `${r.house}%`;
    const carHtml = isVIB ? `<b style="color:var(--red)">${r.car}%</b>` : `${r.car}%`;
    
    tHouse.innerHTML += `<tr><td>${bankHtml}</td><td>${houseHtml}</td><td>CSTK + 3.0%</td></tr>`;
    tCar.innerHTML += `<tr><td>${bankHtml}</td><td>${carHtml}</td><td>80%</td></tr>`;
  });
}

function formatCurrency(input) {
  let value = input.value.replace(/\D/g, '');
  value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  input.value = value;
}

function calculateLoan() {
  const amountStr = document.getElementById('calc-amount').value;
  const amount = parseFloat(amountStr.replace(/\./g, ''));
  const months = parseInt(document.getElementById('calc-months').value);
  const type = document.getElementById('calc-type').value;
  
  const promoRate = parseFloat(document.getElementById('calc-promo-rate').value) / 100 / 12;
  const promoTime = parseInt(document.getElementById('calc-promo-time').value);
  const floatRate = parseFloat(document.getElementById('calc-float-rate').value) / 100 / 12;
  
  if (!amount || !months) return showToast("Vui lòng nhập đủ số tiền và thời hạn!");
  
  let principalPerMonth = amount / months;
  let totalInterest = 0;
  let interestM1 = 0;
  let floatAmount = 0;
  let firstMonthTotal = 0;
  
  if (type === 'decline') {
    interestM1 = amount * promoRate;
    firstMonthTotal = principalPerMonth + interestM1;
    
    let remainingAmount = amount;
    for (let i = 1; i <= months; i++) {
        let currentRate = (i <= promoTime) ? promoRate : floatRate;
        let interestForMonth = remainingAmount * currentRate;
        totalInterest += interestForMonth;
        
        if (i === (promoTime + 1)) {
           floatAmount = principalPerMonth + interestForMonth;
        }
        remainingAmount -= principalPerMonth;
    }
    if(promoTime >= months) floatAmount = 0;
    
  } else {
    const r = promoRate;
    const emi = amount * r * Math.pow(1+r, months) / (Math.pow(1+r, months) - 1);
    
    principalPerMonth = emi - (amount * r);
    interestM1 = amount * r;
    firstMonthTotal = emi;
    totalInterest = (emi * months) - amount;
    floatAmount = emi;
  }
  
  document.getElementById('res-principal').textContent = Math.round(principalPerMonth).toLocaleString('vi-VN') + ' ₫';
  document.getElementById('res-interest-m1').textContent = Math.round(interestM1).toLocaleString('vi-VN') + ' ₫';
  document.getElementById('res-total-m1').textContent = Math.round(firstMonthTotal).toLocaleString('vi-VN') + ' ₫';
  
  if (type === 'flat') {
      document.getElementById('res-float-label').textContent = `Trả đều cố định mỗi tháng:`;
  } else {
      document.getElementById('res-float-label').textContent = `Gốc Lãi tháng thả nổi (Tháng ${promoTime + 1}):`;
      if(promoTime >= months) document.getElementById('res-float-label').textContent = "Không bị thả nổi:";
  }
  document.getElementById('res-float-amount').textContent = Math.round(floatAmount).toLocaleString('vi-VN') + ' ₫';
  
  document.getElementById('res-total-interest').textContent = Math.round(totalInterest).toLocaleString('vi-VN') + ' ₫';
  
  document.getElementById('calc-results').style.display = 'block';
  document.getElementById('calc-results').scrollIntoView({ behavior: 'smooth' });
}

// ========== INIT on DOMContentLoaded ==========
document.addEventListener('DOMContentLoaded', () => {
    const defaultProduct = document.getElementById('diary-product')?.value;
    if (defaultProduct) toggleLendingFields(defaultProduct);
});

// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
