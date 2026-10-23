const express = require('express'), crypto = require('crypto'), fs = require('fs')
const PORT = process.env.SERVER_PORT || process.env.PORT || 3000
const BOT = process.env.BOT_API_URL || 'http://127.0.0.1:3001'          // alamat API bot (IP:port panel bot)
const KEY = process.env.BOT_API_KEY || 'ganti-api-key-rahasia'          // sama dengan API_KEY di bot
const SECRET = process.env.JWT_SECRET || 'ganti-secret-web'
const app = express(); app.use(express.json()); app.use(express.static('public'))
let users = []; try { users = JSON.parse(fs.readFileSync('users.json')) } catch {}
const save = () => fs.writeFileSync('users.json', JSON.stringify(users, null, 1))
const hash = (p, s) => crypto.scryptSync(p, s, 32).toString('hex')
const sign = u => { const b = Buffer.from(JSON.stringify({ id: u.id, exp: Date.now() + 7 * 864e5 })).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url') }
const auth = (req, res, next) => {
  try { const [b, s] = (req.headers.authorization || '').replace('Bearer ', '').split('.')
    if (s !== crypto.createHmac('sha256', SECRET).update(b).digest('base64url')) throw 0
    const t = JSON.parse(Buffer.from(b, 'base64url')); if (t.exp < Date.now()) throw 0
    req.user = users.find(u => u.id === t.id); if (!req.user) throw 0; next() } catch { res.status(401).json({ error: 'Silakan login dulu.' }) }
}
const bot = async (p, body) => { const r = await fetch(BOT + p, { method: body ? 'POST' : 'GET', headers: { 'x-api-key': KEY, 'content-type': 'application/json' }, body: body && JSON.stringify(body), signal: AbortSignal.timeout(30000) }); return r.json() }
const wrap = f => (req, res) => f(req, res).catch(e => res.status(502).json({ error: 'Bot tidak bisa dihubungi: ' + e.message }))
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body || {}
  if (!name || !/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 6) return res.status(400).json({ error: 'Isi nama, email valid, dan password minimal 6 karakter.' })
  if (users.some(u => u.email === email.toLowerCase())) return res.status(409).json({ error: 'Email sudah terdaftar.' })
  const salt = crypto.randomBytes(8).toString('hex'), u = { id: 'u' + Date.now().toString(36) + crypto.randomBytes(2).toString('hex'), name, email: email.toLowerCase(), salt, pw: hash(password, salt) }
  users.push(u); save(); res.json({ token: sign(u), name })
})
app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {}, u = users.find(x => x.email === (email || '').toLowerCase())
  if (!u || hash(password || '', u.salt) !== u.pw) return res.status(401).json({ error: 'Email atau password salah.' })
  res.json({ token: sign(u), name: u.name })
})
app.get('/api/me', auth, (req, res) => res.json({ name: req.user.name, email: req.user.email }))
app.get('/api/stats', wrap(async (q, r) => r.json(await bot('/api/stats'))))
app.get('/api/bot/status', auth, wrap(async (q, r) => r.json(await bot('/api/status?id=' + q.user.id))))
app.post('/api/bot/pair', auth, wrap(async (q, r) => { const j = await bot('/api/pair', { id: q.user.id, phone: q.body.phone }); r.status(j.error ? 400 : 200).json(j) }))
app.post('/api/bot/start', auth, wrap(async (q, r) => r.json(await bot('/api/start', { id: q.user.id }))))
app.post('/api/bot/stop', auth, wrap(async (q, r) => r.json(await bot('/api/stop', { id: q.user.id }))))
app.listen(PORT, () => console.log('SecretLy Web on :' + PORT))
