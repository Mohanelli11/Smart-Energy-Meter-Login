/**
 * Geocoding utilities for device location mapping.
 *
 * Uses the OpenStreetMap Nominatim API (free, no API key required) to resolve
 * a human-readable location name into latitude/longitude coordinates.
 *
 * A local gazetteer of known service areas is checked first so the common case
 * resolves instantly and offline, without hitting the network.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeoLocation extends Coordinates {
  /** Resolved display name from the geocoder, when available */
  displayName?: string;
  /** Where the coordinates came from */
  source: 'gazetteer' | 'nominatim' | 'fallback';
}

const GEOCODE_CACHE_KEY = 'motech_geocode_cache';

/**
 * Known MoTech service areas with real coordinates.
 * Covers every location used across the prepaid and postpaid meter fleet.
 */
const GAZETTEER: Record<string, Coordinates> = {
  // Nairobi and environs
  'nairobi west': { latitude: -1.3106, longitude: 36.8065 },
  'nairobi cbd': { latitude: -1.2864, longitude: 36.8172 },
  kasarani: { latitude: -1.2216, longitude: 36.8969 },
  ruiru: { latitude: -1.1454, longitude: 36.9615 },
  thika: { latitude: -1.0333, longitude: 37.0693 },
  juja: { latitude: -1.1018, longitude: 37.0144 },
  kiambu: { latitude: -1.1714, longitude: 36.8356 },
  kikuyu: { latitude: -1.2465, longitude: 36.6636 },
  limuru: { latitude: -1.1116, longitude: 36.6425 },
  'kahawa west': { latitude: -1.1889, longitude: 36.9214 },
  zimmerman: { latitude: -1.2075, longitude: 36.8897 },
  roysambu: { latitude: -1.2186, longitude: 36.8878 },
  embakasi: { latitude: -1.3184, longitude: 36.8944 },
  donholm: { latitude: -1.2952, longitude: 36.8886 },
  umoja: { latitude: -1.2807, longitude: 36.8944 },
  kayole: { latitude: -1.2745, longitude: 36.9169 },
  githurai: { latitude: -1.1932, longitude: 36.9139 },
  'kahawa sukari': { latitude: -1.1806, longitude: 36.9317 },
  mwiki: { latitude: -1.2181, longitude: 36.9269 },
  njiru: { latitude: -1.2617, longitude: 36.9508 },
  utawala: { latitude: -1.2831, longitude: 36.9711 },
  mihango: { latitude: -1.2925, longitude: 36.9583 },
  komarock: { latitude: -1.2717, longitude: 36.9106 },
  buruburu: { latitude: -1.2872, longitude: 36.8797 },
  makadara: { latitude: -1.2986, longitude: 36.8583 },
  eastleigh: { latitude: -1.2758, longitude: 36.8500 },
  pangani: { latitude: -1.2725, longitude: 36.8353 },
  parklands: { latitude: -1.2620, longitude: 36.8156 },
  westlands: { latitude: -1.2673, longitude: 36.8100 },
  kilimani: { latitude: -1.2906, longitude: 36.7833 },
  lavington: { latitude: -1.2792, longitude: 36.7686 },
  kileleshwa: { latitude: -1.2811, longitude: 36.7794 },
  hurlingham: { latitude: -1.2947, longitude: 36.7869 },
  ngong: { latitude: -1.3528, longitude: 36.6539 },
  rongai: { latitude: -1.3961, longitude: 36.7433 },
  kitengela: { latitude: -1.4747, longitude: 36.9569 },
  'industrial area': { latitude: -1.3081, longitude: 36.8514 },
  'south b': { latitude: -1.3086, longitude: 36.8339 },
  'south c': { latitude: -1.3181, longitude: 36.8267 },
  langata: { latitude: -1.3411, longitude: 36.7583 },
  karen: { latitude: -1.3194, longitude: 36.7075 },
  runda: { latitude: -1.2181, longitude: 36.8069 },
  'runda estate': { latitude: -1.2158, longitude: 36.8092 },
  muthaiga: { latitude: -1.2536, longitude: 36.8317 },
  gigiri: { latitude: -1.2336, longitude: 36.8125 },
  ridgeways: { latitude: -1.2225, longitude: 36.8394 },
  'spring valley': { latitude: -1.2569, longitude: 36.7861 },
  loresho: { latitude: -1.2547, longitude: 36.7539 },
  kitisuru: { latitude: -1.2314, longitude: 36.7842 },
  nyari: { latitude: -1.2372, longitude: 36.7942 },
  rosslyn: { latitude: -1.2258, longitude: 36.8003 },
  'two rivers': { latitude: -1.2200, longitude: 36.8033 }
};

/** Nairobi city centre — used as the last-resort fallback */
const FALLBACK_CENTER: Coordinates = { latitude: -1.2864, longitude: 36.8172 };

/**
 * Deterministically scatter a coordinate by a small amount so that many
 * meters sharing one location name don't stack into a single pin.
 * Uses a hash of the seed so a given meter always lands on the same spot.
 */
export function scatterCoordinates(
base: Coordinates,
seed: string,
radiusKm: number = 1.2)
: Coordinates {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const angle = Math.abs(hash) % 360 * (Math.PI / 180);
  const distance = Math.abs(hash >> 8) % 1000 / 1000 * radiusKm;
  // ~111km per degree of latitude
  const dLat = distance / 111 * Math.cos(angle);
  const dLng =
  distance / (111 * Math.cos(base.latitude * Math.PI / 180)) *
  Math.sin(angle);
  return {
    latitude: parseFloat((base.latitude + dLat).toFixed(6)),
    longitude: parseFloat((base.longitude + dLng).toFixed(6))
  };
}

/** Read the persisted geocode cache */
function readCache(): Record<string, GeoLocation> {
  try {
    return JSON.parse(localStorage.getItem(GEOCODE_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

/** Persist a resolved location to the cache */
function writeCache(key: string, value: GeoLocation): void {
  try {
    const cache = readCache();
    cache[key] = value;
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Failed to cache geocode result:', error);
  }
}

/**
 * Resolve a location name from the local gazetteer only (synchronous).
 * Returns null when the location isn't a known service area.
 */
export function geocodeFromGazetteer(location: string): GeoLocation | null {
  if (!location) return null;
  const key = location.trim().toLowerCase();

  if (GAZETTEER[key]) {
    return { ...GAZETTEER[key], displayName: location, source: 'gazetteer' };
  }
  // Partial match — e.g. "Nairobi West, Block C" still resolves
  const partial = Object.keys(GAZETTEER).find(
    (g) => key.includes(g) || g.includes(key)
  );
  if (partial) {
    return { ...GAZETTEER[partial], displayName: location, source: 'gazetteer' };
  }
  return null;
}

/**
 * Resolve a location name to coordinates.
 *
 * Order of resolution:
 *  1. Local gazetteer of known service areas (instant, offline)
 *  2. Persisted cache of previous geocoder lookups
 *  3. OpenStreetMap Nominatim API (live lookup, no key required)
 *  4. Nairobi centre fallback
 */
export async function geocodeLocation(
location: string,
countryHint: string = 'Kenya')
: Promise<GeoLocation> {
  const key = location.trim().toLowerCase();

  // 1. Known service area
  const local = geocodeFromGazetteer(location);
  if (local) return local;

  // 2. Previously resolved
  const cache = readCache();
  if (cache[key]) return cache[key];

  // 3. Live geocoder
  try {
    const query = encodeURIComponent(`${location}, ${countryHint}`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`,
      { headers: { Accept: 'application/json' } }
    );
    if (response.ok) {
      const results = await response.json();
      if (Array.isArray(results) && results.length > 0) {
        const resolved: GeoLocation = {
          latitude: parseFloat(results[0].lat),
          longitude: parseFloat(results[0].lon),
          displayName: results[0].display_name,
          source: 'nominatim'
        };
        writeCache(key, resolved);
        return resolved;
      }
    }
  } catch (error) {
    console.warn('Geocoding lookup failed, using fallback:', error);
  }

  // 4. Fallback
  return { ...FALLBACK_CENTER, displayName: location, source: 'fallback' };
}

/**
 * Resolve coordinates for a device, scattering them around the resolved
 * area so multiple devices in the same neighbourhood remain distinguishable.
 */
export async function geocodeDevice(
location: string,
seed: string)
: Promise<GeoLocation> {
  const resolved = await geocodeLocation(location);
  const scattered = scatterCoordinates(resolved, seed);
  return { ...resolved, ...scattered };
}

/** Synchronous coordinate resolution for bulk backfill of existing meters */
export function resolveCoordinatesSync(
location: string,
seed: string)
: Coordinates {
  const local = geocodeFromGazetteer(location);
  const base = local || FALLBACK_CENTER;
  return scatterCoordinates(base, seed);
}