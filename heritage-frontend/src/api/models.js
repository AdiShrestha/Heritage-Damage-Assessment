import client from './client';

export async function listModels() {
  return client.get('/models');
}

export async function getModel(name) {
  return client.get(`/models/${encodeURIComponent(name)}`);
}
