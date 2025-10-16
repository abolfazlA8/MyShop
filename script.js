/* script.js - shared logic for auth + UI behaviors (client-side) */
/* Usage: include <script src="script.js"></script> at end of body */

const USERS_KEY = 'shop_users_v1';
const CURRENT_USER_KEY = 'shop_current_user_v1';
const CONTACT_KEY = 'shop_messages_v1';
const LOCAL_SEEDED = 'shop_seeded_v1';
const USERS_JSON = 'users.json'; // optional server file to read initial users

// helper
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// load users from localStorage
function loadUsers(){
  try{
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return [] }
}
function saveUsers(users){
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// current user
function getCurrentUser(){ 
  try { return JSON.parse(localStorage.getItem(CURRENT_USER_KEY)); } catch(e){ return null }
}
function setCurrentUser(user){ localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user)); updateAuthUI(); }
function clearCurrentUser(){ localStorage.removeItem(CURRENT_USER_KEY); updateAuthUI(); }

// try to fetch users.json once and merge (non-destructive)
async function seedFromUsersJson(){
  if(localStorage.getItem(LOCAL_SEEDED)) return;
  try{
    const res = await fetch(USERS_JSON);
    if(!res.ok) { localStorage.setItem(LOCAL_SEEDED, '1'); return; }
    const remote = await res.json();
    const local = loadUsers();
    const emails = new Set(local.map(u=>u.email));
    const merged = local.slice();
    for(const u of remote){
      if(!emails.has(u.email)) merged.push(u);
    }
    saveUsers(merged);
    localStorage.setItem(LOCAL_SEEDED, '1');
  }catch(e){
    // ignore network errors, mark seeded to avoid retries
    localStorage.setItem(LOCAL_SEEDED, '1');
  }
}

/* update navbar / auth-area based on login */
function updateAuthUI(){
  const user = getCurrentUser();
  $$('.user-area').forEach(el => {
    el.innerHTML = ''; // clear
    if(user){
      const span = document.createElement('span');
      span.textContent = `سلام، ${user.name}`;
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.style.padding = '6px 10px';
      btn.textContent = 'خروج';
      btn.addEventListener('click', () => {
        clearCurrentUser();
        alert('شما خارج شدید.');
      });
      el.appendChild(span);
      el.appendChild(btn);
    } else {
      const a = document.createElement('a');
      a.href = 'login.html';
      a.textContent = 'ورود / ثبت‌نام';
      a.className = 'btn ghost';
      el.appendChild(a);
    }
  });

  // enable/disable buy buttons
  const logged = !!user;
  $$('.btn-buy').forEach(b => {
    b.disabled = !logged;
    if(!logged){
      b.title = 'برای خرید لطفاً وارد شوید';
      b.classList.add('ghost');
      b.classList.remove('btn');
    } else {
      b.title = '';
      b.classList.remove('ghost');
      b.classList.add('btn');
    }
  });
}

/* AUTH HANDLERS for login.html (if present in page) */
function initAuthForms(){
  const loginForm = $('#login-form');
  const registerForm = $('#register-form');
  if(!loginForm || !registerForm) return;

  // tabs handled in markup (if any)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;
    const users = loadUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    const msg = $('#login-message');
    if(user){
      setCurrentUser({name: user.name, email: user.email});
      if(msg){ msg.style.color='green'; msg.textContent = `خوش آمدید، ${user.name}!`; }
      // optionally redirect to index
      setTimeout(()=>{ window.location.href = 'index.html' }, 800);
    } else {
      if(msg){ msg.style.color='red'; msg.textContent = 'ایمیل یا رمز اشتباه است!'; }
    }
  });

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = registerForm.name.value.trim();
    const email = registerForm.email.value.trim().toLowerCase();
    const password = registerForm.password.value;
    const msg = $('#register-message');
    if(!name || !email || !password){ if(msg){ msg.style.color='red'; msg.textContent='همه فیلدها را پر کنید'; } return; }

    const users = loadUsers();
    if(users.find(u=>u.email === email)){
      if(msg){ msg.style.color='red'; msg.textContent = 'این ایمیل قبلاً ثبت شده است!'; }
      return;
    }
    users.push({name, email, password});
    saveUsers(users);
    setCurrentUser({name, email});
    if(msg){ msg.style.color='green'; msg.textContent = 'ثبت‌نام با موفقیت انجام شد!'; }
    setTimeout(()=>{ window.location.href = 'index.html' }, 900);
  });
}

/* Contact form handler */
function initContactForm(){
  const form = $('#contact-form');
  if(!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name ? form.name.value.trim() : 'کاربر';
    const email = form.email ? form.email.value.trim() : '';
    const message = form.message ? form.message.value.trim() : '';
    if(!message){ alert('متن پیام خالی است'); return; }
    const stored = JSON.parse(localStorage.getItem(CONTACT_KEY) || '[]');
    stored.push({name, email, message, date: new Date().toISOString()});
    localStorage.setItem(CONTACT_KEY, JSON.stringify(stored));
    alert('پیام شما با موفقیت ثبت شد. با تشکر!');
    form.reset();
  });
}

/* Product buy buttons */
function initBuyButtons(){
  $$('.btn-buy').forEach(b=>{
    b.addEventListener('click', ()=>{
      const user = getCurrentUser();
      if(!user){
        // redirect to login
        if(confirm('برای خرید باید وارد شوید. می‌خواهید به صفحهٔ ورود بروید؟')) window.location.href='login.html';
        return;
      }
      const productId = b.dataset.product;
      // simple cart in localStorage
      const cartKey = `shop_cart_${user.email}`;
      const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      const already = cart.find(p => p.id === productId);
      if(!already){
        cart.push({id: productId, title: b.dataset.title, addedAt: new Date().toISOString()});
        localStorage.setItem(cartKey, JSON.stringify(cart));
        alert('محصول به سبد شما اضافه شد.');
      } else {
        alert('این محصول قبلاً در سبد شما هست.');
      }
    });
  });
}

/* init on DOMContentLoaded */
document.addEventListener('DOMContentLoaded', async ()=>{
  await seedFromUsersJson();
  updateAuthUI();
  initAuthForms();
  initContactForm();
  initBuyButtons();
});

/* expose for debugging */
window.shopAPI = {loadUsers, saveUsers, getCurrentUser, setCurrentUser, clearCurrentUser};