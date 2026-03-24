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

Откройте `http://localhost:3000`. Тестовые учётки после сида:

- `admin@armflow.local` / `admin123`
- `coach@armflow.local` / `coach123`
- `student@armflow.local` / `student123`

## Docker

При установленном Docker:

```bash
docker compose up --build
```

Поднимутся Postgres, API (порт 4000) и веб (порт 3000). Перед первым запуском контейнера API применит миграции; для сида выполните один раз вручную, например:

```bash
docker compose exec api npx prisma db seed
```

Если Docker недоступен, используйте локальный сценарий выше.

## Роли

- **ADMIN** — `/admin`: пользователи, блокировка, удаление.
- **COACH** — календарь выбранного ученика, CRUD тренировок и упражнений, перетаскивание событий, загрузка видео.
- **STUDENT** — свой календарь, канбан (перетаскивание карточек и чекбоксы подходов).
