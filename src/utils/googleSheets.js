const { GoogleSpreadsheet } = require('google-spreadsheet');
const path = require('path');

// ID вашей таблицы Google
const SPREADSHEET_ID = '1O9dpdrVOTW37ID3Y_RGAUTVJDBXRa3E3GW8O-jO8z6Q';

// Функция для получения учетных данных
const getCredentials = () => {
  // 1. Проверяем переменную окружения (лучше для деплоя)
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
      return JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    } catch (e) {
      console.error('Ошибка парсинга GOOGLE_CREDENTIALS_JSON:', e);
      return null;
    }
  }

  // 2. Ищем файл credentials.json (удобно для локальной разработки)
  try {
    const credentialsPath = path.resolve(process.cwd(), 'credentials.json');
    return require(credentialsPath);
  } catch (error) {
    console.error('Ошибка: файл credentials.json не найден в корне проекта.');
    return null;
  }
};


// Функция для получения данных из Google Sheets
const getSheetData = async (sheetTitle) => {
  const credentials = getCredentials();
  if (!credentials) {
    console.error('Аутентификация не удалась: учетные данные не найдены.');
    return [];
  }

  try {
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
    await doc.useServiceAccountAuth(credentials);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) {
      console.error(`Лист с названием "${sheetTitle}" не найден.`);
      return [];
    }

    const rows = await sheet.getRows();

    const data = rows.map(row => {
      const rowData = {};
      sheet.headerValues.forEach(header => {
        rowData[header] = row[header];
      });
      return rowData;
    });

    return data;
  } catch (error) {
    console.error('Ошибка при получении данных из Google Sheets:', error.message);
    return [];
  }
};

module.exports = { getSheetData };
