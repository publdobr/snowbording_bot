const sendToManager = (ctx, message) => {
  const MANAGER_CHAT_ID = process.env.MANAGER_CHAT_ID;
  if (MANAGER_CHAT_ID) {
    ctx.telegram.sendMessage(MANAGER_CHAT_ID, message);
  } else {
    console.error('Ошибка: MANAGER_CHAT_ID не найден. Пожалуйста, добавьте его в файл .env');
  }
};

module.exports = { sendToManager };
