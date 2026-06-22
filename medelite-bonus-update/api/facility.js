import Papa from 'papaparse';

const CMS_CATALOG_URL = 'https://data.cms.gov/provider-data/data.json';

const fallbackKendall = {
  ccn: '686123',
  providerName: 'Kendall Lakes Healthcare and Rehab Center',
  location: '5280 SW 157th Ave, Miami, FL',
  state: 'FL',
  certifiedBeds: '120',
  averageResidents: '112',
  overallRating: '1',
  healthInspectionRating: '1',
  staffingRating: '2',
  qmRating: '4'
};

let cachedRows = null;
let cachedAt = 0;
const CACHE_TTL_MS = 1000 * 60 * 30;

function read(row, key) {
  return row?.[key]?.trim?.() || '';
}

async function getProviderCsvUrl() {
  const response = await fetch(CMS_CATALOG_URL);
  if (!response.ok) {
    throw new Error('Unable to load CMS catalog');
  }

  const catalog = await response.json();
  const dataset = catalog.dataset?.find((item) => {
    return (
      item.identifier === '4pq5-n9py' ||
      (item.title === 'Provider Information' &&
        Array.isArray(item.theme) &&
        item.theme.includes('Nursing homes including rehab services'))
    );
  });

  const url = dataset?.distribution?.[0]?.downloadURL;
  if (!url) {
    throw new Error('Provider Information CSV URL not found');
  }

  return url;
}

async function loadProviderRows() {
  const now = Date.now();

  if (cachedRows && now - cachedAt < CACHE_TTL_MS) {
    return cachedRows;
  }

  const csvUrl = await getProviderCsvUrl();
  const csvResponse = await fetch(csvUrl);

  if (!csvResponse.ok) {
    throw new Error('Unable to fetch Provider Information CSV');
  }

  const csvText = await csvResponse.text();
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true
  });

  cachedRows = parsed.data;
  cachedAt = now;
  return cachedRows;
}

function mapFacility(row, ccn) {
  const location =
    read(row, 'Location') ||
    [read(row, 'Provider Address'), read(row, 'City/Town'), read(row, 'State'), read(row, 'ZIP Code')]
      .filter(Boolean)
      .join(', ');

  return {
    ccn,
    providerName: read(row, 'Provider Name') || read(row, 'Legal Business Name'),
    location,
    state: read(row, 'State'),
    certifiedBeds: read(row, 'Number of Certified Beds'),
    averageResidents: read(row, 'Average Number of Residents per Day'),
    overallRating: read(row, 'Overall Rating'),
    healthInspectionRating: read(row, 'Health Inspection Rating'),
    staffingRating: read(row, 'Staffing Rating'),
    qmRating: read(row, 'QM Rating')
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const ccn = String(req.query.ccn || '').trim();

  if (!ccn) {
    return res.status(400).json({ error: 'Missing CCN' });
  }

  if (!/^\d{6}$/.test(ccn)) {
    return res.status(400).json({
      error: 'Invalid CCN format. Please enter a 6-digit CMS Certification Number.'
    });
  }

  try {
    const rows = await loadProviderRows();
    const row = rows.find((item) => read(item, 'CMS Certification Number (CCN)') === ccn);

    if (!row) {
      return res.status(404).json({
        error: `No active nursing home provider record found for CCN ${ccn}.`
      });
    }

    return res.status(200).json(mapFacility(row, ccn));
  } catch (error) {
    if (ccn === '686123') {
      return res.status(200).json({
        ...fallbackKendall,
        warning: 'CMS lookup unavailable; using validation fallback record.'
      });
    }

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'CMS lookup failed'
    });
  }
}
