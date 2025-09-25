# PG File Storage API

REST API для управления файлами в PostgreSQL с использованием Large Objects.

## Технологии

- PHP 8.2
- PostgreSQL 15
- Apache
- JWT для аутентификации
- PostgreSQL Large Objects для хранения файлов

## Структура проекта

```
api/
├── src/
│   ├── config/
│   │   └── database.php      # Конфигурация базы данных
│   ├── models/
│   │   ├── User.php          # Модель пользователя
│   │   └── FileManager.php   # Модель для работы с файлами
│   ├── controllers/
│   │   ├── AuthController.php # Контроллер аутентификации
│   │   └── FileController.php # Контроллер файлов
│   └── utils/
│       ├── Router.php        # Простой роутер
│       ├── Response.php      # Утилиты для ответов
│       └── JWT.php          # JWT токены
├── index.php                # Точка входа API
├── .htaccess               # Конфигурация Apache
├── test.php               # Тестовая страница
└── Dockerfile             # Docker конфигурация
```

## API Endpoints

### Аутентификация

#### POST /api/auth/register
Регистрация нового пользователя
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### POST /api/auth/login
Вход в систему
```json
{
  "username": "string",
  "password": "string"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

#### POST /api/auth/refresh
Обновление JWT токена

### Файлы

#### GET /api/files
Получение файлов текущего пользователя
**Заголовки:** `Authorization: Bearer {token}`

#### POST /api/files/upload
Загрузка файла
**Заголовки:** `Authorization: Bearer {token}`
**Тело:** `multipart/form-data` с полем `file`

#### GET /api/files/download/{id}
Скачивание файла
**Заголовки:** `Authorization: Bearer {token}`

#### DELETE /api/files/{id}
Удаление файла
**Заголовки:** `Authorization: Bearer {token}`

### Админ панель

#### GET /api/admin/files
Получение всех файлов в системе (только для админов)
**Заголовки:** `Authorization: Bearer {token}`

#### GET /api/admin/users
Получение всех пользователей (только для админов)
**Заголовки:** `Authorization: Bearer {token}`

## База данных

### Таблицы

#### users
- `id` - SERIAL PRIMARY KEY
- `username` - VARCHAR(50) UNIQUE NOT NULL
- `email` - VARCHAR(100) UNIQUE NOT NULL
- `password_hash` - VARCHAR(255) NOT NULL
- `role` - VARCHAR(20) DEFAULT 'user' ('user', 'manager', 'admin')
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

#### files
- `id` - SERIAL PRIMARY KEY
- `user_id` - INTEGER REFERENCES users(id)
- `filename` - VARCHAR(255) NOT NULL
- `original_name` - VARCHAR(255) NOT NULL
- `file_size` - BIGINT NOT NULL
- `mime_type` - VARCHAR(100)
- `lo_oid` - OID NOT NULL (PostgreSQL Large Object)
- `is_public` - BOOLEAN DEFAULT FALSE
- `download_count` - INTEGER DEFAULT 0
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

## Особенности

### PostgreSQL Large Objects
- Файлы хранятся как Large Objects в PostgreSQL
- Поддержка потоковой передачи данных
- Работа с файлами любого размера
- Автоматическое управление транзакциями

### Безопасность
- JWT токены для аутентификации
- Хеширование паролей с помощью `password_hash()`
- Проверка прав доступа к файлам
- CORS заголовки для фронтенда

### Лимиты
- Максимальный размер файла: 10MB
- Максимальное количество файлов на пользователя: 10
- Администратор по умолчанию: `admin` / `password`

## Запуск

### Docker
```bash
docker-compose up api -d
```

### Локально
```bash
# Установка зависимостей
composer install

# Настройка Apache
# Включить mod_rewrite и mod_headers

# Настройка базы данных
# Создать базу данных и выполнить init.sql
```

## Тестирование

Откройте `http://localhost:8000/test.php` для проверки работоспособности API.

## Переменные окружения

- `DB_HOST` - хост базы данных (по умолчанию: postgres)
- `DB_NAME` - имя базы данных (по умолчанию: file_storage)
- `DB_USER` - пользователь БД (по умолчанию: admin)
- `DB_PASS` - пароль БД (по умолчанию: password)
