const pad = (value: number) => String(value).padStart(2, "0");

export const localDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const localDateTime = (date = new Date(), includeSeconds = true) =>
  `${localDateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}${includeSeconds ? `:${pad(date.getSeconds())}` : ""}`;

export const localDateInputValue = (date = new Date()) => localDateKey(date);

export const localTimeInputValue = (date = new Date()) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const parseLocalDate = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

export const startOfLocalDay = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const endOfLocalDay = (date = new Date()) => {
  const end = startOfLocalDay(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

export const addLocalDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const dateTimeForInput = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  return localDateTime(date, false);
};
