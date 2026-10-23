const $ = s => document.querySelector(s), tk = () => localStorage.getItem('sl_token')
const api = async (p, body) => { const r = await fetch('/api' + p, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + (tk() || '') }, body: body && JSON.stringify(body) }); const j = await r.json().catch(() => ({})); if (r.status === 401 && tk()) { localStorage.removeItem('sl_token'); location.href = 'login.html' } if (!r.ok) throw Error(j.error || 'Terjadi kesalahan'); return j }
const needLogin = () => { if (!tk()) location.href = 'login.html' }
function shell(active) {
  const name = localStorage.getItem('sl_name') || '', logged = !!tk(), cur = location.pathname.split('/').pop() || 'index.html'
  const L = [['index.html', 'Beranda'], ['dashboard.html', 'Dashboard'], ['connect.html', 'Connection Bot'], ...(logged ? [['#out', 'Keluar']] : [['login.html', 'Masuk / Daftar']])]
  document.body.insertAdjacentHTML('afterbegin', `<header><a class="brand" href="index.html"><img src="logo.jpg" alt="">SecretLy</a>
<div class="hr"><button class="ib" aria-label="Notifikasi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 004 0"/></svg></button>
<a class="av" href="${logged ? 'dashboard.html' : 'login.html'}">${(name[0] || '?').toUpperCase()}</a>
<button class="ib" id="menuBtn" aria-label="Menu"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg></button></div></header>
<div id="scrim"></div><nav id="drawer"><div class="t"><img src="logo.jpg" alt="">SecretLy</div>${L.map(([h, t]) => `<a href="${h}" class="${h === cur ? 'on' : ''}">${t}</a>`).join('')}</nav>`)
  const t = () => document.body.classList.toggle('open')
  $('#menuBtn').onclick = t; $('#scrim').onclick = t
  document.querySelector('a[href="#out"]')?.addEventListener('click', e => { e.preventDefault(); localStorage.clear(); location.href = 'index.html' })
}
const fmt = n => n >= 1000 ? (n / 1000).toFixed(1).replace('.', ',') + 'rb' : n
