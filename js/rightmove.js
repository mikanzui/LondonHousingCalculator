/**
 * Rightmove search URL builder.
 * Constructs links to Rightmove property searches — we do NOT scrape or use
 * any private API; we only build the public search URL.
 */

const BASE = 'https://www.rightmove.co.uk/property-for-sale/find.html';

const PROPERTY_TYPE_MAP = {
  flat: 'flats',
  terraced: 'terraced',
  semi: 'semi-detached',
  detached: 'detached',
};

/**
 * Build a Rightmove search URL.
 *
 * @param {string|null} regionId  — Rightmove REGION identifier, e.g. "93929".
 *                                   Pass null for a general London search.
 * @param {object}      opts
 * @param {number}     [opts.maxPrice]      — Maximum price filter.
 * @param {string}     [opts.minBeds]       — Minimum bedrooms ("1", "2", …).
 * @param {string}     [opts.propertyType]  — One of "flat","terraced","semi","detached" or "".
 * @returns {string} Fully-encoded Rightmove URL.
 */
export function buildSearchUrl(regionId, opts = {}) {
  // Default to Greater London if no specific borough region
  const locId = regionId ? `REGION%5E${regionId}` : 'REGION%5E87490';

  const params = new URLSearchParams();
  params.set('locationIdentifier', locId);
  params.set('sortType', '6'); // newest listed
  params.set('includeSSTC', 'false');

  if (opts.maxPrice) params.set('maxPrice', String(opts.maxPrice));
  if (opts.minBeds)  params.set('minBedrooms', String(opts.minBeds));
  if (opts.propertyType && PROPERTY_TYPE_MAP[opts.propertyType]) {
    params.set('propertyTypes', PROPERTY_TYPE_MAP[opts.propertyType]);
  }

  // URLSearchParams double-encodes the %5E in locationIdentifier,
  // so we build the string manually for that param and append the rest.
  const rest = new URLSearchParams();
  rest.set('sortType', '6');
  rest.set('includeSSTC', 'false');
  if (opts.maxPrice) rest.set('maxPrice', String(opts.maxPrice));
  if (opts.minBeds)  rest.set('minBedrooms', String(opts.minBeds));
  if (opts.propertyType && PROPERTY_TYPE_MAP[opts.propertyType]) {
    rest.set('propertyTypes', PROPERTY_TYPE_MAP[opts.propertyType]);
  }

  return `${BASE}?locationIdentifier=${locId}&${rest.toString()}`;
}
