
export interface Resident {
  id: string; // e.g., "13-5"
  addressNumber: string; // "13", "13-1", etc.
  floor: number;
  motorcycleParking: 'none' | 'small' | 'large';
  motorcycleCount: number;
  carParking: 'none' | 'small' | 'large';
  carCount: number;
}

export interface PaymentRecord {
  residentId: string;
  year: number;
  month: number;
  managementFee: number;
  motorcycleFee: number;
  carFee: number;
  total: number;
  paidAt: string; // ISO date string
  // Start dates for this payment period
  prevManagementStart: string;
  prevMotorcycleStart: string;
  prevCarStart: string;
  // Next cycle starts
  nextManagementStart: string; // "YYYY-MM"
  nextMotorcycleStart: string; // "YYYY-MM"
  nextCarStart: string; // "YYYY-MM"
}

export const FEE_CONFIG = {
  MANAGEMENT: 800,
  MOTORCYCLE: { small: 100, large: 200, none: 0 },
  CAR: { small: 1200, large: 1800, none: 0 }
};

export const ADDRESS_NUMBERS = [
  "13", "13-1", "15", "15-1", "17", "17-1", 
  "19", "19-1", "21", "21-1", "23", "23-1"
];
