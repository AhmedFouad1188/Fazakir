export const mapToArabic = (value) => {
  const mapping = {
    'new': { text: 'جديد', color: 'blue' },
    'preparing': { text: 'جارى التحضير', color: 'orange' },
    'out for delivery': { text: 'خرج للتوصيل', color: 'brown' },
    'delivered': { text: 'تم التوصيل', color: 'green' },
    'cancelled': { text: 'تم الالغاء', color: 'red' },
    'quran': { text: 'آيات قرآنية' },
    'art': { text: 'طابع فنى' },
    'kids': { text: 'أطفال' },
    'cold': { text: 'باردة' },
    'warm': { text: 'دافئة' },
  };
  
  return mapping[value] || value; // Fallback to original value if no mapping
};