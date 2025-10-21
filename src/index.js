require('dotenv').config();
const { Telegraf, session, Scenes } = require('telegraf');
const { start } = require('./handlers/start');
const { help } = require('./handlers/help');
const { coursesScene } = require('./handlers/courses');
const { boardsScene } = require('./handlers/boards');
const { faqScene, faqContactScene } = require('./handlers/faq');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('Ошибка: BOT_TOKEN не найден. Пожалуйста, добавьте его в файл .env');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Напоминание о бездействии
const userTimeouts = {};
const REMINDER_TIMEOUT = 30 * 60 * 1000; // 30 минут

const setReminder = (ctx) => {
  const userId = ctx.from.id;
  if (userTimeouts[userId]) {
    clearTimeout(userTimeouts[userId]);
  }
  userTimeouts[userId] = setTimeout(() => {
    ctx.reply('Привет! Мы тут заметили, что вы немного пропали 🙂 Вернуться к выбору?');
  }, REMINDER_TIMEOUT);
};

bot.use((ctx, next) => {
  setReminder(ctx);
  return next();
});


const stage = new Scenes.Stage([coursesScene, boardsScene, faqScene, faqContactScene]);
bot.use(session());
bot.use(stage.middleware());

bot.start(start);
bot.help(help);
bot.action('courses', (ctx) => ctx.scene.enter('courses'));
bot.action('boards', (ctx) => ctx.scene.enter('boards'));
bot.action('faq', (ctx) => ctx.scene.enter('faq'));

// Обработка непредвиденных сообщений
bot.on('message', (ctx) => {
  if (!ctx.scene.current) {
    ctx.reply('Я вас не понимаю. Воспользуйтесь меню или командой /start.');
  }
});


// Удаление старого вебхука
bot.telegram.deleteWebhook().then(() => {
  console.log('Старый вебхук удален.');
  // Запуск бота с использованием polling
  bot.launch(() => {
    console.log('Бот запущен...');
  });
}).catch((error) => {
  console.error('Ошибка при удалении вебхука:', error);
});


// Обработка сигналов для корректного завершения работы
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log('Бот инициализирован.');
