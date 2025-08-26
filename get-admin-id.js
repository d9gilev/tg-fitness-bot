const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');

// Создаем бот с polling для получения ID
const tempBot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: true });

console.log('📱 Для получения вашего Telegram ID:');
console.log('1. Отправьте любое сообщение боту @Max_trainerbot');
console.log('2. Я покажу ваш ID в консоли и отправлю вам сообщение');
console.log('3. Скопируйте ID и добавьте его в config.js в массив ADMIN_IDS\n');

// Обработчик для получения ID
tempBot.on('message', async (msg) => {
  const userId = msg.from.id;
  const username = msg.from.username || 'Не указан';
  const firstName = msg.from.first_name || '';
  const lastName = msg.from.last_name || '';
  
  console.log('👤 Информация о пользователе:');
  console.log(`ID: ${userId}`);
  console.log(`Username: @${username}`);
  console.log(`Имя: ${firstName} ${lastName}`);
  console.log(`\n📝 Добавьте ${userId} в config.js:`);
  console.log(`ADMIN_IDS: [${userId}]`);
  
  // Отправляем ID пользователю
  try {
    await tempBot.sendMessage(msg.chat.id, 
      `🔑 Ваш Telegram ID: \`${userId}\`\n\n` +
      `Добавьте этот ID в config.js в массив ADMIN_IDS для получения прав администратора.`,
      { parse_mode: 'Markdown' }
    );
    console.log('✅ ID отправлен в Telegram!');
  } catch (error) {
    console.error('❌ Ошибка отправки:', error.message);
  }
});

console.log('🤖 Бот готов к получению ID. Отправьте любое сообщение...');
