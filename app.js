// ═══════════════════════════════════════════
// First Down Academy — App JS
// Auth, navigation, dashboards, lesson engine
// Depends on: curriculum.js loaded before this
// ═══════════════════════════════════════════

// ── SUPABASE CONFIG ──
// Replace these with your real keys
const SUPABASE_URL = 'https://wzylgwvifdfnkmuleoxn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FaPj5NQeqzsRE8kOme2lKQ_uXrHArbt';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);
var currentUser = null;
var currentProfile = null;

// ══════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════

function showPage(name) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-link').forEach(function(n) { n.classList.remove('active'); });
  var pg = document.getElementById('page-' + name);
  if (!pg) { console.warn('Page not found:', name); return; }
  pg.classList.add('active');
  var nb = document.getElementById('nav-' + name);
  if (nb) nb.classList.add('active');
  if (name === 'giq' || name === 'levels') {
    var pb = document.getElementById('nav-platform');
    if (pb) pb.classList.add('active');
  }
  window.scrollTo(0, 0);
  var menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.remove('open');
  var burger = document.getElementById('hamburger');
  if (burger) {
    burger.querySelectorAll('span').forEach(function(s) { s.style.transform = ''; s.style.opacity = ''; });
  }
  var dd = document.getElementById('navDropdown');
  if (dd) dd.classList.remove('open');
  if (name === 'course') buildModuleList();
  if (name === 'dashboard') {
    var dl = document.getElementById('nav-dashboard');
    if (dl) dl.style.display = 'block';
    buildDashModuleList();
    loadDashboard();
  }
}

function toggleMobile() {
  var menu = document.getElementById('mobileMenu');
  if (!menu) return;
  menu.classList.toggle('open');
  var burger = document.getElementById('hamburger');
  if (burger) {
    var isOpen = menu.classList.contains('open');
    var spans = burger.querySelectorAll('span');
    if (spans[0]) spans[0].style.transform = isOpen ? 'rotate(45deg) translate(5px,5px)' : '';
    if (spans[1]) spans[1].style.opacity = isOpen ? '0' : '';
    if (spans[2]) spans[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px,-5px)' : '';
  }
}

function toggleDropdown() {
  var dd = document.getElementById('navDropdown');
  if (dd) dd.classList.toggle('open');
}

document.addEventListener('click', function(e) {
  var wrap = document.getElementById('nav-platform-wrap');
  if (wrap && !wrap.contains(e.target)) {
    var dd = document.getElementById('navDropdown');
    if (dd) dd.classList.remove('open');
  }
});

function switchTab(tab) {
  var fs = document.getElementById('formSignup');
  var fl = document.getElementById('formLogin');
  var ts = document.getElementById('tabSignup');
  var tl = document.getElementById('tabLogin');
  if (fs) fs.style.display = tab === 'signup' ? 'block' : 'none';
  if (fl) fl.style.display = tab === 'login' ? 'block' : 'none';
  if (ts) ts.classList.toggle('active', tab === 'signup');
  if (tl) tl.classList.toggle('active', tab === 'login');
}

var currentRole = 'player';
function switchRole(role) {
  currentRole = role;
  var pf = document.getElementById('playerFields');
  var cf = document.getElementById('coachFields');
  var rp = document.getElementById('rolePlayer');
  var rc = document.getElementById('roleCoach');
  if (role === 'player') {
    if (pf) pf.style.display = 'block';
    if (cf) cf.style.display = 'none';
    if (rp) rp.classList.add('active');
    if (rc) rc.classList.remove('active');
  } else {
    if (pf) pf.style.display = 'none';
    if (cf) cf.style.display = 'block';
    if (rp) rp.classList.remove('active');
    if (rc) rc.classList.add('active');
  }
}

function generateSlug(mascot) {
  var clean = mascot.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean + Math.floor(1000 + Math.random() * 9000);
}

function updateCoachPreview() {
  var m = document.getElementById('coachMascot');
  var p = document.getElementById('coachLinkPreview');
  var c = document.getElementById('clpCode');
  if (!m || !p || !c) return;
  var mascot = m.value.trim();
  if (mascot.length > 0) {
    var slug = generateSlug(mascot);
    c.textContent = slug;
    p.style.display = 'block';
    m.dataset.slug = slug;
  } else { p.style.display = 'none'; }
}

function copyDemo(btn) {
  btn.textContent = 'Copied!';
  setTimeout(function() { btn.textContent = 'Copy Link'; }, 2000);
}

function submitNotify() {
  var email = document.getElementById('notifyEmail');
  if (!email || !email.value.includes('@')) { alert('Please enter a valid email.'); return; }
  var confirm = document.getElementById('notifyConfirm');
  var form = document.querySelector('.notify-form');
  if (confirm) confirm.style.display = 'block';
  if (form) form.style.display = 'none';
}

function setDoc(doc) {
  var lp = document.getElementById('legalPrivacy');
  var lt = document.getElementById('legalTerms');
  var tp = document.getElementById('legalTabPrivacy');
  var tt = document.getElementById('legalTabTerms');
  if (lp) lp.style.display = doc === 'privacy' ? 'block' : 'none';
  if (lt) lt.style.display = doc === 'terms' ? 'block' : 'none';
  if (tp) { tp.className = doc === 'privacy' ? 'btn btn-navy' : 'btn btn-ghost'; tp.style.cssText = 'font-size:14px;padding:10px 24px;'; }
  if (tt) { tt.className = doc === 'terms' ? 'btn btn-navy' : 'btn btn-ghost'; tt.style.cssText = 'font-size:14px;padding:10px 24px;'; }
  window.scrollTo({top:0,behavior:'smooth'});
}

// ══════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════

async function checkSession() {
  try {
    var result = await db.auth.getSession();
    if (result.data && result.data.session) {
      currentUser = result.data.session.user;
      await loadProfile();
      updateNavForLoggedIn();
    }
    // Signal that session check is complete
    document.dispatchEvent(new Event('sessionReady'));
  } catch(e) {
    console.log('Session check skipped — keys not configured yet');
    document.dispatchEvent(new Event('sessionReady'));
  }
}

async function loadProfile() {
  if (!currentUser) return;
  try {
    var result = await db.from('profiles').select('*').eq('id', currentUser.id).single();
    if (result.data) currentProfile = result.data;
  } catch(e) { console.error('Profile load error:', e); }
}

function updateNavForLoggedIn() {
  var dashLink = document.getElementById('nav-dashboard');
  if (dashLink) dashLink.style.display = 'block';
  var authBtns = document.getElementById('navAuthBtns');
  if (authBtns) authBtns.style.display = 'none';
  var dashBtn = document.getElementById('navDashBtn');
  if (dashBtn) dashBtn.style.display = 'inline-flex';
}

async function doSignup() {
  var name     = document.getElementById('playerName') ? document.getElementById('playerName').value.trim() : '';
  var email    = document.getElementById('playerEmail') ? document.getElementById('playerEmail').value.trim() : '';
  var password = document.getElementById('playerPassword') ? document.getElementById('playerPassword').value.trim() : '';
  var age      = document.getElementById('playerAge') ? document.getElementById('playerAge').value : '';
  var refCode  = document.getElementById('playerReferral') ? document.getElementById('playerReferral').value.trim().toLowerCase() : '';

  if (!name || !email || !password) { showAuthMsg('error', 'Please fill in your name, email, and password.'); return; }
  if (password.length < 6) { showAuthMsg('error', 'Password must be at least 6 characters.'); return; }
  showAuthMsg('loading', 'Creating your account...');

  try {
    var coachId = null;
    if (refCode) {
      var coachResult = await db.from('profiles').select('id').eq('referral_code', refCode).single();
      if (coachResult.data) { coachId = coachResult.data.id; }
      else { showAuthMsg('error', 'That referral code was not found. Check with your coach.'); return; }
    }
    var signupResult = await db.auth.signUp({
      email: email, password: password,
      options: { data: { full_name: name, role: 'player', age: age } }
    });
    if (signupResult.error) { showAuthMsg('error', signupResult.error.message); return; }
    if (signupResult.data.user) {
      await db.from('profiles').insert({
        id: signupResult.data.user.id, full_name: name,
        age: parseInt(age) || 0, referral_code: refCode || null,
        coach_id: coachId, created_at: new Date().toISOString()
      });
      currentUser = signupResult.data.user;
      currentProfile = { full_name: name, coach_id: coachId, referral_code: refCode };
    }
    showAuthMsg('success', 'Account created! Logging you in...');
    setTimeout(function() {
      showPage('dashboard');
    }, 1500);
  } catch(err) { showAuthMsg('error', 'Something went wrong. Please try again.'); console.error(err); }
}

async function doCoachSignup() {
  var name     = document.getElementById('coachName') ? document.getElementById('coachName').value.trim() : '';
  var email    = document.getElementById('coachEmail') ? document.getElementById('coachEmail').value.trim() : '';
  var password = document.getElementById('coachPassword') ? document.getElementById('coachPassword').value.trim() : '';
  var teamName = document.getElementById('coachTeamName') ? document.getElementById('coachTeamName').value.trim() : '';

  // Auto-generate slug from team name
  var slug = generateSlug(teamName || name || 'coach');

  if (!name || !email || !password) { showAuthMsg('error', 'Please fill in all required fields.'); return; }
  if (!teamName) { showAuthMsg('error', 'Please enter your team name.'); return; }
  if (password.length < 6) { showAuthMsg('error', 'Password must be at least 6 characters.'); return; }
  showAuthMsg('loading', 'Creating your coach account...');

  try {
    var signupResult = await db.auth.signUp({
      email: email, password: password,
      options: { data: { full_name: name, role: 'coach', team_name: teamName, referral_slug: slug } }
    });
    if (signupResult.error) { showAuthMsg('error', signupResult.error.message); return; }
    if (signupResult.data.user) {
      await db.from('profiles').insert({
        id: signupResult.data.user.id, full_name: name,
        age: 0, referral_code: slug, team_name: teamName,
        created_at: new Date().toISOString()
      });
      currentUser = signupResult.data.user;
      currentProfile = { full_name: name, referral_code: slug, team_name: teamName, role: 'coach' };
    }
    showAuthMsg('success', 'Coach account created! Your referral link is ready in your dashboard.');
    setTimeout(function() {
      showPage('dashboard');
    }, 1500);
  } catch(err) { showAuthMsg('error', 'Something went wrong. Please try again.'); console.error(err); }
}

async function doLogin() {
  var email    = document.getElementById('loginEmail') ? document.getElementById('loginEmail').value.trim() : '';
  var password = document.getElementById('loginPassword') ? document.getElementById('loginPassword').value.trim() : '';
  if (!email || !password) { showAuthMsg('error', 'Please enter your email and password.'); return; }
  showAuthMsg('loading', 'Logging in...');
  try {
    var result = await db.auth.signInWithPassword({ email: email, password: password });
    if (result.error) { showAuthMsg('error', 'Incorrect email or password.'); return; }
    currentUser = result.data.user;
    await loadProfile();
    // Navigate to dashboard — dashboard.html handles its own init
    showPage('dashboard');
  } catch(err) { showAuthMsg('error', 'Something went wrong. Please try again.'); console.error(err); }
}

async function doLogout() {
  await db.auth.signOut();
  currentUser = null; currentProfile = null;
  var dashLink = document.getElementById('nav-dashboard');
  if (dashLink) dashLink.style.display = 'none';
  var authBtns = document.getElementById('navAuthBtns');
  if (authBtns) authBtns.style.display = 'flex';
  var dashBtn = document.getElementById('navDashBtn');
  if (dashBtn) dashBtn.style.display = 'none';
  showPage('home');
}

function showAuthMsg(type, msg) {
  document.querySelectorAll('.auth-msg').forEach(function(e) { e.remove(); });
  var div = document.createElement('div');
  div.className = 'auth-msg';
  var styles = {
    error: 'background:#FEF2F2;border:1px solid #FECACA;color:#B91C1C;',
    success: 'background:#F0FDF4;border:1px solid #BBF7D0;color:#15803D;',
    loading: 'background:#EFF6FF;border:1px solid #BFDBFE;color:#1E40AF;'
  };
  var icons = { error:'⚠️', success:'✅', loading:'⏳' };
  div.style.cssText = styles[type] + 'padding:12px 16px;border-radius:8px;font-size:14px;margin-top:12px;';
  div.textContent = icons[type] + ' ' + msg;
  var active = document.getElementById('formSignup') && document.getElementById('formSignup').style.display !== 'none'
    ? document.getElementById('formSignup') : document.getElementById('formLogin');
  if (active) active.appendChild(div);
}

// ══════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════

async function loadDashboard() {
  if (!currentUser) { showPage('signup'); return; }
  if (!currentProfile) { await loadProfile(); }
  var role = 'player';
  if (currentUser.user_metadata && currentUser.user_metadata.role) {
    role = currentUser.user_metadata.role;
  } else if (currentProfile && currentProfile.team_name && !currentProfile.coach_id) {
    role = 'coach';
  }
  var playerDash = document.getElementById('dashPlayer');
  var coachDash  = document.getElementById('dashCoach');
  if (role === 'coach') {
    if (playerDash) playerDash.style.display = 'none';
    if (coachDash)  coachDash.style.display = 'block';
    loadCoachDashboard();
  } else {
    if (coachDash)  coachDash.style.display = 'none';
    if (playerDash) playerDash.style.display = 'block';
    loadPlayerDashboard();
  }
}

async function loadPlayerDashboard() {
  // Ensure profile is loaded before using it
  if (!currentProfile && currentUser) await loadProfile();
  var nameEl = document.getElementById('dashPlayerName');
  if (nameEl) nameEl.textContent = (currentProfile && currentProfile.full_name) ? currentProfile.full_name.split(' ')[0] : (currentUser && currentUser.user_metadata && currentUser.user_metadata.full_name ? currentUser.user_metadata.full_name.split(' ')[0] : 'Player');

  var streakDays = document.getElementById('dashStreakDays');
  if (streakDays) {
    var days = ['M','T','W','T','F','S','S'];
    var today = new Date().getDay();
    var dayIndex = today === 0 ? 6 : today - 1;
    streakDays.innerHTML = days.map(function(d, i) {
      var isToday = i === dayIndex;
      return '<div style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:var(--font-m);font-size:11px;font-weight:700;letter-spacing:.04em;background:' + (isToday ? 'var(--orange)' : 'var(--off)') + ';color:' + (isToday ? 'white' : 'var(--muted)') + ';border:1px solid ' + (isToday ? 'var(--orange)' : 'var(--gray)') + ';">' + d + '</div>';
    }).join('');
  }

  try {
    var result = await db.from('progress').select('module_num,quiz_passed').eq('user_id', currentUser.id);
    if (result.data) {
      var passedModules = result.data.filter(function(r) { return r.quiz_passed; });
      var passedSet = new Set(passedModules.map(function(r) { return r.module_num; }));
      var modulesDone = passedSet.size;
      var progressLabel = document.getElementById('dashProgressLabel');
      if (progressLabel) progressLabel.textContent = modulesDone + ' / 8 modules';
      var progressBar = document.getElementById('dashProgressBar');
      if (progressBar) progressBar.style.width = Math.round((modulesDone / 8) * 100) + '%';
      var progressNote = document.getElementById('dashProgressNote');
      if (progressNote) {
        if (modulesDone === 8) progressNote.textContent = 'All 8 modules complete!';
        else if (modulesDone > 0) progressNote.textContent = modulesDone + ' module' + (modulesDone > 1 ? 's' : '') + ' complete — keep going!';
        else progressNote.textContent = 'Tap any module below to start learning';
      }
      var nextIdx = 0;
      for (var ni = 0; ni < 8; ni++) { if (passedSet.has(ni + 1)) nextIdx = ni + 1; else break; }
      var nextEl = document.getElementById('nextLessonTitle');
      if (nextEl && nextIdx < 8 && typeof CURRICULUM !== 'undefined') nextEl.textContent = CURRICULUM[nextIdx].name;
    }
  } catch(e) { console.error('Progress load error:', e); }

  if (currentProfile && currentProfile.coach_id) {
    try {
      var coachResult = await db.from('profiles').select('full_name, team_name').eq('id', currentProfile.coach_id).single();
      if (coachResult.data) {
        var coachCard = document.getElementById('playerCoachCard');
        if (coachCard) coachCard.style.display = 'block';
        var coachNameEl = document.getElementById('playerCoachName');
        if (coachNameEl) coachNameEl.textContent = coachResult.data.full_name || '—';
        var coachTeamEl = document.getElementById('playerCoachTeam');
        if (coachTeamEl) coachTeamEl.textContent = coachResult.data.team_name || '';
      }
    } catch(e) { console.error('Coach load error:', e); }
  }
  buildDashModuleList();
}

async function loadCoachDashboard() {
  if (!currentProfile) return;
  var nameEl = document.getElementById('dashCoachName');
  if (nameEl) nameEl.textContent = currentProfile.full_name ? currentProfile.full_name.split(' ')[0] : 'Coach';
  var teamEl = document.getElementById('dashCoachTeam');
  if (teamEl) teamEl.textContent = currentProfile.team_name || '';
  var refCode = currentProfile.referral_code || '';
  var fullLink = 'https://firstdownacademy.com/auth.html?ref=' + refCode;
  var refLinkEl = document.getElementById('coachRefLink');
  if (refLinkEl) refLinkEl.textContent = fullLink;
  var codeEl = document.getElementById('coachStatCode');
  if (codeEl) codeEl.textContent = refCode || '—';
  var codeEl2 = document.getElementById('coachStatCodeDisplay');
  if (codeEl2) codeEl2.textContent = refCode || '—';
  // Update copy button data
  var copyBtn = document.getElementById('coachCopyBtn');
  if (copyBtn) copyBtn.setAttribute('data-link', fullLink);

  try {
    var playersResult = await db.from('profiles').select('full_name, created_at').eq('coach_id', currentUser.id);
    var players = playersResult.data || [];
    var total = players.length;
    var countEl = document.getElementById('coachPlayerCount');
    if (countEl) countEl.textContent = total + (total === 1 ? ' player' : ' players');
    var statEl = document.getElementById('coachStatPlayers');
    if (statEl) statEl.textContent = total;
    var activeEl = document.getElementById('coachStatActive');
    if (activeEl) activeEl.textContent = total;
    var listEl = document.getElementById('coachPlayersList');
    if (listEl) {
      if (total === 0) {
        listEl.innerHTML = '<div style="text-align:center;padding:32px 0;"><div style="font-size:32px;margin-bottom:12px;">🏈</div><div style="font-weight:700;font-size:16px;margin-bottom:8px;">No Players Yet</div><div style="font-size:14px;color:var(--grey-500);">Share your referral link to get started.</div></div>';
      } else {
        listEl.innerHTML = players.map(function(p) {
          var joined = new Date(p.created_at).toLocaleDateString('en-US', {month:'short', day:'numeric'});
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--grey-200);">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
            '<div style="width:32px;height:32px;background:var(--navy-800);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:white;">' + (p.full_name ? p.full_name[0].toUpperCase() : '?') + '</div>' +
            '<span style="font-size:14px;">' + (p.full_name || 'Player') + '</span>' +
            '</div><span style="font-size:12px;color:var(--grey-500);">Joined ' + joined + '</span></div>';
        }).join('');
      }
    }
  } catch(e) { console.error('Players load error:', e); }
}

function copyCoachLink() {
  var refCode = currentProfile ? currentProfile.referral_code : '';
  var link = 'https://firstdownacademy.com/auth.html?ref=' + refCode;
  // Try clipboard API first, fall back to selecting the text
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(function() {
      showCopiedConfirm();
    }).catch(function() { fallbackCopy(link); });
  } else {
    fallbackCopy(link);
  }
}
function fallbackCopy(text) {
  var el = document.createElement('textarea');
  el.value = text;
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.select();
  try { document.execCommand('copy'); showCopiedConfirm(); } catch(e) {}
  document.body.removeChild(el);
}
function showCopiedConfirm() {
  var confirm = document.getElementById('coachCopyConfirm');
  if (confirm) {
    confirm.style.display = 'block';
    setTimeout(function() { confirm.style.display = 'none'; }, 3000);
  }
  var btn = document.getElementById('coachCopyBtn');
  if (btn) {
    var orig = btn.textContent;
    btn.textContent = '✓ Copied!';
    btn.style.background = 'var(--green)';
    setTimeout(function() { btn.textContent = orig; btn.style.background = ''; }, 3000);
  }
}

// ══════════════════════════════════════════
// MODULE LIST + PROGRESS
// ══════════════════════════════════════════

function buildModuleList() {
  var loggedOut = document.getElementById('courseLoggedOut');
  var loggedIn  = document.getElementById('courseLoggedIn');
  if (currentUser) {
    if (loggedOut) loggedOut.style.display = 'none';
    if (loggedIn)  loggedIn.style.display = 'block';
  } else {
    if (loggedOut) loggedOut.style.display = 'block';
    if (loggedIn)  loggedIn.style.display = 'none';
    return;
  }
  var list = document.getElementById('moduleList');
  if (!list) return;
  list.innerHTML = '';
  CURRICULUM.forEach(function(m, i) {
    var row = document.createElement('div');
    row.className = 'module-row';
    row.style.cursor = 'pointer';
    row.onclick = (function(idx) { return function() { openModule(idx); }; })(i);
    row.innerHTML =
      '<div class="module-row-num orange">' + m.num + '</div>' +
      '<div class="module-row-body"><div class="module-row-name">' + m.name + '</div><div class="module-row-desc">' + m.desc + '</div></div>' +
      '<div class="module-row-right"><div class="module-row-count">' + m.lessons.length + ' lessons</div>' +
      '<div class="module-row-progress-wrap"><div class="module-row-progress-fill" id="modRowFill' + i + '" style="width:0%"></div></div>' +
      '<div class="module-row-pct" id="modRowPct' + i + '">0%</div></div>';
    list.appendChild(row);
  });
  var tag = document.getElementById('moduleListTag');
  if (tag) tag.textContent = '8 Modules · 5 Pillars';
  loadModuleProgress();
}

function buildDashModuleList() {
  var list = document.getElementById('dashModuleList');
  if (!list) return;
  list.innerHTML = '';
  CURRICULUM.slice(0, 5).forEach(function(m, i) {
    var item = document.createElement('div');
    item.className = 'mod-prog-item';
    item.style.cursor = 'pointer';
    item.onclick = (function(idx) { return function() { openModule(idx); }; })(i);
    item.innerHTML =
      '<div class="mod-prog-num">' + m.num + '</div>' +
      '<span class="mod-prog-name">' + m.name + '</span>' +
      '<div class="mod-prog-bar-wrap"><div class="mod-prog-fill" id="modFill' + i + '" style="width:0%"></div></div>' +
      '<span class="mod-prog-pct" id="modPct' + i + '">0%</span>';
    list.appendChild(item);
  });
  var more = document.createElement('div');
  more.style.cssText = 'text-align:center;margin-top:12px;';
  more.innerHTML = "<button class='btn btn-ghost' style='font-size:13px;padding:8px 18px' onclick=\"showPage('course')\">View All 8 Modules</button>";
  list.appendChild(more);
  loadModuleProgress();
}

async function loadModuleProgress() {
  if (!currentUser) return;
  try {
    var result = await db.from('progress').select('module_num, quiz_passed').eq('user_id', currentUser.id);
    if (!result.data) return;
    var moduleMap = {};
    result.data.forEach(function(r) {
      if (!moduleMap[r.module_num]) moduleMap[r.module_num] = { passed: false };
      if (r.quiz_passed) moduleMap[r.module_num].passed = true;
    });
    CURRICULUM.forEach(function(m, i) {
      var pct = moduleMap[m.num] && moduleMap[m.num].passed ? 100 : 0;
      var fillEl = document.getElementById('modRowFill' + i);
      var pctEl  = document.getElementById('modRowPct' + i);
      if (fillEl) fillEl.style.width = pct + '%';
      if (pctEl)  pctEl.textContent = pct + '%';
      var dashFill = document.getElementById('modFill' + i);
      var dashPct  = document.getElementById('modPct' + i);
      if (dashFill) dashFill.style.width = pct + '%';
      if (dashPct)  dashPct.textContent = pct + '%';
    });
    var passedCount = Object.values(moduleMap).filter(function(m) { return m.passed; }).length;
    var progressLabel = document.getElementById('dashProgressLabel');
    if (progressLabel) progressLabel.textContent = passedCount + ' / 8 modules';
    var progressBar = document.getElementById('dashProgressBar');
    if (progressBar) progressBar.style.width = Math.round((passedCount/8)*100) + '%';
    var nextEl = document.getElementById('nextLessonTitle');
    if (nextEl) {
      var nextIdx = 0;
      for (var i = 0; i < CURRICULUM.length; i++) {
        if (moduleMap[CURRICULUM[i].num] && moduleMap[CURRICULUM[i].num].passed) nextIdx = i + 1;
        else break;
      }
      if (nextIdx < CURRICULUM.length) nextEl.textContent = CURRICULUM[nextIdx].name;
    }
  } catch(e) { console.error('Progress load error:', e); }
}

// ══════════════════════════════════════════
// LESSON ENGINE
// ══════════════════════════════════════════

var moduleState = {
  moduleIdx: 0, lessonIdx: 0, slideIdx: 0,
  phase: 'overview', quizAnswers: [], quizScore: 0, quizPassed: false,
  skipIntro: false, touchStartX: 0
};
var quizResponses = {};

function openModule(mIdx) {
  moduleState.moduleIdx = mIdx;
  moduleState.lessonIdx = 0;
  moduleState.slideIdx  = 0;
  moduleState.phase     = 'overview';
  moduleState.skipIntro = false;
  quizResponses = {};
  renderModule();
  showPage('lesson');
}

function renderModule() {
  var mIdx = moduleState.moduleIdx;
  var mod  = CURRICULUM[mIdx];
  var phase = moduleState.phase;
  var header = document.getElementById('lessonHeader');
  var body   = document.getElementById('lessonBody');
  if (!body) return;

  if (header) {
    var totalS = totalSlides(mIdx);
    var currentS = phase === 'slides' ? absoluteSlideIdx(mIdx, moduleState.lessonIdx, moduleState.slideIdx) + 1 : 0;
    var pct = phase === 'slides' ? Math.round((currentS / totalS) * 100) : (phase === 'quiz' || phase === 'complete' ? 100 : 0);
    header.innerHTML =
      '<div class="lesson-module-label">Module ' + mod.num + '</div>' +
      '<div class="lesson-title">' + mod.name + '</div>' +
      (phase === 'slides' ?
        '<div class="lesson-progress-row"><div class="lesson-progress-bar"><div class="lesson-progress-fill" style="width:' + pct + '%"></div></div><span class="lesson-progress-label">Slide ' + currentS + ' of ' + totalS + '</span></div>' : '');
  }

  if (phase === 'overview') renderOverview(mod);
  else if (phase === 'slides') renderSlide(mod);
  else if (phase === 'quiz')   renderQuiz(mod);
  else if (phase === 'complete') renderComplete(mod);
}

function renderOverview(mod) {
  var body = document.getElementById('lessonBody');
  body.innerHTML =
    '<div class="module-overview">' +
    '<div class="overview-meta">' +
      '<span class="overview-chip">' + mod.lessons.length + ' lessons</span>' +
      '<span class="overview-chip">' + totalSlides(moduleState.moduleIdx) + ' slides</span>' +
      '<span class="overview-chip">' + mod.quiz.length + '-question quiz</span>' +
    '</div>' +
    '<p class="overview-desc">' + mod.desc + '</p>' +
    '<div class="overview-lessons">' +
      mod.lessons.map(function(l, i) {
        return '<div class="overview-lesson-item"><div class="overview-lesson-num">' + (i+1) + '</div><div class="overview-lesson-info"><div class="overview-lesson-title">' + l.title + '</div><div class="overview-lesson-count">' + l.slides.length + ' slides</div></div></div>';
      }).join('') +
    '</div>' +
    '<button class="btn btn-primary lesson-advance-btn" onclick="startSlides()">Start Module ' + mod.num + ' &#8594;</button>' +
    '</div>';
}

function startSlides() {
  moduleState.lessonIdx = 0;
  moduleState.slideIdx  = 0;
  moduleState.phase     = 'slides';
  renderModule();
}

function renderSlide(mod) {
  var body   = document.getElementById('lessonBody');
  var lIdx   = moduleState.lessonIdx;
  var sIdx   = moduleState.slideIdx;
  if (sIdx === 0 && lIdx > 0 && !moduleState.skipIntro) { renderLessonIntro(mod, lIdx); return; }
  moduleState.skipIntro = false;
  var lesson = mod.lessons[lIdx];
  var slide  = lesson.slides[sIdx];
  var isLast = lIdx === mod.lessons.length - 1 && sIdx === lesson.slides.length - 1;
  var isFirst = lIdx === 0 && sIdx === 0;
  body.innerHTML =
    '<div class="slide-container" id="slideContainer" ontouchstart="handleTouchStart(event)" ontouchend="handleTouchEnd(event)">' +
    '<div class="slide-lesson-banner"><div class="slide-lesson-banner-left"><span class="slide-lesson-chip">Lesson ' + (lIdx+1) + ' of ' + mod.lessons.length + '</span><span class="slide-lesson-name">' + lesson.title + '</span></div><span class="slide-lesson-pos">Slide ' + (sIdx+1) + ' of ' + lesson.slides.length + '</span></div>' +
    '<div class="slide-card" id="slideCard"><div class="slide-heading">' + slide.heading + '</div><div class="slide-body">' + slide.body + '</div></div>' +
    '<div class="slide-dots">' + generateDots(lIdx, sIdx, mod) + '</div>' +
    '<div class="slide-nav">' +
      '<button class="slide-btn-back" onclick="prevSlide()" ' + (isFirst ? 'disabled' : '') + '>&#8592; Back</button>' +
      (isLast ? '<button class="slide-btn-next primary" onclick="goToQuiz()">Take the Quiz &#8594;</button>' : '<button class="slide-btn-next" onclick="nextSlide()">Next &#8594;</button>') +
    '</div></div>';
}

function renderLessonIntro(mod, lIdx) {
  var body   = document.getElementById('lessonBody');
  var lesson = mod.lessons[lIdx];
  var colors = ['#E8630A','#1B3A8C','#22C55E','#8B5CF6'];
  var color  = colors[lIdx % colors.length];
  body.innerHTML =
    '<div class="lesson-intro-card" style="border-top:4px solid ' + color + ';">' +
    '<div class="lesson-intro-eyebrow" style="color:' + color + ';">Lesson ' + (lIdx+1) + ' of ' + mod.lessons.length + '</div>' +
    '<div class="lesson-intro-title">' + lesson.title + '</div>' +
    '<div class="lesson-intro-slides">' + lesson.slides.length + ' slides</div>' +
    '<div class="lesson-intro-previews">' + lesson.slides.map(function(s) { return '<div class="lesson-intro-preview-item"><div class="lesson-intro-preview-dot" style="background:' + color + '"></div><span>' + s.heading + '</span></div>'; }).join('') + '</div>' +
    '<div class="slide-nav" style="margin-top:28px;"><button class="slide-btn-back" onclick="prevSlide()">&#8592; Back</button><button class="slide-btn-next" style="background:' + color + ';border-color:' + color + ';" onclick="skipIntroAndStart()">Start Lesson ' + (lIdx+1) + ' &#8594;</button></div>' +
    '</div>';
}

function skipIntroAndStart() { moduleState.skipIntro = true; renderSlide(CURRICULUM[moduleState.moduleIdx]); }

function generateDots(curLIdx, curSIdx, mod) {
  var dots = '';
  var colors = ['#E8630A','#1B3A8C','#22C55E','#8B5CF6'];
  mod.lessons.forEach(function(l, li) {
    var color = colors[li % colors.length];
    if (li > 0) dots += '<span class="slide-dot-sep"></span>';
    l.slides.forEach(function(s, si) {
      var isActive = li === curLIdx && si === curSIdx;
      var isPast   = li < curLIdx || (li === curLIdx && si < curSIdx);
      var style = isActive ? 'background:' + color + ';width:20px;' : isPast ? 'background:' + color + ';opacity:.35;' : '';
      dots += '<span class="slide-dot" style="' + style + '"></span>';
    });
  });
  return dots;
}

function nextSlide() {
  var mod    = CURRICULUM[moduleState.moduleIdx];
  var lesson = mod.lessons[moduleState.lessonIdx];
  if (moduleState.slideIdx + 1 < lesson.slides.length) { moduleState.slideIdx++; moduleState.skipIntro = false; }
  else if (moduleState.lessonIdx + 1 < mod.lessons.length) { moduleState.lessonIdx++; moduleState.slideIdx = 0; moduleState.skipIntro = false; }
  renderModule();
}

function prevSlide() {
  if (moduleState.slideIdx > 0) { moduleState.slideIdx--; moduleState.skipIntro = false; }
  else if (moduleState.lessonIdx > 0) {
    moduleState.lessonIdx--;
    moduleState.slideIdx = CURRICULUM[moduleState.moduleIdx].lessons[moduleState.lessonIdx].slides.length - 1;
    moduleState.skipIntro = true;
  }
  renderModule();
}

function handleTouchStart(e) { moduleState.touchStartX = e.touches[0].clientX; }
function handleTouchEnd(e) {
  var diff = moduleState.touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) { if (diff > 0) nextSlide(); else prevSlide(); }
}

function goToQuiz() { moduleState.phase = 'quiz'; quizResponses = {}; renderModule(); }

function renderQuiz(mod) {
  var body = document.getElementById('lessonBody');
  var questions = mod.quiz.map(function(q, qi) {
    var opts = q.opts.map(function(opt, oi) {
      var letters = ['A','B','C','D'];
      return '<button class="lesson-quiz-opt" id="qOpt_' + qi + '_' + oi + '" onclick="answerQuizQ(' + qi + ',' + oi + ',' + q.correct + ')">' +
        '<span class="lesson-opt-letter">' + letters[oi] + '</span><span>' + opt + '</span></button>';
    }).join('');
    return '<div class="module-quiz-q" id="quizQ_' + qi + '">' +
      '<div class="module-quiz-num">Q' + (qi+1) + '</div>' +
      '<div class="lesson-quiz-q">' + q.q + '</div>' +
      '<div class="lesson-quiz-opts">' + opts + '</div>' +
      '<div class="lesson-quiz-result" id="quizResult_' + qi + '"></div></div>';
  }).join('');
  body.innerHTML =
    '<div class="module-quiz-section">' +
    '<div class="module-quiz-header"><div class="module-quiz-title">Module ' + mod.num + ' Quiz</div><div class="module-quiz-sub">Answer all ' + mod.quiz.length + ' questions. You need 70% to complete this module.</div></div>' +
    '<div id="quizQuestions">' + questions + '</div>' +
    '<div id="quizSubmitArea" style="display:none;margin-top:28px;"><button class="btn btn-primary lesson-advance-btn" onclick="submitQuiz()">Submit Quiz &#8594;</button></div>' +
    '</div>';
}

function answerQuizQ(qi, chosen, correct) {
  if (quizResponses[qi] !== undefined) return;
  quizResponses[qi] = chosen;
  for (var i = 0; i < 4; i++) {
    var el = document.getElementById('qOpt_' + qi + '_' + i);
    if (el) el.disabled = true;
  }
  var chosenEl  = document.getElementById('qOpt_' + qi + '_' + chosen);
  var correctEl = document.getElementById('qOpt_' + qi + '_' + correct);
  var resultEl  = document.getElementById('quizResult_' + qi);
  var explanation = CURRICULUM[moduleState.moduleIdx].quiz[qi].explanation;
  if (chosen === correct) {
    if (chosenEl) chosenEl.classList.add('correct');
    if (resultEl) { resultEl.className = 'lesson-quiz-result correct show'; resultEl.textContent = explanation; }
  } else {
    if (chosenEl) chosenEl.classList.add('wrong');
    if (correctEl) correctEl.classList.add('correct');
    if (resultEl) { resultEl.className = 'lesson-quiz-result wrong show'; resultEl.textContent = explanation; }
  }
  if (Object.keys(quizResponses).length >= CURRICULUM[moduleState.moduleIdx].quiz.length) {
    var submitArea = document.getElementById('quizSubmitArea');
    if (submitArea) { submitArea.style.display = 'block'; submitArea.scrollIntoView({behavior:'smooth'}); }
  }
}

async function submitQuiz() {
  var mod     = CURRICULUM[moduleState.moduleIdx];
  var total   = mod.quiz.length;
  var correct = 0;
  for (var qi = 0; qi < total; qi++) { if (quizResponses[qi] === mod.quiz[qi].correct) correct++; }
  var score  = Math.round((correct / total) * 100);
  var passed = score >= 70;
  if (currentUser) {
    try {
      await db.from('progress').upsert({
        user_id: currentUser.id, module_num: mod.num,
        lesson_num: 0, slide_num: 0,
        completed: passed, quiz_passed: passed,
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id,module_num,lesson_num' });
    } catch(e) { console.error('Progress save error:', e); }
  }
  quizResponses = {};
  moduleState.phase      = 'complete';
  moduleState.quizScore  = score;
  moduleState.quizPassed = passed;
  renderModule();
}

function renderComplete(mod) {
  var body   = document.getElementById('lessonBody');
  var passed = moduleState.quizPassed;
  var score  = moduleState.quizScore;
  var nextMod = moduleState.moduleIdx + 1 < CURRICULUM.length ? CURRICULUM[moduleState.moduleIdx + 1] : null;
  if (passed) {
    body.innerHTML =
      '<div class="lesson-complete-section">' +
      '<div class="lesson-complete-icon">&#127941;</div>' +
      '<div class="lesson-complete-title">Module Complete!</div>' +
      '<div class="lesson-complete-sub">You scored ' + score + '% on the quiz.</div>' +
      '<div class="lesson-module-complete-badge">&#127944; Module ' + mod.num + ' — ' + mod.name + '</div>' +
      (nextMod ? '<button class="btn btn-primary lesson-advance-btn" onclick="openModule(' + (moduleState.moduleIdx+1) + ')">Start Module ' + nextMod.num + ': ' + nextMod.name + ' &#8594;</button>' : '<button class="btn btn-primary lesson-advance-btn" onclick="showPage(\'dashboard\')">Back to Dashboard &#8594;</button>') +
      '<button class="btn btn-ghost" onclick="showPage(\'dashboard\')" style="width:100%;justify-content:center;margin-top:12px;">Back to Dashboard</button>' +
      '</div>';
  } else {
    body.innerHTML =
      '<div class="lesson-complete-section">' +
      '<div class="lesson-complete-icon">&#128172;</div>' +
      '<div class="lesson-complete-title">Not Quite Yet</div>' +
      '<div class="lesson-complete-sub">You scored ' + score + '%. You need 70% to complete this module.</div>' +
      '<button class="btn btn-primary lesson-advance-btn" onclick="retakeModule()">Review Slides &#8594;</button>' +
      '<button class="btn btn-ghost" onclick="goToQuiz()" style="width:100%;justify-content:center;margin-top:12px;">Retake Quiz Immediately</button>' +
      '</div>';
  }
}

function retakeModule() {
  moduleState.lessonIdx = 0; moduleState.slideIdx = 0;
  moduleState.phase     = 'slides'; quizResponses = {};
  renderModule();
}

// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════
// Only call functions that exist on this page
if (typeof showPage === 'function') showPage('home');
if (typeof buildModuleList === 'function') buildModuleList();
checkSession();
