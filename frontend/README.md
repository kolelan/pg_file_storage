# PG File Storage Frontend

React приложение для управления файлами в PostgreSQL.

## Технологии

- React 18
- React Router DOM
- Vite (сборщик)
- CSS (стили)

## Структура проекта

```
src/
├── components/          # Переиспользуемые компоненты
│   ├── Header.jsx      # Шапка приложения
│   ├── FileUpload.jsx  # Компонент загрузки файлов
│   ├── FileList.jsx    # Список файлов
│   ├── LoginForm.jsx   # Форма входа
│   ├── RegisterForm.jsx # Форма регистрации
│   └── ProtectedRoute.jsx # Защищенные маршруты
├── pages/              # Страницы приложения
│   ├── LoginPage.jsx   # Страница входа/регистрации
│   ├── DashboardPage.jsx # Главная страница пользователя
│   └── AdminPage.jsx   # Админ панель
├── contexts/           # React контексты
│   └── AuthContext.jsx # Контекст аутентификации
├── services/           # API сервисы
│   └── api.js         # API клиент
├── App.jsx            # Главный компонент
├── main.jsx           # Точка входа
└── index.css          # Глобальные стили
```

## Команды

### Разработка
```bash
npm run dev          # Запуск dev сервера
```

### Сборка
```bash
npm run build        # Сборка для продакшена
npm run preview      # Предварительный просмотр сборки
```

### Docker
```bash
docker build -f docker/Dockerfile -t pg-file-storage-frontend .
docker run -p 3000:80 pg-file-storage-frontend
```

## Функциональность

### Аутентификация
- Вход в систему
- Регистрация новых пользователей
- Защищенные маршруты
- Автоматическое перенаправление

### Управление файлами
- Загрузка файлов
- Просмотр списка файлов
- Скачивание файлов
- Удаление файлов

### Админ панель
- Просмотр всех файлов в системе
- Управление файлами всех пользователей

## API

Приложение использует прокси для API запросов:
- Dev режим: Vite проксирует `/api/*` на `http://localhost:8000`
- Production: Nginx проксирует `/api/*` на backend контейнер

## Стили

Используются CSS классы для стилизации:
- `.btn` - кнопки
- `.form-group`, `.form-input` - формы
- `.card` - карточки
- `.alert` - уведомления
