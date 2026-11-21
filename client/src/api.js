// URL del backend. En local usa http://localhost:3000; en producción se define en Vercel como VITE_API_URL.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('No hay conexión con el servidor. Si usas Render, puede tardar unos segundos en despertar.');
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    // El backend envía { errors: [...] } para validaciones o { error: '...' } para otros casos
    throw new Error(data?.errors?.join('. ') || data?.error || 'No se pudo completar la acción');
  }
  return data;
}

export const api = {
  getHabits: (today) => request(`/api/habits?today=${today}`),
  createHabit: (habit) => request('/api/habits', { method: 'POST', body: JSON.stringify(habit) }),
  updateHabit: (id, habit) => request(`/api/habits/${id}`, { method: 'PUT', body: JSON.stringify(habit) }),
  deleteHabit: (id) => request(`/api/habits/${id}`, { method: 'DELETE' }),
  markDay: (id, date) => request(`/api/habits/${id}/logs`, { method: 'POST', body: JSON.stringify({ date }) }),
  unmarkDay: (id, date) => request(`/api/habits/${id}/logs/${date}`, { method: 'DELETE' }),
};
