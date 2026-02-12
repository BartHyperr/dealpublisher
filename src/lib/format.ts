import { format, parseISO } from "date-fns";

export function formatPostDateShort(iso?: string) {
  if (!iso) return "Not Set";
  try {
    const dt = parseISO(iso);
    return format(dt, "MMM dd, HH:mm").toUpperCase();
  } catch {
    return iso;
  }
}

export function formatPostDateLong(iso?: string) {
  if (!iso) return "—";
  try {
    const dt = parseISO(iso);
    return format(dt, "dd MMM yyyy, HH:mm");
  } catch {
    return iso;
  }
}

