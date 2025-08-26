const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');
const http = require('http');

// Конфигурация из переменных окружения
const config = {
  TELEGRAM_BOT_TOKEN: process.env.BOT_TOKEN,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ADMIN_IDS: process.env.ADMIN_IDS 
    ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim()))
    : [26757881] // S M (@Stanis212) - дефолтный админ
};

// Health check server для Fly.io
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(process.env.PORT || 8080, () => {
  console.log(`Health check server running on port ${process.env.PORT || 8080}`);
});

// Инициализация бота
const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { 
  polling: true,
  polling_options: {
    timeout: 10,
    limit: 100,
    retryTimeout: 5000
  }
});

// Инициализация OpenAI
const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY
});

// Хранилище контекста для каждого пользователя
const userContexts = new Map();

// Функция проверки админа
function isAdmin(userId) {
  return config.ADMIN_IDS.includes(userId);
}

// Обработка команды /start
bot.onText(/^\/start$/, async (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
Привет! Я Макс, твой персональный тренер с искусственным интеллектом! 🏋️‍♂️

Моя суперсила - я мгновенно изучаю все рекомендации ВОЗ, нахожу научные источники и создаю программы тренировок, которые работают именно для тебя!

Не важно, хочешь ли ты похудеть, набрать мышечную массу или просто стать здоровее - я составлю план, который приведет тебя к цели.

Готов начать путь к лучшей версии себя? Расскажи о своих целях!
  `;
  
  await bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: {
      keyboard: [
        [{ text: "📅 План" }, { text: "📝 Отчёт" }],
        [{ text: "💧 +250 мл" }, { text: "🍽️ Еда" }],
        [{ text: "🕒 Расписание" }, { text: "🔕 Пауза 24ч" }],
        [{ text: "👤 Профиль" }, { text: "❓ Помощь" }],
      ],
      resize_keyboard: true,
      is_persistent: true,
      one_time_keyboard: false,
      selective: false,
    },
  });
});

// Команда для восстановления меню
bot.onText(/^\/menu$/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, "Меню обновлено 👇", {
    reply_markup: {
      keyboard: [
        [{ text: "📅 План" }, { text: "📝 Отчёт" }],
        [{ text: "💧 +250 мл" }, { text: "🍽️ Еда" }],
        [{ text: "🕒 Расписание" }, { text: "🔕 Пауза 24ч" }],
        [{ text: "👤 Профиль" }, { text: "❓ Помощь" }],
      ],
      resize_keyboard: true,
      is_persistent: true,
      one_time_keyboard: false,
      selective: false,
    },
  });
});



// Обработка команды /clear
bot.onText(/\/clear/, async (msg) => {
  const chatId = msg.chat.id;
  userContexts.delete(chatId);
  await bot.sendMessage(chatId, '🔄 Начинаем с чистого листа! Расскажи о своих новых целях.');
});

// Админ команда для полной очистки всех данных
bot.onText(/\/admin_reset/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  if (!isAdmin(userId)) {
    await bot.sendMessage(chatId, '❌ У вас нет прав администратора для выполнения этой команды.');
    return;
  }
  
  const resetKeyboard = {
    inline_keyboard: [
      [
        { text: '✅ Да, очистить ВСЕ данные', callback_data: 'confirm_reset_all' },
        { text: '❌ Отмена', callback_data: 'cancel_reset' }
      ]
    ]
  };
  
  await bot.sendMessage(chatId, 
    '⚠️ ВНИМАНИЕ! Это действие удалит ВСЕ данные всех пользователей!\n\n' +
    '• Все контексты разговоров\n' +
    '• Вся история взаимодействий\n' +
    '• Все настройки пользователей\n\n' +
    'Это действие НЕОБРАТИМО! Подтвердите операцию:',
    { reply_markup: resetKeyboard }
  );
});

// Обработка кнопок меню
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Пропускаем команды
  if (text.startsWith('/')) {
    return;
  }

  // Обработка кнопок меню
  if (text === "📅 План") {
    await bot.sendMessage(chatId, "📅 Создаю персональный план тренировок...\n\nРасскажи о своих целях и текущем уровне подготовки!");
    return;
  }
  
  if (text === "📝 Отчёт") {
    await bot.sendMessage(chatId, "📝 Анализирую твой прогресс...\n\nПока что отчёты в разработке. Скоро здесь будет детальная статистика!");
    return;
  }
  
  if (text === "💧 +250 мл") {
    await bot.sendMessage(chatId, "💧 +250 мл воды добавлено в дневник!\n\nПродолжай пить воду - это важно для здоровья и результатов тренировок.");
    return;
  }
  
  if (text === "🍽️ Еда") {
    await bot.sendMessage(chatId, "🍽️ Дневник питания\n\nРасскажи что ты съел или планируешь съесть - я помогу с рекомендациями по питанию!");
    return;
  }
  
  if (text === "🕒 Расписание") {
    await bot.sendMessage(chatId, "🕒 Настройка расписания тренировок\n\nВ какие дни и время ты предпочитаешь тренироваться?");
    return;
  }
  
  if (text === "🔕 Пауза 24ч") {
    await bot.sendMessage(chatId, "🔕 Уведомления приостановлены на 24 часа\n\nНе забудь вернуться к тренировкам завтра!");
    return;
  }
  
  if (text === "👤 Профиль") {
    await bot.sendMessage(chatId, "👤 Твой профиль\n\nЗдесь будет информация о твоих целях, прогрессе и настройках. Скоро!");
    return;
  }
  
  if (text === "❓ Помощь") {
    const helpMessage = `
📚 Как работать со мной:

• Расскажи о своих целях (похудение, набор массы, здоровье)
• Опиши свой текущий уровень подготовки
• Укажи ограничения по времени и оборудованию
• Я создам персонализированную программу тренировок

Примеры запросов:
- "Хочу похудеть на 10 кг за 3 месяца"
- "Нужна программа для набора мышечной массы дома"
- "Хочу стать выносливее для бега"
    `;
    await bot.sendMessage(chatId, helpMessage);
    return;
  }

  try {
    // Показываем индикатор набора
    await bot.sendChatAction(chatId, 'typing');

    // Получаем или создаем контекст пользователя
    if (!userContexts.has(chatId)) {
      userContexts.set(chatId, []);
    }
    const context = userContexts.get(chatId);

    // Добавляем сообщение пользователя в контекст
    context.push({ role: 'user', content: text });

    // Ограничиваем контекст последними 10 сообщениями
    if (context.length > 10) {
      context.splice(0, context.length - 10);
    }

    // Запрос к GPT
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Ты Макс - персональный тренер с ИИ. Ты специализируешься на создании персонализированных программ тренировок на основе рекомендаций ВОЗ и научных исследований. Всегда предоставляй научные источники для своих советов. Отвечай на русском языке, будь мотивирующим и профессиональным.'
        },
        ...context
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content;

    // Добавляем ответ в контекст
    context.push({ role: 'assistant', content: response });

    // Отправляем ответ
    await bot.sendMessage(chatId, response);

  } catch (error) {
    console.error('Ошибка при обработке сообщения:', error);
    await bot.sendMessage(chatId, '❌ Произошла ошибка при обработке запроса. Попробуй еще раз.');
  }
});

// Обработка callback query (кнопки)
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;
  
  // Отвечаем на callback query
  await bot.answerCallbackQuery(callbackQuery.id);
  
  if (data === 'confirm_reset_all') {
    if (!isAdmin(userId)) {
      await bot.sendMessage(chatId, '❌ У вас нет прав администратора для выполнения этой операции.');
      return;
    }
    
    // Очищаем все данные
    userContexts.clear();
    
    // Обновляем сообщение
    await bot.editMessageText(
      '✅ ВСЕ ДАННЫЕ УДАЛЕНЫ!\n\n' +
      '• Контексты разговоров: очищены\n' +
      '• История взаимодействий: удалена\n' +
      '• Настройки пользователей: сброшены\n\n' +
      'Бот готов к новому старту! 🚀',
      {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        reply_markup: { inline_keyboard: [] }
      }
    );
    
    // Отправляем приветственное сообщение как при первом запуске
    setTimeout(async () => {
      await bot.sendMessage(chatId, 
        'Привет! Я Макс, твой персональный тренер с искусственным интеллектом! 🏋️‍♂️\n\n' +
        'Моя суперсила - я мгновенно изучаю все рекомендации ВОЗ, нахожу научные источники и создаю программы тренировок, которые работают именно для тебя!\n\n' +
        'Не важно, хочешь ли ты похудеть, набрать мышечную массу или просто стать здоровее - я составлю план, который приведет тебя к цели.\n\n' +
        'Готов начать путь к лучшей версии себя? Расскажи о своих целях!'
      );
    }, 1000);
    
    console.log(`🔧 Админ ${userId} выполнил полную очистку всех данных`);
    
  } else if (data === 'cancel_reset') {
    await bot.editMessageText(
      '❌ Операция отменена. Данные сохранены.',
      {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        reply_markup: { inline_keyboard: [] }
      }
    );
  }
});

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('Ошибка polling:', error);
});

bot.on('error', (error) => {
  console.error('Ошибка бота:', error);
});

console.log('🤖 Бот запущен и готов к работе!');
