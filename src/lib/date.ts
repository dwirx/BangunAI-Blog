/**
 * Format date string to "11 Februari 2026, 14:30" format
 */
export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const datePart = d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const timePart = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${datePart}, ${timePart}`;
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  const datePart = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  const timePart = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${datePart} · ${timePart}`;
}

export function formatDateMedium(dateStr: string): string {
  const d = new Date(dateStr);
  const datePart = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const timePart = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${datePart}, ${timePart}`;
}
