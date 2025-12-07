const { Home } = require('../models/Home');
const { Message } = require('../models/Message');

function pick(obj, fields = []) {
  if (!obj || !Array.isArray(fields) || !fields.length) return {};
  const out = {};
  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(obj, f)) out[f] = obj[f];
  }
  return out;
}

function asSection(title, body) {
  const t = (title || '').trim();
  const b = (body || '').trim();
  if (!b) return '';
  return `\n\n### ${t}\n${b}`;
}

function kvLines(obj) {
  return Object.entries(obj || {})
    .map(([k, v]) => `- ${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
    .join('\n');
}

async function buildContext({ homeId, tradeId, taskId, config = {} }) {
  if (!homeId) return '';
  const home = await Home.findById(homeId).lean();
  if (!home) return '';
  const includes = config.includes || {}; // namespaced toggles
  const lines = [];

  // Home basics
  if (includes.home) {
    const fields = Array.isArray(includes.home.fields) ? includes.home.fields : ['name', 'address', 'city', 'state', 'zip'];
    const basic = pick(home, fields);
    lines.push(asSection('Home', kvLines(basic)));
  }

  // Trades
  if (includes.trades) {
    const onlyCurrent = !!includes.trades.onlyCurrent;
    const fields = Array.isArray(includes.trades.fields) ? includes.trades.fields : ['name', 'totalPrice', 'notes'];
    const source = onlyCurrent && tradeId
      ? (home.trades || []).filter((t) => String(t._id) === String(tradeId))
      : (home.trades || []);
    const body = source.map((t) => `• ${t.name || t.category || 'Trade'}\n${kvLines(pick(t, fields))}`).join('\n');
    if (body) lines.push(asSection('Trades', body));
  }

  // Tasks (for current trade)
  if (includes.tasks) {
    const fields = Array.isArray(includes.tasks.fields) ? includes.tasks.fields : ['title', 'description', 'phaseKey', 'status'];
    const trade = (home.trades || []).find((t) => String(t._id) === String(tradeId));
    const src = trade ? (trade.tasks || []) : [];
    const onlyTask = !!includes.tasks.onlyCurrent && taskId;
    const filtered = onlyTask ? src.filter((tk) => String(tk._id) === String(taskId)) : src;
    const body = filtered.map((tk) => `• ${tk.title}\n${kvLines(pick(tk, fields))}`).join('\n');
    if (body) lines.push(asSection('Tasks', body));
  }

  // Quality Checks (for current trade)
  if (includes.qualityChecks) {
    const fields = Array.isArray(includes.qualityChecks.fields) ? includes.qualityChecks.fields : ['title', 'phaseKey', 'accepted', 'acceptedBy', 'acceptedAt'];
    const trade = (home.trades || []).find((t) => String(t._id) === String(tradeId));
    const src = trade ? (trade.qualityChecks || []) : [];
    const body = src.map((qc) => `• ${qc.title}\n${kvLines(pick(qc, fields))}`).join('\n');
    if (body) lines.push(asSection('Quality Checks', body));
  }

  // Documents
  if (includes.documents) {
    const categories = Array.isArray(includes.documents.categories) ? includes.documents.categories : [];
    const onlyFinal = !!includes.documents.onlyFinal;
    const fields = Array.isArray(includes.documents.fields) ? includes.documents.fields : ['title', 'category', 'fileName', 'createdAt', 'isFinal'];
    let docs = home.documents || [];
    if (categories.length) {
      const cats = new Set(categories.map((c) => String(c).toLowerCase()));
      docs = docs.filter((d) => cats.has(String(d.category || '').toLowerCase()));
    }
    if (onlyFinal) docs = docs.filter((d) => !!d.isFinal);
    const body = docs.slice(0, includes.documents.limit || 50).map((d) => `• ${d.title}\n${kvLines(pick(d, fields))}`).join('\n');
    if (body) lines.push(asSection('Documents', body));
  }

  // Messages
  if (includes.messages) {
    const scope = includes.messages.scope || 'home'; // 'home' | 'trade' | 'task'
    const limit = Math.max(1, Math.min(Number(includes.messages.limit) || 50, 200));
    const query = { homeId: String(homeId) };
    if (scope === 'trade' && tradeId) query.tradeId = String(tradeId);
    if (scope === 'task' && taskId) query.taskId = String(taskId);
    const msgs = await Message.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    const body = (msgs || []).reverse().map((m) => {
      const who = m.author?.fullName || m.author?.email || 'Unknown';
      return `- ${new Date(m.createdAt).toISOString()} ${who}: ${m.text || ''}`;
    }).join('\n');
    if (body) lines.push(asSection('Messages', body));
  }

  // Schedules
  if (includes.schedules) {
    const fields = Array.isArray(includes.schedules.fields) ? includes.schedules.fields : ['title', 'startsAt', 'endsAt', 'bidId', 'taskId'];
    const src = home.schedules || [];
    const body = src.map((s) => `• ${s.title}\n${kvLines(pick(s, fields))}`).join('\n');
    if (body) lines.push(asSection('Schedules', body));
  }

  // Contacts (trade contacts)
  if (includes.contacts) {
    const trade = (home.trades || []).find((t) => String(t._id) === String(tradeId));
    const contacts = trade ? (trade.contacts || []) : [];
    const fields = Array.isArray(includes.contacts.fields) ? includes.contacts.fields : ['company', 'fullName', 'email', 'phone', 'isPrimary'];
    const body = contacts.map((c) => `• ${c.fullName || c.company || c.email || 'Contact'}\n${kvLines(pick(c, fields))}`).join('\n');
    if (body) lines.push(asSection('Contacts', body));
  }

  // Budget summary (trade)
  if (includes.budget) {
    const trade = (home.trades || []).find((t) => String(t._id) === String(tradeId));
    if (trade) {
      const fields = Array.isArray(includes.budget.fields) ? includes.budget.fields : ['totalPrice', 'totalPaid'];
      const body = kvLines(pick(trade, fields));
      if (body) lines.push(asSection('Budget', body));
    }
  }

  return lines.filter(Boolean).join('');
}

module.exports = { buildContext };


