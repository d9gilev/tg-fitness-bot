# 🤖 TG Fitness Bot

Персональный тренер с ИИ для Telegram. Создает персонализированные программы тренировок на основе рекомендаций ВОЗ и научных исследований.

## 🚀 Возможности

- 📅 Создание персональных планов тренировок
- 📝 Отслеживание прогресса
- 💧 Дневник воды
- 🍽️ Рекомендации по питанию
- 🕒 Настройка расписания
- 👤 Профиль пользователя

## 🛠️ Технологии

- Node.js
- node-telegram-bot-api
- OpenAI GPT-3.5
- TypeScript (исходники)

## 📦 Установка

1. Клонируй репозиторий:
```bash
git clone <repository-url>
cd tg-fitness-bot
```

2. Установи зависимости:
```bash
npm install
```

3. Создай файл `.env`:
```bash
# Скопируй env.example в .env
cp env.example .env
```

4. Настрой переменные в `.env`:
```bash
# Telegram Bot Token (получи у @BotFather)
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# OpenAI API Key (получи на https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-1234567890abcdef1234567890abcdef1234567890abcdef

# ID администраторов (необязательно)
ADMIN_IDS=26757881,123456789
```

5. Запусти бота:
```bash
node bot.js
```

## 🔧 Команды

- `/start` - Главное меню
- `/menu` - Восстановить меню
- `/clear` - Очистить контекст
- `/help` - Помощь
- `/admin_reset` - Сброс всех данных (только для админов)

## 📱 Меню

Бот использует персистентную reply-клавиатуру с кнопками:
- 📅 План | 📝 Отчёт
- 💧 +250 мл | 🍽️ Еда
- 🕒 Расписание | 🔕 Пауза 24ч
- 👤 Профиль | ❓ Помощь

## 🚀 Деплой

Для 24/7 работы рекомендуется использовать:
- Railway
- Render
- Fly.io
- VPS (DigitalOcean, Linode)

### Переменные окружения для деплоя

При деплое на платформу добавь эти переменные:

| Переменная | Описание | Где получить |
|------------|----------|--------------|
| `BOT_TOKEN` | Telegram Bot Token | @BotFather в Telegram |
| `OPENAI_API_KEY` | OpenAI API Key | https://platform.openai.com/api-keys |
| `ADMIN_IDS` | ID администраторов (опционально) | Через @userinfobot в Telegram |

**Пример для Railway:**
1. Создай проект на railway.app
2. Подключи GitHub репозиторий
3. В разделе "Variables" добавь:
   - `BOT_TOKEN` = `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
   - `OPENAI_API_KEY` = `sk-1234567890abcdef1234567890abcdef1234567890abcdef`
   - `ADMIN_IDS` = `26757881` (твой ID)
4. Деплой запустится автоматически

## 📄 Лицензия

MIT
