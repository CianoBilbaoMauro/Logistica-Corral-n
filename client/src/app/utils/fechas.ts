// Fecha local en formato YYYY-MM-DD (sin el desfase que produce toISOString() por la zona horaria)
export function fechaLocal(d: Date = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
