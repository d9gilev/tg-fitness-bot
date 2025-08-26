# 🚀 Деплой на Fly.io

## 📋 Предварительные требования

1. **Установи Fly CLI:**
   ```bash
   # macOS
   brew install flyctl
   
   # Windows
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   
   # Linux
   curl -L https://fly.io/install.sh | sh
   ```

2. **Создай аккаунт на Fly.io:**
   - Зайди на https://fly.io
   - Зарегистрируйся (можно через GitHub)

## 🔧 Пошаговая инструкция

### 1. Авторизация
```bash
fly auth login
```

### 2. Создание приложения
```bash
fly apps create tg-fitness-bot
```

### 3. Настройка переменных окружения
```bash
# Telegram Bot Token
fly secrets set BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"

# OpenAI API Key
fly secrets set OPENAI_API_KEY="sk-1234567890abcdef1234567890abcdef1234567890abcdef"

# Admin IDs (опционально)
fly secrets set ADMIN_IDS="26757881"
```

### 4. Деплой
```bash
fly deploy
```

### 5. Проверка статуса
```bash
fly status
```

### 6. Просмотр логов
```bash
fly logs
```

## 🔍 Полезные команды

```bash
# Перезапуск приложения
fly apps restart tg-fitness-bot

# Просмотр переменных окружения
fly secrets list

# Удаление приложения
fly apps destroy tg-fitness-bot

# Масштабирование
fly scale count 1
```

## ⚠️ Важные моменты

1. **Бесплатный тариф:** 3 VM, 256MB RAM каждая
2. **Регион:** По умолчанию `fra` (Франкфурт), можно изменить в `fly.toml`
3. **Health check:** Приложение должно отвечать на `/health`
4. **Порт:** Используется порт 8080

## 🐛 Решение проблем

### Приложение не запускается
```bash
fly logs
fly status
```

### Проблемы с переменными
```bash
fly secrets list
fly secrets set VARIABLE_NAME="value"
```

### Изменение региона
```bash
# В fly.toml измени primary_region
fly deploy
```

## 📊 Мониторинг

- **Dashboard:** https://fly.io/apps/tg-fitness-bot
- **Логи:** `fly logs`
- **Метрики:** В веб-интерфейсе Fly.io
