export type Mandi = {
  id: string;
  name: string;
  city: string;
  state: string;
  district: string;
  distanceKm: number;
  congestionStatus: string;
  freeCapacityPercentage: number;
  utilizationPercentage: number;
  smartRedirect: boolean;
  estimatedWaitMinutes: number;
  latitude: number;
  longitude: number;
};

export type QueueItem = {
  tokenId: string;
  tokenNumber: string;
  status: string;
  assignedCounter: number | null;
  estimatedWaitMinutes: number;
};

export type Token = {
  id: string;
  tokenNumber: string;
  status: string;
  cropType: string;
  quantityKg: number;
  assignedCounter: number | null;
  mandiId: string;
  slotTime: string;
};

export type Stats = {
  grainsProcuredKg: number;
  averageWaitMinutes: number;
  activeMandis: number;
};
