const { Markup, Input } = require('telegraf');
const path = require('path');

const start = (ctx) => {
  const logoPath = path.resolve(__dirname, '..', 'assets', 'logo.png');
  ctx.replyWithPhoto(Input.fromLocalFile(logoPath), {
    caption: 'Что ищем: курс или доску?',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🎓 Курсы и запись', 'courses')],
      [Markup.button.callback('🏂 Подбор сноубордов', 'boards')],
      [Markup.button.callback('💬 Ответы на вопросы', 'faq')],
    ]),
  });
};

module.exports = { start };
