/**
 * Calls the optional Python FastAPI service (clothing_predict_server.py) and
 * maps its response to Restyle wardrobe fields (category, color, season).
 */

let FormDataPkg = null;
try {
  // Prefer native WHATWG FormData + Blob (Node 18+). Fallback to form-data package.
  if (typeof FormData !== 'undefined' && typeof Blob !== 'undefined') {
    FormDataPkg = { native: true, FormData, Blob };
  } else {
    FormDataPkg = { native: false, FormData: require('form-data') };
  }
} catch (e) {
  FormDataPkg = { native: false, FormData: require('form-data') };
}

const DEFAULT_BASE =
  process.env.PREDICT_SERVICE_URL || process.env.PYTHON_PREDICT_URL || 'http://127.0.0.1:8000';
const TIMEOUT_MS = Number(process.env.PREDICT_SERVICE_TIMEOUT_MS) || 30000;

function getPredictUrl() {
  return `${String(DEFAULT_BASE).replace(/\/$/, '')}/predict-clothing`;
}

/**
 * Maps coarse AI category strings to wardrobe category values used by the UI + outfitGenerator.
 */
function mapCategoryToWardrobe(cat) {
  const c = (cat || '').toLowerCase().trim();
  if (!c) return 'top';
  if (c === 'clothing item') return 'top';

  const tops = new Set(['t-shirt', 'tank top', 'sweater', 'shirt', 'top', 'blouse', 'hoodie']);
  const bottoms = new Set(['jeans', 'shorts', 'pants', 'trousers', 'bottom', 'skirt']);

  if (tops.has(c)) return c;
  if (c === 'trousers') return 'pants';
  if (bottoms.has(c)) return c;
  if (c === 'dress') return 'dress';
  if (['jacket', 'coat', 'suit', 'blazer', 'outerwear'].includes(c)) return 'jacket';
  if (c === 'shoes') return 'shoes';
  if (['hat', 'scarf', 'socks', 'bag', 'accessory'].includes(c)) return 'accessory';

  return 'top';
}

function mapSeasonToDb(season) {
  if (!season) return 'all';
  const s = String(season).toLowerCase().trim();
  if (s === 'all-season' || s === 'all seasons') return 'all';
  if (['spring', 'summer', 'fall', 'winter', 'all'].includes(s)) return s;
  return 'all';
}

function buildSuggestedName(normalized) {
  const color = (normalized.color || '').trim();
  const raw = (normalized.rawCategory || normalized.category || 'item').trim();
  const prettyType =
    raw === 't-shirt'
      ? 'T-shirt'
      : raw
        ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
        : 'Item';
  if (!color) return prettyType;
  const colorTitle = color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
  return `${colorTitle} ${prettyType}`;
}

function normalizePredictionPayload(raw) {
  // Be defensive: Python service should send an object, but don't assume.
  const payload = raw && typeof raw === 'object' ? raw : {};
  const category = mapCategoryToWardrobe(payload.category);
  const color = String(payload.color || '')
    .toLowerCase()
    .trim();
  const season = mapSeasonToDb(payload.season);
  return {
    rawCategory: payload.category,
    category,
    color: color || 'unknown',
    season,
    description: payload.description || '',
    confidence: typeof payload.confidence_category === 'number' ? payload.confidence_category : null,
    imagenetTop5: Array.isArray(payload.imagenet_top5_hints) ? payload.imagenet_top5_hints : []
  };
}

function isConnectionError(err) {
  const code = err && (err.code || err.cause?.code);
  if (code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT') return true;
  const msg = String(err && err.message ? err.message : err);
  if (/ECONNREFUSED|ENOTFOUND|fetch failed|network/i.test(msg)) return true;
  return false;
}

/**
 * POST multipart to Python /predict-clothing. Returns parsed JSON body on success.
 */
async function callPredictService(buffer, filename, mimetype) {
  if (!buffer || buffer.length < 32) {
    throw new Error('Image buffer is empty or too small');
  }

  // Build multipart body. Use native WHATWG FormData+Blob when available to
  // ensure the fetch implementation sets a correct Content-Type boundary.
  let body;
  let headers = {};
  if (FormDataPkg.native) {
    const fd = new FormDataPkg.FormData();
    const blob = new FormDataPkg.Blob([buffer], { type: mimetype || 'image/jpeg' });
    fd.append('file', blob, filename || 'upload.jpg');
    body = fd;
    // Let fetch set the Content-Type header for native FormData; do not set manually.
  } else {
    const fd = new FormDataPkg.FormData();
    fd.append('file', buffer, {
      filename: filename || 'upload.jpg',
      contentType: mimetype || 'image/jpeg'
    });
    body = fd;
    headers = fd.getHeaders();
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(getPredictUrl(), {
      method: 'POST',
      body,
      headers,
      signal: controller.signal
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Prediction service returned non-JSON (${res.status})`);
    }

    if (!res.ok) {
      const detail = data.detail;
      const msg =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d) => d.msg || d).join('; ')
            : data.message || JSON.stringify(data);
      throw new Error(msg || `Prediction failed (${res.status})`);
    }

    return data;
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new Error(`Prediction timed out after ${TIMEOUT_MS}ms`);
    }
    if (isConnectionError(err)) {
      throw new Error(
        'Cannot reach clothing prediction service. Start it with: python clothing_predict_server.py'
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  getPredictUrl,
  mapCategoryToWardrobe,
  mapSeasonToDb,
  normalizePredictionPayload,
  buildSuggestedName,
  callPredictService
};
