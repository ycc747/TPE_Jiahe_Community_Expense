
export interface Resident {
  id: string; // e.g., "13-5"
  addressNumber: string; // "13", "13-1", etc.
  floor: number;
  motorcycleParking: 'none' | 'small' | 'large';
  motorcycleCount: number;
  carParking: 'none' | 'small' | 'large';
  carCount: number;
  // Auto-fill parking configuration from last registration
  lastParkingConfig?: {
    moto: { smallCount: number; largeCount: number };
    car: { smallCount: number; largeCount: number };
  };
  // Auto-fill payment period dates from last registration
  lastPaymentPeriods?: {
    mgmt: { prev: { y: number; m: number }; next: { y: number; m: number } };
    moto: { prev: { y: number; m: number }; next: { y: number; m: number } };
    car: { prev: { y: number; m: number }; next: { y: number; m: number } };
  };
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

export const DEFAULT_FEE_CONFIG: FeeConfig = {
  management: 800,
  motorcycle: { small: 100, large: 200, none: 0 },
  car: { small: 1200, large: 1800, none: 0 }
};

export const ADDRESS_NUMBERS = [
  "13", "13-1", "15", "15-1", "17", "17-1",
  "19", "19-1", "21", "21-1", "21-2", "21-3", "23", "23-1", "23-2", "23-3"
];

// ===== Authentication & Authorization Types =====

export type UserRole = 'EXT' | 'KEEP' | 'MGR' | 'ADMIN';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string; // Unique user ID
  username: string;
  passwordHash: string; // Hashed password
  role: UserRole;
  registeredAddresses: string[]; // Array of resident IDs (e.g., ["13-1-5", "21-2-3"])
  createdAt: string; // ISO date string
}

export interface AddressRegistration {
  id: string; // Unique registration ID
  userId: string;
  residentId: string; // e.g., "13-1-5"
  status: ApprovalStatus;
  requestedAt: string; // ISO date string
  approvedBy?: string; // User ID of approver (KEEP/MGR/ADMIN)
  approvedAt?: string; // ISO date string
}

export interface FeeConfig {
  management: number;
  motorcycle: { small: number; large: number; none: number };
  car: { small: number; large: number; none: number };
  lastModifiedBy?: string; // User ID (only MGR can modify)
  lastModifiedAt?: string; // ISO date string
}
