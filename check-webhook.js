const https = require('https');
const config = require('./config');

// Получаем токен из конфигурации
const BOT_TOKEN = config.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN не найден в конфигурации');
  process.exit(1);
}

// Функция для получения информации о webhook
function getWebhookInfo() {
  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${BOT_TOKEN}/getWebhookInfo`,
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
          console.log('📋 Информация о webhook:');
          console.log(`   URL: ${result.result.url || 'не установлен'}`);
          console.log(`   Активен: ${result.result.url ? 'да' : 'нет'}`);
          console.log(`   Ошибки: ${result.result.last_error_message || 'нет'}`);
          console.log(`   Последняя ошибка: ${result.result.last_error_date || 'нет'}`);
          console.log(`   Максимальные подключения: ${result.result.max_connections || 'не указано'}`);
          console.log(`   Разрешенные обновления: ${result.result.allowed_updates ? result.result.allowed_updates.join(', ') : 'все'}`);
          
          if (result.result.url) {
            console.log('\n✅ Webhook установлен и активен!');
            console.log('🌐 Бот должен работать в продакшене');
          } else {
            console.log('\n⚠️ Webhook не установлен');
            console.log('🔧 Проверь Railway логи и переменные окружения');
          }
        } else {
          console.error('❌ Ошибка при получении информации о webhook:', result);
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

// Запускаем проверку webhook
console.log('🔍 Проверяю информацию о webhook...');
getWebhookInfo();
