import { EXCEL_DATE_OFFSET, MS_PER_DAY } from './constants';

function convertExcelTime(timeDecimal: number): { hours: number; minutes: number } {
  const totalMinutes = Math.round(timeDecimal * 24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
}

export function parseDateString(dateStr: string | number | Date, timeStr: string | number = '00:00'): Date {
  try {
    // Eğer zaten Date objesi ise direkt döndür
    if (dateStr instanceof Date) {
      return dateStr;
    }

    // Eğer sayı ise Excel tarih formatı olarak kabul et
    if (typeof dateStr === 'number' || !isNaN(Number(dateStr))) {
      const days = Math.floor(Number(dateStr));
      const date = new Date(EXCEL_DATE_OFFSET + (days * MS_PER_DAY));
      
      // timeStr sayı ise Excel time formatı olarak işle
      if (typeof timeStr === 'number') {
        const { hours, minutes } = convertExcelTime(timeStr);
        date.setHours(hours, minutes);
      } else {
        // String ise normal parse et
        const [hours, minutes] = timeStr.split(':').map(Number);
        date.setHours(hours || 0, minutes || 0);
      }
      
      return date;
    }

    // CSV'den gelen string tarihi parse et (DD/MM/YYYY formatında)
    const [day, month, year] = String(dateStr).split('/').map(Number);
    const [hours, minutes] = typeof timeStr === 'string' ? timeStr.split(':').map(Number) : [0, 0];
    
    // Geçerli bir tarih mi kontrol et
    if (!day || !month || !year || day > 31 || month > 12) {
      console.error('Invalid date components:', { day, month, year, dateStr });
      return new Date();
    }
    
    // Burada month-1 yapıyoruz çünkü JavaScript'te aylar 0'dan başlar
    const date = new Date(year, month - 1, day, hours || 0, minutes || 0);
    
    // Geçerli bir tarih mi kontrol et
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', { dateStr, timeStr });
      return new Date();
    }
    
    return date;
  } catch (error) {
    console.error('Date parsing error:', { dateStr, timeStr, error });
    return new Date(); // Hata durumunda şu anki tarihi döndür
  }
}

// Excel tarihini normal tarihe çeviren fonksiyon
export function convertExcelDate(excelDate: number | string): string {
  // Excel tarihi 1900'den başlar ve geçen gün sayısını temsil eder
  const EXCEL_START_DATE = new Date(1900, 0, 1);
  
  // String ise sayıya çevir
  const numericDate = typeof excelDate === 'string' ? parseInt(excelDate) : excelDate;
  
  // Geçerli bir sayı değilse orijinal değeri döndür
  if (!Number.isFinite(numericDate)) return String(excelDate);
  
  // Excel'in 1900'ü artık yıl sayma hatasını düzelt
  const adjustedDate = numericDate <= 60 ? numericDate - 1 : numericDate - 2;
  
  // Milisaniyeye çevir ve başlangıç tarihine ekle
  const date = new Date(EXCEL_START_DATE.getTime() + (adjustedDate * 24 * 60 * 60 * 1000));
  
  // Tarihi formatla
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}.${month}.${year}`;
}

export const formatDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export const calculateSeason = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= 6 ? `${year}-${year + 1}` : `${year-1}-${year}`;
};