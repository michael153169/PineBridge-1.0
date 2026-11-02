// PineBridge Investments: client login + admin back office.
// One Netlify Function. Accounts live in a Supabase table (clients); sessions are signed cookies.
import crypto from 'node:crypto';

export const config = { path: ['/api/*', '/account'] };

const USER_SESSION_MS = 12 * 60 * 60 * 1000;  // customers stay signed in for 12 hours
const ADMIN_SESSION_MS = 2 * 60 * 60 * 1000;  // admin stays signed in for 2 hours
const MAX_FAILS = 8;
const WINDOW_MS = 15 * 60 * 1000;
const USERNAME_RE = /^[a-z0-9._-]{3,32}$/;

const ACCOUNT_HTML = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n<meta name=\"color-scheme\" content=\"light\">\n<meta name=\"robots\" content=\"noindex, nofollow\">\n<title>My account | PineBridge Investments</title>\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link href=\"https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap\" rel=\"stylesheet\">\n<link rel=\"stylesheet\" href=\"/styles.css\">\n<link rel=\"stylesheet\" href=\"/app.css\">\n</head>\n<body>\n<header>\n  <div class=\"wrap nav\">\n    <a class=\"brand\" href=\"/\" aria-label=\"PineBridge Investments home\"><img alt=\"PineBridge Investments\" width=\"560\" height=\"120\" src=\"/img/logo.png\"></a>\n    <nav aria-label=\"Main\"><a href=\"/\">Website</a><button class=\"login-btn\" id=\"logout\" type=\"button\">Log out</button></nav>\n  </div>\n</header>\n<div class=\"portal\">\n  <aside class=\"side\" aria-label=\"Account menu\">\n    <div class=\"pwho\"><span class=\"av\" id=\"av\">?</span><span class=\"wn\" id=\"wn\"></span></div>\n    <div class=\"menu\" id=\"menu\">\n      <a href=\"#home\" data-p=\"home\">Home</a>\n      <a href=\"#history\" data-p=\"history\">History</a>\n      <a href=\"#profile\" data-p=\"profile\">Profile</a>\n      <a href=\"#contact\" data-p=\"contact\">Contact</a>\n    </div>\n  </aside>\n  <main class=\"content\">\n\n    <section class=\"pg\" id=\"p-home\">\n      <div class=\"toprow\">\n        <div><h1 id=\"hello\">Welcome</h1><p class=\"sub\">You are signed in.</p></div>\n        <div class=\"notice\" id=\"notice\" hidden></div>\n      </div>\n      <div class=\"tiles\">\n        <a class=\"tile\" href=\"#history\"><span class=\"ti\">&#9993;</span><strong>History</strong><span>Messages and updates from PineBridge.</span></a>\n        <a class=\"tile\" href=\"#profile\"><span class=\"ti\">&#9786;</span><strong>Profile</strong><span>View your account details.</span></a>\n        <a class=\"tile\" href=\"#contact\"><span class=\"ti\">&#9742;</span><strong>Contact</strong><span>Get in touch with our team.</span></a>\n      </div>\n      <div class=\"intro\">\n        <h2>Your PineBridge client portal</h2>\n        <p>This is your private space with PineBridge Investments. Check the History page for the latest messages from us, and use the Contact page if you need help with your account.</p>\n      </div>\n    </section>\n\n    <section class=\"pg\" id=\"p-history\" hidden>\n      <h1>History</h1>\n      <p class=\"sub\">Messages and updates from PineBridge.</p>\n      <ul class=\"ann\" id=\"annAll\"><li class=\"empty\">Loading…</li></ul>\n    </section>\n\n    <section class=\"pg\" id=\"p-profile\" hidden>\n      <h1>Profile</h1>\n      <p class=\"sub\">Your account details.</p>\n      <dl class=\"kv\">\n        <dt>Username</dt><dd id=\"pu\"></dd>\n        <dt>Status</dt><dd>Active</dd>\n      </dl>\n      <p class=\"hint\">To change your password, please contact us.</p>\n    </section>\n\n    <section class=\"pg\" id=\"p-contact\" hidden>\n      <h1>Contact</h1>\n      <p class=\"sub\">Need help with your account?</p>\n      <p>Please get in touch with your PineBridge account manager. Our latest contact details and office hours are posted on the Home page.</p>\n    </section>\n\n  </main>\n</div>\n<script>\n(function(){\n  var $=function(id){return document.getElementById(id);};\n  var pages=['home','history','profile','contact'];\n  function show(){\n    var h=(location.hash||'#home').slice(1);\n    if(pages.indexOf(h)<0)h='home';\n    pages.forEach(function(p){$('p-'+p).hidden=(p!==h);});\n    Array.prototype.forEach.call($('menu').querySelectorAll('a'),function(a){\n      a.classList.toggle('on',a.getAttribute('data-p')===h);\n    });\n    window.scrollTo(0,0);\n  }\n  window.addEventListener('hashchange',show);\n  show();\n\n  function fill(ul,rows,limit){\n    ul.textContent='';\n    var list=limit?rows.slice(0,limit):rows;\n    if(!list.length){var e=document.createElement('li');e.className='empty';e.textContent='Nothing here yet.';ul.appendChild(e);return;}\n    list.forEach(function(a){\n      var li=document.createElement('li');\n      var t=document.createElement('strong');t.textContent=a.title;\n      var d=document.createElement('small');d.textContent=new Date(a.created).toLocaleDateString();\n      var b=document.createElement('p');b.textContent=a.body;\n      li.appendChild(t);li.appendChild(d);li.appendChild(b);ul.appendChild(li);\n    });\n  }\n\n  fetch('/api/me',{credentials:'same-origin'}).then(function(r){\n    if(!r.ok){location.href='/login';return null;}\n    return r.json();\n  }).then(function(d){\n    if(!d||!d.username)return;\n    $('hello').textContent='Welcome, '+d.username;\n    $('wn').textContent=d.username;\n    $('pu').textContent=d.username;\n    $('av').textContent=d.username.charAt(0).toUpperCase();\n  }).catch(function(){});\n\n  fetch('/api/notice',{credentials:'same-origin'}).then(function(r){return r.ok?r.json():null;}).then(function(d){\n    if(d&&d.text){$('notice').textContent=d.text;$('notice').hidden=false;}\n  }).catch(function(){});\n\n  fetch('/api/announcements',{credentials:'same-origin'}).then(function(r){return r.ok?r.json():[];}).then(function(rows){\n    fill($('annAll'),rows,0);\n  }).catch(function(){});\n\n  $('logout').addEventListener('click',async function(){\n    try{await fetch('/api/logout',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin'});}catch(e){}\n    location.href='/login';\n  });\n})();\n</script>\n</body>\n</html>\n";

// ---------- settings ----------
function settings() {
  return {
    url: (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, ''),
    key: (process.env.SUPABASE_SECRET_KEY || '').trim(),
    adminUser: (process.env.ADMIN_USER || '').trim(),
    adminPass: process.env.ADMIN_PASSWORD || '',
  };
}
function missingSettings(S) {
  const m = [];
  if (!S.url) m.push('SUPABASE_URL');
  if (!S.key) m.push('SUPABASE_SECRET_KEY');
  if (!S.adminUser) m.push('ADMIN_USER');
  if (S.adminPass.length < 10) m.push('ADMIN_PASSWORD (at least 10 characters)');
  return m;
}
let S = settings();
function sessionSecret() {
  return process.env.SESSION_SECRET || crypto.createHash('sha256').update('pb-session:' + S.key).digest('hex');
}

// ---------- Supabase (REST) ----------
async function sb(method, path, body, prefer) {
  const headers = { apikey: S.key, 'Content-Type': 'application/json' };
  if (S.key.startsWith('eyJ')) headers.Authorization = 'Bearer ' + S.key; // legacy JWT-style keys only
  if (prefer) headers.Prefer = prefer;
  const r = await fetch(S.url + '/rest/v1/' + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { /* not json */ }
  if (!r.ok) {
    const err = new Error('Supabase ' + r.status + ' ' + (text || '').slice(0, 200));
    err.status = r.status;
    throw err;
  }
  return data;
}
const q = encodeURIComponent;
async function getUser(username) {
  const rows = await sb('GET', 'clients?username=eq.' + q(username) + '&select=username,salt,hash,disabled,created');
  return rows && rows[0] ? rows[0] : null;
}

const NOTICE_KEY = '__top_notice__';
async function getNotice() {
  const rows = await sb('GET', 'announcements?title=eq.' + q(NOTICE_KEY) + '&select=body&limit=1');
  return rows && rows[0] ? rows[0].body : '';
}

// ---------- passwords (scrypt) ----------
const scrypt = (pw, salt) => new Promise((resolve, reject) =>
  crypto.scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) => (err ? reject(err) : resolve(key))));
async function makeCredential(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt);
  return { salt: salt.toString('hex'), hash: key.toString('hex') };
}
const DUMMY_SALT = crypto.randomBytes(16);
const DUMMY_KEY = Buffer.alloc(64);
async function passwordMatches(user, password) {
  // Same work whether or not the username exists, so timing does not reveal valid usernames.
  const key = await scrypt(password, user ? Buffer.from(user.salt, 'hex') : DUMMY_SALT);
  const expected = user ? Buffer.from(user.hash, 'hex') : DUMMY_KEY;
  return crypto.timingSafeEqual(key, expected) && Boolean(user);
}
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// ---------- signed session cookies ----------
function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', sessionSecret()).update(body).digest('base64url');
  return body + '.' + mac;
}
function unsign(token) {
  if (typeof token !== 'string') return null;
  const i = token.indexOf('.');
  if (i < 1) return null;
  const body = token.slice(0, i);
  const mac = Buffer.from(token.slice(i + 1));
  const want = Buffer.from(crypto.createHmac('sha256', sessionSecret()).update(body).digest('base64url'));
  if (mac.length !== want.length || !crypto.timingSafeEqual(mac, want)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p && p.exp > Date.now() ? p : null;
  } catch (e) { return null; }
}
function readCookies(req) {
  const out = {};
  String(req.headers.get('cookie') || '').split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  });
  return out;
}
function cookieString(req, name, value, maxAgeSec) {
  const secure = new URL(req.url).protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}${secure ? '; Secure' : ''}`;
}
const startCookie = (req, name, payload, ms) => cookieString(req, name, sign({ ...payload, exp: Date.now() + ms }), Math.floor(ms / 1000));
const endCookie = (req, name) => cookieString(req, name, '', 0);

async function currentUser(req) {
  const s = unsign(readCookies(req).pb_user);
  if (!s || s.role !== 'user') return null;
  const u = await getUser(s.u);
  return u && !u.disabled ? u : null;
}
function isAdmin(req) {
  const s = unsign(readCookies(req).pb_admin);
  return Boolean(s && s.role === 'admin');
}

// ---------- brute-force protection (kept in the database, so it works across servers) ----------
const ipKey = (prefix, ip) => prefix + ':' + crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 16);
async function isBlocked(key) {
  const rows = await sb('GET', 'login_attempts?key=eq.' + q(key) + '&select=count,first_at');
  const r = rows && rows[0];
  return Boolean(r && Date.now() - Number(r.first_at) < WINDOW_MS && r.count >= MAX_FAILS);
}
async function addFail(key) {
  const rows = await sb('GET', 'login_attempts?key=eq.' + q(key) + '&select=count,first_at');
  const r = rows && rows[0];
  const now = Date.now();
  const rec = !r || now - Number(r.first_at) >= WINDOW_MS
    ? { key, count: 1, first_at: now }
    : { key, count: r.count + 1, first_at: Number(r.first_at) };
  await sb('POST', 'login_attempts?on_conflict=key', rec, 'resolution=merge-duplicates,return=minimal');
}
async function clearFails(key) {
  await sb('DELETE', 'login_attempts?key=eq.' + q(key), undefined, 'return=minimal');
}

// ---------- responses ----------
function json(status, obj, cookies) {
  const h = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  (cookies || []).forEach((c) => h.append('Set-Cookie', c));
  return new Response(JSON.stringify(obj), { status, headers: h });
}
const clean = (v) => String(v || '').trim().toLowerCase();
const validPassword = (p) => typeof p === 'string' && p.length >= 8 && p.length <= 200;
const publicUser = (u) => ({ username: u.username, created: u.created, disabled: Boolean(u.disabled) });

async function readBody(req) {
  const text = await req.text();
  if (text.length > 10 * 1024) throw Object.assign(new Error('too big'), { status: 413 });
  if (!text) return {};
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' ? v : {};
  } catch (e) { throw Object.assign(new Error('bad json'), { status: 400 }); }
}

// ---------- routes ----------
async function route(req, context) {
  S = settings();
  const url = new URL(req.url);
  const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;
  const method = req.method;
  const missing = missingSettings(S);

  if (pathname === '/account') {
    if (missing.length) return new Response('Setup is not finished.', { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    if (!(await currentUser(req))) return new Response(null, { status: 302, headers: { Location: '/login', 'Cache-Control': 'no-store' } });
    return new Response(ACCOUNT_HTML, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff' },
    });
  }

  if (missing.length) {
    return json(500, { error: 'Setup is not finished. In Netlify, add these settings, then redeploy: ' + missing.join(', ') + '.' });
  }

  // Block cross-site requests: same-origin + JSON only (cookies are also SameSite=Strict).
  if (method !== 'GET' && method !== 'HEAD') {
    const origin = req.headers.get('origin');
    if (origin) {
      let ok = false;
      try { ok = new URL(origin).host === url.host; } catch (e) { ok = false; }
      if (!ok) return json(403, { error: 'Request blocked.' });
    }
    if (!String(req.headers.get('content-type') || '').startsWith('application/json')) {
      return json(415, { error: 'Request blocked.' });
    }
  }
  const body = method === 'GET' || method === 'HEAD' ? {} : await readBody(req);
  const ip = (context && context.ip) || req.headers.get('x-nf-client-connection-ip') || 'unknown';

  // ----- customer login -----
  if (method === 'POST' && pathname === '/api/login') {
    const key = ipKey('u', ip);
    if (await isBlocked(key)) return json(429, { error: 'Too many attempts. Try again in 15 minutes.' });
    const username = clean(body.username);
    const password = String(body.password || '').slice(0, 200);
    const user = USERNAME_RE.test(username) ? await getUser(username) : null;
    const ok = await passwordMatches(user, password);
    if (!ok || user.disabled) {
      await addFail(key);
      return json(401, { error: 'Username or password is incorrect.' });
    }
    await clearFails(key);
    return json(200, { username: user.username }, [startCookie(req, 'pb_user', { role: 'user', u: user.username }, USER_SESSION_MS)]);
  }
  if (method === 'POST' && pathname === '/api/logout') return json(200, { ok: true }, [endCookie(req, 'pb_user')]);
  if (method === 'GET' && pathname === '/api/me') {
    const u = await currentUser(req);
    return u ? json(200, { username: u.username }) : json(401, { error: 'Not signed in.' });
  }

  if (method === 'GET' && pathname === '/api/announcements') {
    const u = await currentUser(req);
    if (!u) return json(401, { error: 'Not signed in.' });
    const rows = await sb('GET', 'announcements?select=id,title,body,created&order=created.desc&limit=50');
    return json(200, (rows || []).filter((r) => r.title !== NOTICE_KEY));
  }
  if (method === 'GET' && pathname === '/api/notice') {
    const u = await currentUser(req);
    if (!u) return json(401, { error: 'Not signed in.' });
    return json(200, { text: await getNotice() });
  }

  // ----- admin -----
  if (method === 'POST' && pathname === '/api/admin/login') {
    const key = ipKey('a', ip);
    if (await isBlocked(key)) return json(429, { error: 'Too many attempts. Try again in 15 minutes.' });
    const okUser = safeEqual(clean(body.username), clean(S.adminUser));
    const okPass = safeEqual(body.password || '', S.adminPass);
    if (!(okUser && okPass)) {
      await addFail(key);
      return json(401, { error: 'Username or password is incorrect.' });
    }
    await clearFails(key);
    return json(200, { ok: true }, [startCookie(req, 'pb_admin', { role: 'admin' }, ADMIN_SESSION_MS)]);
  }
  if (method === 'POST' && pathname === '/api/admin/logout') return json(200, { ok: true }, [endCookie(req, 'pb_admin')]);

  if (pathname.startsWith('/api/admin/')) {
    if (!isAdmin(req)) return json(401, { error: 'Admin sign-in required.' });

    if (method === 'GET' && pathname === '/api/admin/me') return json(200, { ok: true });

    if (pathname === '/api/admin/notice') {
      if (method === 'GET') return json(200, { text: await getNotice() });
      if (method === 'PUT') {
        const text = String(body.text || '').trim().slice(0, 500);
        await sb('DELETE', 'announcements?title=eq.' + q(NOTICE_KEY), undefined, 'return=representation');
        if (text) await sb('POST', 'announcements', { title: NOTICE_KEY, body: text });
        return json(200, { text });
      }
    }
    if (pathname === '/api/admin/announcements') {
      if (method === 'GET') {
        const rows = await sb('GET', 'announcements?select=id,title,body,created&order=created.desc&limit=100');
        return json(200, (rows || []).filter((r) => r.title !== NOTICE_KEY));
      }
      if (method === 'POST') {
        const title = String(body.title || '').trim().slice(0, 120);
        if (title === NOTICE_KEY) return json(400, { error: 'Choose a different title.' });
        const text = String(body.body || '').trim().slice(0, 2000);
        if (!title || !text) return json(400, { error: 'Enter a title and a message.' });
        const rows = await sb('POST', 'announcements', { title, body: text }, 'return=representation');
        return json(201, rows[0]);
      }
    }
    const ann = pathname.match(/^\/api\/admin\/announcements\/(\d{1,12})$/);
    if (ann && method === 'DELETE') {
      const rows = await sb('DELETE', 'announcements?id=eq.' + ann[1], undefined, 'return=representation');
      if (!rows || !rows.length) return json(404, { error: 'Announcement not found.' });
      return json(200, { ok: true });
    }

    if (method === 'GET' && pathname === '/api/admin/users') {
      const rows = await sb('GET', 'clients?select=username,created,disabled&order=username.asc');
      return json(200, (rows || []).map(publicUser));
    }
    if (method === 'POST' && pathname === '/api/admin/users') {
      const username = clean(body.username);
      if (!USERNAME_RE.test(username)) return json(400, { error: 'Username must be 3–32 characters: letters, numbers, dot, dash or underscore.' });
      if (!validPassword(body.password)) return json(400, { error: 'Password must be 8–200 characters.' });
      const cred = await makeCredential(body.password);
      try {
        const rows = await sb('POST', 'clients', { username, salt: cred.salt, hash: cred.hash }, 'return=representation');
        return json(201, publicUser(rows[0]));
      } catch (e) {
        if (e.status === 409) return json(409, { error: 'That username already exists.' });
        throw e;
      }
    }
    const one = pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
    if (one) {
      let name;
      try { name = clean(decodeURIComponent(one[1])); } catch (e) { return json(400, { error: 'Bad username.' }); }
      if (!USERNAME_RE.test(name)) return json(404, { error: 'Account not found.' });
      if (method === 'PATCH') {
        const patch = {};
        if (body.password !== undefined) {
          if (!validPassword(body.password)) return json(400, { error: 'Password must be 8–200 characters.' });
          Object.assign(patch, await makeCredential(body.password));
        }
        if (body.disabled !== undefined) patch.disabled = Boolean(body.disabled);
        if (!Object.keys(patch).length) return json(400, { error: 'Nothing to change.' });
        const rows = await sb('PATCH', 'clients?username=eq.' + q(name), patch, 'return=representation');
        if (!rows || !rows.length) return json(404, { error: 'Account not found.' });
        return json(200, publicUser(rows[0]));
      }
      if (method === 'DELETE') {
        const rows = await sb('DELETE', 'clients?username=eq.' + q(name), undefined, 'return=representation');
        if (!rows || !rows.length) return json(404, { error: 'Account not found.' });
        return json(200, { ok: true });
      }
    }
  }
  return json(404, { error: 'Not found.' });
}

export default async (req, context) => {
  try {
    return await route(req, context);
  } catch (e) {
    if (e && e.status === 413) return json(413, { error: 'Request too large.' });
    if (e && e.status === 400 && e.message === 'bad json') return json(400, { error: 'Bad request.' });
    console.error(e);
    return json(500, { error: 'Server error. Check that the Supabase tables were created (run supabase.sql) and the settings are correct.' });
  }
};
