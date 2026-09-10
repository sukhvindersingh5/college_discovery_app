/**
 * db.ts — Hybrid Supabase / Local-JSON Database Adapter
 *
 * Tries Supabase on first use. If the remote instance is unreachable or
 * paused (ENOTFOUND, 4xx/5xx on health probe), it transparently falls back
 * to an in-memory store backed by a local JSON file.
 *
 * The adapter implements the subset of the @supabase/supabase-js query-builder
 * API that this codebase uses, so every controller/service continues to work
 * without modification.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

// ---------------------------------------------------------------------------
// Local persistence
// ---------------------------------------------------------------------------

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'local_db.json');

interface LocalDB {
  colleges: any[];
  users: any[];
  saved_colleges: any[];
}

function loadLocalDB(): LocalDB {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch {
      /* corrupted – rebuild */
    }
  }

  // Seed from JSON files
  const seed1Path = path.resolve(__dirname, './seed/colleges.json');
  const seed2Path = path.resolve(__dirname, './seed/more_colleges.json');

  let colleges: any[] = [];
  try {
    const c1: any[] = JSON.parse(fs.readFileSync(seed1Path, 'utf8'));
    const c2: any[] = JSON.parse(fs.readFileSync(seed2Path, 'utf8'));
    const seen = new Set<string>();
    [...c1, ...c2].forEach((c) => {
      const key = c.name.toLowerCase().trim();
      if (!seen.has(key)) { seen.add(key); colleges.push(c); }
    });
  } catch (e) {
    console.error('LocalDB: failed to read seed data', e);
  }

  // Assign auto-increment IDs
  colleges = colleges.map((c, i) => ({ id: i + 1, ...c }));

  const db: LocalDB = { colleges, users: [], saved_colleges: [] };
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  return db;
}

function saveLocalDB(db: LocalDB) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ---------------------------------------------------------------------------
// Local query builder
// ---------------------------------------------------------------------------

type Row = Record<string, any>;

class LocalQueryBuilder {
  private _table: string;
  private _db: LocalDB;
  private _filters: Array<(row: Row) => boolean> = [];
  private _selectFields: string[] | null = null; // null = all
  private _orderField: string | null = null;
  private _orderAsc = true;
  private _orderNullsFirst = false;
  private _rangeFrom: number | null = null;
  private _rangeTo: number | null = null;
  private _isSingle = false;
  private _countMode = false;
  private _insertData: Row | Row[] | null = null;
  private _upsertData: Row | Row[] | null = null;
  private _upsertConflict: string | null = null;
  private _deleteMode = false;

  constructor(table: string, db: LocalDB) {
    this._table = table;
    this._db = db;
  }

  private _getTable(): Row[] {
    return (this._db as any)[this._table] as Row[] || [];
  }

  // ---- builder methods ----

  select(fields?: string, opts?: { count?: string; head?: boolean }) {
    if (fields && fields !== '*') {
      this._selectFields = fields.split(',').map((f) => f.trim());
    }
    if (opts?.count) this._countMode = true;
    return this;
  }

  eq(field: string, value: any) {
    this._filters.push((r) => r[field] == value); // loose equality for id string vs number
    return this;
  }

  neq(field: string, value: any) {
    this._filters.push((r) => r[field] != null && r[field] !== value);
    return this;
  }

  ilike(field: string, pattern: string) {
    const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
    this._filters.push((r) => regex.test(String(r[field] || '')));
    return this;
  }

  or(expr: string) {
    // Supports: "name.ilike.%query%,location.ilike.%query%"
    const parts = expr.split(',');
    const subFilters = parts.map((part) => {
      const [field, op, ...rest] = part.split('.');
      const value = rest.join('.');
      if (op === 'ilike') {
        const regex = new RegExp(value.replace(/%/g, '.*'), 'i');
        return (r: Row) => regex.test(String(r[field] || ''));
      }
      if (op === 'eq') return (r: Row) => r[field] == value;
      return (_r: Row) => false;
    });
    this._filters.push((r) => subFilters.some((f) => f(r)));
    return this;
  }

  contains(field: string, values: any[]) {
    this._filters.push((r) => {
      const arr = Array.isArray(r[field]) ? r[field] : [];
      return values.every((v) => arr.includes(v));
    });
    return this;
  }

  lte(field: string, value: number) {
    this._filters.push((r) => Number(r[field]) <= value);
    return this;
  }

  in(field: string, values: any[]) {
    this._filters.push((r) => values.map(String).includes(String(r[field])));
    return this;
  }

  order(field: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) {
    this._orderField = field;
    this._orderAsc = opts?.ascending !== false;
    this._orderNullsFirst = opts?.nullsFirst === true;
    return this;
  }

  range(from: number, to: number) {
    this._rangeFrom = from;
    this._rangeTo = to;
    return this;
  }

  single() {
    this._isSingle = true;
    return this;
  }

  insert(data: Row | Row[]) {
    this._insertData = data;
    return this;
  }

  upsert(data: Row | Row[], opts?: { onConflict?: string }) {
    this._upsertData = data;
    this._upsertConflict = opts?.onConflict || null;
    return this;
  }

  delete() {
    this._deleteMode = true;
    return this;
  }

  // ---- execution (await-able) ----

  then(resolve: (result: any) => any, reject?: (err: any) => any): any {
    try {
      resolve(this._execute());
    } catch (e) {
      if (reject) reject(e);
      else throw e;
    }
  }

  _execute(): { data: any; error: any; count?: number | null } {
    // INSERT
    if (this._insertData !== null) {
      return this._runInsert();
    }
    // UPSERT
    if (this._upsertData !== null) {
      return this._runUpsert();
    }
    // DELETE
    if (this._deleteMode) {
      return this._runDelete();
    }
    // SELECT
    return this._runSelect();
  }

  private _runInsert() {
    const table = this._getTable();
    const rows = Array.isArray(this._insertData) ? this._insertData : [this._insertData!];
    const inserted: Row[] = [];

    for (const row of rows) {
      const maxId = table.reduce((m, r) => Math.max(m, r.id || 0), 0);
      const newRow = { id: maxId + 1, ...row, created_at: new Date().toISOString() };
      table.push(newRow);
      inserted.push(newRow);
    }

    saveLocalDB(this._db);

    if (this._isSingle) {
      const picked = this._applySelect([inserted[0]])[0];
      return { data: picked, error: null };
    }
    return { data: this._applySelect(inserted), error: null };
  }

  private _runUpsert() {
    const table = this._getTable();
    const rows = Array.isArray(this._upsertData) ? this._upsertData : [this._upsertData!];
    const conflictKeys = this._upsertConflict ? this._upsertConflict.split(',').map((k) => k.trim()) : ['id'];

    for (const row of rows) {
      const existingIdx = table.findIndex((r) =>
        conflictKeys.every((k) => String(r[k]) === String(row[k]))
      );
      if (existingIdx >= 0) {
        table[existingIdx] = { ...table[existingIdx], ...row };
      } else {
        const maxId = table.reduce((m, r) => Math.max(m, r.id || 0), 0);
        table.push({ id: maxId + 1, ...row, created_at: new Date().toISOString() });
      }
    }

    saveLocalDB(this._db);
    return { data: null, error: null };
  }

  private _runDelete() {
    const table = this._getTable() as Row[];
    const before = table.length;
    const remaining = table.filter((r) => !this._filters.every((f) => f(r)));
    (this._db as any)[this._table] = remaining;
    saveLocalDB(this._db);
    return { data: null, error: null, count: before - remaining.length };
  }

  private _runSelect() {
    let rows = this._getTable();

    // Apply filters
    for (const f of this._filters) {
      rows = rows.filter(f);
    }

    const totalCount = rows.length;

    // Order
    if (this._orderField) {
      const field = this._orderField;
      const asc = this._orderAsc;
      const nullsFirst = this._orderNullsFirst;
      rows = [...rows].sort((a, b) => {
        const av = a[field];
        const bv = b[field];
        if (av == null && bv == null) return 0;
        if (av == null) return nullsFirst ? -1 : 1;
        if (bv == null) return nullsFirst ? 1 : -1;
        if (av < bv) return asc ? -1 : 1;
        if (av > bv) return asc ? 1 : -1;
        return 0;
      });
    }

    // Range (pagination)
    if (this._rangeFrom !== null && this._rangeTo !== null) {
      rows = rows.slice(this._rangeFrom, this._rangeTo + 1);
    }

    // Select fields
    rows = this._applySelect(rows);

    if (this._isSingle) {
      if (rows.length === 0) return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
      return { data: rows[0], error: null };
    }

    if (this._countMode) {
      return { data: rows, error: null, count: totalCount };
    }

    return { data: rows, error: null };
  }

  private _applySelect(rows: Row[]): Row[] {
    if (!this._selectFields) return rows;
    const fields = this._selectFields;

    return rows.map((r) => {
      const out: Row = {};
      for (const f of fields) {
        // Support nested foreign-key selects like "colleges(id,name,...)"
        const nestedMatch = f.match(/^(\w+)\((.+)\)$/);
        if (nestedMatch) {
          const refTable = nestedMatch[1];
          const refFields = nestedMatch[2].split(',').map((x) => x.trim());
          // e.g. saved_colleges join colleges
          if (r[refTable]) {
            const nested = r[refTable];
            const picked: Row = {};
            for (const rf of refFields) picked[rf] = nested[rf];
            out[refTable] = picked;
          } else {
            out[refTable] = null;
          }
        } else {
          out[f] = r[f];
        }
      }
      return out;
    });
  }
}

// ---------------------------------------------------------------------------
// Local adapter (mirrors the SupabaseClient surface used in this project)
// ---------------------------------------------------------------------------

class LocalAdapter {
  private _db: LocalDB;

  constructor() {
    this._db = loadLocalDB();
    console.log(
      `📦 LocalDB loaded: ${this._db.colleges.length} colleges, ${this._db.users.length} users`
    );
  }

  from(table: string) {
    // saved_colleges needs to resolve the college join inline
    const self = this;

    // We return a proxy builder that intercepts .select() to handle joins
    return new Proxy(new LocalQueryBuilder(table, this._db), {
      get(target, prop) {
        if (prop === 'select') {
          return function (fields?: string, opts?: any) {
            const builder = target.select(fields, opts);
            // If this is saved_colleges selecting college nested data, we need to enrich rows
            if (table === 'saved_colleges' && fields && fields.includes('colleges(')) {
              // Override _execute to do join
              const origExecute = builder._execute.bind(builder);
              builder._execute = function () {
                const result = origExecute();
                if (!result.data) return result;
                const colleges: Row[] = (self._db as any).colleges || [];
                const enriched = (result.data as Row[]).map((saved: Row) => {
                  const college = colleges.find((c) => c.id === saved.college_id) || null;
                  return { ...saved, colleges: college };
                });
                return { ...result, data: enriched };
              };
            }
            return builder;
          };
        }
        return (target as any)[prop];
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Probe Supabase; on failure use local adapter
// ---------------------------------------------------------------------------

let _client: SupabaseClient | LocalAdapter | null = null;
let _probed = false;

async function probeSupabase(): Promise<boolean> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes('your_supabase')) return false;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${url}/rest/v1/colleges?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok || res.status === 400; // 400 = table may not exist but Supabase is reachable
  } catch {
    return false;
  }
}

async function getClient(): Promise<SupabaseClient | LocalAdapter> {
  if (_client) return _client;
  if (!_probed) {
    _probed = true;
    const ok = await probeSupabase();
    if (ok) {
      console.log('✅ Connected to Supabase (remote)');
      _client = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    } else {
      console.warn('⚠️  Supabase unreachable — using LocalDB fallback (all 58 colleges available)');
      _client = new LocalAdapter();
    }
  } else {
    // Wait until probed (shouldn't happen in practice)
    await new Promise((r) => setTimeout(r, 200));
    return getClient();
  }
  return _client!;
}

// ---------------------------------------------------------------------------
// Synchronous proxy that defers to the async client
// Because Supabase builders are themselves async (they resolve on .then()),
// we can return a "lazy" builder that resolves the client when awaited.
// ---------------------------------------------------------------------------

class LazyClientProxy {
  from(table: string) {
    return new LazyBuilderProxy(table);
  }
}

class LazyBuilderProxy {
  private _table: string;
  private _ops: Array<{ method: string; args: any[] }> = [];

  constructor(table: string) {
    this._table = table;
  }

  private _chain(method: string, args: any[]) {
    this._ops.push({ method, args });
    return this;
  }

  select(...args: any[]) { return this._chain('select', args); }
  eq(...args: any[]) { return this._chain('eq', args); }
  neq(...args: any[]) { return this._chain('neq', args); }
  ilike(...args: any[]) { return this._chain('ilike', args); }
  or(...args: any[]) { return this._chain('or', args); }
  contains(...args: any[]) { return this._chain('contains', args); }
  lte(...args: any[]) { return this._chain('lte', args); }
  in(...args: any[]) { return this._chain('in', args); }
  order(...args: any[]) { return this._chain('order', args); }
  range(...args: any[]) { return this._chain('range', args); }
  single() { return this._chain('single', []); }
  insert(...args: any[]) { return this._chain('insert', args); }
  upsert(...args: any[]) { return this._chain('upsert', args); }
  delete() { return this._chain('delete', []); }

  then(resolve: (v: any) => any, reject?: (e: any) => any): any {
    getClient()
      .then((client) => {
        let builder: any = client.from(this._table);
        for (const { method, args } of this._ops) {
          builder = builder[method](...args);
        }
        return builder;
      })
      .then(resolve)
      .catch(reject);
  }
}

// Singleton lazy proxy – drop-in replacement for the supabase client
const supabase = new LazyClientProxy() as any;

export default supabase;
