# Настройка pgAdmin для управления PostgreSQL

## Доступ к pgAdmin

**URL:** http://localhost:5050

**Данные для входа:**
- **Email:** admin@example.com
- **Пароль:** admin

## Подключение к базе данных

После входа в pgAdmin выполните следующие шаги:

### 1. Добавление сервера

1. Щелкните правой кнопкой мыши на "Servers" в левой панели
2. Выберите "Register" → "Server..."

### 2. Настройка подключения

**General Tab:**
- **Name:** PG File Storage (или любое удобное имя)

**Connection Tab:**
- **Host name/address:** postgres
- **Port:** 5432
- **Maintenance database:** file_storage
- **Username:** admin
- **Password:** password

### 3. Сохранение

Нажмите "Save" для сохранения подключения.

## Структура базы данных

После подключения вы увидите следующие таблицы:

### users
- `id` - SERIAL PRIMARY KEY
- `username` - VARCHAR(50) UNIQUE NOT NULL
- `email` - VARCHAR(100) UNIQUE NOT NULL
- `password_hash` - VARCHAR(255) NOT NULL
- `role` - VARCHAR(20) DEFAULT 'user'
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### files
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
- `updated_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### user_limits
- `id` - SERIAL PRIMARY KEY
- `user_id` - INTEGER REFERENCES users(id)
- `max_files` - INTEGER DEFAULT 10
- `max_file_size` - BIGINT DEFAULT 10485760
- `is_custom` - BOOLEAN DEFAULT FALSE

### global_limits
- `id` - SERIAL PRIMARY KEY
- `max_files_per_user` - INTEGER DEFAULT 10
- `max_file_size` - BIGINT DEFAULT 10485760
- `updated_by` - INTEGER REFERENCES users(id)
- `updated_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

## Полезные запросы

### Просмотр всех пользователей
```sql
SELECT id, username, email, role, created_at FROM users;
```

### Просмотр всех файлов с информацией о пользователях
```sql
SELECT 
    f.id, 
    f.original_name, 
    f.file_size, 
    f.mime_type, 
    f.download_count,
    f.created_at,
    u.username as owner
FROM files f 
LEFT JOIN users u ON f.user_id = u.id 
ORDER BY f.created_at DESC;
```

### Статистика по файлам
```sql
SELECT 
    COUNT(*) as total_files,
    SUM(file_size) as total_size,
    AVG(file_size) as avg_size,
    MAX(file_size) as max_size
FROM files;
```

### Просмотр Large Objects
```sql
SELECT 
    f.id,
    f.original_name,
    f.lo_oid,
    pg_size_pretty(pg_lobj_size(f.lo_oid)) as size
FROM files f;
```

## Управление данными

### Очистка тестовых данных
```sql
-- Удаление всех файлов (осторожно!)
DELETE FROM files;

-- Удаление всех пользователей кроме админа
DELETE FROM users WHERE username != 'admin';
```

### Создание тестового пользователя
```sql
INSERT INTO users (username, email, password_hash, role) 
VALUES ('testuser', 'test@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user');
```

## Безопасность

- pgAdmin доступен только локально на порту 5050
- Данные для входа в pgAdmin: admin@example.com / admin
- Данные для подключения к БД: admin / password
- Рекомендуется изменить пароли в продакшене

## Troubleshooting

### Если pgAdmin не запускается
```bash
docker-compose logs pgadmin
```

### Если не удается подключиться к БД
1. Проверьте, что контейнер postgres запущен
2. Убедитесь, что используете правильный host: `postgres`
3. Проверьте логи postgres: `docker-compose logs postgres`
