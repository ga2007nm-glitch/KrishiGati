import type { Mandi, QueueItem, Stats, Token } from "./types";

export type Recommendation = {
  id: string;
  name: string;
  district: string;
  distanceKm: number;
  utilizationPercentage: number;
  freeCapacityKg: number;
  freeCapacityPercentage: number;
  queueLength: number;
  predictedWaitMinutes: number;
  recommendedArrival: string;
  score: number;
  reason: string;
};

export type CropPrice = { category: string; mspPerKg: number; marketPerKg: number; unit: string; season: string };
export type ProcurementDetails = { token: Token & { cropGrade?: { grade: string; moisturePercent?: number | null; notes?: string | null }; payout?: { amount: number; status: string; transactionReference?: string | null } }; pricing: CropPrice | null; estimatedPayout: number | null };

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function getNearestMandis(lat: number, lng: number) {
  return request<{ mandis: Mandi[] }>(`/api/mandis/nearest?lat=${lat}&lng=${lng}`);
}

export function getAllMandis(lat: number, lng: number, state?: string, city?: string) {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  if (state) params.set("state", state);
  if (city) params.set("city", city);
  return request<{ mandis: Mandi[]; states: string[]; cities: string[] }>(`/api/mandis/all?${params}`);
}

export function getStats() {
  return request<{ stats: Stats }>("/api/stats");
}

export function getCropPrices() {
  return request<{ crops: Record<string, CropPrice>; updatedAt: string }>("/api/crops/prices");
}

export function getProcurementDetails(tokenId: string) {
  return request<ProcurementDetails>(`/api/tokens/${tokenId}`);
}

export function dispatchPayout(tokenId: string, amount: number) {
  return request<{ sms: { message: string; recipientLast4: string }; token: { status: string } }>("/api/procurement/payout", {
    method: "POST",
    body: JSON.stringify({ tokenId, amount, transactionReference: `KRG-${Date.now().toString().slice(-8)}` }),
  });
}

export function getRecommendation(lat: number, lng: number, quantityKg: number) {
  return request<{ recommendation: Recommendation; alternatives: Recommendation[] }>(`/api/mandis/recommend?lat=${lat}&lng=${lng}&quantityKg=${quantityKg}`);
}

export function requestLowTech(channel: "sms" | "ivr", phone: string) {
  return request<{ message?: string; menu?: string[]; channel: string; phoneLast4: string }>(`/api/low-tech/${channel}`, {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export function getQueue(mandiId: string) {
  return request<{ queue: QueueItem[] }>(`/api/mandis/${mandiId}/queue`);
}

export function getDemoFarmer() {
  return request<{ farmer: { id: string; name: string } }>("/api/farmers/demo");
}

export function registerFarmer(payload: { name: string; phone: string; aadhaarNo?: string; panNo?: string; officialId?: string; role: "FARMER" | "OFFICIAL" }) {
  return request<{ farmer: { id: string; name: string; phone: string; role: "FARMER" | "OFFICIAL" }; sms: { status: string; message: string; simulated: boolean } }>("/api/farmers/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function bookToken(payload: Record<string, unknown>) {
  return request<{ token: Token }>("/api/tokens/book", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

const offlineBookingKey = "krishigati_offline_bookings";

export function queueOfflineBooking(payload: Record<string, unknown>) {
  const pending = JSON.parse(localStorage.getItem(offlineBookingKey) || "[]") as Record<string, unknown>[];
  pending.push(payload);
  localStorage.setItem(offlineBookingKey, JSON.stringify(pending));
}

export async function syncOfflineBookings() {
  const pending = JSON.parse(localStorage.getItem(offlineBookingKey) || "[]") as Record<string, unknown>[];
  if (!pending.length) return 0;
  const remaining: Record<string, unknown>[] = [];
  for (const payload of pending) {
    try { await bookToken(payload); } catch { remaining.push(payload); }
  }
  localStorage.setItem(offlineBookingKey, JSON.stringify(remaining));
  return pending.length - remaining.length;
}

export { API_URL };
