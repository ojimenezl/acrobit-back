# Acrobit API

Backend NestJS + MongoDB Atlas + Firebase Admin + OpenAI para Acrobit.

## Requisitos

- Node 20+
- MongoDB Atlas
- Firebase service account (local: archivo JSON; Vercel: variable de entorno)
- OpenAI API key (organizador semanal)

## Local

```bash
cp .env.example .env
# Edita .env con tus credenciales
# Coloca el JSON de Firebase en src/firebase/ (gitignored)

npm install
npm run start:dev   # http://localhost:3000/api/health
npm run seed        # categorías + mensajes (una vez)
```

## Deploy en Vercel (desde GitHub)

1. Conecta este repo en [Vercel](https://vercel.com) → Import Git Repository
2. **Root Directory:** `/` (raíz del repo)
3. **Build Command:** `npm run build` (ya en `vercel.json`)
4. **Environment Variables** (Production):

| Variable | Descripción |
|----------|-------------|
| `MONGODB_URI` | URI MongoDB Atlas |
| `CORS_ORIGIN` | URL del front (ej. `https://tu-app.vercel.app`) |
| `FIREBASE_PROJECT_ID` | `acrobit-app` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | JSON completo del service account |
| `OPENAI_API_KEY` | Key OpenAI |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `OPENAI_MAX_OUTPUT_TOKENS` | `6000` |

5. MongoDB Atlas → Network Access → `0.0.0.0/0`
6. Tras cada push a `main`, Vercel despliega automáticamente
7. Probar: `https://tu-proyecto.vercel.app/api/health`

**No uses** `GOOGLE_APPLICATION_CREDENTIALS` en Vercel (solo local).

## Scripts

| Comando | Uso |
|---------|-----|
| `npm run start:dev` | Desarrollo local |
| `npm run build` | Compilar |
| `npm run seed` | Seed MongoDB |
| `npm run vercel-build` | Build para Vercel |

## API

Prefijo: `/api`

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/health` | No |
| POST | `/auth/sync-user` | Firebase Bearer |
| GET | `/users/me` | Firebase Bearer |
| POST | `/users/me/organize` | Firebase Bearer |

Ver controllers en `src/modules/` para el listado completo.
