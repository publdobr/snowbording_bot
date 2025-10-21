const { Markup, Scenes, session } = require('telegraf');
const { getSheetData } = require('../utils/googleSheets');
const { sendToManager } = require('../utils/sendToManager');

// Создание сцены
const coursesScene = new Scenes.WizardScene(
  'courses',
  // Шаг 1: Определение уровня
  (ctx) => {
    ctx.reply('Катались ли у нас раньше?', Markup.inlineKeyboard([
      [Markup.button.callback('Да! Хочу ещё!', 'returning_student')],
      [Markup.button.callback('Нет, но есть опыт', 'experienced_student')],
      [Markup.button.callback('Нет, я новичок', 'new_student')],
    ]));
    return ctx.wizard.next();
  },
  // Шаг 2: Выбор фильтра
  async (ctx) => {
    // Логика выбора курсов в зависимости от уровня
    const userLevel = ctx.callbackQuery.data;
    const courses = await getSheetData('Курсы');
    let filteredCourses;

    if (userLevel === 'new_student') {
      filteredCourses = courses.filter(course => course['Уровень'] === 'Базовый');
    } else {
      filteredCourses = courses.filter(course => course['Уровень'] !== 'Базовый');
    }

    ctx.wizard.state.courses = filteredCourses;

    ctx.reply('Выберите фильтр:', Markup.inlineKeyboard([
      [Markup.button.callback('Город', 'filter_city')],
      [Markup.button.callback('Даты', 'filter_dates')],
      [Markup.button.callback('Курс', 'filter_course')],
    ]));

    return ctx.wizard.next();
  },
  // Шаг 3: Выбор значения фильтра
  async (ctx) => {
    const filterType = ctx.callbackQuery.data.split('_')[1];
    const courses = ctx.wizard.state.courses;
    const filterValues = [...new Set(courses.map(course => course[filterType.charAt(0).toUpperCase() + filterType.slice(1)]))];

    ctx.reply(`Выберите ${filterType}:`, Markup.inlineKeyboard(
      filterValues.map(value => [Markup.button.callback(value, `select_${filterType}_${value}`)])
    ));

    return ctx.wizard.next();
  },
  // Шаг 4: Отображение курсов
  async (ctx) => {
    const [,, filterType, filterValue] = ctx.callbackQuery.data.split('_');
    const courses = ctx.wizard.state.courses;
    const filteredCourses = courses.filter(course => course[filterType.charAt(0).toUpperCase() + filterType.slice(1)] === filterValue);

    ctx.wizard.state.selectedCourses = filteredCourses;

    ctx.reply('Вот что мы нашли:', Markup.inlineKeyboard(
      filteredCourses.map(course => [Markup.button.callback(course['Курс'], `details_${course['Курс']}`)])
    ));

    return ctx.wizard.next();
  },
  // Шаг 5: Детали курса
  (ctx) => {
    const courseName = ctx.callbackQuery.data.split('_')[1];
    const course = ctx.wizard.state.selectedCourses.find(c => c['Курс'] === courseName);
    ctx.wizard.state.selectedCourse = course;
    ctx.replyWithHTML(`<b>${course['Курс']}</b>\n\n${course['Описание']}\n\n<a href="${course['Ссылка']}">Подробнее...</a>`);
    ctx.reply('Хотите записаться?', Markup.inlineKeyboard([
      [Markup.button.callback('Да', 'enroll')],
      [Markup.button.callback('Нет', 'cancel')],
    ]));
    return ctx.wizard.next();
  },
  // Шаг 6: Сбор контактов
  (ctx) => {
    if (ctx.callbackQuery.data === 'enroll') {
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

    const { name, phone, telegram, selectedCourse } = ctx.wizard.state;
    const message = `Новая заявка на курс!\n\nКурс: ${selectedCourse['Курс']}\nИмя: ${name}\nТелефон: ${phone}\nTelegram: @${telegram}`;

    sendToManager(ctx, message);

    ctx.reply('Заявка передана! Менеджер свяжется с вами в ближайшее время 🌞');
    return ctx.scene.leave();
  }
);

module.exports = { coursesScene };
