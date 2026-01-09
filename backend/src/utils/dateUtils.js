export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return null;
  const d = new Date(date);
  
  if (format === 'YYYY-MM-DD') {
    return d.toISOString().split('T')[0];
  }
  
  if (format === 'MM/DD/YYYY') {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }
  
  return d.toISOString();
};

export const getDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates = [];
  
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

export const getPayPeriod = (date = new Date(), cycle = 'monthly') => {
  const d = new Date(date);
  let periodStart, periodEnd;
  
  if (cycle === 'monthly') {
    periodStart = new Date(d.getFullYear(), d.getMonth(), 1);
    periodEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  } else if (cycle === 'bi-weekly') {
    const dayOfMonth = d.getDate();
    const biWeekStart = dayOfMonth <= 15 ? 1 : 16;
    const biWeekEnd = dayOfMonth <= 15 ? 15 : new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    
    periodStart = new Date(d.getFullYear(), d.getMonth(), biWeekStart);
    periodEnd = new Date(d.getFullYear(), d.getMonth(), biWeekEnd);
  } else if (cycle === 'weekly') {
    const dayOfWeek = d.getDay();
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    periodStart = new Date(d.setDate(diff));
    periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 6);
  }
  
  return { periodStart, periodEnd };
};

export const isBusinessDay = (date, workingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']) => {
  const d = new Date(date);
  const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  return workingDays.includes(dayName);
};

export const calculateBusinessDays = (startDate, endDate, workingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  
  const current = new Date(start);
  while (current <= end) {
    if (isBusinessDay(current, workingDays)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getEndOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const isDateInRange = (date, startDate, endDate) => {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  return d >= start && d <= end;
};


