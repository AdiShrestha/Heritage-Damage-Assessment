import client from './client';

export async function getCacheStats() {
  return client.get('/cache/stats');
}

export async function invalidateCache(modelName = null) {
  const params = new URLSearchParams();
  if (modelName) {
    params.set('model', modelName);
  }

  const url = `/cache${params.toString() ? `?${params.toString()}` : ''}`;
  return client.delete(url);
}
