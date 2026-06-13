import client from './client';

export async function generateReport(file, model = 'moe', siteId = null, siteName = null, surveyor = null, notes = null) {
  const formData = new FormData();
  formData.append('file', file);

  const params = new URLSearchParams();
  params.set('model', model);
  if (siteId) params.set('site_id', siteId);
  if (siteName) params.set('site_name', siteName);
  if (surveyor) params.set('surveyor', surveyor);
  if (notes) params.set('notes', notes);

  return client.post(`/report?${params.toString()}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 120000,
  });
}

export async function getSiteHistory(siteId, limit = 50, since = null) {
  const params = new URLSearchParams();
  params.set('site_id', siteId);
  params.set('limit', limit);
  if (since) params.set('since', since);

  return client.get(`/report/history?${params.toString()}`);
}

export async function getSeverityTrend(siteId, limit = 20) {
  const params = new URLSearchParams();
  params.set('limit', limit);

  return client.get(`/report/trend/${encodeURIComponent(siteId)}?${params.toString()}`);
}

export async function getFlaggedPredictions(limit = 100) {
  const params = new URLSearchParams();
  params.set('limit', limit);

  return client.get(`/report/flagged?${params.toString()}`);
}

export async function getPredictionStats() {
  return client.get('/report/stats');
}
