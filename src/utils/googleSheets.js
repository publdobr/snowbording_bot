const { GoogleSpreadsheet } = require('google-spreadsheet');
require('dotenv').config();

// ID вашей таблицы Google
const SPREADSHEET_ID = '1O9dpdrVOTW37ID3Y_RGAUTVJDBXRa3E3GW8O-jO8z6Q';

// Функция для получения данных из Google Sheets
const getSheetData = async (sheetTitle) => {
  try {
    let credentials;
    try {
      if (!process.env.GOOGLE_CREDENTIALS_JSON || process.env.GOOGLE_CREDENTIALS_JSON === '""') {
        console.error('Ошибка: GOOGLE_CREDENTIALS_JSON не установлен или пуст в файле .env. Пожалуйста, убедитесь, что вы предоставили действительные учетные данные в формате JSON.');
        return [];
      }
      credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    } catch (error) {
      console.error('Ошибка: Не удалось загрузить или распарсить учетные данные из GOOGLE_CREDENTIALS_JSON.', error);
      return [];
    }

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

    // Аутентификация с использованием ключа сервисного аккаунта
    await doc.useServiceAccountAuth(credentials);

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
