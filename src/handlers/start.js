const { Markup } = require('telegraf');

const start = (ctx) => {
  ctx.replyWithPhoto('https://funcarve.ru/wp-content/uploads/logo-ru-bl-to-svg-1.svg', {
    caption: 'Что ищем: курс или доску?',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🎓 Курсы и запись', 'courses')],
      [Markup.button.callback('🏂 Подбор сноубордов', 'boards')],
      [Markup.button.callback('💬 Ответы на вопросы', 'faq')],
    ]),
  });
};

module.exports = { start };
