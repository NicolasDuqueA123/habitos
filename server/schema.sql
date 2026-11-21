-- Tabla de hábitos: cada hábito tiene nombre y color
CREATE TABLE IF NOT EXISTS habits (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#22c55e',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla de registros diarios: indica que un hábito se cumplió en una fecha.
-- UNIQUE evita que haya dos registros del mismo hábito en el mismo día.
-- ON DELETE CASCADE borra los registros si se borra el hábito.
CREATE TABLE IF NOT EXISTS habit_logs (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  UNIQUE (habit_id, log_date)
);
