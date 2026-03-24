# ArmFlow

Веб-сервис по ТЗ: календарь тренировок (FullCalendar, часовой пояс **Asia/Yekaterinburg**) и канбан упражнений (@dnd-kit). Бэкенд — NestJS, PostgreSQL, Prisma; фронт — Next.js (App Router), Tailwind, Radix UI.

## Локальный запуск (без Docker)

1. **PostgreSQL** на `localhost:5432`, БД `armflow`, пользователь/пароль `postgres`/`postgres` (или поменяйте `DATABASE_URL` в `backend/.env`).

2. Бэкенд:

```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

API: `http://localhost:4000/api`, загрузки: `http://localhost:4000/uploads/...`

3. Фронтенд:

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

**Прокси API:** запросы с браузера идут на **`/api-proxy`**; их обрабатывает [`frontend/src/app/api-proxy/[...path]/route.ts`](frontend/src/app/api-proxy/%5B...path%5D/route.ts) и пересылает на бэкенд (`BACKEND_INTERNAL_URL` или по умолчанию `http://127.0.0.1:4000`). Так обходятся CORS и баг Next.js 16 с **POST** через `rewrites` в `next.config`. Статику загрузок отдаёт rewrite **`/uploads-proxy`** → `/uploads` на API.

Не задавайте в `.env.local` абсолютный **`NEXT_PUBLIC_API_URL`**, если не нужен отдельный домен API (тогда используется прокси).

Откройте `http://localhost:3000`. Тестовые учётки после сида:

- `admin@armflow.local` / `admin123`
- `coach@armflow.local` / `coach123`
- `student@armflow.local` / `student123`

## Docker

```bash
docker compose up -d --build
```

Сервисы: Postgres, **api** (4000), **web** (3000). У **web** задано `BACKEND_INTERNAL_URL=http://api:4000` — прокси из контейнера Next к контейнеру API. При старте **api** выполняется `prisma migrate deploy`, затем приложение (`node dist/src/main.js`).

Сид (один раз после первого подъёма):

```bash
docker compose exec api npx prisma db seed
```

Остановить и **удалить контейнеры** (тома БД и uploads сохраняются):

```bash
docker compose down
```

Удалить и тома (`pgdata`, `uploads`):

```bash
docker compose down -v
```

## Роли

- **ADMIN** — `/admin`: пользователи, блокировка, удаление.
- **COACH** — календарь выбранного ученика, CRUD тренировок и упражнений, перетаскивание событий, загрузка видео.
- **STUDENT** — свой календарь, канбан (перетаскивание карточек и чекбоксы подходов).
