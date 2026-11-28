const ISO_DATE_LENGTH = 10;

export function toPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

export function getTodayIsoDate() {
  return new Date().toISOString().slice(0, ISO_DATE_LENGTH);
}
