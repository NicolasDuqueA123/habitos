import { addDays, toKey } from '../utils/dates';

// Mapa de calor de los últimos 365 días. Cada columna es una semana (domingo arriba).
export default function HeatMap({ habit, today, onToggle }) {
  const done = new Set(habit.dates);

  // Empezamos 364 días atrás y retrocedemos hasta el domingo anterior para que las columnas sean semanas completas
  let start = addDays(today, -364);
  start = addDays(start, -start.getDay());

  // Lista de todos los días desde start hasta hoy
  const days = [];
  for (let day = start; day <= today; day = addDays(day, 1)) {
    days.push(day);
  }

  return (
    <div className="heatmap">
      {days.map(day => {
        const key = toKey(day);
        const isDone = done.has(key);
        return (
          <button
            key={key}
            className={`cell ${isDone ? 'done' : ''}`}
            style={isDone ? { background: habit.color } : undefined}
            title={`${key}${isDone ? ' · cumplido' : ''}`}
            aria-label={`${key}${isDone ? ', cumplido' : ', no cumplido'}`}
            onClick={() => onToggle(key, !isDone)}
          />
        );
      })}
    </div>
  );
}
