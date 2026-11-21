import { useEffect, useState } from 'react';
import { api } from './api';
import HeatMap from './components/HeatMap';
import HabitForm from './components/HabitForm';
import { toKey } from './utils/dates';
import './App.css';

export default function App() {
  const [habits, setHabits] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | hábito que se edita
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // "Hoy" a medianoche, en la hora local del usuario
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selected = habits.find(h => h.id === selectedId);

  // Carga los hábitos desde el backend y conserva el seleccionado si todavía existe
  async function loadHabits() {
    try {
      const data = await api.getHabits(toKey(today));
      setHabits(data);
      setSelectedId(prev => (data.some(h => h.id === prev) ? prev : (data[0]?.id ?? null)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHabits();
  }, []);

  async function handleSave(form) {
    try {
      setError('');
      if (editing === 'new') {
        const created = await api.createHabit(form);
        setSelectedId(created.id);
      } else {
        await api.updateHabit(editing.id, form);
      }
      setEditing(null);
      await loadHabits();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(habit) {
    if (!window.confirm(`¿Eliminar "${habit.name}" y todo su historial?`)) return;
    try {
      setError('');
      await api.deleteHabit(habit.id);
      setSelectedId(null);
      await loadHabits();
    } catch (err) {
      setError(err.message);
    }
  }

  // Marca o desmarca un día del hábito seleccionado
  async function handleToggle(dateKey, markAsDone) {
    try {
      setError('');
      if (markAsDone) await api.markDay(selected.id, dateKey);
      else await api.unmarkDay(selected.id, dateKey);
      await loadHabits();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="app">
      <h1>Registro de hábitos</h1>

      {error && (
        <div className="error" role="alert">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {loading ? (
        <p>Cargando hábitos...</p>
      ) : (
        <div className="layout">
          <aside>
            <button className="primary" onClick={() => setEditing('new')}>
              + Nuevo hábito
            </button>

            <ul className="habit-list">
              {habits.map(h => (
                <li key={h.id}>
                  <button
                    className={`habit-item ${h.id === selectedId ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedId(h.id);
                      setEditing(null);
                    }}
                  >
                    <span className="dot" style={{ background: h.color }} />
                    <span>{h.name}</span>
                    <small>🔥 {h.streak}</small>
                  </button>
                </li>
              ))}
            </ul>

            {habits.length === 0 && <p className="hint">Aún no tienes hábitos. Crea el primero.</p>}
          </aside>

          <section>
            {editing && (
              <HabitForm
                key={editing === 'new' ? 'new' : editing.id}
                initial={editing === 'new' ? null : editing}
                onSave={handleSave}
                onCancel={() => setEditing(null)}
              />
            )}

            {selected && !editing && (
              // La key hace que el panel se anime cada vez que cambias de hábito
              <div className="panel fade-in" key={selected.id}>
                <div className="panel-header">
                  <h2>{selected.name}</h2>
                  <div className="actions">
                    <button onClick={() => setEditing(selected)}>Editar</button>
                    <button className="danger" onClick={() => handleDelete(selected)}>
                      Eliminar
                    </button>
                  </div>
                </div>

                <p>
                  Racha actual: <strong>{selected.streak} {selected.streak === 1 ? 'día' : 'días'}</strong>
                </p>

                <HeatMap habit={selected} today={today} onToggle={handleToggle} />
                <p className="hint">Haz clic en un día para marcarlo o desmarcarlo.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
