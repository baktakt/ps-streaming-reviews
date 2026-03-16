import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export async function fetchGames() {
  const { data } = await api.get('/games');
  return data;
}

export async function fetchGameDetails(id) {
  const { data } = await api.get(`/games/${id}/details`);
  return data;
}

export async function fetchEnrichBatch(ids) {
  const { data } = await api.post('/games/enrich-batch', { ids });
  return data;
}
