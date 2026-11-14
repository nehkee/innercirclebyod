// Minimal in-memory stand-in for the supabase-js query builder, covering the
// calls used by lib/support/*, lib/membership.ts and lib/payments/*. Test-only.
const crypto = require('crypto');

const db = {
  members: [], memberships: [], events: [], tickets: [], payments: [],
  member_offers: [], support_threads: [], support_messages: [], refund_requests: [],
  drops: [], drop_orders: [], rate_limits: [], waitlist: [], invite_codes: [],
};

/** Empty every table between tests. */
function reset() {
  for (const k of Object.keys(db)) db[k].length = 0;
}
let clock = Date.parse('2026-11-14T08:00:00Z');
const nowIso = () => new Date(clock += 1000).toISOString();

const DEFAULTS = {
  support_threads:  () => ({ status: 'bot', stage: 'start', reason: null, outcome: null, assigned_to: null, ticket_id: null, member_last_read_at: nowIso(), team_last_read_at: null, updated_at: nowIso() }),
  support_messages: () => ({ actions: null, author_id: null }),
  member_offers:    () => ({ source: 'bot', granted_by: null, thread_id: null, expires_at: null, used_at: null, payment_id: null, percent: null, tier: null, months: null }),
  refund_requests:  () => ({ status: 'requested', crypto_address: null, note: null, processed_by: null, processed_at: null, ticket_id: null }),
  tickets:          () => ({ status: 'valid', payment_status: 'paid', qr_token: null, used_at: null }),
};

function uniqueViolation(table, row, ignoreId) {
  if (table === 'tickets') {
    return db.tickets.some(t => t.id !== ignoreId && t.event_id === row.event_id && t.user_id === row.user_id);
  }
  if (table === 'drop_orders') {
    return db.drop_orders.some(o => o.id !== ignoreId && o.drop_id === row.drop_id && o.member_id === row.member_id);
  }
  return false;
}

function attachEmbeds(table, row, cols) {
  const out = { ...row };
  if (/events\s*\(/.test(cols) && row.event_id) out.events = db.events.find(e => e.id === row.event_id) ?? null;
  if (table === 'refund_requests' && /payments\s*\(/.test(cols)) out.payments = db.payments.find(p => p.id === row.payment_id) ?? null;
  return out;
}

class Q {
  constructor(table) { Object.assign(this, { table, filters: [], op: 'select', cols: '*', head: false, count: null, orderBy: [], lim: null, returning: false, mode: 'many' }); }
  select(cols = '*', opts = {}) { this.cols = cols; if (this.op !== 'select') this.returning = true; if (opts.head) this.head = true; if (opts.count) this.count = opts.count; return this; }
  insert(rows) { this.op = 'insert'; this.payload = Array.isArray(rows) ? rows : [rows]; return this; }
  update(patch) { this.op = 'update'; this.payload = patch; return this; }
  upsert(row) { this.op = 'upsert'; this.payload = row; return this; }
  eq(c, v)  { this.filters.push(r => r[c] === v); return this; }
  neq(c, v) { this.filters.push(r => r[c] !== v); return this; }
  is(c, v)  { this.filters.push(r => (r[c] ?? null) === v); return this; }
  in(c, vs) { this.filters.push(r => vs.includes(r[c])); return this; }
  gt(c, v)  { this.filters.push(r => r[c] != null && r[c] > v); return this; }
  gte(c, v) { this.filters.push(r => r[c] != null && r[c] >= v); return this; }
  like(c, p) { const re = new RegExp('^' + p.replace(/%/g, '.*') + '$'); this.filters.push(r => re.test(r[c] ?? '')); return this; }
  not(c, op, v) { if (op === 'is' && v === null) this.filters.push(r => r[c] != null); return this; }
  or(expr) {
    const parts = expr.split(',').map(p => { const [col, op, ...rest] = p.split('.'); return { col, op, val: rest.join('.') }; });
    this.filters.push(r => parts.some(({ col, op, val }) => op === 'is' ? (r[col] ?? null) === null : op === 'gt' ? r[col] != null && r[col] > val : false));
    return this;
  }
  order(c, { ascending = true } = {}) { this.orderBy.push([c, ascending]); return this; }
  limit(n) { this.lim = n; return this; }
  single() { this.mode = 'single'; return this; }
  maybeSingle() { this.mode = 'maybe'; return this; }
  then(res, rej) { return Promise.resolve().then(() => this.run()).then(res, rej); }

  run() {
    const T = db[this.table];
    if (!T) return { data: null, error: { message: `no table ${this.table}` } };
    const match = r => this.filters.every(f => f(r));
    let rows;

    if (this.op === 'insert') {
      rows = [];
      for (const p of this.payload) {
        const row = { id: crypto.randomUUID(), created_at: nowIso(), ...(DEFAULTS[this.table]?.() ?? {}), ...p };
        if (uniqueViolation(this.table, row)) return { data: null, error: { code: '23505', message: 'duplicate key' } };
        T.push(row); rows.push(row);
      }
      if (!this.returning) return { data: null, error: null };
    } else if (this.op === 'update') {
      rows = T.filter(match);
      for (const r of rows) {
        const next = { ...r, ...this.payload };
        if (uniqueViolation(this.table, next, r.id)) return { data: null, error: { code: '23505', message: 'duplicate key' } };
      }
      rows.forEach(r => Object.assign(r, this.payload));
      if (!this.returning) return { data: null, error: null };
    } else if (this.op === 'upsert') {
      const ex = T.find(r => r.user_id === this.payload.user_id);
      if (ex) Object.assign(ex, this.payload); else T.push({ id: crypto.randomUUID(), created_at: nowIso(), ...this.payload });
      return { data: null, error: null };
    } else {
      rows = T.filter(match);
    }

    for (const [c, asc] of [...this.orderBy].reverse()) rows = [...rows].sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1));
    if (this.lim != null) rows = rows.slice(0, this.lim);
    if (this.head) return { data: null, count: rows.length, error: null };
    const data = rows.map(r => attachEmbeds(this.table, r, this.cols));
    if (this.mode === 'single') return data.length ? { data: data[0], error: null } : { data: null, error: { message: 'no rows' } };
    if (this.mode === 'maybe') return { data: data[0] ?? null, error: null };
    return { data, error: null, count: this.count ? data.length : undefined };
  }
}

const client = {
  from: t => new Q(t),
  rpc: async (fn, args) => {
    if (fn === 'increment_event_sold') {
      const e = db.events.find(x => x.id === args.event_id);
      if (!e || e.capacity - e.sold < args.amount) return { error: { message: 'Insufficient capacity' } };
      e.sold += args.amount; return { error: null };
    }
    if (fn === 'increment_drop_sold') {
      const d = db.drops.find(x => x.id === args.drop_id);
      if (!d || d.quantity - d.sold < args.amount) return { error: { message: 'Sold out' } };
      d.sold += args.amount; return { error: null };
    }
    if (fn === 'update_member_points') {
      const m = db.members.find(x => x.id === args.member_id); if (m) m.points += args.points_delta; return { error: null };
    }
    return { error: { message: `unknown rpc ${fn}` } };
  },
};

module.exports = {
  db, nowIso, reset,
  createAdminClient: () => client,
  isSupabaseConfigured: () => true,
  supabase: client,
};
