import TelegramBot, { InlineKeyboardButton } from "node-telegram-bot-api";

export const mainKb: TelegramBot.ReplyKeyboardMarkup = {
  keyboard: [
    [{ text: "📅 План" }, { text: "📝 Отчёт" }],
    [{ text: "💧 +250 мл" }, { text: "🍽️ Еда" }],
    [{ text: "🕒 Расписание" }, { text: "🔕 Пауза 24ч" }],
    [{ text: "👤 Профиль" }, { text: "❓ Помощь" }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

export const morningIKB = {
  inline_keyboard: [
    [{ text: "📅 Открыть план", callback_data: "open_plan" }],
    [
      { text: "↪️ Перенести", callback_data: "reschedule_today" },
      { text: "🚫 Не сегодня", callback_data: "skip_today" },
    ],
  ] as InlineKeyboardButton[][]
};

export const foodIKB = {
  inline_keyboard: [
    [{ text: "➕ Добавить приём", callback_data: "food_add" },
     { text: "📊 Итоги дня", callback_data: "food_summary" }]
  ]
};
