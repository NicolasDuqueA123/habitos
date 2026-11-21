# Registro de hábitos con mapa de calor

Aplicación web para crear hábitos, marcar los días cumplidos y ver una cuadrícula de colores con la constancia del último año, estilo GitHub.

**Stack:** React + Vite (frontend), Express (backend), PostgreSQL con Neon (base de datos).

## Links de despliegue

- Frontend (Vercel): _pega aquí tu link_
- Backend (Render): _pega aquí tu link_

> Nota: el backend gratuito de Render se duerme tras un tiempo sin uso. La primera petición puede tardar unos segundos en responder mientras el servicio despierta.

## Estructura

```
habitos/
├── client/   Frontend en React
├── server/   Backend en Express y script SQL
└── README.md
```

## Correr en local

### 1. Base de datos

1. En Neon, abre tu proyecto y entra a **SQL Editor**.
2. Copia el contenido de `server/schema.sql`, pégalo y ejecútalo. Así se crean las tablas.

### 2. Backend

```bash
cd server
cp .env.example .env     # en Windows: copy .env.example .env
```

Abre `.env` y pega tu cadena de conexión de Neon en `DATABASE_URL`. Luego:

```bash
npm install
npm run dev
```

Debe aparecer el mensaje `Servidor escuchando en el puerto 3000`.

### 3. Frontend

En otra terminal:

```bash
cd client
npm install
npm run dev
```

Abre http://localhost:5173 en el navegador.

## Variables de entorno

| Dónde | Variable | Para qué |
|---|---|---|
| `server` | `DATABASE_URL` | Cadena de conexión de Neon |
| `server` | `CLIENT_URL` | URL del frontend, para CORS |
| `client` | `VITE_API_URL` | URL del backend |

## Despliegue

### Neon (base de datos)
Ya tienes el proyecto creado. Ejecuta `server/schema.sql` en el SQL Editor una sola vez.

### Render (backend)
1. Crea un **New → Web Service** y conecta tu repositorio de GitHub.
2. **Root Directory:** `server`
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. En **Environment**, agrega:
   - `DATABASE_URL` con tu cadena de Neon
   - `CLIENT_URL` con el link de Vercel (sin barra al final). Por ahora puedes poner `http://localhost:5173` y cambiarlo cuando tengas el frontend.
6. Espera a que el deploy termine y abre la URL: debe responder `{"status":"ok"}`.

### Vercel (frontend)
1. Crea un **Add New → Project** e importa el repositorio.
2. **Root Directory:** `client`
3. **Framework Preset:** Vite (se detecta solo).
4. En **Environment Variables**, agrega `VITE_API_URL` con la URL de Render.
5. Haz deploy. Después vuelve a Render y actualiza `CLIENT_URL` con el link que te dio Vercel.

### Verificar que funciona
- Crea un hábito desde el frontend desplegado.
- Marca algunos días y revisa que la racha cambie.
- Recarga la página y comprueba que los datos siguen ahí (es señal de que la base de datos funciona).
