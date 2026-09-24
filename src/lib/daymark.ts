export const LOGIN_DOMAIN = "daymark.example.com";

export type Role = "admin" | "staff";
export type EventType = "shift_in" | "shift_out" | "break_in" | "break_out";
export type ShiftStatus = "off" | "on_shift" | "on_break";

export type Profile = {
  id: string;
  login_id: string;
  display_name: string;
  role: Role;
  active: boolean;
  created_at: string;
};

export type Punch = {
  id: string;
  user_id: string;
  event_type: EventType;
  occurred_at: string;
  latitude: number;
  longitude: number;
  accuracy_m: number | null;
  photo_path: string;
};

export const EVENT_LABEL: Record<EventType, string> = {
  shift_in: "Shift clock in",
  shift_out: "Shift clock out",
  break_in: "Break clock in",
  break_out: "Break clock out",
};

export function emailForLogin(loginId: string) {
  return `${loginId.trim().toLowerCase()}@${LOGIN_DOMAIN}`;
}

export function formatWhen(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatClockTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function localDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isSameLocalDay(iso: string, now: Date) {
  const date = new Date(iso);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function formatCoord(latitude: number, longitude: number) {
  const latHem = latitude >= 0 ? "N" : "S";
  const lngHem = longitude >= 0 ? "E" : "W";
  return `${Math.abs(latitude).toFixed(5)}° ${latHem}, ${Math.abs(longitude).toFixed(5)}° ${lngHem}`;
}

export function mapLink(latitude: number, longitude: number) {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;
}

export function mapEmbed(latitude: number, longitude: number) {
  const pad = 0.008;
  const bbox = [
    longitude - pad,
    latitude - pad,
    longitude + pad,
    latitude + pad,
  ].join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

export function errorText(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message
  ) {
    return error.message;
  }
  return fallback;
}
