require('dotenv').config();

module.exports = {
  TELEGRAM_BOT_TOKEN: process.env.BOT_TOKEN,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  // ID админов из переменной окружения или дефолтный
  ADMIN_IDS: process.env.ADMIN_IDS 
    ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim()))
    : [26757881] // S M (@Stanis212) - дефолтный админ
};
