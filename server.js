const express = require('express'), crypto = require('crypto')
const PORT = process.env.SERVER_PORT || process.env.PORT || 3000
const BOT = process.env.BOT_API_URL || 'http://127.0.0.1:3001'          // alamat API bot (IP:port panel bot)
const KEY = process.env.BOT_API_KEY || 'ganti-api-key-rahasia'          // sama dengan API_KEY di bot
const SECRET = process.env.JWT_SECRET || 'ganti-secret-web'
const SB = (process.env.SUPABASE_URL || '').replace(/\/$/, ''), SBK = process.env.SUPABASE_SERVICE_KEY || ''   // service_role key (rahasia, jangan dipasang di frontend)
const sb = async (path, opt = {}) => {
  if (!SB || !SBK) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY belum diisi di environment variable.')
  const r = await fetch(SB + '/rest/v1/' + path, { ...opt, headers: { apikey: SBK, ...(SBK.startsWith('sb_') ? {} : { authorization: 'Bearer ' + SBK }), 'content-type': 'application/json', prefer: 'return=representation', ...opt.headers }, signal: AbortSignal.timeout(15000) })
  const j = await r.json().catch(() => null); if (!r.ok) throw new Error((j && (j.message || j.hint)) || 'Supabase error ' + r.status); return j
}
const hash = (p, s) => crypto.scryptSync(p, s, 32).toString('hex')
const byEmail = async e => (await sb('users?select=*&email=eq.' + encodeURIComponent(e) + '&limit=1'))[0]
const app = express(); app.use(express.json()); const path = require('path'), PUB = path.join(__dirname, 'public')
app.use(express.static(PUB))
;[['/', 'index.html'], ['/login', 'login.html'], ['/dashboard', 'dashboard.html'], ['/connect', 'connect.html']].forEach(([u, f]) => app.get(u, (q, r) => r.sendFile(path.join(PUB, f))))
const sign = u => { const b = Buffer.from(JSON.stringify({ id: u.id, name: u.name, email: u.email, exp: Date.now() + 7 * 864e5 })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url') }
const auth = (req, res, next) => {
  try { const [b, s] = (req.headers.authorization || '').replace('Bearer ', '').split('.')
    if (s !== crypto.createHmac('sha256', SECRET).update(b).digest('base64url')) throw 0
    const t = JSON.parse(Buffer.from(b, 'base64url')); if (t.exp < Date.now()) throw 0
    req.user = { id: t.id, name: t.name, email: t.email }; next() } catch { res.status(401).json({ error: 'Silakan login dulu.' }) }
}
const bot = async (p, body) => { const r = await fetch(BOT + p, { method: body ? 'POST' : 'GET', headers: { 'x-api-key': KEY, 'content-type': 'application/json' }, body: body && JSON.stringify(body), signal: AbortSignal.timeout(30000) }); return r.json() }
const wrap = f => (req, res) => f(req, res).catch(e => res.status(502).json({ error: e.message }))
app.post('/api/register', wrap(async (q, r) => {
  const { name, email, password } = q.body || {}, em = String(email || '').toLowerCase().trim()
  if (!name || !/^\S+@\S+\.\S+$/.test(em) || String(password || '').length < 6) return r.status(400).json({ error: 'Isi nama, email valid, dan password minimal 6 karakter.' })
  if (await byEmail(em)) return r.status(409).json({ error: 'Email sudah terdaftar.' })
  const salt = crypto.randomBytes(8).toString('hex'), id = 'u' + Date.now().toString(36) + crypto.randomBytes(2).toString('hex')
  await sb('users', { method: 'POST', body: JSON.stringify({ id, name: String(name).slice(0, 40), email: em, salt, pw: hash(String(password), salt) }) })
  r.json({ token: sign({ id, name, email: em }), name })
}))
app.post('/api/login', wrap(async (q, r) => {
  const { email, password } = q.body || {}, u = await byEmail(String(email || '').toLowerCase().trim())
  if (!u || hash(String(password || ''), u.salt) !== u.pw) return r.status(401).json({ error: 'Email atau password salah.' })
  r.json({ token: sign(u), name: u.name })
}))
app.get('/api/me', auth, (req, res) => res.json({ name: req.user.name, email: req.user.email }))
app.get('/api/stats', wrap(async (q, r) => r.json(await bot('/api/stats'))))
app.get('/api/bot/status', auth, wrap(async (q, r) => r.json(await bot('/api/status?id=' + q.user.id))))
app.post('/api/bot/pair', auth, wrap(async (q, r) => { const j = await bot('/api/pair', { id: q.user.id, phone: q.body.phone }); r.status(j.error ? 400 : 200).json(j) }))
app.post('/api/bot/start', auth, wrap(async (q, r) => r.json(await bot('/api/start', { id: q.user.id }))))
app.post('/api/bot/stop', auth, wrap(async (q, r) => r.json(await bot('/api/stop', { id: q.user.id }))))
if (require.main === module) app.listen(PORT, () => console.log('SecretLy Web on :' + PORT))
module.exports = app
