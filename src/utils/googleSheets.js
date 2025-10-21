const { GoogleSpreadsheet } = require('google-spreadsheet');

// ID вашей таблицы Google
const SPREADSHEET_ID = '1O9dpdrVOTW37ID3Y_RGAUTVJDBXRa3E3GW8O-jO8z6Q';

// Функция для получения данных из Google Sheets
const getSheetData = async (sheetTitle) => {
  try {
    let credentials;
    try {
      credentials = require('../credentials.json');
    } catch (error) {
      console.error('Ошибка: файл credentials.json не найден. Убедитесь, что он существует в корневой директории.');
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
