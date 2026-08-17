# KAIROS - Платформа онлайн-банкинга и управления криптоактивами

Инновационный веб-сервис с живыми котировками криптовалют, анимациями на чистом CSS/TypeScript и безопасной авторизацией через Google OAuth2.

## Стек технологий

- Frontend: HTML5, Vanilla CSS, TypeScript 5.x, Vite 6.x
- Backend: PHP 8.2+ (Stateless Google OAuth2 Service, cURL, HMAC-SHA256)
- WebSockets: Публичные потоки котировок OKX и Binance с автопереключением и heartbeat

## Структура проекта

- `frontend/` - клиентская часть (компоненты, стили, модули TypeScript, ассеты)
- `backend/` - серверная часть (эндпоинты авторизации, сервис Google OAuth, валидация state)

## Требования к окружению

- Node.js: версия 18.0 или выше
- PHP: версия 8.2 или выше с включенными расширениями `curl`, `json`, `openssl`

## Быстрый запуск

### 1. Настройка и запуск бэкенда

1. Перейдите в директорию `backend`:
   ```bash
   cd backend
   ```

2. Убедитесь в наличии файла конфигурации `.env` (при необходимости скопируйте из `.env.example`):
   ```ini
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/google/callback
   FRONTEND_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000
   APP_SECRET=your_32_byte_app_secret_hash
   ```

3. Запустите встроенный PHP сервер из корня проекта:
   ```bash
   php -S localhost:8080 -t backend/public
   ```
   Проверить статус API: `http://localhost:8080/api/health` (возвращает `{"status":"ok"}`).

### 2. Настройка и запуск фронтенда

1. Откройте второй терминал и перейдите в директорию `frontend`:
   ```bash
   cd frontend
   ```

2. Установите зависимости:
   ```bash
   npm install
   ```

3. Запустите сервер разработки:
   ```bash
   npm run dev -- --port 5173
   ```

4. Откройте в браузере: `http://localhost:5173`

## Сборка для production

1. Проверка типов TypeScript и сборка:
   ```bash
   cd frontend
   npm run build
   ```

2. Локальный предпросмотр production сборки:
   ```bash
   npm run preview
   ```

## Деплой на Vercel

Проект полностью готов для деплоя на платформу Vercel в виде единого сервиса (Vite Frontend + PHP Serverless Backend).

1. Импортируйте репозиторий в Vercel.
2. В настройках проекта (Settings -> Environment Variables) добавьте переменные:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` (например, `https://ваш-домен.vercel.app/api/auth/google/callback`)
   - `FRONTEND_ORIGINS` (например, `https://ваш-домен.vercel.app`)
   - `APP_SECRET`
3. Нажмите Deploy. Конфигурация в `vercel.json` автоматически соберет статику и подключит маршрутизацию к PHP API.

## Функциональные возможности

1. Главный экран (Hero):
   - Фоновое видео с анимацией раскрытия
   - Анимированное появление заголовков и текста
   - Интерактивные кнопки вызова модальных окон (Learn More и Видеоплеер)

2. Авторизация (Google OAuth2):
   - Интерактивный виджет с переключением вкладок Personal и Business
   - Безопасная авторизация без сохранения сессий на сервере (Stateless HMAC-SHA256)
   - Автоматическое отображение аватара, имени, email и кнопки выхода (Sign out)

3. Живая крипто-орбита (WebSockets):
   - Потоковое обновление цен в реальном времени
   - Цветовая индикация изменения котировок: зеленая вспышка при росте, красная при падении
   - Выпадающий список добавления новых монет с плавной анимацией встраивания
   - Отказоустойчивый механизм с автоматическим переключением источников (OKX и Binance)

4. Адаптивность и доступность:
   - Полная адаптивность под Desktop (1920px), Tablet (768px) и Mobile (360px)
   - Поддержка навигации с клавиатуры, кастомные фокусы (:focus-visible) и WAI-ARIA разметка
   - Поддержка режима пониженной динамики (prefers-reduced-motion)
