module.exports = {
  apps: [
    {
      name: '5HeadBot',       // любое удобное имя для процесса
      script: 'dist/bot.js',  // собранный файл
      cwd: './',              // рабочая папка
      instances: 1,           // количество инстансов (1)
      autorestart: true,      // автоматически перезапускать при падении
      watch: false,           // можно включить watch, но не обязательно
      max_memory_restart: '200M', // перезапуск, если память превысит 200М
      env: {
        NODE_ENV: 'production',
        // сюда попадут ваши переменные .env, если не используете dotenv — можно указать их явно
      }
    }
  ]
};
