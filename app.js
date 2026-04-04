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
  var clean = mascot.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
  return clean + Math.floor(100 + Math.random() * 900);
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
    // Check if email confirmation is required
    var sessionCheck = await db.auth.getSession();
    var hasSession = sessionCheck.data && sessionCheck.data.session;
    var nextPage = new URLSearchParams(window.location.search).get('next') || 'dashboard.html';

    if (hasSession) {
      showAuthMsg('success', 'Account created! Logging you in...');
      setTimeout(function() { window.location.href = nextPage; }, 1500);
    } else {
      var msgEl = document.getElementById('authMsg');
      if (msgEl) {
        msgEl.innerHTML =
          '<div style="text-align:center;padding:8px 0;">' +
          '<div style="font-size:28px;margin-bottom:10px;">&#x1F4EC;</div>' +
          '<div style="font-weight:700;font-size:16px;margin-bottom:6px;color:#fff;">Check your inbox</div>' +
          '<div style="font-size:13px;color:rgba(255,255,255,.6);line-height:1.6;max-width:320px;margin:0 auto;">' +
            'We sent a confirmation link to <strong style="color:#fff;">' + email + '</strong>. ' +
            'Click it to activate your account, then come back to sign in.' +
          '</div>' +
          '<div style="margin-top:16px;font-size:11px;color:rgba(255,255,255,.3);">Can&#39;t find it? Check your spam folder.</div>' +
          '</div>';
        msgEl.className = 'auth-msg auth-msg-success';
        msgEl.style.display = 'block';
      }
    }
  } catch(err) { showAuthMsg('error', 'Something went wrong. Please try again.'); console.error(err); }
}

async function doCoachSignup() {
  var name     = document.getElementById('coachName') ? document.getElementById('coachName').value.trim() : '';
  var email    = document.getElementById('coachEmail') ? document.getElementById('coachEmail').value.trim() : '';
  var password = document.getElementById('coachPassword') ? document.getElementById('coachPassword').value.trim() : '';
  var teamName = document.getElementById('coachTeamName') ? document.getElementById('coachTeamName').value.trim() : '';

  var mascot   = document.getElementById('coachMascot') ? document.getElementById('coachMascot').value.trim() : '';

  // Build code from mascot if provided, otherwise fall back to team name
  var codeBase = mascot || teamName || name || 'team';
  var slug = generateSlug(codeBase);

  if (!name || !email || !password) { showAuthMsg('error', 'Please fill in all required fields.'); return; }
  if (!teamName) { showAuthMsg('error', 'Please enter your team name.'); return; }
  if (!mascot) { showAuthMsg('error', 'Please enter your team mascot (e.g. Bears, Eagles).'); return; }
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
    // Supabase may require email confirmation before session is active
    var sessionCheck = await db.auth.getSession();
    var hasSession = sessionCheck.data && sessionCheck.data.session;

    if (hasSession) {
      showAuthMsg('success', 'Account created! Taking you to your dashboard...');
      setTimeout(function() { window.location.href = 'dashboard.html'; }, 1500);
    } else {
      // Email confirmation required — show inbox message
      showAuthMsg('success', '');
      var msgEl = document.getElementById('authMsg');
      if (msgEl) {
        msgEl.innerHTML =
          '<div style="text-align:center;padding:8px 0;">' +
          '<div style="font-size:28px;margin-bottom:10px;">📬</div>' +
          '<div style="font-weight:700;font-size:16px;margin-bottom:6px;color:#fff;">Check your inbox</div>' +
          '<div style="font-size:13px;color:rgba(255,255,255,.6);line-height:1.6;max-width:320px;margin:0 auto;">' +
            'We sent a confirmation link to <strong style="color:#fff;">' + email + '</strong>. ' +
            'Click it to activate your account, then come back to sign in.' +
          '</div>' +
          '<div style="margin-top:16px;font-size:11px;color:rgba(255,255,255,.3);">Can&#39;t find it? Check your spam folder.</div>' +
          '</div>';
        msgEl.className = 'auth-msg auth-msg-success';
        msgEl.style.display = 'block';
      }
    }
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
    // Navigate to next page or dashboard
    var nextPage = new URLSearchParams(window.location.search).get('next');
    window.location.href = nextPage || 'dashboard.html';
  } catch(err) { showAuthMsg('error', 'Something went wrong. Please try again.'); console.error(err); }
}

async function doLogout() {
  await db.auth.signOut();
  currentUser = null; currentProfile = null;
  window.location.href = 'index.html';
}

function showAuthMsg(type, msg) {
  document.querySelectorAll('.auth-msg').forEach(function(e) { e.remove(); });
  if (!msg && type !== 'success') return;
  var div = document.createElement('div');
  div.id = 'authMsg';
  var styles = {
    error:   'background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#fca5a5;',
    success: 'background:rgba(193,255,34,.08);border:1px solid rgba(193,255,34,.2);color:#d9e7fc;',
    loading: 'background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#9eacc0;'
  };
  var icons = { error:'⚠️ ', success:'', loading:'⏳ ' };
  div.style.cssText = styles[type] + 'padding:14px 16px;border-radius:8px;font-size:13px;margin-top:12px;line-height:1.6;';
  div.innerHTML = icons[type] + msg;
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

  // Build module list first
  buildDashModuleList();

  // This Week days
  var streakDays = document.getElementById('dashStreakDays');
  if (streakDays) {
    var days = ['M','T','W','T','F','S','S'];
    var today = new Date().getDay();
    var dayIndex = today === 0 ? 6 : today - 1;
    streakDays.innerHTML = days.map(function(d, i) {
      var isToday = i === dayIndex;
      return '<div class="pdb-day ' + (isToday ? 'today' : 'off') + '">' + d + '</div>';
    }).join('');
  }

  // Load progress from Supabase
  try {
    var result = await db.from('progress').select('module_num,quiz_passed').eq('user_id', currentUser.id);
    if (result.data) {
      var passedModules = result.data.filter(function(r) { return r.quiz_passed; });
      var passedSet = new Set(passedModules.map(function(r) { return r.module_num; }));
      var modulesDone = passedSet.size;

      // Update progress fraction
      var progressLabel = document.getElementById('dashProgressLabel');
      if (progressLabel) progressLabel.textContent = modulesDone + ' / 8';

      // Update progress bar
      var progressBar = document.getElementById('dashProgressBar');
      if (progressBar) progressBar.style.width = Math.round((modulesDone / 8) * 100) + '%';

      // Update pillar dots
      for (var di = 0; di < 8; di++) {
        var dot = document.getElementById('pdot' + di);
        if (dot) {
          if (passedSet.has(di + 1)) dot.classList.add('done');
          else if (di === modulesDone) dot.classList.add('active');
        }
      }

      // Update progress note
      var progressNote = document.getElementById('dashProgressNote');
      if (progressNote) {
        if (modulesDone === 8) progressNote.textContent = 'All 8 modules complete — Gridiron IQ coming soon!';
        else if (modulesDone > 0) progressNote.textContent = modulesDone + ' module' + (modulesDone > 1 ? 's' : '') + ' complete — keep going!';
        else progressNote.textContent = 'Start your first module below';
      }

      // Update next lesson title
      var nextIdx = 0;
      for (var ni = 0; ni < 8; ni++) {
        if (passedSet.has(ni + 1)) nextIdx = ni + 1; else break;
      }
      var nextEl = document.getElementById('nextLessonTitle');
      if (nextEl && nextIdx < 8 && typeof CURRICULUM !== 'undefined') {
        nextEl.textContent = CURRICULUM[nextIdx].name;
      }

      // Update each module row state
      if (typeof CURRICULUM !== 'undefined') {
        CURRICULUM.forEach(function(m, i) {
          var isDone = passedSet.has(i + 1);
          var isNext = i === nextIdx;
          var numEl  = document.getElementById('pdb-num-' + i);
          var nameEl2 = document.getElementById('pdb-name-' + i);
          var barEl  = document.getElementById('pdb-bar-' + i);
          var pctEl  = document.getElementById('pdb-pct-' + i);

          if (isDone) {
            if (numEl)  { numEl.className = 'pdb-mod-num done'; numEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
            if (nameEl2) nameEl2.className = 'pdb-mod-name';
            if (barEl)  barEl.style.width = '100%';
            if (pctEl)  { pctEl.textContent = '100%'; pctEl.className = 'pdb-mod-pct done'; }
          } else if (isNext) {
            if (numEl)  numEl.className = 'pdb-mod-num next';
            if (nameEl2) nameEl2.className = 'pdb-mod-name';
            if (barEl)  barEl.style.width = '0%';
            if (pctEl)  pctEl.textContent = '';
          }
          // locked modules stay as-is
        });
      }
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
  if (!list || typeof CURRICULUM === 'undefined') return;
  list.innerHTML = '';
  CURRICULUM.forEach(function(m, i) {
    var row = document.createElement('div');
    row.className = 'pdb-mod-row';
    row.onclick = function() {
      sessionStorage.setItem('openModule', i);
      window.location.href = 'lesson.html';
    };
    // State: done, next, locked — set by loadPlayerDashboard after progress loads
    row.id = 'pdb-row-' + i;
    row.innerHTML =
      '<div class="pdb-mod-num locked" id="pdb-num-' + i + '">' + (i + 1) + '</div>' +
      '<div class="pdb-mod-name locked" id="pdb-name-' + i + '">' + m.name + '</div>' +
      '<div class="pdb-mod-right">' +
        '<div class="pdb-mod-bar-track"><div class="pdb-mod-bar-fill" id="pdb-bar-' + i + '" style="width:0%"></div></div>' +
        '<div class="pdb-mod-pct" id="pdb-pct-' + i + '">0%</div>' +
      '</div>';
    list.appendChild(row);
  });
}


// ══════════════════════════════════════════
// GRIDIRON IQ DASHBOARD
// ══════════════════════════════════════════

var PILLAR_COLORS_DASH = ['#E8630A','#3B82F6','#8B5CF6','#F59E0B','#22C55E'];
var PILLAR_NAMES_DASH  = ['Rules & Objectives','Positions & Responsibilities','Formations & Alignments','Plays & Concepts','Situational Awareness'];
var PILLAR_SHORT       = ['Rules','Positions','Formations','Plays','Situational'];

function getLetterGrade(score) {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 60) return 'D';
  return 'F';
}

function getTierName(score) {
  if (score >= 85) return { name:'Elite IQ',   color:'#22C55E' };
  if (score >= 70) return { name:'Advanced',    color:'#E8630A' };
  if (score >= 55) return { name:'Developing',  color:'#F59E0B' };
  if (score >= 40) return { name:'Learning',    color:'#3B82F6' };
  return                   { name:'Rookie',     color:'#94A3B8' };
}

async function loadGIQScore() {
  if (!currentUser) return;

  try {
    // Load all scores sorted by most recent
    var result = await db
      .from('giq_scores')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('taken_at', { ascending: false });

    var scores = result.data || [];
    var quizCount = scores.length;

    // ── Quiz count indicator ──
    var countEl = document.getElementById('giqQuizCount');
    if (countEl) {
      if (quizCount === 0) {
        countEl.textContent = '2 free quizzes available';
      } else if (quizCount === 1) {
        countEl.textContent = '1 free quiz remaining';
      } else {
        countEl.textContent = quizCount + ' quizzes taken';
      }
    }

    if (quizCount === 0) {
      // No score yet — show empty state + quiz CTA recommendation
      updateRecommendation('quiz', null, null);
      return;
    }

    // ── Best score for main display ──
    var best = scores.reduce(function(b, s) { return (s.score > b.score) ? s : b; }, scores[0]);
    var latest = scores[0];
    var grade = best.grade || getLetterGrade(best.score);
    var tier  = getTierName(best.score);

    // Switch to score state
    var emptyEl = document.getElementById('giqEmpty');
    var scoreEl = document.getElementById('giqScoreState');
    if (emptyEl) emptyEl.style.display = 'none';
    if (scoreEl) scoreEl.style.display = 'block';

    // Populate grade/tier
    var gradeEl = document.getElementById('giqGrade');
    if (gradeEl) { gradeEl.textContent = grade; gradeEl.style.color = tier.color; }
    var tierEl = document.getElementById('giqTier');
    if (tierEl) { tierEl.textContent = tier.name; tierEl.style.color = tier.color; }
    var scoreNumEl = document.getElementById('giqScoreNum');
    if (scoreNumEl) scoreNumEl.textContent = best.score + ' / 100';

    // Update button
    var btn = document.getElementById('giqDashBtn');
    if (btn) btn.textContent = 'Retake Quiz →';

    // ── Pillar bars ──
    var pillarsEl = document.getElementById('giqDashPillars');
    if (pillarsEl && latest) {
      pillarsEl.style.display = 'flex';
      pillarsEl.innerHTML = '';
      PILLAR_NAMES_DASH.forEach(function(p, i) {
        var key = 'pillar_' + p.replace(/[^a-zA-Z]/g,'').toLowerCase();
        var raw = latest[key];
        var pct = 0;
        if (raw && raw.includes('/')) {
          var parts = raw.split('/');
          pct = parseInt(parts[1]) > 0 ? Math.round(parseInt(parts[0]) / parseInt(parts[1]) * 100) : 0;
        }
        var row = document.createElement('div');
        row.className = 'db-iq-pillar-row';
        row.innerHTML =
          '<div class="db-iq-pillar-name">' + PILLAR_SHORT[i] + '</div>' +
          '<div class="db-iq-pillar-track"><div class="db-iq-pillar-fill" style="width:0%;background:' + PILLAR_COLORS_DASH[i] + '" data-pct="' + pct + '"></div></div>' +
          '<div class="db-iq-pillar-pct">' + pct + '%</div>';
        pillarsEl.appendChild(row);
      });
      setTimeout(function() {
        document.querySelectorAll('.db-iq-pillar-fill').forEach(function(el) {
          el.style.width = el.getAttribute('data-pct') + '%';
        });
      }, 300);
    }

    // ── Recommendation ──
    updateRecommendation('scored', best, latest);

    // ── Quiz History ──
    buildQuizHistory(scores);

  } catch(e) {
    console.error('GIQ load error:', e);
  }
}

function updateRecommendation(type, best, latest) {
  var eyebrow = document.getElementById('dbRecEyebrow');
  var title   = document.getElementById('dbRecTitle');
  var body    = document.getElementById('dbRecBody');
  var btn     = document.getElementById('dbRecBtn');
  var card    = document.getElementById('dbRecCard');

  if (!eyebrow || !title || !body || !btn) return;

  if (type === 'quiz') {
    // No score yet
    eyebrow.textContent = 'Start Here';
    title.textContent   = 'TAKE THE GRIDIRON IQ QUIZ';
    body.textContent    = 'Find out where your football knowledge stands. 15 adaptive questions. Instant grade. Free.';
    btn.href = 'giq-exam.html';
    btn.textContent = 'Start Quiz →';
    if (card) card.style.borderLeftColor = 'var(--orange-500)';
    return;
  }

  var score = best.score;

  if (score >= 85) {
    // Elite — point to upcoming content
    eyebrow.textContent = 'Strong Gridiron IQ';
    title.textContent   = "YOU'RE AHEAD OF THE CURVE.";
    body.textContent    = "Your score puts you in the top tier. Pro and Elite level content is coming soon — you'll be the first to know when it drops.";
    btn.href = 'giq-exam.html';
    btn.textContent = 'Retake Quiz →';
    if (card) card.style.borderLeftColor = '#22C55E';
    if (eyebrow) eyebrow.style.color = '#16A34A';
    return;
  }

  // Find weakest pillar from latest attempt
  var weakest = null;
  var weakestPct = 1;
  var weakestModule = 'Module 8';
  var pillarModules = {
    'Rules & Objectives': 'Modules 1 & 2',
    'Positions & Responsibilities': 'Modules 4 & 5',
    'Formations & Alignments': 'Module 6',
    'Plays & Concepts': 'Modules 6 & 7',
    'Situational Awareness': 'Module 8'
  };

  if (latest) {
    PILLAR_NAMES_DASH.forEach(function(p) {
      var key = 'pillar_' + p.replace(/[^a-zA-Z]/g,'').toLowerCase();
      var raw = latest[key];
      if (raw && raw.includes('/')) {
        var parts = raw.split('/');
        var pct = parseInt(parts[1]) > 0 ? parseInt(parts[0]) / parseInt(parts[1]) : 0;
        if (pct < weakestPct) { weakestPct = pct; weakest = p; weakestModule = pillarModules[p] || 'Module 8'; }
      }
    });
  }

  if (score >= 70 && weakest) {
    eyebrow.textContent = 'Targeted Improvement';
    title.textContent   = 'BUILD ' + weakest.toUpperCase() + '.';
    body.textContent    = 'Your weakest pillar is ' + weakest + '. ' + weakestModule + ' in the Rookie course targets this directly. Complete it and retake the quiz to see your score improve.';
    btn.href = 'program.html';
    btn.textContent = 'Start the Course →';
  } else {
    eyebrow.textContent = 'Recommended Next Step';
    title.textContent   = 'COMPLETE THE ROOKIE COURSE.';
    body.textContent    = 'Your score shows room to build across multiple pillars. The free Rookie course covers all 5 pillars in 8 modules. Finish it and retake the quiz — the improvement will be measurable.';
    btn.href = 'program.html';
    btn.textContent = 'Start the Course →';
  }
}

function buildQuizHistory(scores) {
  if (!scores || scores.length === 0) return;

  var section = document.getElementById('dbHistorySection');
  var list    = document.getElementById('dbHistoryList');
  if (!section || !list) return;

  section.style.display = 'block';
  list.innerHTML = '';

  scores.slice(0, 5).forEach(function(s) {
    var grade = s.grade || getLetterGrade(s.score);
    var tier  = getTierName(s.score);
    var date  = new Date(s.taken_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });

    var row = document.createElement('div');
    row.className = 'db-history-row';
    row.innerHTML =
      '<div class="db-history-grade" style="color:' + tier.color + '">' + grade + '</div>' +
      '<div class="db-history-info">' +
        '<div class="db-history-tier" style="color:' + tier.color + '">' + tier.name + '</div>' +
        '<div class="db-history-meta">' + date + ' &middot; ' + (s.correct || '?') + '/15 correct</div>' +
      '</div>' +
      '<div class="db-history-score" style="color:' + tier.color + '">' + s.score + '<span>/100</span></div>';
    list.appendChild(row);
  });
}

// ══════════════════════════════════════════
// INIT — must be last
// ══════════════════════════════════════════
checkSession();
