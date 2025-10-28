const { GoogleSpreadsheet } = require('google-spreadsheet');
require('dotenv').config();

// ID вашей таблицы Google
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// Функция для получения данных из Google Sheets
const getSheetData = async (sheetTitle) => {
  try {
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

    // Аутентификация с использованием ключа сервисного аккаунта
    // Загрузка учетных данных из переменной окружения GOOGLE_APPLICATION_CREDENTIALS
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });

    // Загрузка информации о документе
    await doc.loadInfo();

    // Получение нужного листа
    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) {
      console.error(`Лист с названием "${sheetTitle}" не найден.`);
      return [];
    }

    // Получение всех строк
    const rows = await sheet.getRows();

    // Преобразование строк в массив объектов
    const data = rows.map(row => {
      const rowData = {};
      sheet.headerValues.forEach(header => {
        rowData[header] = row[header];
      });
      return rowData;
    });

    return data;
  } catch (error) {
    console.error('Ошибка при получении данных из Google Sheets:', error);
    return [];
  }
};

module.exports = { getSheetData };
