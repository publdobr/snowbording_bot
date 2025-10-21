const { Markup, Scenes } = require('telegraf');
const { getSheetData } = require('../utils/googleSheets');
const { sendToManager } = require('../utils/sendToManager');

// Сцена подбора сноубордов
const boardsScene = new Scenes.WizardScene(
  'boards',
  // Шаг 1: Опыт
  (ctx) => {
    ctx.reply('Как часто катаешься?', Markup.inlineKeyboard([
      [Markup.button.callback('Начинающий', 'exp_beginner')],
      [Markup.button.callback('Средний', 'exp_intermediate')],
      [Markup.button.callback('Продвинутый', 'exp_advanced')],
    ]));
    return ctx.wizard.next();
  },
  // Шаг 2: Стиль
  (ctx) => {
    ctx.wizard.state.experience = ctx.callbackQuery.data.split('_')[1];
    ctx.reply('Какой стиль нравится?', Markup.inlineKeyboard([
      [Markup.button.callback('Прыжки', 'style_freestyle')],
      [Markup.button.callback('Фрирайд', 'style_freeride')],
      [Markup.button.callback('Универсал', 'style_allmountain')],
    ]));
    return ctx.wizard.next();
  },
  // Шаг 3: Рост и вес
  (ctx) => {
    ctx.wizard.state.style = ctx.callbackQuery.data.split('_')[1];
    ctx.reply('Какой у тебя рост и вес? (например: 180 см, 75 кг)');
    return ctx.wizard.next();
  },
  // Шаг 4: Рекомендация
  async (ctx) => {
    ctx.wizard.state.hw = ctx.message.text;
    const { experience, style } = ctx.wizard.state;

    // Получаем все доски
    const boards = await getSheetData('Доски');

    // Простая логика подбора (можно усложнить)
    const recommendedBoards = boards.filter(board =>
      board['Стиль'].toLowerCase().includes(style) &&
      board['Уровень'].toLowerCase().includes(experience)
    ).slice(0, 3); // Берем не больше 3

    if (recommendedBoards.length > 0) {
      ctx.reply('Вот что мы можем порекомендовать:');
      recommendedBoards.forEach(board => {
        ctx.replyWithHTML(`<b>${board['Название']}</b>\n${board['Описание']}`);
      });
      ctx.reply('Хотите, чтобы с вами связался консультант для уточнения деталей?', Markup.inlineKeyboard([
        [Markup.button.callback('Да, нужна помощь', 'contact_manager')],
        [Markup.button.callback('Нет, спасибо', 'cancel')],
      ]));
    } else {
      ctx.reply('К сожалению, по вашим параметрам ничего не найдено. Хотите, чтобы с вами связался консультант?', Markup.inlineKeyboard([
        [Markup.button.callback('Да, нужна помощь', 'contact_manager')],
        [Markup.button.callback('Нет, спасибо', 'cancel')],
      ]));
    }
    return ctx.wizard.next();
  },
  // Шаг 5: Сбор контактов
  (ctx) => {
    if (ctx.callbackQuery && ctx.callbackQuery.data === 'contact_manager') {
      ctx.reply('Пожалуйста, введите ваше имя:');
      return ctx.wizard.next();
    }
    ctx.reply('Хорошо, если передумаете, мы всегда здесь!');
    return ctx.scene.leave();
  },
  (ctx) => {
    ctx.wizard.state.name = ctx.message.text;
    ctx.reply('Теперь ваш номер телефона:');
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.phone = ctx.message.text;
    ctx.wizard.state.telegram = ctx.from.username;

    const { name, phone, telegram, experience, style, hw } = ctx.wizard.state;
    const message = `Новая заявка на подбор сноуборда!\n\nОпыт: ${experience}\nСтиль: ${style}\nРост/вес: ${hw}\n\nИмя: ${name}\nТелефон: ${phone}\nTelegram: @${telegram}`;

    sendToManager(ctx, message);

    ctx.reply('Заявка передана! Менеджер свяжется с вами в ближайшее время 🏔️');
    return ctx.scene.leave();
  }
);

module.exports = { boardsScene };
