      // Convierte un teléfono argentino al formato que pide WhatsApp (549 + código de área + número).
// Devuelve null si no puede interpretarlo.
export function telefonoWhatsapp(entrada: string): string | null {
  let d = (entrada ?? '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);

  if (d.startsWith('549') && d.length === 13) return d;
  if (d.startsWith('54') && d.length === 12) return '549' + d.slice(2);
  if (d.startsWith('54')) return null;

  if (d.startsWith('0')) d = d.slice(1);

  // Formato viejo con "15": código de área + 15 + número
  if (d.length === 12) {
    for (const area of [2, 3, 4]) {
      if (d.slice(area, area + 2) === '15') {
        d = d.slice(0, area) + d.slice(area + 2);
        break;
      }
    }
  }

  return d.length === 10 ? '549' + d : null;
}