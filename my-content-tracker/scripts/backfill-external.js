/*
Backfill script: enrich contents rows without external_id using TMDb/RAWG/OpenLibrary.
Requirements:
- Node 18+ (global fetch)
- Environment variables set:

Run:
  node scripts/backfill-external.js
  export const TMDB_API_KEY = "a29f7916b2c089698d48ec43216a6cff";
export const RAWG_API_KEY = "d5b4c44a780642cc97fd3c978aa5962e"; 

This script processes rows in batches and updates found external_id, cover_url and duration_minutes.
*/


const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const RAWG_API_KEY = process.env.RAWG_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY env vars.');
  process.exit(1);
}
if (!TMDB_API_KEY) console.warn('Warning: TMDB_API_KEY not set — movies/series will not be enriched');
if (!RAWG_API_KEY) console.warn('Warning: RAWG_API_KEY not set — videogames will not be enriched');

const BATCH_SIZE = Number(process.env.BATCH_SIZE || 50);
const DELAY_MS = Number(process.env.DELAY_MS || 300);
// FILTER_MODE:
// - no_external (default): select rows where external_id IS NULL or = ''
// - no_duration: select rows where duration_minutes IS NULL
// - both: select rows where external_id IS NULL/'' OR duration_minutes IS NULL
const FILTER_MODE = process.env.FILTER_MODE || 'no_external';

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function fetchRows(offset = 0, limit = BATCH_SIZE) {
  // Build query depending on desired filter mode
  let filterQuery = '';
  if (FILTER_MODE === 'no_duration') {
    filterQuery = 'duration_minutes=is.null';
  } else if (FILTER_MODE === 'both') {
    // external_id IS NULL OR '' OR duration_minutes IS NULL
    // We'll fetch rows matching either by using PostgREST OR is not directly supported in a single param,
    // so fetch rows where external_id is null/empty first, if none, fetch duration null.
    const urlExternalNull = `${SUPABASE_URL}/rest/v1/contents?external_id=is.null&select=id,title,type&limit=${limit}&offset=${offset}`;
    let resExt = await fetch(urlExternalNull, { headers });
    if (!resExt.ok) throw new Error(`Supabase fetch rows failed: ${resExt.status} ${resExt.statusText}`);
    const jExt = await resExt.json();
    if (jExt && jExt.length > 0) return jExt;
    const urlExternalEmpty = `${SUPABASE_URL}/rest/v1/contents?external_id=eq.%27%27&select=id,title,type&limit=${limit}&offset=${offset}`;
    resExt = await fetch(urlExternalEmpty, { headers });
    if (!resExt.ok) throw new Error(`Supabase fetch rows (empty) failed: ${resExt.status} ${resExt.statusText}`);
    const jEmpty = await resExt.json();
    if (jEmpty && jEmpty.length > 0) return jEmpty;
    // fallback to duration null
    filterQuery = 'duration_minutes=is.null';
  } else {
    // default no_external
    filterQuery = 'external_id=is.null';
  }

  const url = `${SUPABASE_URL}/rest/v1/contents?${filterQuery}&select=id,title,type&limit=${limit}&offset=${offset}`;
  const res = await fetch(url, { headers });
  console.log(`DEBUG fetchRows: GET ${url} -> ${res.status} ${res.statusText}`);
  const cr = res.headers && typeof res.headers.get === 'function' ? res.headers.get('content-range') : null;
  if (cr) console.log('DEBUG Content-Range:', cr);
  if (!res.ok) throw new Error(`Supabase fetch rows failed: ${res.status} ${res.statusText}`);
  const j = await res.json();
  if (!j || j.length === 0) {
    try {
      const bodyText = JSON.stringify(j);
      console.log('DEBUG fetchRows response body (truncated):', bodyText && bodyText.substring(0, 1000));
    } catch (e) {
      console.log('DEBUG fetchRows response body could not be stringified');
    }
  }
  // If we asked for external_id is.null and got none, also try empty string
  if ((FILTER_MODE === 'no_external' || FILTER_MODE === 'both') && (!j || j.length === 0)) {
    const urlEmpty = `${SUPABASE_URL}/rest/v1/contents?external_id=eq.%27%27&select=id,title,type&limit=${limit}&offset=${offset}`;
  const res2 = await fetch(urlEmpty, { headers });
  console.log(`DEBUG fetchRows (empty check): GET ${urlEmpty} -> ${res2.status} ${res2.statusText}`);
  if (!res2.ok) throw new Error(`Supabase fetch rows (empty) failed: ${res2.status} ${res2.statusText}`);
  const j2 = await res2.json();
  if (!j2 || j2.length === 0) console.log('DEBUG fetchRows (empty) response body (truncated):', JSON.stringify(j2).substring(0, 1000));
  return j2;
  }
  return j;
}

async function patchRow(id, payload) {
  const url = `${SUPABASE_URL}/rest/v1/contents?id=eq.${encodeURIComponent(id)}`;
  const opts = {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  };
  // handle rate limits with a simple retry
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, opts);
    if (res.ok) {
      const j = await res.json();
      return j;
    }
    if (res.status === 429) {
      const wait = 1000 * (attempt + 1);
      console.warn(`Rate limited on patch, attempt ${attempt + 1}, waiting ${wait}ms`);
      await sleep(wait);
      continue;
    }
    const text = await res.text();
    throw new Error(`Supabase patch failed: ${res.status} ${res.statusText} - ${text}`);
  }
  throw new Error('Supabase patch failed after retries');
}

async function enrichForRow(row) {
  const { id, title, type } = row;
  const payload = {};

  try {
    if (type === 'movie') {
      if (!TMDB_API_KEY) return null;
      const s = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
      if (!s.ok) return null;
      const sj = await s.json();
      const m = sj.results?.[0];
      if (m) {
        const dres = await fetch(`https://api.themoviedb.org/3/movie/${m.id}?api_key=${TMDB_API_KEY}`);
        if (dres.ok) {
          const d = await dres.json();
          payload.external_provider = 'tmdb';
          payload.external_id = String(m.id);
          payload.cover_url = d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null;
          payload.duration_minutes = d.runtime || null;
        }
      }
    } else if (type === 'tvSerie') {
      if (!TMDB_API_KEY) return null;
      const s = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
      if (!s.ok) return null;
      const sj = await s.json();
      const m = sj.results?.[0];
      if (m) {
        const dres = await fetch(`https://api.themoviedb.org/3/tv/${m.id}?api_key=${TMDB_API_KEY}`);
        if (dres.ok) {
          const d = await dres.json();
          payload.external_provider = 'tmdb';
          payload.external_id = String(m.id);
          payload.cover_url = d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null;
          payload.duration_minutes = Array.isArray(d.episode_run_time) && d.episode_run_time.length > 0 ? d.episode_run_time[0] : null;
        }
      }
    } else if (type === 'videoGame') {
      if (!RAWG_API_KEY) return null;
      const s = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(title)}`);
      if (!s.ok) return null;
      const sj = await s.json();
      const g = sj.results?.[0];
      if (g) {
        const dres = await fetch(`https://api.rawg.io/api/games/${g.id}?key=${RAWG_API_KEY}`);
        if (dres.ok) {
          const d = await dres.json();
          payload.external_provider = 'rawg';
          payload.external_id = String(g.id);
          payload.cover_url = d.background_image || null;
          payload.duration_minutes = d.playtime ? Math.round(d.playtime * 60) : null;
          if (d.metacritic) payload.metacritic = d.metacritic;
        }
      }
    } else if (type === 'book') {
      const s = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}`);
      if (!s.ok) return null;
      const sj = await s.json();
      const b = sj.docs?.[0];
      if (b) {
        const pages = b.number_of_pages_median || b.number_of_pages || null;
        payload.external_provider = 'openlibrary';
        payload.external_id = b.key || null;
        payload.cover_url = b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-L.jpg` : null;
        payload.duration_minutes = pages ? Math.round(pages * 1) : null; // heuristic
      }
    }

    if (Object.keys(payload).length > 0) {
      // Update row
      const updated = await patchRow(id, payload);
      return updated;
    }
  } catch (err) {
    console.warn(`Error enriching row ${id}:`, err.message || err);
    return null;
  }

  return null;
}

async function main() {
  console.log('Starting backfill/external enrichment...');
  let offset = 0;
  while (true) {
    const rows = await fetchRows(offset, BATCH_SIZE);
    if (!rows || rows.length === 0) {
      console.log('No more rows to process.');
      break;
    }

    console.log(`Processing batch offset=${offset} count=${rows.length}`);
    for (const row of rows) {
      console.log('Processing row', row.id, row.title, row.type);
      try {
        const res = await enrichForRow(row);
        if (res) {
          console.log('Updated row', row.id, '->', JSON.stringify(res[0] || res));
        } else {
          console.log('No match for row', row.id);
        }
      } catch (err) {
        console.warn('Row enrichment failed for', row.id, err.message || err);
      }
      await sleep(DELAY_MS);
    }

    offset += rows.length;
  }

  console.log('Backfill finished.');
}

main().catch((err) => {
  console.error('Fatal error in backfill script:', err);
  process.exit(1);
});
