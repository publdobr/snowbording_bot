const { Markup, Scenes } = require('telegraf');
const { getSheetData } = require('../utils/googleSheets');
const { sendToManager } = require('../utils/sendToManager');

const faqScene = new Scenes.BaseScene('faq');

faqScene.enter(async (ctx) => {
  const questions = await getSheetData('Вопросы');
  ctx.scene.state.questions = questions;

  ctx.reply('Выберите вопрос:', Markup.inlineKeyboard(
    questions.map(q => [Markup.button.callback(q['Вопрос'], `question_${q['Вопрос']}`)])
  ));
});

faqScene.action(/question_(.+)/, async (ctx) => {
  const questionText = ctx.match[1];
  const question = ctx.scene.state.questions.find(q => q['Вопрос'] === questionText);

  if (question) {
    await ctx.reply(question['Ответ']);

    if (question['Требует помощи'] && question['Требует помощи'].toLowerCase() === 'да') {
      ctx.reply('Похоже, вам нужна помощь. Хотите, чтобы с вами связался менеджер?', Markup.inlineKeyboard([
        [Markup.button.callback('Да', 'contact_manager_faq')],
        [Markup.button.callback('Нет', 'cancel_faq')],
      ]));
    } else {
      ctx.scene.leave();
    }
  }
});

faqScene.action('contact_manager_faq', (ctx) => {
  return ctx.scene.enter('faq_contact');
});

faqScene.action('cancel_faq', (ctx) => {
  ctx.reply('Хорошо!');
  return ctx.scene.leave();
});

const faqContactScene = new Scenes.WizardScene(
  'faq_contact',
  (ctx) => {
    ctx.reply('Пожалуйста, введите ваше имя:');
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.name = ctx.message.text;
    ctx.reply('Теперь ваш номер телефона:');
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.phone = ctx.message.text;
    ctx.wizard.state.telegram = ctx.from.username;

    const { name, phone, telegram } = ctx.wizard.state;
    const message = `Новая заявка из FAQ!\n\nИмя: ${name}\nТелефон: ${phone}\nTelegram: @${telegram}`;

    sendToManager(ctx, message);

    ctx.reply('Заявка передана! Менеджер свяжется с вами в ближайшее время 💬');
    return ctx.scene.leave();
  }
);


module.exports = { faqScene, faqContactScene };
