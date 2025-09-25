-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
                                     id SERIAL PRIMARY KEY,
                                     username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'manager', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Таблица лимитов
CREATE TABLE IF NOT EXISTS user_limits (
                                           id SERIAL PRIMARY KEY,
                                           user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    max_files INTEGER DEFAULT 10,
    max_file_size BIGINT DEFAULT 10485760, -- 10MB в байтах
    is_custom BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id)
    );

-- Таблица для хранения метаданных файлов
CREATE TABLE IF NOT EXISTS files (
                                     id SERIAL PRIMARY KEY,
                                     user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    lo_oid OID NOT NULL, -- OID large object
    is_public BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Глобальные настройки лимитов
CREATE TABLE IF NOT EXISTS global_limits (
                                             id SERIAL PRIMARY KEY,
                                             max_files_per_user INTEGER DEFAULT 10,
                                             max_file_size BIGINT DEFAULT 10485760,
                                             updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Вставка администратора по умолчанию
INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
    ON CONFLICT (username) DO NOTHING;

-- Вставка глобальных лимитов
INSERT INTO global_limits (max_files_per_user, max_file_size)
VALUES (10, 10485760)
    ON CONFLICT (id) DO NOTHING;