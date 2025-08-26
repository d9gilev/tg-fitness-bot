const https = require('https');
const config = require('./config');

// Получаем токен из конфигурации
const BOT_TOKEN = config.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN не найден в конфигурации');
  process.exit(1);
}

// Функция для сброса webhook
function resetWebhook() {
  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${BOT_TOKEN}/deleteWebhook`,
    method: 'GET'
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        if (result.ok) {
          console.log('✅ Webhook успешно сброшен');
          console.log('📋 Результат:', result);
        } else {
          console.error('❌ Ошибка при сбросе webhook:', result);
        }
      } catch (error) {
        console.error('❌ Ошибка парсинга ответа:', error);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Ошибка запроса:', error);
  });

  req.end();
}

// Запускаем сброс webhook
console.log('🔄 Сбрасываю webhook для бота...');
resetWebhook();
