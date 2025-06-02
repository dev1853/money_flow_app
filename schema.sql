-- Установка временной зоны
SET TIME ZONE 'UTC';

-- Таблица для иерархического справочника статей ДДС
CREATE TABLE dds_articles (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES dds_articles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    article_type VARCHAR(10) NOT NULL CHECK (article_type IN ('income', 'expense')),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE dds_articles IS 'Справочник статей Движения Денежных Средств (ДДС)';

-- Таблица для управления счетами и кассами
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('bank_account', 'cash_box')),
    currency VARCHAR(3) NOT NULL DEFAULT 'RUB',
    initial_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE accounts IS 'Счета и кассы компании';

-- Таблица ролей пользователей
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);
COMMENT ON TABLE roles IS 'Роли пользователей в системе';

-- Наполнение таблицы ролей
INSERT INTO roles (name, description) VALUES
('admin', 'Администратор. Полный доступ ко всем функциям, включая управление пользователями.'),
('employee', 'Сотрудник. Может создавать и редактировать операции, просматривать отчеты.');

-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE users IS 'Пользователи системы';
COMMENT ON COLUMN users.password_hash IS 'Хеш пароля, сгенерированный с помощью, например, bcrypt';
CREATE INDEX idx_users_email ON users(email);

-- Таблица для хранения денежных операций
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    dds_article_id INTEGER REFERENCES dds_articles(id),
    transaction_date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    description TEXT,
    contractor VARCHAR(255),
    employee VARCHAR(255),
    created_by_user_id INTEGER REFERENCES users(id), -- Кто создал операцию
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE transactions IS 'Денежные операции (поступления и списания)';
COMMENT ON COLUMN transactions.amount IS 'Сумма операции. > 0 для прихода, < 0 для расхода';
COMMENT ON COLUMN transactions.created_by_user_id IS 'ID пользователя, который создал/добавил операцию';

-- Индексы для ускорения выборок
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_dds_article_id ON transactions(dds_article_id);
CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date);