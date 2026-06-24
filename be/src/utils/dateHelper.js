// be/src/utils/dateHelper.js

/**
 * Định dạng thời gian UTC từ Database sang giờ Việt Nam (UTC+7 / Asia/Ho_Chi_Minh)
 * @param {Date|string} dateInput - Thời gian đầu vào (UTC)
 * @param {string} type - Loại định dạng ('full': DD/MM/YYYY HH:mm:ss, 'date': DD/MM/YYYY, 'time': HH:mm:ss)
 * @returns {string|null} - Chuỗi thời gian đã định dạng
 */
export const formatToVietnamTime = (dateInput, type = 'full') => {
  if (!dateInput) return null;
  const date = new Date(dateInput);

  // Sử dụng Intl.DateTimeFormat để ép múi giờ sang Asia/Ho_Chi_Minh
  const formatter = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const getPart = (partType) => parts.find(p => p.type === partType)?.value || '';

  const day = getPart('day');
  const month = getPart('month');
  const year = getPart('year');
  const hour = getPart('hour');
  const minute = getPart('minute');
  const second = getPart('second');

  if (type === 'date') {
    return `${day}/${month}/${year}`;
  }

  if (type === 'time') {
    return `${hour}:${minute}:${second}`;
  }

  // Mặc định trả về full date time
  return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
};

/**
 * Lấy thời gian hiện tại dưới dạng chuỗi ISO có chứa offset múi giờ Việt Nam (+07:00)
 * @returns {string} - Chuỗi ISO Việt Nam
 */
export const getVietnamNowISO = () => {
  const date = new Date();
  
  // Cộng thêm 7 tiếng (7 * 60 * 60 * 1000 ms)
  const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  
  // Cắt đuôi 'Z' và cộng thêm '+07:00'
  return vnTime.toISOString().replace('Z', '+07:00');
};
