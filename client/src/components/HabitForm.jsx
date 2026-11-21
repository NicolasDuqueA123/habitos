import { useState } from 'react';

// Formulario para crear (initial = null) o editar un hábito
export default function HabitForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? '#22c55e');
  const [localError, setLocalError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const cleanName = name.trim();

    // Validación rápida en el frontend; el backend vuelve a validar
    if (!cleanName) return setLocalError('Escribe un nombre para el hábito');
    if (cleanName.length > 100) return setLocalError('El nombre no puede superar 100 caracteres');

    setLocalError('');
    onSave({ name: cleanName, color });
  }

  return (
    <form className="panel fade-in" onSubmit={handleSubmit}>
      <h2>{initial ? 'Editar hábito' : 'Nuevo hábito'}</h2>

      <label>
        Nombre
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ej: Leer 20 minutos"
          maxLength={100}
        />
      </label>

      <label>
        Color
        <input type="color" value={color} onChange={e => setColor(e.target.value)} />
      </label>

      {localError && <p className="field-error">{localError}</p>}

      <div className="actions">
        <button type="submit" className="primary">Guardar</button>
        <button type="button" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}
