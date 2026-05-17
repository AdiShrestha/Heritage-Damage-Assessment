import client from './client';

export async function getHealth() {
  return client.get('/health');
}

export async function getReadiness() {
  return client.get('/health/ready');
}
