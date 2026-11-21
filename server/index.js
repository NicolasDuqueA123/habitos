import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// CORS: solo permitimos que el frontend (Vercel o local) llame a esta API
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

// ---------- Utilidades ----------

// Comprueba que sea una fecha válida con formato YYYY-MM-DD (rechaza, por ejemplo, 2026-02-30)
function isDateKey(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && addDays(value, 0) === value;
}

// Suma días a una fecha YYYY-MM-DD. Trabajamos en UTC para no tener problemas de zona horaria.
function addDays(dateKey, n) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// Calcula la racha actual: cuenta cuántos días seguidos hacia atrás están cumplidos.
// Si hoy todavía no está marcado, la racha se cuenta desde ayer, así no se pierde hasta que acabe el día.
function calcStreak(dates, today) {
  const done = new Set(dates);
  let day = done.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (done.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

// Valida nombre y color de un hábito
function validateHabit(body = {}) {
  const errors = [];
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const color = body.color ?? '#22c55e';

  if (!name) errors.push('El nombre es obligatorio');
  if (name.length > 100) errors.push('El nombre no puede superar 100 caracteres');
  if (!COLOR_RE.test(color)) errors.push('El color debe tener formato #RRGGBB');

  return { errors, habit: { name, color } };
}

// Convierte el id de la URL en un entero positivo, o null si no es válido
function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// ---------- Rutas ----------

app.get('/', (req, res) => res.json({ status: 'ok' }));

// Lista de hábitos con sus días cumplidos y su racha actual.
// El frontend envía su fecha de hoy (?today=YYYY-MM-DD) para que la racha use el día local del usuario.
app.get('/api/habits', async (req, res, next) => {
  try {
    const today = isDateKey(req.query.today) ? req.query.today : new Date().toISOString().slice(0, 10);

    const habits = (await pool.query('SELECT id, name, color FROM habits ORDER BY created_at, id')).rows;
    const logs = (await pool.query(
      `SELECT habit_id, to_char(log_date, 'YYYY-MM-DD') AS date FROM habit_logs`
    )).rows;

    // Agrupamos las fechas cumplidas por hábito
    const datesByHabit = {};
    for (const log of logs) {
      (datesByHabit[log.habit_id] ??= []).push(log.date);
    }

    res.json(habits.map(h => {
      const dates = datesByHabit[h.id] ?? [];
      return { ...h, dates, streak: calcStreak(dates, today) };
    }));
  } catch (err) {
    next(err);
  }
});

// Crear un hábito
app.post('/api/habits', async (req, res, next) => {
  try {
    const { errors, habit } = validateHabit(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const { rows } = await pool.query(
      'INSERT INTO habits (name, color) VALUES ($1, $2) RETURNING id, name, color',
      [habit.name, habit.color]
    );
    res.status(201).json({ ...rows[0], dates: [], streak: 0 });
  } catch (err) {
    next(err);
  }
});

// Editar nombre y color de un hábito
app.put('/api/habits/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    const { errors, habit } = validateHabit(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const { rows } = await pool.query(
      'UPDATE habits SET name = $1, color = $2 WHERE id = $3 RETURNING id, name, color',
      [habit.name, habit.color, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Hábito no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Eliminar un hábito (sus registros se borran por ON DELETE CASCADE)
app.delete('/api/habits/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    const { rowCount } = await pool.query('DELETE FROM habits WHERE id = $1', [id]);
    if (!rowCount) return res.status(404).json({ error: 'Hábito no encontrado' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Marcar un día como cumplido. Si ya estaba marcado, no pasa nada (ON CONFLICT DO NOTHING).
app.post('/api/habits/:id/logs', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    const date = req.body?.date;
    if (!isDateKey(date)) return res.status(400).json({ errors: ['La fecha debe tener formato YYYY-MM-DD'] });

    const exists = await pool.query('SELECT 1 FROM habits WHERE id = $1', [id]);
    if (!exists.rowCount) return res.status(404).json({ error: 'Hábito no encontrado' });

    await pool.query(
      'INSERT INTO habit_logs (habit_id, log_date) VALUES ($1, $2) ON CONFLICT (habit_id, log_date) DO NOTHING',
      [id, date]
    );
    res.status(201).json({ habit_id: id, date });
  } catch (err) {
    next(err);
  }
});

// Desmarcar un día
app.delete('/api/habits/:id/logs/:date', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido' });
    if (!isDateKey(req.params.date)) return res.status(400).json({ error: 'Fecha inválida' });

    await pool.query('DELETE FROM habit_logs WHERE habit_id = $1 AND log_date = $2', [id, req.params.date]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ---------- Manejo de errores ----------

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
